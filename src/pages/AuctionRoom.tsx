// src/pages/AuctionRoom.tsx
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Timer } from 'lucide-react';
import { useAuctionParticipant } from '@/hooks/useAuctionParticipant';
import { getLeader } from '@/utils/auctionUtils';
import { AuctionItemInfo } from '@/components/auction/AuctionItemInfo';
import { BiddingControl } from '@/components/auction/BiddingControl';
import { BidHistory } from '@/components/auction/BidHistory';
import { ParticipantsList } from '@/components/auction/ParticipantsList';
import {AuctionStatus} from "@/components/auction/AuctionStatus.tsx";

export default function AuctionRoom() {
    const { id } = useParams();
    const {
        auction,
        participant,
        participants,
        moves,
        loading,
        timeLeft,
        auctionTimeLeft,
        isMyTurn,
        placeBid,
        skipTurn
    } = useAuctionParticipant(id || '');

    const leader = getLeader(moves, participants);

    if (loading && !auction) {
        return <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>;
    }

    if (!auction || !participant) {
        return <div className="container max-w-2xl mx-auto p-4">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Аукцион не найден или ссылка недействительна
                </AlertDescription>
            </Alert>
        </div>;
    }

    return (
        <div className="container max-w-2xl mx-auto p-4">
            <div className="space-y-6">
                <AuctionItemInfo item={auction.item} />

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Текущие торги</span>
                            <div className="flex items-center gap-2 text-sm font-normal">
                                <Timer className="w-4 h-4" />
                                {Math.floor(auctionTimeLeft / 60)}:{String(auctionTimeLeft % 60).padStart(2, '0')}
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <AuctionStatus
                            currentPrice={auction.currentPrice}
                            leader={leader}
                            timeLeft={timeLeft}
                        />

                        <BiddingControl
                            auction={auction}
                            isMyTurn={Boolean(isMyTurn)}
                            loading={loading}
                            timeLeft={timeLeft}
                            onPlaceBid={placeBid}
                            onSkip={skipTurn}
                        />

                        <ParticipantsList
                            participants={participants}
                            currentParticipant={participant}
                            leaderId={leader?.participant.id}
                            currentParticipantIndex={auction.currentParticipantIndex}
                        />

                        <div className="space-y-2">
                            <h3 className="font-medium">История ставок:</h3>
                            <BidHistory
                                moves={moves}
                                participants={participants}
                                currentUserId={participant.id}
                                leaderId={leader?.participant.id}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}