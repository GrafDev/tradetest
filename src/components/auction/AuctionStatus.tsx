import { Crown } from "lucide-react";
import type { AuctionParticipant } from "@/types/types";

interface AuctionStatusProps {
    currentPrice: number;
    leader: { participant: AuctionParticipant; price: number } | null;
    timeLeft: number;
}

export function AuctionStatus({ currentPrice, leader, timeLeft }: AuctionStatusProps) {
    return (
        <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="text-2xl font-bold text-center">
                Текущая ставка: {currentPrice.toLocaleString()} ₽
            </div>

            {leader && (
                <div className="flex items-center justify-center gap-2 text-center">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm text-muted-foreground">Лидер торгов: </span>
                    <span className="font-medium">
                        {leader.participant.name}
                    </span>
                </div>
            )}

            <div className="text-sm text-center text-muted-foreground">
                Осталось времени: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
            </div>
        </div>
    );
}