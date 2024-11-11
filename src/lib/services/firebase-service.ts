import { ref, set, get, update, onValue, off, DataSnapshot } from 'firebase/database';
import { db } from '@/lib/firebase';
import type { Auction, AuctionParticipant, Move } from '@/types/types.ts';

export class FirebaseService {
    private static auctionRef = (auctionId: string) => ref(db, `auctions/${auctionId}`);
    private static movesRef = (auctionId: string) => ref(db, `moves/${auctionId}`);
    private static participantsRef = (auctionId: string) => ref(db, `participants/${auctionId}`);

    static async createAuction(baseAuction: Omit<Auction, 'id'>): Promise<string> {
        const auctionId = crypto.randomUUID();
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
    }

    static async addParticipant(auctionId: string, name: string): Promise<AuctionParticipant> {
        const participant: AuctionParticipant = {
            id: crypto.randomUUID(),
            name,
            role: 'participant',
            uniqueUrl: crypto.randomUUID()
        };

        const participantsRef = this.participantsRef(auctionId);
        const snapshot = await get(participantsRef);
        const participants = snapshot.val() || [];

        await set(participantsRef, [...participants, participant]);

        // Обновляем список участников в аукционе
        const auctionRef = this.auctionRef(auctionId);
        await update(auctionRef, {
            participants: [...(participants.map((p: AuctionParticipant) => p.id)), participant.id]
        });

        return participant;
    }

    static async updateAuctionStatus(auctionId: string, status: Auction['status']) {
        const now = Date.now();
        const updates: Partial<Auction> = {
            status,
            startTime: status === 'active' ? now : undefined,
            endTime: status === 'finished' ? now : undefined,
            moveDeadline: status === 'active' ? now + 30000 : undefined,
        };

        await update(this.auctionRef(auctionId), updates);
    }

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

    static subscribeToParticipants(auctionId: string, callback: (participants: AuctionParticipant[]) => void): () => void {
        const participantsRef = this.participantsRef(auctionId);
        onValue(participantsRef, (snapshot: DataSnapshot) => {
            const participants = snapshot.val() || [];
            callback(participants);
        });

        return () => off(participantsRef);
    }

    static subscribeToMoves(auctionId: string, callback: (moves: Move[]) => void): () => void {
        const movesRef = this.movesRef(auctionId);
        onValue(movesRef, (snapshot: DataSnapshot) => {
            const moves = snapshot.val() || [];
            callback(moves);
        });

        return () => off(movesRef);
    }

    // Найти аукцион по URL участника
    static async findAuctionByParticipantUrl(url: string): Promise<{ auction: Auction; participant: AuctionParticipant } | null> {
        // Получаем все аукционы
        const auctionsRef = ref(db, 'auctions');
        const auctionsSnapshot = await get(auctionsRef);

        // Проходим по всем аукционам
        const auctions = auctionsSnapshot.val() || {};
        for (const auctionId of Object.keys(auctions)) {
            // Получаем участников этого аукциона
            const participantsSnapshot = await get(this.participantsRef(auctionId));
            const participants = participantsSnapshot.val() || [];

            // Ищем участника с нужным URL
            const participant = participants.find((p: AuctionParticipant) => p.uniqueUrl === url);
            if (participant) {
                return {
                    auction: auctions[auctionId],
                    participant
                };
            }
        }

        return null;
    }
}