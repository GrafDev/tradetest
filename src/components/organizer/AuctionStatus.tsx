import { Crown, Timer } from "lucide-react";
import { getStatusColor, getStatusText, formatTime } from "@/utils/auctionUtils";
import type { Auction, AuctionParticipant} from "@/types/types";

interface AuctionStatusProps {
    currentAuction: Auction | null;
    auctionTimeLeft: number;
    leader: { participant: AuctionParticipant; price: number; } | null;
}

export function AuctionStatus({ currentAuction, auctionTimeLeft, leader }: AuctionStatusProps) {
    return (
        <div className="grid md:grid-cols-2 gap-4">
            {/* Статус */}
            <div className="space-y-1">
                <h3 className="font-semibold">Статус аукциона</h3>
                <div className="flex items-center space-x-2">
                    <span className={getStatusColor(currentAuction?.status || 'waiting')}>
                        {getStatusText(currentAuction?.status || 'waiting')}
                    </span>
                    {currentAuction?.status === 'active' && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                            <Timer className="h-4 w-4" />
                            <span>{formatTime(Math.floor(auctionTimeLeft / 60))}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Лидер торгов */}
            {leader && (
                <div className="space-y-1">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        Лидер торгов
                    </h3>
                    <div>
                        <div className="font-medium">{leader.participant.name}</div>
                        <div className="text-sm text-muted-foreground">
                            {leader.price.toLocaleString()} ₽
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}