import React from "react";
import { Button } from "@/components/ui/button";
import { Crown, Copy, Trash2 } from "lucide-react";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Auction, AuctionParticipant } from "@/types/types";

interface ParticipantsTableProps {
    participants: AuctionParticipant[];
    currentAuction: Auction | null;
    leaderId?: string;
    onCopyUrl: (url: string) => Promise<void>;
    onRemoveParticipant: (id: string) => Promise<void>;
}

export const ParticipantsTable = React.memo(function ParticipantsTable({
                                                                     participants,
                                                                     currentAuction,
                                                                     leaderId,
                                                                     onCopyUrl,
                                                                     onRemoveParticipant
                                                                 }: ParticipantsTableProps) {
    return (
        <Table>
            <TableCaption>Список участников торгов</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>Участник</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>URL для входа</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {participants.map((participant) => (
                    <TableRow key={participant.id}>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {leaderId === participant.id && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                                <span className="font-medium">{participant.name}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            {currentAuction?.currentParticipantIndex === participants.indexOf(participant)
                                ? "Текущий ход"
                                : "Ожидание"
                            }
                        </TableCell>
                        <TableCell>
                            <code className="relative bg-muted px-2 py-1 rounded text-xs">
                                {participant.uniqueUrl}
                            </code>
                        </TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => onCopyUrl(participant.uniqueUrl)}
                                    title="Копировать ссылку"
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                                {currentAuction?.status === 'waiting' && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => onRemoveParticipant(participant.id)}
                                        title="Удалить участника"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
                {participants.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Нет участников
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
});