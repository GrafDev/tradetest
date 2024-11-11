// src/hooks/useAuction.ts
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { FirebaseService } from "@/lib/services/firebase-service";
import type { Auction, AuctionParticipant, Move, AuctionItem } from "@/types/types";

interface CreateAuctionOptions {
    item: AuctionItem;
}

export function useAuction() {
    const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
    const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(true);
    const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(0);
    const [moveTimeLeft, setMoveTimeLeft] = useState<number>(0);
    const { toast } = useToast();

    // Функция обновления аукциона
    const refreshAuction = async () => {
        try {
            const activeAuctions = await FirebaseService.getActiveAuctions();
            const auction = activeAuctions[0];
            if (auction) {
                setCurrentAuction(auction);
            }
        } catch (error) {
            console.error('Ошибка обновления аукциона:', error);
        }
    };

    // Инициализация и подписки
    useEffect(() => {
        let unsubscribeAuction: (() => void) | undefined;
        let unsubscribeMoves: (() => void) | undefined;
        let unsubscribeParticipants: (() => void) | undefined;

        const initializeAuction = async () => {
            try {
                setLoading(true);
                const activeAuctions = await FirebaseService.getActiveAuctions();
                const auction = activeAuctions[0];

                if (auction?.id) {
                    setCurrentAuction(auction);

                    unsubscribeAuction = FirebaseService.subscribeToAuction(
                        auction.id,
                        (updatedAuction) => {
                            if (updatedAuction) setCurrentAuction(updatedAuction);
                        }
                    );

                    unsubscribeParticipants = FirebaseService.subscribeToParticipants(
                        auction.id,
                        setParticipants
                    );

                    unsubscribeMoves = FirebaseService.subscribeToMoves(
                        auction.id,
                        setMoves
                    );
                }
            } catch (error) {
                console.error('Ошибка инициализации:', error);
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: "Не удалось загрузить данные аукциона"
                });
            } finally {
                setLoading(false);
            }
        };

        initializeAuction();

        return () => {
            unsubscribeAuction?.();
            unsubscribeMoves?.();
            unsubscribeParticipants?.();
        };
    }, []);

    // Обработка таймеров
    useEffect(() => {
        if (!currentAuction) return;

        const interval = setInterval(() => {
            const now = Date.now();

            // Обновление времени аукциона
            if (currentAuction.status === 'active' && currentAuction.startTime && currentAuction.duration) {
                const endTime = currentAuction.startTime + currentAuction.duration;
                const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
                setAuctionTimeLeft(timeLeft);

                if (timeLeft === 0 && currentAuction.status === 'active') {
                    handleEndAuction();
                }
            }

            // Обновление времени хода
            if (currentAuction.moveDeadline) {
                const moveTime = Math.max(0, Math.floor((currentAuction.moveDeadline - now) / 1000));
                setMoveTimeLeft(moveTime);

                // Автоматический пропуск хода при истечении времени
                if (moveTime === 0 && currentAuction.status === 'active') {
                    const nextParticipantIndex = (currentAuction.currentParticipantIndex + 1) % participants.length;
                    FirebaseService.updateMoveDeadline(currentAuction.id, nextParticipantIndex).catch(console.error);
                }
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentAuction, participants]);

    // Создание нового аукциона
    const createAuction = async (options: CreateAuctionOptions) => {
        try {
            setLoading(true);
            const auctionId = await FirebaseService.createAuction({
                item: options.item,
                currentPrice: options.item.startPrice
            });

            toast({
                title: "Аукцион создан",
                description: "Теперь вы можете добавлять участников"
            });

            return auctionId;
        } catch (error) {
            console.error('Ошибка при создании аукциона:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось создать аукцион"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Обновление информации о предмете
    const updateAuctionItem = async (auctionId: string, itemUpdates: Partial<AuctionItem>) => {
        try {
            setLoading(true);
            await FirebaseService.updateAuctionItem(auctionId, itemUpdates);

            toast({
                title: "Успешно",
                description: "Информация о предмете обновлена"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось обновить информацию о предмете"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Запуск аукциона
    const handleStartAuction = async () => {
        if (!currentAuction?.id) return;

        try {
            setLoading(true);
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'active');
            toast({
                title: "Успешно",
                description: "Торги начались"
            });
        } catch (error) {
            console.error('Ошибка при старте аукциона:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось начать торги"
            });
        } finally {
            setLoading(false);
        }
    };

    // Завершение аукциона
    const handleEndAuction = async () => {
        if (!currentAuction?.id) return;

        try {
            setLoading(true);
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'finished');

            const lastMove = moves[moves.length - 1];
            if (lastMove) {
                await FirebaseService.updateAuction(currentAuction.id, {
                    winnerId: lastMove.userId,
                    endTime: Date.now()
                });
            }

            toast({
                title: "Успешно",
                description: "Торги завершены"
            });
        } catch (error) {
            console.error('Ошибка при завершении аукциона:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось завершить торги"
            });
        } finally {
            setLoading(false);
        }
    };

    // Добавление участника
    const handleAddParticipant = async (name: string): Promise<AuctionParticipant> => {
        if (!currentAuction?.id) {
            throw new Error("Аукцион не инициализирован");
        }

        try {
            setLoading(true);
            const participant = await FirebaseService.addParticipant(currentAuction.id, name);
            return participant;
        } finally {
            setLoading(false);
        }
    };

    // Удаление участника
    const handleRemoveParticipant = async (participantId: string) => {
        if (!currentAuction?.id) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Аукцион не инициализирован"
            });
            return;
        }

        try {
            setLoading(true);
            await FirebaseService.removeParticipant(currentAuction.id, participantId);
            toast({
                title: "Успешно",
                description: "Участник удален"
            });
        } catch (error) {
            console.error('Ошибка при удалении участника:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось удалить участника"
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        currentAuction,
        participants,
        moves,
        loading,
        auctionTimeLeft,
        moveTimeLeft,
        createAuction,
        updateAuctionItem,
        handleStartAuction,
        handleEndAuction,
        handleAddParticipant,
        handleRemoveParticipant,
        refreshAuction,
    };
}