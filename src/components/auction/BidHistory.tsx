import { Crown } from "lucide-react";
import type { Move, AuctionParticipant } from "@/types/types";

interface BidHistoryProps {
    moves: Move[];
    participants: AuctionParticipant[];
    currentUserId: string;
    leaderId?: string;
}

export function BidHistory({ moves, participants, currentUserId, leaderId }: BidHistoryProps) {
    return (
        <div className="space-y-2 max-h-40 overflow-y-auto">
            {moves.map((move, index) => (
                <div key={index} className="flex justify-between items-center p-2 text-sm">
                    <div className="flex items-center gap-2">
                        {move.userId === leaderId && (
                            <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        <span>
                            {participants.find(p => p.id === move.userId)?.name}
                            {move.userId === currentUserId ? ' (вы)' : ''}
                        </span>
                    </div>
                    <span className="text-muted-foreground">
                        {move.price.toLocaleString()} ₽
                    </span>
                </div>
            ))}
            {moves.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-2">
                    Пока нет ставок
                </div>
            )}
        </div>
    );
}