import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuction } from "@/hooks/useAuction";
import { useToast } from "@/hooks/use-toast";
import { copyToClipboard, getParticipantUrl, getLeader } from "@/utils/auctionUtils";
import { AuctionStatus } from "./organizer/AuctionStatus";
import { TimeProgress } from "./organizer/TimeProgress";
import { ActionButton } from "./organizer/ActionButton";
import { ParticipantDialog } from "./organizer/ParticipantDialog";
import { ParticipantsTable } from "./organizer/ParticipantsTable";
import { BiddingHistory } from "./organizer/BiddingHistory";
import { EditAuctionItemDialog } from "./organizer/EditAuctionItemDialog";
import { CreateAuctionForm } from "@/components/auction/CreateAuctionForm";

export default function OrganizerPanel() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newParticipantName, setNewParticipantName] = useState("");
    const { toast } = useToast();

    const {
        currentAuction,
        participants,
        moves,
        loading,
        auctionTimeLeft,
        moveTimeLeft,
        handleStartAuction,
        handleEndAuction,
        handleAddParticipant,
        handleRemoveParticipant,
        updateAuctionItem,
    } = useAuction();

    // Отладочный эффект
    useEffect(() => {
        console.log("Current auction state:", currentAuction);
    }, [currentAuction]);

    const leader = getLeader(moves, participants);

    const onAddParticipant = async () => {
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
            const participant = await handleAddParticipant(trimmedName);
            setNewParticipantName("");
            await copyToClipboard(getParticipantUrl(participant.uniqueUrl));

            toast({
                title: "Участник добавлен",
                description: "Ссылка скопирована в буфер обмена",
            });

            setIsDialogOpen(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: error instanceof Error ? error.message : "Не удалось добавить участника"
            });
        }
    };

    const onCopyUrl = async (uniqueUrl: string) => {
        try {
            await copyToClipboard(getParticipantUrl(uniqueUrl));
            toast({
                title: "Успешно",
                description: "Ссылка скопирована в буфер обмена"
            });
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Ошибка",
                description: "Не удалось скопировать ссылку"
            });
        }
    };

    // Показываем загрузку при инициализации
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    // Если нет аукциона - показываем форму создания
    if (!currentAuction || !currentAuction.item) {
        return (
            <div className="container mx-auto p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Создание аукциона</CardTitle>
                        <CardDescription>
                            Заполните информацию для создания нового аукциона
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <CreateAuctionForm />
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Основной интерфейс панели организатора
    return (
        <div className="container mx-auto p-4">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>{currentAuction.item.title}</CardTitle>
                                <CardDescription>
                                    Минимальный шаг: {currentAuction.item.minStep.toLocaleString()} ₽
                                </CardDescription>
                            </div>
                            <EditAuctionItemDialog
                                auctionId={currentAuction.id}
                                item={currentAuction.item}
                                onUpdate={updateAuctionItem}
                                disabled={currentAuction.status !== 'waiting'}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            {currentAuction.item.description}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Панель организатора торгов</CardTitle>
                        <CardDescription>
                            Управление текущим аукционом
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="grid md:grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                                <div className="md:col-span-2">
                                    <AuctionStatus
                                        currentAuction={currentAuction}
                                        auctionTimeLeft={auctionTimeLeft}
                                        leader={leader}
                                    />
                                </div>
                                <div className="flex justify-end items-center">
                                    <ActionButton
                                        currentAuction={currentAuction}
                                        loading={loading}
                                        onStart={handleStartAuction}
                                        onEnd={handleEndAuction}
                                        participants={participants}
                                    />
                                </div>
                            </div>

                            {currentAuction.status === 'active' && (
                                <TimeProgress moveTimeLeft={moveTimeLeft} />
                            )}

                            <ParticipantDialog
                                isOpen={isDialogOpen}
                                onOpenChange={setIsDialogOpen}
                                participantName={newParticipantName}
                                onParticipantNameChange={setNewParticipantName}
                                onSubmit={onAddParticipant}
                                currentAuction={currentAuction}
                            />

                            <ParticipantsTable
                                participants={participants}
                                currentAuction={currentAuction}
                                leaderId={leader?.participant.id}
                                onCopyUrl={onCopyUrl}
                                onRemoveParticipant={handleRemoveParticipant}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>История ставок</CardTitle>
                        <CardDescription>
                            Все ставки участников в хронологическом порядке
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BiddingHistory
                            moves={moves}
                            participants={participants}
                            leaderId={leader?.participant.id}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}