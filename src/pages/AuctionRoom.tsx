import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle, Timer } from 'lucide-react';
import { useAuctionParticipant } from '@/hooks/useAuctionParticipant';
import { useAuctionTimer } from '@/hooks/useAuctionTimer';
import { getLeader } from '@/utils/auctionUtils';
import { AuctionItemInfo } from '@/components/auction/AuctionItemInfo';
import { BiddingControl } from '@/components/auction/BiddingControl';
import { BidHistory } from '@/components/auction/BidHistory';
import { ParticipantsList } from '@/components/auction/ParticipantsList';
import { AuctionStatus } from "@/components/auction/AuctionStatus";
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function AuctionRoom() {
    const { id } = useParams();
    const { toast } = useToast();

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

    // Добавляем автономный таймер
    useAuctionTimer(auction);

    // Уведомления о важных событиях
    useEffect(() => {
        if (!auction || !participant) return;

        // Уведомление о начале хода
        if (isMyTurn) {
            toast({
                title: "Ваш ход!",
                description: "У вас есть 30 секунд на принятие решения",
            });
        }

        // Уведомление о скором окончании аукциона
        if (auction.status === 'active' && auctionTimeLeft <= 60) {
            toast({
                title: "Внимание!",
                description: "До окончания торгов осталась 1 минута",
                variant: "destructive"
            });
        }

        // Уведомление о завершении аукциона
        if (auction.status === 'finished') {
            const leader = getLeader(moves, participants);
            if (leader) {
                toast({
                    title: "Аукцион завершен",
                    description: `Победитель: ${leader.participant.name} с ценой ${leader.price.toLocaleString()} ₽`
                });
            }
        }
    }, [auction?.status, isMyTurn, auctionTimeLeft, moves, participants, participant, toast]);

    // Проверка валидности аукциона и участника
    if (!loading && (!auction || !participant || participant.auctionId !== auction.id)) {
        return (
            <div className="container max-w-2xl mx-auto p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {!auction ? "Аукцион не найден" :
                            !participant ? "Участник не найден" :
                                "Ссылка недействительна или аукцион завершен"}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Отображение загрузки
    if (loading || !auction || !participant) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const leader = getLeader(moves, participants);

    return (
        <div className="container max-w-2xl mx-auto p-4">
            <div className="space-y-6">
                {/* Информация о предмете торгов */}
                <AuctionItemInfo item={auction.item} />

                {/* Основной блок торгов */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>
                                {auction.status === 'waiting' ? 'Ожидание начала торгов' :
                                    auction.status === 'active' ? 'Идут торги' : 'Торги завершены'}
                            </span>
                            {auction.status === 'active' && (
                                <div className="flex items-center gap-2 text-sm font-normal">
                                    <Timer className="w-4 h-4" />
                                    {Math.floor(auctionTimeLeft / 60)}:{String(auctionTimeLeft % 60).padStart(2, '0')}
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Статус аукциона */}
                        {auction.status === 'active' && (
                            <AuctionStatus
                                currentPrice={auction.currentPrice}
                                leader={leader}
                                timeLeft={auctionTimeLeft}
                            />
                        )}

                        {/* Управление ставками */}
                        {auction.status === 'active' && (
                            <BiddingControl
                                auction={auction}
                                isMyTurn={isMyTurn ?? false}
                                loading={loading}
                                timeLeft={timeLeft}
                                onPlaceBid={placeBid}
                                onSkip={skipTurn}
                            />
                        )}

                        {/* Список участников */}
                        <ParticipantsList
                            participants={participants}
                            currentParticipant={participant}
                            leaderId={leader?.participant.id}
                            currentParticipantIndex={auction.currentParticipantIndex}
                        />

                        {/* История ставок */}
                        <div className="space-y-2">
                            <h3 className="font-medium">История ставок:</h3>
                            <BidHistory
                                moves={moves}
                                participants={participants}
                                currentUserId={participant.id}
                                leaderId={leader?.participant.id}
                            />
                        </div>

                        {/* Сообщение о завершении */}
                        {auction.status === 'finished' && leader && (
                            <Alert>
                                <AlertDescription className="font-medium text-center">
                                    Аукцион завершен. Победитель: {leader.participant.name}
                                    <br />
                                    Финальная цена: {leader.price.toLocaleString()} ₽
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}