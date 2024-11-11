import type { User as FirebaseUser } from 'firebase/auth';

// Базовые роли пользователей
export type UserRole = 'organizer' | 'participant';

// Базовый интерфейс для создания нового участника
export interface NewParticipant {
    id: string;
    name: string;
    role: 'participant';
}

// Полный интерфейс участника аукциона (включая URL)
export interface AuctionParticipant extends NewParticipant {
    uniqueUrl: string;
}

// Интерфейс для авторизованного пользователя
export interface AuthUser extends Omit<FirebaseUser, 'role'> {
    role?: UserRole;
}

// Статусы аукциона
export type AuctionStatus = 'waiting' | 'active' | 'finished';

// Интерфейс аукциона
export interface Auction {
    id: string;
    status: AuctionStatus;
    startTime?: number | null;
    endTime?: number | null;
    currentPrice: number;
    currentParticipantIndex: number;
    participants: string[];
    moveDeadline?: number | null;
    winnerId?: string;
    duration?: number;
    moveTimeout?: number;
}

// Интерфейс хода в аукционе
export interface Move {
    userId: string;
    price: number;
    timestamp: number;
}