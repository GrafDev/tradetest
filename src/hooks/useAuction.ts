import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FirebaseService } from "@/lib/services/firebase-service";
import type { Auction, AuctionParticipant, Move, AuctionItem } from "@/types/types";

export function useAuction() {
    const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
    const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(true);
    const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(0);
    const [moveTimeLeft, setMoveTimeLeft] = useState<number>(0);
    const { toast } = useToast();

    const unsubscribeRefs = useRef<{
        auction?: () => void;
        moves?: () => void;
        participants?: () => void;
    }>({});

    const timerRef = useRef<NodeJS.Timeout>();
    const currentAuctionIdRef = useRef<string | null>(null);

    const subscribeToAuctionData = useCallback((auctionId: string) => {
        Object.values(unsubscribeRefs.current).forEach(unsubscribe => unsubscribe?.());

        unsubscribeRefs.current.auction = FirebaseService.subscribeToAuction(
            auctionId,
            (updatedAuction) => {
                if (updatedAuction) {
                    setCurrentAuction(updatedAuction);
                    currentAuctionIdRef.current = updatedAuction.id;
                }
            }
        );

        unsubscribeRefs.current.participants = FirebaseService.subscribeToParticipants(
            auctionId,
            (updatedParticipants) => {
                setParticipants(updatedParticipants || []);
            }
        );

        unsubscribeRefs.current.moves = FirebaseService.subscribeToMoves(
            auctionId,
            (updatedMoves) => {
                setMoves(updatedMoves || []);
            }
        );
    }, []);

    useEffect(() => {
        let mounted = true;

        const initializeAuction = async () => {
            try {
                const auction = await FirebaseService.getActiveAuctions();

                if (!mounted) return;

                if (auction && auction.length > 0) {
                    // Берем последний активный аукцион
                    const lastAuction = auction[0];
                    currentAuctionIdRef.current = lastAuction.id;
                    setCurrentAuction(lastAuction);
                    subscribeToAuctionData(lastAuction.id);
                } else {
                    setCurrentAuction(null);
                }
            } catch (error) {
                console.error('Ошибка инициализации:', error);
                if (mounted) {
                    toast({
                        variant: "destructive",
                        title: "Ошибка",
                        description: "Не удалось загрузить данные аукциона"
                    });
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        initializeAuction();

        return () => {
            mounted = false;
            Object.values(unsubscribeRefs.current).forEach(unsubscribe => unsubscribe?.());
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [subscribeToAuctionData, toast]);

    // Обработка таймеров
    useEffect(() => {
        if (!currentAuction) return;

        // Создаем интервал
        timerRef.current = setInterval(() => {
            const now = Date.now();

            if (currentAuction.status === 'active' && currentAuction.startTime && currentAuction.duration) {
                const endTime = currentAuction.startTime + currentAuction.duration;
                const timeLeft = Math.max(0, Math.floor((endTime - now) / 1000));
                setAuctionTimeLeft(timeLeft);

                if (timeLeft === 0 && currentAuction.status === 'active') {
                    handleEndAuction();
                }
            }

            if (currentAuction.moveDeadline) {
                const moveTime = Math.max(0, Math.floor((currentAuction.moveDeadline - now) / 1000));
                setMoveTimeLeft(moveTime);

                if (moveTime === 0 && currentAuction.status === 'active') {
                    const nextParticipantIndex = (currentAuction.currentParticipantIndex + 1) % participants.length;
                    FirebaseService.updateMoveDeadline(currentAuction.id, nextParticipantIndex).catch(console.error);
                }
            }
        }, 1000);

        // Очистка при изменении зависимостей или размонтировании
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [currentAuction, participants.length]);



    const handleAddParticipant = useCallback(async (name: string): Promise<AuctionParticipant> => {
        if (!currentAuction?.id) {
            throw new Error("Аукцион не инициализирован");
        }

        setLoading(true);
        try {
            const participant = await FirebaseService.addParticipant(currentAuction.id, name);
            return participant;
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id]);

    const handleStartAuction = useCallback(async () => {
        if (!currentAuction?.id) return;
        setLoading(true);
        try {
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'active');
            toast({
                title: "Торги начались",
                description: "Участники могут делать ставки"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось начать торги"
            });
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id, toast]);

    const handleRemoveParticipant = useCallback(async (participantId: string) => {
        if (!currentAuction?.id) return;
        setLoading(true);
        try {
            await FirebaseService.removeParticipant(currentAuction.id, participantId);
            toast({
                title: "Успешно",
                description: "Участник удален"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось удалить участника"
            });
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id, toast]);

    const updateAuctionItem = useCallback(async (auctionId: string, itemUpdates: Partial<AuctionItem>) => {
        setLoading(true);
        try {
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
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const handleEndAuction = useCallback(async () => {
        if (!currentAuction?.id) return;
        setLoading(true);
        try {
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'finished');
            const lastMove = moves[moves.length - 1];
            if (lastMove) {
                await FirebaseService.updateAuction(currentAuction.id, {
                    winnerId: lastMove.userId,
                    endTime: Date.now()
                });
            }
            toast({
                title: "Торги завершены",
                description: lastMove
                    ? "Определен победитель торгов"
                    : "Торги завершены без ставок"
            });
            // Не обнуляем currentAuction, чтобы отобразить завершенный аукцион
            setCurrentAuction(prev => prev ? { ...prev, status: 'finished' } : null);
        } catch (error) {
            console.error('Error ending auction:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось завершить торги"
            });
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id, moves, toast]);

    return {
        currentAuction,
        participants,
        moves,
        loading,
        auctionTimeLeft,
        moveTimeLeft,
        handleStartAuction,
        handleEndAuction,
        handleAddParticipant,
        handleRemoveParticipant,
        updateAuctionItem,
    };
}