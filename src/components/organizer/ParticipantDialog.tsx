import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import type { Auction } from "@/types/types";

interface ParticipantDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    participantName: string;
    onParticipantNameChange: (name: string) => void;
    onSubmit: () => Promise<void>;
    currentAuction: Auction | null;
}

export function ParticipantDialog({
                                      isOpen,
                                      onOpenChange,
                                      participantName,
                                      onParticipantNameChange,
                                      onSubmit,
                                      currentAuction
                                  }: ParticipantDialogProps) {
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full"
                    disabled={currentAuction?.status !== 'waiting'}
                >
                    Добавить участника
                </Button>
            </DialogTrigger>
            <DialogContent onInteractOutside={(e) => {
                // Предотвращаем закрытие во время обработки
                if (participantName.trim()) {
                    e.preventDefault();
                }
            }}>
                <DialogHeader>
                    <DialogTitle>Добавить участника</DialogTitle>
                    <DialogDescription>
                        После добавления участника, ссылка будет автоматически скопирована в буфер обмена
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Имя участника</Label>
                        <Input
                            id="name"
                            value={participantName}
                            onChange={(e) => onParticipantNameChange(e.target.value)}
                            placeholder="Введите имя участника"
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={!participantName.trim()}>
                            Добавить
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}