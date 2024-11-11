import { useEffect, useRef } from 'react';
import { FirebaseService } from '@/lib/services/firebase-service';
import type { Auction } from '@/types/types';

export function useAuctionTimer(auction: Auction | null) {
    const timerRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!auction || auction.status !== 'active') return;

        const checkAndUpdateAuctionStatus = async () => {
            if (!auction) return;

            const now = Date.now();

            // Проверка окончания времени аукциона
            if (auction.startTime && auction.duration) {
                const endTime = auction.startTime + auction.duration;
                if (now >= endTime && auction.status === 'active') {
                    await FirebaseService.updateAuctionStatus(auction.id, 'finished');
                    const lastMove = await FirebaseService.getLastMove(auction.id);
                    if (lastMove) {
                        await FirebaseService.updateAuction(auction.id, {
                            winnerId: lastMove.userId,
                            endTime: now
                        });
                    }
                    return;
                }
            }

            // Проверка времени на ход
            if (auction.moveDeadline && now >= auction.moveDeadline) {
                const participants = await FirebaseService.getParticipants(auction.id);
                const nextParticipantIndex =
                    (auction.currentParticipantIndex + 1) % participants.length;
                await FirebaseService.updateMoveDeadline(auction.id, nextParticipantIndex);
            }
        };

        // Запускаем проверку каждую секунду
        timerRef.current = setInterval(checkAndUpdateAuctionStatus, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [auction]);
}