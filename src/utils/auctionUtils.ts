import type {Auction, AuctionParticipant, Move} from "@/types/types.ts";

export function getStatusColor(status: Auction['status']): string {
    switch (status) {
        case 'waiting': return 'text-yellow-500 dark:text-yellow-400';
        case 'active': return 'text-green-500 dark:text-green-400';
        case 'finished': return 'text-red-500 dark:text-red-400';
        default: return '';
    }
}

export function getStatusText(status: Auction['status']): string {
    switch (status) {
        case 'waiting': return 'Ожидание участников';
        case 'active': return 'Торги идут';
        case 'finished': return 'Торги завершены';
        default: return 'Неизвестный статус';
    }
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getLeader(moves: Move[], participants: AuctionParticipant[]): {
    participant: AuctionParticipant;
    price: number;
} | null {
    if (!moves.length) return null;

    // Находим ход с максимальной ценой
    const maxMove = moves.reduce((max, move) =>
            move.price > max.price ? move : max
        , moves[0]);

    const leader = participants.find(p => p.id === maxMove.userId);
    return leader ? { participant: leader, price: maxMove.price } : null;
}

export async function copyToClipboard(text: string): Promise<void> {
    try {
        await navigator.clipboard.writeText(text);
        return Promise.resolve();
    } catch (error) {
        return Promise.reject(error);
    }
}

export function getParticipantUrl(uniqueUrl: string): string {
    return `${window.location.origin}/auction/${uniqueUrl}`;
}