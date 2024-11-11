import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Timer, AlertCircle, ArrowRight, Loader2, Crown } from 'lucide-react';
import { FirebaseService } from '@/lib/services/firebase-service';
import { getLeader } from '@/utils/auctionUtils';
import type { Auction, AuctionParticipant, Move } from '@/types/types';
import {cn} from "@/utils/utils.ts";

const AuctionRoom: React.FC = () => {
    const { id } = useParams();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [participant, setParticipant] = useState<AuctionParticipant | null>(null);
    const [participants, setParticipants] = useState<AuctionParticipant[]>([]);
    const [moves, setMoves] = useState<Move[]>([]);
    const [loading, setLoading] = useState(true);
    const [bidAmount, setBidAmount] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<number>(30);
    const [auctionTimeLeft, setAuctionTimeLeft] = useState<number>(900);

    const { toast } = useToast();

    // Инициализация аукциона и подписок
    useEffect(() => {
        if (!id) return;

        const initializeAuctionRoom = async () => {
            try {
                const result = await FirebaseService.findAuctionByParticipantUrl(id);

                if (!result) {
                    toast({
                        variant: "destructive",
                        title: "Ошибка",
                        description: "Аукцион не найден"
                    });
                    return;
                }

                const { auction: foundAuction, participant: foundParticipant } = result;
                setAuction(foundAuction);
                setParticipant(foundParticipant);
                setBidAmount(foundAuction.currentPrice + 1); // Устанавливаем начальную ставку на 1 больше текущей

                // Подписка на обновления аукциона
                const unsubscribeAuction = FirebaseService.subscribeToAuction(
                    foundAuction.id,
                    (updatedAuction) => {
                        if (updatedAuction) {
                            setAuction(updatedAuction);
                            setBidAmount(prev => Math.max(prev, updatedAuction.currentPrice + 1));
                        }
                    }
                );

                // Подписка на участников
                const unsubscribeParticipants = FirebaseService.subscribeToParticipants(
                    foundAuction.id,
                    setParticipants
                );

                // Подписка на ходы
                const unsubscribeMoves = FirebaseService.subscribeToMoves(
                    foundAuction.id,
                    setMoves
                );

                setLoading(false);

                return () => {
                    unsubscribeAuction();
                    unsubscribeParticipants();
                    unsubscribeMoves();
                };
            } catch (error) {
                console.error('Ошибка инициализации:', error);
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: "Не удалось подключиться к аукциону"
                });
            }
        };

        initializeAuctionRoom();
    }, [id, toast]);

    // Обработка времени
    useEffect(() => {
        if (!auction || auction.status !== 'active') return;

        // Время на ход
        const moveInterval = setInterval(() => {
            if (auction.moveDeadline) {
                const timeLeftOnMove = Math.max(0, Math.floor((auction.moveDeadline - Date.now()) / 1000));
                setTimeLeft(timeLeftOnMove);
            }
        }, 1000);

        // Общее время аукциона
        const auctionInterval = setInterval(() => {
            if (auction.startTime && auction.duration) {
                const timeLeftInAuction = Math.max(
                    0,
                    Math.floor(((auction.startTime + auction.duration) - Date.now()) / 1000)
                );
                setAuctionTimeLeft(timeLeftInAuction);
            }
        }, 1000);

        return () => {
            clearInterval(moveInterval);
            clearInterval(auctionInterval);
        };
    }, [auction]);

    // Проверка, является ли текущий ход участника
    const isMyTurn = auction && participant &&
        auction.status === 'active' &&
        participants[auction.currentParticipantIndex]?.id === participant.id;

    // Получаем информацию о лидере
    const leader = getLeader(moves, participants);
    const isLeader = leader?.participant.id === participant?.id;

    // Обработка отправки ставки
    const handleSubmit = async () => {
        if (!auction || !participant || !isMyTurn) return;

        try {
            setLoading(true);

            const move: Move = {
                userId: participant.id,
                price: bidAmount,
                timestamp: Date.now()
            };

            await FirebaseService.addMove(auction.id, move);

            // Обновляем аукцион
            const nextParticipantIndex =
                (auction.currentParticipantIndex + 1) % participants.length;

            await FirebaseService.updateAuction(auction.id, {
                currentPrice: bidAmount,
                currentParticipantIndex: nextParticipantIndex,
                moveDeadline: Date.now() + 30000 // 30 секунд на следующий ход
            });

            toast({
                title: "Успешно",
                description: "Ставка принята"
            });
        } catch (error) {
            console.error('Ошибка при отправке ставки:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось сделать ставку"
            });
        } finally {
            setLoading(false);
        }
    };

    // Пропуск хода
    const handleSkip = async () => {
        if (!auction || !participant || !isMyTurn) return;

        try {
            setLoading(true);
            const nextParticipantIndex =
                (auction.currentParticipantIndex + 1) % participants.length;

            await FirebaseService.updateAuction(auction.id, {
                currentParticipantIndex: nextParticipantIndex,
                moveDeadline: Date.now() + 30000
            });

            toast({
                title: "Ход пропущен",
                description: "Очередь перешла к следующему участнику"
            });
        } catch (error) {
            console.error('Ошибка при пропуске хода:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось пропустить ход"
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!auction || !participant) {
        return (
            <div className="container max-w-2xl mx-auto p-4">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Аукцион не найден или ссылка недействительна
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto p-4">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Активный аукцион</span>
                        <div className="flex items-center gap-2 text-sm font-normal">
                            <Timer className="w-4 h-4" />
                            {Math.floor(auctionTimeLeft / 60)}:{String(auctionTimeLeft % 60).padStart(2, '0')}
                        </div>
                    </CardTitle>
                    <CardDescription>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span>Время на ход</span>
                                <span className={timeLeft < 10 ? "text-destructive" : ""}>
                                    {timeLeft} сек
                                </span>
                            </div>
                            <Progress value={(timeLeft / 30) * 100} />
                        </div>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="p-4 bg-muted rounded-lg space-y-3">
                        <div className="text-2xl font-bold text-center">
                            Текущая ставка: {auction.currentPrice.toLocaleString()} ₽
                        </div>

                        {leader && (
                            <div className="flex items-center justify-center gap-2 text-center">
                                <Crown className="h-4 w-4 text-yellow-500" />
                                <span className="text-sm text-muted-foreground">Лидер торгов: </span>
                                <span className="font-medium">
                                    {leader.participant.name}
                                    {isLeader ? ' (вы)' : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {isMyTurn ? (
                        <div className="space-y-4">
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    Сейчас ваш ход! Сделайте ставку или пропустите ход
                                </AlertDescription>
                            </Alert>

                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(Number(e.target.value))}
                                    className="text-lg"
                                    min={auction.currentPrice + 1}
                                />
                                <Button
                                    onClick={handleSubmit}
                                    disabled={loading || bidAmount <= auction.currentPrice}
                                    className="min-w-[140px]"
                                >
                                    {loading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            Сделать ставку
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Alert className="bg-muted">
                            <AlertDescription>
                                Ожидание хода других участников...
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <h3 className="font-medium">Участники:</h3>
                        <div className="space-y-2">
                            {participants.map((p) => (
                                <div
                                    key={p.id}
                                    className={cn(
                                        "flex justify-between items-center p-2 rounded",
                                        p.id === participant.id && 'bg-secondary',
                                        leader?.participant.id === p.id && 'border-l-4 border-yellow-500 pl-3'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {leader?.participant.id === p.id && (
                                            <Crown className="h-4 w-4 text-yellow-500" />
                                        )}
                                        <span className={p.id === participant.id ? 'font-medium' : ''}>
                                            {p.name} {p.id === participant.id ? '(вы)' : ''}
                                        </span>
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {auction.currentParticipantIndex === participants.indexOf(p)
                                            ? 'Текущий ход'
                                            : 'Ожидание'
                                        }
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* История ставок */}
                    <div className="space-y-2">
                        <h3 className="font-medium">История ставок:</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {moves.map((move, index) => (
                                <div key={index} className="flex justify-between items-center p-2 text-sm">
                                    <span>
                                        {participants.find(p => p.id === move.userId)?.name}
                                        {move.userId === participant.id ? ' (вы)' : ''}
                                    </span>
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
                    </div>
                </CardContent>

                <CardFooter>
                    {isMyTurn && (
                        <Button
                            variant="outline"
                            onClick={handleSkip}
                            disabled={loading}
                            className="w-full"
                        >
                            Пропустить ход
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
};

export default AuctionRoom;