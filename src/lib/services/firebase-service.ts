import { ref, set, get, update, remove, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Auction, AuctionParticipant, Move, AuctionItem } from '@/types/types';

interface CreateAuctionData {
    item: AuctionItem;
    currentPrice: number;
}

export class FirebaseService {
    private static auctionRef = (auctionId: string) => ref(db, `auctions/${auctionId}`);
    private static movesRef = (auctionId: string) => ref(db, `moves/${auctionId}`);
    private static participantsRef = (auctionId: string) => ref(db, `auction_users/${auctionId}`);
    private static auctionsRef = () => ref(db, 'auctions');

    // Базовые операции с аукционами
    static async createAuction(data: CreateAuctionData): Promise<string> {
        const auctionId = crypto.randomUUID();

        const baseAuction: Auction = {
            id: auctionId,
            status: 'waiting',
            currentPrice: data.currentPrice,
            currentParticipantIndex: 0,
            participants: [],
            item: data.item,
            duration: 15 * 60 * 1000, // 15 минут
            moveTimeout: 30 * 1000,   // 30 секунд
            lastUpdated: Date.now()   // Добавляем время создания
        };

        try {
            await set(this.auctionRef(auctionId), baseAuction);
            return auctionId;
        } catch (error) {
            console.error('Error creating auction:', error);
            throw new Error('Не удалось создать аукцион');
        }
    }

    static async getActiveAuctions(): Promise<Auction[]> {
        const snapshot = await get(this.auctionsRef());
        const data = snapshot.val() || {};

        return Object.values(data)
            .filter((auction: any): auction is Auction => (
                !!auction && auction.status === 'active' || auction.status === 'waiting'
            ))
            .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
    }

    static async getLastMove(auctionId: string): Promise<Move | null> {
        const moves = await this.getMoves(auctionId);
        return moves.length > 0 ? moves[moves.length - 1] : null;
    }
    
    static async getLastCreatedAuction(): Promise<Auction | null> {
        const snapshot = await get(this.auctionsRef());
        const data = snapshot.val() || {};
        const auctions = Object.values(data)
            .filter((auction: any): auction is Auction => (
                !!auction && auction.status !== 'finished'
            ))
            .sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

        return auctions[0] || null;
    }

    static async getAuction(auctionId: string): Promise<Auction | null> {
        const snapshot = await get(this.auctionRef(auctionId));
        return snapshot.val();
    }

    static async getParticipantsCount(auctionId: string): Promise<number> {
        const participants = await this.getParticipants(auctionId);
        return participants.length;
    }
    // Управление статусом аукциона
    static async updateAuctionStatus(auctionId: string, status: Auction['status']) {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');

            const updates: Partial<Auction> = { status };

            if (status === 'active') {
                const participants = await this.getParticipantsCount(auctionId);
                if (participants < 2) {
                    throw new Error('Для начала торгов необходимо минимум 2 участника');
                }

                const now = Date.now();
                Object.assign(updates, {
                    startTime: now,
                    moveDeadline: now + 30000, // 30 секунд на ход
                    duration: 15 * 60 * 1000, // 15 минут на аукцион
                    currentParticipantIndex: 0
                });
            }

            if (status === 'finished') {
                Object.assign(updates, {
                    endTime: Date.now()
                });
            }

            await update(this.auctionRef(auctionId), updates);
            return updates;
        } catch (error) {
            console.error('Error updating auction status:', error);
            throw error;
        }
    }
    // В класс FirebaseService добавляем новый метод:
    static async updateAuction(auctionId: string, updates: Partial<Auction>): Promise<void> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');

            // Обновляем поля аукциона
            await update(this.auctionRef(auctionId), {
                ...updates,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error updating auction:', error);
            throw new Error('Не удалось обновить аукцион');
        }
    }

    // Управление ходами
    static async updateMoveDeadline(auctionId: string, nextParticipantIndex: number) {
        const now = Date.now();
        await update(this.auctionRef(auctionId), {
            currentParticipantIndex: nextParticipantIndex,
            moveDeadline: now + 30000,
            lastUpdated: now
        });
    }
    // В класс FirebaseService добавляем новый метод:
    static async updateAuctionItem(auctionId: string, itemUpdates: Partial<AuctionItem>): Promise<void> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction) throw new Error('Аукцион не найден');

            // Обновляем только указанные поля предмета
            const updatedItem = {
                ...auction.item,
                ...itemUpdates
            };

            // Обновляем предмет в аукционе
            await update(this.auctionRef(auctionId), {
                item: updatedItem,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Error updating auction item:', error);
            throw new Error('Не удалось обновить информацию о предмете');
        }
    }

    static async getParticipants(auctionId: string): Promise<AuctionParticipant[]> {
        const snapshot = await get(this.participantsRef(auctionId));
        return snapshot.val() || [];
    }

    // Управление участниками
    static async addParticipant(auctionId: string, name: string): Promise<AuctionParticipant> {
        try {
            const auction = await this.getAuction(auctionId);
            if (!auction || auction.status !== 'waiting') {
                throw new Error('Нельзя добавить участника после начала торгов');
            }

            const participant: AuctionParticipant = {
                id: crypto.randomUUID(),
                name,
                role: 'participant',
                uniqueUrl: crypto.randomUUID(),
                auctionId: auctionId // Добавляем привязку к аукциону
            };

            const participants = await this.getParticipants(auctionId);
            const updates: Record<string, any> = {};
            updates[`auction_users/${auctionId}`] = [...participants, participant];
            updates[`auctions/${auctionId}/participants`] = [...participants, participant].map(p => p.id);

            await update(ref(db), updates);
            return participant;
        } catch (error) {
            console.error('Error adding participant:', error);
            throw error;
        }
    }

    static async removeParticipant(auctionId: string, participantId: string) {
        const auction = await this.getAuction(auctionId);
        if (!auction || auction.status !== 'waiting') {
            throw new Error('Нельзя удалить участника после начала торгов');
        }

        const participants = await this.getParticipants(auctionId);
        const updatedParticipants = participants.filter(p => p.id !== participantId);

        if (participants.length === updatedParticipants.length) {
            throw new Error('Участник не найден');
        }

        await set(this.participantsRef(auctionId), updatedParticipants);
        await update(this.auctionRef(auctionId), {
            participants: updatedParticipants.map(p => p.id)
        });
    }

    // Управление ставками
    static async addMove(auctionId: string, move: Omit<Move, 'timestamp'>) {
        const auction = await this.getAuction(auctionId);
        if (!auction || auction.status !== 'active') {
            throw new Error('Аукцион не активен');
        }

        if (move.price <= auction.currentPrice) {
            throw new Error('Новая ставка должна быть больше текущей');
        }

        if (move.price < auction.currentPrice + auction.item.minStep) {
            throw new Error(`Минимальный шаг ставки: ${auction.item.minStep} ₽`);
        }

        const timestamp = Date.now();
        const fullMove: Move = { ...move, timestamp };

        const moves = await this.getMoves(auctionId);
        await set(this.movesRef(auctionId), [...moves, fullMove]);
        await update(this.auctionRef(auctionId), {
            currentPrice: move.price,
            lastUpdated: timestamp
        });

        return fullMove;
    }

    static async getMoves(auctionId: string): Promise<Move[]> {
        const snapshot = await get(this.movesRef(auctionId));
        return snapshot.val() || [];
    }

    // Подписки на обновления
    static subscribeToAuction(auctionId: string, callback: (auction: Auction | null) => void): () => void {
        onValue(this.auctionRef(auctionId), (snapshot) => callback(snapshot.val()));
        return () => off(this.auctionRef(auctionId));
    }

    static subscribeToParticipants(auctionId: string, callback: (participants: AuctionParticipant[]) => void): () => void {
        onValue(this.participantsRef(auctionId), (snapshot) => callback(snapshot.val() || []));
        return () => off(this.participantsRef(auctionId));
    }

    static subscribeToMoves(auctionId: string, callback: (moves: Move[]) => void): () => void {
        onValue(this.movesRef(auctionId), (snapshot) => callback(snapshot.val() || []));
        return () => off(this.movesRef(auctionId));
    }

    // Поиск и очистка
    static async findAuctionByParticipantUrl(url: string): Promise<{ auction: Auction; participant: AuctionParticipant } | null> {
        const snapshot = await get(this.auctionsRef());
        const auctions = snapshot.val() || {};

        for (const auctionId of Object.keys(auctions)) {
            const participants = await this.getParticipants(auctionId);
            const participant = participants.find(p =>
                p.uniqueUrl === url && p.auctionId === auctionId // Проверяем соответствие аукциона
            );

            if (participant) {
                const auction = auctions[auctionId];
                // Проверяем статус аукциона
                if (auction.status === 'finished') {
                    return null; // Аукцион завершен, ссылка недействительна
                }
                return { auction, participant };
            }
        }
        return null;
    }

    static async cleanupAuction(auctionId: string) {
        const auction = await this.getAuction(auctionId);
        if (!auction || auction.status !== 'finished') {
            throw new Error('Можно очистить только завершенный аукцион');
        }

        await remove(this.auctionRef(auctionId));
        await remove(this.participantsRef(auctionId));
        await remove(this.movesRef(auctionId));
    }
}