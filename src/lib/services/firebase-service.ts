import { ref, set, get, update, onValue, off, DataSnapshot } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Auction, AuctionParticipant, Move } from '@/types/types';

export class FirebaseService {
    private static auctionRef = (auctionId: string) => ref(db, `auctions/${auctionId}`);
    private static movesRef = (auctionId: string) => ref(db, `moves/${auctionId}`);
    private static participantsRef = (auctionId: string) => ref(db, `auction_users/${auctionId}`);

    /**
     * Создает новый аукцион
     */
    static async createAuction(baseAuction: Omit<Auction, 'id'>): Promise<string> {
        const auctionId = crypto.randomUUID();
        try {
            await set(this.auctionRef(auctionId), {
                ...baseAuction,
                id: auctionId,
                status: 'waiting',
                currentPrice: 0,
                currentParticipantIndex: 0,
                participants: [],
                startTime: null,
                endTime: null,
                moveDeadline: null,
            });
            return auctionId;
        } catch (error) {
            console.error('Error creating auction:', error);
            throw new Error('Не удалось создать аукцион');
        }
    }

    /**
     * Добавляет нового участника в аукцион
     */
    static async addParticipant(auctionId: string, name: string): Promise<AuctionParticipant> {
        try {
            const participant: AuctionParticipant = {
                id: crypto.randomUUID(),
                name,
                role: 'participant',
                uniqueUrl: crypto.randomUUID()
            };

            const participantsRef = this.participantsRef(auctionId);
            const snapshot = await get(participantsRef);
            const participants = snapshot.val() || [];

            // Добавляем участника в auction_users
            await set(participantsRef, [...participants, participant]);

            // Обновляем список ID участников в аукционе
            const auctionRef = this.auctionRef(auctionId);
            await update(auctionRef, {
                participants: [...(participants.map((p: AuctionParticipant) => p.id)), participant.id]
            });

            return participant;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw new Error('Не удалось добавить участника');
        }
    }

    /**
     * Обновляет статус аукциона
     */
    static async updateAuctionStatus(auctionId: string, status: Auction['status']) {
        try {
            const now = Date.now();
            const updates: Record<string, any> = { status };

            // Добавляем поля только если они имеют значение
            if (status === 'active') {
                updates.startTime = now;
                updates.moveDeadline = now + 30000; // 30 секунд на ход
                updates.currentParticipantIndex = 0; // Начинаем с первого участника
            }

            if (status === 'finished') {
                updates.endTime = now;
                updates.moveDeadline = null;
            }

            await update(this.auctionRef(auctionId), updates);
        } catch (error) {
            console.error('Error updating auction status:', error);
            throw new Error('Не удалось обновить статус аукциона');
        }
    }

    /**
     * Подписка на обновления аукциона
     */
    static subscribeToAuction(auctionId: string, callback: (auction: Auction) => void): () => void {
        const auctionRef = this.auctionRef(auctionId);
        onValue(auctionRef, (snapshot: DataSnapshot) => {
            const auction = snapshot.val();
            if (auction) {
                callback(auction);
            }
        });

        return () => off(auctionRef);
    }

    /**
     * Обновляет данные аукциона
     */
    static async updateAuction(auctionId: string, updates: Partial<Auction>) {
        try {
            const auctionRef = this.auctionRef(auctionId);
            await update(auctionRef, updates);
        } catch (error) {
            console.error('Error updating auction:', error);
            throw new Error('Не удалось обновить данные аукциона');
        }
    }

    /**
     * Добавляет новый ход в аукцион
     */
    static async addMove(auctionId: string, move: Move) {
        try {
            const movesRef = this.movesRef(auctionId);
            const snapshot = await get(movesRef);
            const moves = snapshot.val() || [];
            await set(movesRef, [...moves, move]);
        } catch (error) {
            console.error('Error adding move:', error);
            throw new Error('Не удалось сделать ход');
        }
    }

    /**
     * Подписка на обновления участников
     */
    static subscribeToParticipants(
        auctionId: string,
        callback: (participants: AuctionParticipant[]) => void
    ): () => void {
        const participantsRef = this.participantsRef(auctionId);
        onValue(participantsRef, (snapshot: DataSnapshot) => {
            const participants = snapshot.val() || [];
            callback(participants);
        });

        return () => off(participantsRef);
    }

    /**
     * Подписка на обновления ходов
     */
    static subscribeToMoves(
        auctionId: string,
        callback: (moves: Move[]) => void
    ): () => void {
        const movesRef = this.movesRef(auctionId);
        onValue(movesRef, (snapshot: DataSnapshot) => {
            const moves = snapshot.val() || [];
            callback(moves);
        });

        return () => off(movesRef);
    }

    /**
     * Находит аукцион по URL участника
     */
    static async findAuctionByParticipantUrl(url: string): Promise<{ auction: Auction; participant: AuctionParticipant } | null> {
        try {
            const auctionsRef = ref(db, 'auctions');
            const auctionsSnapshot = await get(auctionsRef);

            const auctions = auctionsSnapshot.val() || {};
            for (const auctionId of Object.keys(auctions)) {
                const participantsSnapshot = await get(this.participantsRef(auctionId));
                const participants = participantsSnapshot.val() || [];

                const participant = participants.find((p: AuctionParticipant) => p.uniqueUrl === url);
                if (participant) {
                    return {
                        auction: auctions[auctionId],
                        participant
                    };
                }
            }

            return null;
        } catch (error) {
            console.error('Error finding auction by participant URL:', error);
            throw new Error('Не удалось найти аукцион');
        }
    }
}