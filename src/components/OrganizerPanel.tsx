// src/components/OrganizerPanel.tsx
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { FirebaseService } from "@/lib/services/firebase-service"
import { useAuth } from "@/providers/auth-provider"
import { Auction, AuctionParticipant, Move } from "@/types/types"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function OrganizerPanel() {
    const [currentAuction, setCurrentAuction] = useState<Auction | null>(null)
    const [participants, setParticipants] = useState<AuctionParticipant[]>([])
    const [moves, setMoves] = useState<Move[]>([])
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState("")
    const { toast } = useToast()
    const { user } = useAuth()

    useEffect(() => {
        console.log('Auth state:', { user });
        if (!user) return;

        let unsubscribeAuction: () => void;
        let unsubscribeMoves: () => void;
        let unsubscribeParticipants: () => void;

        const initializeAuction = async () => {
            try {
                // TODO: Добавить получение текущего аукциона
                // Временно создаем новый
                if (!currentAuction) {
                    const auctionId = await FirebaseService.createAuction({
                        status: 'waiting',
                        currentPrice: 0,
                        currentParticipantIndex: 0,
                        participants: [],
                        duration: 15 * 60 * 1000, // 15 минут
                        moveTimeout: 30 * 1000 // 30 секунд
                    });

                    // Подписываемся на обновления аукциона
                    unsubscribeAuction = FirebaseService.subscribeToAuction(auctionId, (auction) => {
                        setCurrentAuction(auction);
                    });

                    // Подписываемся на обновления участников
                    unsubscribeParticipants = FirebaseService.subscribeToParticipants(auctionId, (newParticipants) => {
                        setParticipants(newParticipants);
                    });

                    // Подписываемся на ходы
                    unsubscribeMoves = FirebaseService.subscribeToMoves(auctionId, (newMoves) => {
                        setMoves(newMoves);
                    });
                }
            } catch (error) {
                console.error('Ошибка при инициализации аукциона:', error);
                toast({
                    variant: "destructive",
                    title: "Ошибка",
                    description: "Не удалось загрузить данные аукциона"
                });
            }
        };

        initializeAuction();

        // Отписываемся при размонтировании
        return () => {
            unsubscribeAuction?.();
            unsubscribeMoves?.();
            unsubscribeParticipants?.();
        };
    }, [user]);

    const handleStartAuction = async () => {
        if (!currentAuction) return;

        try {
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'active');
            toast({
                title: "Успешно",
                description: "Торги начались"
            });
        } catch (error) {
            console.error('Ошибка при старте аукциона:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось начать торги"
            });
        }
    };

    const handleEndAuction = async () => {
        if (!currentAuction) return;

        try {
            await FirebaseService.updateAuctionStatus(currentAuction.id, 'finished');
            toast({
                title: "Успешно",
                description: "Торги завершены"
            });
        } catch (error) {
            console.error('Ошибка при завершении аукциона:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось завершить торги"
            });
        }
    };


    const handleAddParticipant = async () => {
        if (!currentAuction) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Аукцион не инициализирован"
            });
            return;
        }

        const trimmedName = newParticipantName.trim();
        if (!trimmedName) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Введите имя участника"
            });
            return;
        }

        try {
            const participant = await FirebaseService.addParticipant(currentAuction.id, trimmedName);
            setNewParticipantName("");

            // Формируем полную ссылку для участника
            const participantUrl = `${window.location.origin}/auction/${participant.uniqueUrl}`;

            // Копируем ссылку в буфер обмена
            await navigator.clipboard.writeText(participantUrl);

            toast({
                title: "Участник добавлен",
                description: "Ссылка скопирована в буфер обмена",
            });

            // Закрываем диалог
            setIsDialogOpen(false);
        } catch (error) {
            console.error('Ошибка при добавлении участника:', error);
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось добавить участника"
            });
        }
    };

    const copyParticipantUrl = (url: string) => {
        navigator.clipboard.writeText(`${window.location.origin}/auction/${url}`);
        toast({
            title: "Ссылка скопирована",
            description: "Теперь вы можете отправить её участнику"
        });
    };

    const getStatusColor = (status: Auction['status']) => {
        switch (status) {
            case 'waiting': return 'text-yellow-500';
            case 'active': return 'text-green-500';
            case 'finished': return 'text-red-500';
            default: return '';
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Панель организатора</CardTitle>
                        <CardDescription>
                            Управление текущим аукционом
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <h3 className="font-semibold">Статус аукциона</h3>
                                    <p className={getStatusColor(currentAuction?.status || 'waiting')}>
                                        {currentAuction?.status === 'waiting' && "Ожидание"}
                                        {currentAuction?.status === 'active' && "Активен"}
                                        {currentAuction?.status === 'finished' && "Завершен"}
                                    </p>
                                </div>
                                <Button
                                    variant={currentAuction?.status === 'active' ? "destructive" : "default"}
                                    onClick={currentAuction?.status === 'active' ? handleEndAuction : handleStartAuction}
                                    disabled={currentAuction?.status === 'finished'}
                                >
                                    {currentAuction?.status === 'active' ? "Завершить торги" : "Начать торги"}
                                </Button>
                            </div>

                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        Добавить участника
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Добавить участника</DialogTitle>
                                        <DialogDescription>
                                            После добавления участника, ссылка будет автоматически скопирована в буфер обмена
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={(e) => {
                                        e.preventDefault();
                                        handleAddParticipant();
                                    }} className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Имя участника</Label>
                                            <Input
                                                id="name"
                                                value={newParticipantName}
                                                onChange={(e) => setNewParticipantName(e.target.value)}
                                                placeholder="Введите имя участника"
                                                autoFocus
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                                Отмена
                                            </Button>
                                            <Button type="submit">
                                                Добавить
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Table>
                                <TableCaption>Список участников торгов</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Участник</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>URL для входа</TableHead>
                                        <TableHead>Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {participants.map((participant) => (
                                        <TableRow key={participant.id}>
                                            <TableCell>{participant.name}</TableCell>
                                            <TableCell>
                                                {currentAuction?.currentParticipantIndex === participants.indexOf(participant)
                                                    ? "Текущий ход"
                                                    : "Ожидание"
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <code className="bg-muted px-2 py-1 rounded">
                                                    {participant.uniqueUrl}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => participant.uniqueUrl && copyParticipantUrl(participant.uniqueUrl)}
                                                >
                                                    Копировать URL
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>История ставок</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Время</TableHead>
                                    <TableHead>Участник</TableHead>
                                    <TableHead>Ставка</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {moves.map((move, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {new Date(move.timestamp).toLocaleTimeString()}
                                        </TableCell>
                                        <TableCell>
                                            {participants.find(p => p.id === move.userId)?.name}
                                        </TableCell>
                                        <TableCell>{move.price.toLocaleString()} ₽</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}