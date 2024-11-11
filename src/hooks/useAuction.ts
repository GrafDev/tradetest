import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { FirebaseService } from "@/lib/services/firebase-service";
import type { Auction, AuctionParticipant, Move } from "@/types/types";
export function useAuction() {
    const [currentAuction, setCurrentAuction] = useState<Auction | null>(null);
    const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(false);
    const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(0);
    const [moveTimeLeft, setMoveTimeLeft] = useState<number>(0);
    const { toast } = useToast();

    // Инициализация и подписки
    useEffect(() => {
        let unsubscribeAuction: (() => void) | undefined;
        let unsubscribeMoves: (() => void) | undefined;
        let unsubscribeParticipants: (() => void) | undefined;

        const initializeAuction = async () => {
            try {
                setLoading(true);
                const activeAuctions = await FirebaseService.getActiveAuctions();
                let auction = activeAuctions[0];

                if (!auction) {
                    const auctionId = await FirebaseService.createAuction({
                        status: 'waiting',
                        currentPrice: 0,
                        currentParticipantIndex: 0,
                        participants: [],
                        duration: 15 * 60 * 1000,
                        moveTimeout: 30 * 1000,
                    });

                    const newAuction = await FirebaseService.getAuction(auctionId);
                    if (newAuction) {
                        auction = newAuction;
                    }
                }

                if (auction?.id) {
                    unsubscribeAuction = FirebaseService.subscribeToAuction(
                        auction.id,
                        (updatedAuction) => {
                            if (updatedAuction) {
                                setCurrentAuction(updatedAuction);
                            }
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
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentAuction]);

    const handleStartAuction = useCallback(async () => {
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
    }, [currentAuction?.id]);

    const handleEndAuction = useCallback(async () => {
        if (!currentAuction?.id) return;

        try {
            setLoading(true);
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'finished');

            const lastMove = moves[moves.length - 1];
            if (lastMove) {
                await FirebaseService.updateAuction(currentAuction.id, {
                    winnerId: lastMove.userId
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
    }, [currentAuction?.id, moves]);

    const handleAddParticipant = useCallback(async (name: string): Promise<AuctionParticipant> => {
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
    }, [currentAuction?.id]);

    const handleRemoveParticipant = useCallback(async (participantId: string) => {
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
    }, [currentAuction?.id]);

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
    } as const;
}