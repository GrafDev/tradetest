import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Auction, AuctionParticipant } from "@/types/types";

interface ActionButtonProps {
    currentAuction: Auction | null;
    loading: boolean;
    onStart: () => void;
    onEnd: () => void;
    participants: AuctionParticipant[];
}

export function ActionButton({
                                 currentAuction,
                                 loading,
                                 onStart,
                                 onEnd,
                                 participants
                             }: ActionButtonProps) {
    if (currentAuction?.status === 'finished') return null;

    const participantsCount = participants.length;
    const isEnoughParticipants = participantsCount >= 2;
    const remainingParticipants = 2 - participantsCount;

    return (
        <div className="space-y-4">
            {currentAuction?.status === 'waiting' && !isEnoughParticipants && (
                <Alert variant="destructive" className="mb-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {participantsCount === 0
                            ? "Добавьте минимум 2 участника для начала торгов"
                            : `Необходимо добавить ещё ${remainingParticipants} ${
                                remainingParticipants === 1 ? "участника" : "участников"
                            } для начала торгов`
                        }
                    </AlertDescription>
                </Alert>
            )}

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        variant={currentAuction?.status === 'active' ? "destructive" : "default"}
                        disabled={loading}
                        className={`w-full md:w-auto ${currentAuction?.status === 'waiting' && !isEnoughParticipants ? 'hidden' : ''}`}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            currentAuction?.status === 'active' ? "Завершить торги" : "Начать торги"
                        )}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {currentAuction?.status === 'active'
                                ? "Завершить торги?"
                                : "Начать торги?"
                            }
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2 text-sm text-muted-foreground">
                                {currentAuction?.status === 'active' ? (
                                    "Это действие завершит текущие торги. Все участники получат уведомление о завершении."
                                ) : (
                                    <>
                                        <span className="block">
                                            Убедитесь, что все участники готовы к началу торгов.
                                        </span>
                                        <span className="block font-medium text-foreground">
                                            Количество участников: {participantsCount}
                                        </span>
                                        <span className="block">
                                            Торги будут длиться 15 минут, каждому участнику даётся 30 секунд на ход.
                                        </span>
                                    </>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={currentAuction?.status === 'active' ? onEnd : onStart}
                        >
                            Подтвердить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}