export interface User {
    id: string;
    name: string;
    role: 'organizer' | 'participant';
    uniqueUrl?: string;
}

export interface Auction {
    id: string;
    status: 'waiting' | 'active' | 'finished';
    startTime?: number;
    endTime?: number;
    currentPrice: number;
    currentParticipantIndex: number;
    participants: User[];
    moveDeadline?: number;
    winnerId?: string;
}

export interface Move {
    userId: string;
    price: number;
    timestamp: number;
}