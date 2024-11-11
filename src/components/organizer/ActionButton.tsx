import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
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
import type { Auction } from "@/types/types";

interface ActionButtonProps {
    currentAuction: Auction | null;
    loading: boolean;
    onStart: () => void;
    onEnd: () => void;
}

export function ActionButton({ currentAuction, loading, onStart, onEnd }: ActionButtonProps) {
    if (currentAuction?.status === 'finished') return null;

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant={currentAuction?.status === 'active' ? "destructive" : "default"}
                    disabled={loading}
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
                    <AlertDialogDescription>
                        {currentAuction?.status === 'active'
                            ? "Это действие завершит текущие торги. Все участники получат уведомление о завершении."
                            : "Убедитесь, что все участники готовы к началу торгов."
                        }
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
    );
}