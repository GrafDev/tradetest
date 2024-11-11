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

    // Используем ref для хранения функций отписки
    const unsubscribeRefs = useRef<{
        auction?: () => void;
        moves?: () => void;
        participants?: () => void;
    }>({});

    // Ref для таймера
    const timerRef = useRef<NodeJS.Timeout>();

    // Инициализация и подписки
    useEffect(() => {
        let mounted = true;

        const initializeAuction = async () => {
            try {
                const activeAuctions = await FirebaseService.getActiveAuctions();
                const auction = activeAuctions[0];

                if (!mounted) return;

                if (auction?.id) {
                    setCurrentAuction(auction);

                    // Подписываемся на изменения аукциона
                    unsubscribeRefs.current.auction = FirebaseService.subscribeToAuction(
                        auction.id,
                        (updatedAuction) => {
                            if (updatedAuction && mounted) {
                                setCurrentAuction(updatedAuction);
                            }
                        }
                    );

                    // Подписываемся на изменения участников
                    unsubscribeRefs.current.participants = FirebaseService.subscribeToParticipants(
                        auction.id,
                        (updatedParticipants) => {
                            if (mounted) {
                                setParticipants(updatedParticipants || []);
                            }
                        }
                    );

                    // Подписываемся на изменения ходов
                    unsubscribeRefs.current.moves = FirebaseService.subscribeToMoves(
                        auction.id,
                        (updatedMoves) => {
                            if (mounted) {
                                setMoves(updatedMoves || []);
                            }
                        }
                    );
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

        // Очистка при размонтировании
        return () => {
            mounted = false;
            Object.values(unsubscribeRefs.current).forEach(unsubscribe => unsubscribe?.());
        };
    }, [toast]);

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

    // Остальные функции-обработчики с useCallback
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
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id]);

    const handleRemoveParticipant = useCallback(async (participantId: string) => {
        if (!currentAuction?.id) return;
        setLoading(true);
        try {
            await FirebaseService.removeParticipant(currentAuction.id, participantId);
        } finally {
            setLoading(false);
        }
    }, [currentAuction?.id]);

    const updateAuctionItem = useCallback(async (auctionId: string, itemUpdates: Partial<AuctionItem>) => {
        setLoading(true);
        try {
            await FirebaseService.updateAuctionItem(auctionId, itemUpdates);
        } finally {
            setLoading(false);
        }
    }, []);

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