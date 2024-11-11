import { useState, useEffect } from 'react';
import { FirebaseService } from '@/lib/services/firebase-service';
import { useToast } from './use-toast';
import type { Auction, AuctionParticipant, Move } from '@/types/types';

export function useAuctionParticipant(participantUrl: string) {
    const [auction, setAuction] = useState<Auction | null>(null);
    const [participant, setParticipant] = useState<AuctionParticipant | null>(null);
    const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(900);
    const { toast } = useToast();

    // Инициализация аукциона и подписок
    useEffect(() => {
        if (!participantUrl) return;

        let unsubscribeAuction: () => void;
        let unsubscribeParticipants: () => void;
        let unsubscribeMoves: () => void;

        const initializeAuctionRoom = async () => {
            try {
                const result = await FirebaseService.findAuctionByParticipantUrl(participantUrl);

                if (!result) {
                    toast({
                        variant: "destructive",
                        title: "Ошибка",
                        description: "Аукцион не найден"
                    });
                    return;
                }

                const { auction: foundAuction, participant: foundParticipant } = result;
                setAuction(foundAuction);
                setParticipant(foundParticipant);

                // Подписки на обновления
                unsubscribeAuction = FirebaseService.subscribeToAuction(
                    foundAuction.id,
                    (updatedAuction) => {
                        if (updatedAuction) setAuction(updatedAuction);
                    }
                );

                unsubscribeParticipants = FirebaseService.subscribeToParticipants(
                    foundAuction.id,
                    setParticipants
                );

                unsubscribeMoves = FirebaseService.subscribeToMoves(
                    foundAuction.id,
                    setMoves
                );

            } catch (error) {
                console.error('Ошибка инициализации:', error);
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: "Не удалось подключиться к аукциону"
                });
            } finally {
                setLoading(false);
            }
        };

        initializeAuctionRoom();

        return () => {
            unsubscribeAuction?.();
            unsubscribeParticipants?.();
            unsubscribeMoves?.();
        };
    }, [participantUrl]);

    // Обработка времени
    useEffect(() => {
        if (!auction || auction.status !== 'active') return;

        const interval = setInterval(() => {
            if (auction.moveDeadline) {
                const moveTimeLeft = Math.max(0, Math.floor((auction.moveDeadline - Date.now()) / 1000));
                setTimeLeft(moveTimeLeft);
            }

            if (auction.startTime && auction.duration) {
                const remainingTime = Math.max(
                    0,
                    Math.floor(((auction.startTime + auction.duration) - Date.now()) / 1000)
                );
                setAuctionTimeLeft(remainingTime);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [auction]);


    const isMyTurn = Boolean(auction && participant &&
        auction.status === 'active' &&
        participants[auction.currentParticipantIndex]?.id === participant.id);

    const placeBid = async (amount: number) => {
        if (!auction || !participant || !isMyTurn) return;

        try {
            setLoading(true);

            const move: Omit<Move, 'timestamp'> = {
                userId: participant.id,
                price: amount
            };

            await FirebaseService.addMove(auction.id, move);

            const nextParticipantIndex =
                (auction.currentParticipantIndex + 1) % participants.length;

            await FirebaseService.updateMoveDeadline(auction.id, nextParticipantIndex);

            toast({
                title: "Успешно",
                description: "Ставка принята"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось сделать ставку"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const skipTurn = async () => {
        if (!auction || !participant || !isMyTurn) return;

        try {
            setLoading(true);
            const nextParticipantIndex =
                (auction.currentParticipantIndex + 1) % participants.length;

            await FirebaseService.updateMoveDeadline(auction.id, nextParticipantIndex);

            toast({
                title: "Ход пропущен",
                description: "Очередь перешла к следующему участнику"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось пропустить ход"
            });
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        auction,
        participant,
        participants,
        moves,
        loading,
        timeLeft,
        auctionTimeLeft,
        isMyTurn,
        placeBid,
        skipTurn
    };
}