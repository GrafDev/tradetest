import { ref, set, get, update, remove, onValue, off, DataSnapshot } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Auction, AuctionParticipant, Move } from '@/types/types';

export class FirebaseService {
    private static auctionRef = (auctionId: string) => ref(db, `auctions/${auctionId}`);
    private static movesRef = (auctionId: string) => ref(db, `moves/${auctionId}`);
    private static participantsRef = (auctionId: string) => ref(db, `auction_users/${auctionId}`);
    private static auctionsRef = () => ref(db, 'auctions');

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
                startTime: undefined,  // Изменили с null на undefined
                endTime: undefined,    // Изменили с null на undefined
                moveDeadline: undefined // Изменили с null на undefined
            });
            return auctionId;
        } catch (error) {
            console.error('Error creating auction:', error);
            throw new Error('Не удалось создать аукцион');
        }
    }

    /**
     * Получает все активные аукционы
     */
    static async getActiveAuctions(): Promise<Auction[]> {
        try {
            const snapshot = await get(this.auctionsRef());
            const data = snapshot.val();
            if (!data) return [];

            const auctions = Object.values(data);
            return auctions.filter((auction): auction is Auction =>
                auction !== null &&
                typeof auction === 'object' &&
                'status' in auction &&
                auction.status !== 'finished'
            );
        } catch (error) {
            console.error('Error getting active auctions:', error);
            throw new Error('Не удалось получить активные аукционы');
        }
    }

    /**
     * Получает конкретный аукцион по ID
     */
    static async getAuction(auctionId: string): Promise<Auction | null> {
        try {
            const snapshot = await get(this.auctionRef(auctionId));
            const data = snapshot.val();
            if (!data) return null;
            return data as Auction;
        } catch (error) {
            console.error('Error getting auction:', error);
            throw new Error('Не удалось получить данные аукциона');
        }
    }

    /**
     * Обновляет статус аукциона
     */
    static async updateAuctionStatus(auctionId: string, status: Auction['status']) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');

            if (status === 'active') {
                const participantsSnapshot = await get(this.participantsRef(auctionId));
                const participants = participantsSnapshot.val() || [];
                if (participants.length < 2) {
                    throw new Error('Для начала торгов необходимо минимум 2 участника');
                }
            }

            const now = Date.now();
            const updates: Partial<Auction> = { status };

            if (status === 'active') {
                updates.startTime = now;
                updates.moveDeadline = now + 30000;
                updates.currentParticipantIndex = 0;
                updates.duration = 15 * 60 * 1000;
            }

            if (status === 'finished') {
                updates.endTime = now;
                updates.moveDeadline = undefined; // Изменили с null на undefined
            }

            await update(this.auctionRef(auctionId), updates);
        } catch (error) {
            console.error('Error updating auction status:', error);
            throw error;
        }
    }

    /**
     * Обновляет данные аукциона
     */
    static async updateAuction(auctionId: string, updates: Partial<Auction>) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');

            await update(this.auctionRef(auctionId), updates);
        } catch (error) {
            console.error('Error updating auction:', error);
            throw error;
        }
    }

    /**
     * Добавляет нового участника в аукцион
     */
    static async addParticipant(auctionId: string, name: string): Promise<AuctionParticipant> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');
            if (auction.status !== 'waiting') {
                throw new Error('Нельзя добавить участника после начала торгов');
            }

            const participant: AuctionParticipant = {
                id: crypto.randomUUID(),
                name,
                role: 'participant',
                uniqueUrl: crypto.randomUUID()
            };

            const participantsRef = this.participantsRef(auctionId);
            const snapshot = await get(participantsRef);
            const participants: AuctionParticipant[] = snapshot.val() || [];

            // Добавляем участника
            await set(participantsRef, [...participants, participant]);

            // Обновляем список ID участников в аукционе
            await update(this.auctionRef(auctionId), {
                participants: [...participants.map(p => p.id), participant.id]
            });

            return participant;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    }

    /**
     * Удаляет участника из аукциона
     */
    static async removeParticipant(auctionId: string, participantId: string): Promise<void> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');
            if (auction.status !== 'waiting') {
                throw new Error('Нельзя удалить участника после начала торгов');
            }

            const participantsRef = this.participantsRef(auctionId);
            const snapshot = await get(participantsRef);
            const participants: AuctionParticipant[] = snapshot.val() || [];

            const updatedParticipants = participants.filter(p => p.id !== participantId);

            if (participants.length === updatedParticipants.length) {
                throw new Error('Участник не найден');
            }

            // Обновляем список участников
            await set(participantsRef, updatedParticipants);

            // Обновляем список ID участников в аукционе
            await update(this.auctionRef(auctionId), {
                participants: updatedParticipants.map(p => p.id)
            });
        } catch (error) {
            console.error('Error removing participant:', error);
            throw error;
        }
    }

    /**
     * Добавляет новый ход в аукцион
     */
    static async addMove(auctionId: string, move: Move) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');
            if (auction.status !== 'active') {
                throw new Error('Аукцион не активен');
            }

            const movesRef = this.movesRef(auctionId);
            const snapshot = await get(movesRef);
            const moves: Move[] = snapshot.val() || [];

            // Проверяем, что новая цена больше текущей
            if (move.price <= auction.currentPrice) {
                throw new Error('Новая ставка должна быть больше текущей');
            }

            await set(movesRef, [...moves, move]);
        } catch (error) {
            console.error('Error adding move:', error);
            throw error;
        }
    }

    /**
     * Подписка на обновления аукциона
     */
    static subscribeToAuction(
        auctionId: string,
        callback: (auction: Auction | null) => void
    ): () => void {
        const auctionRef = this.auctionRef(auctionId);
        onValue(auctionRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            callback(data as Auction | null);
        });

        return () => off(auctionRef);
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
            const data = snapshot.val();
            callback(Array.isArray(data) ? data : []);
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
            const data = snapshot.val();
            callback(Array.isArray(data) ? data : []);
        });

        return () => off(movesRef);
    }

    /**
     * Находит аукцион по URL участника
     */
    static async findAuctionByParticipantUrl(url: string): Promise<{ auction: Auction; participant: AuctionParticipant } | null> {
        try {
            const auctionsSnapshot = await get(this.auctionsRef());
            const auctions = auctionsSnapshot.val() || {};

            for (const auctionId of Object.keys(auctions)) {
                const participantsSnapshot = await get(this.participantsRef(auctionId));
                const participants: AuctionParticipant[] = participantsSnapshot.val() || [];

                const participant = participants.find(p => p.uniqueUrl === url);
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

    /**
     * Очищает данные завершенного аукциона
     */
    static async cleanupAuction(auctionId: string): Promise<void> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');
            if (auction.status !== 'finished') {
                throw new Error('Можно очистить только завершенный аукцион');
            }

            await remove(this.auctionRef(auctionId));
            await remove(this.participantsRef(auctionId));
            await remove(this.movesRef(auctionId));
        } catch (error) {
            console.error('Error cleaning up auction:', error);
            throw error;
        }
    }
}