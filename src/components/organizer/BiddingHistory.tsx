import { Crown } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Move, AuctionParticipant } from "@/types/types";

interface BiddingHistoryProps {
    moves: Move[];
    participants: AuctionParticipant[];
    leaderId?: string;
}

export function BiddingHistory({ moves, participants, leaderId }: BiddingHistoryProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Время</TableHead>
                    <TableHead>Участник</TableHead>
                    <TableHead className="text-right">Ставка</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {moves.map((move, index) => (
                    <TableRow key={index}>
                        <TableCell>
                            {new Date(move.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                {move.userId === leaderId && (
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                )}
                                <span>
                                    {participants.find(p => p.id === move.userId)?.name}
                                </span>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                            {move.price.toLocaleString()} ₽
                        </TableCell>
                    </TableRow>
                ))}
                {moves.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                            Ставок пока нет
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}