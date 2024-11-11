import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type {AuctionParticipant } from "@/types/types";

interface ParticipantsListProps {
    participants: AuctionParticipant[];
    currentParticipant: AuctionParticipant;
    leaderId?: string;
    currentParticipantIndex: number;
}

export function ParticipantsList({
                                     participants,
                                     currentParticipant,
                                     leaderId,
                                     currentParticipantIndex
                                 }: ParticipantsListProps) {
    return (
        <div className="space-y-2">
            <h3 className="font-medium">Участники:</h3>
            <div className="space-y-2">
                {participants.map((p) => (
                    <div
                        key={p.id}
                        className={cn(
                            "flex justify-between items-center p-2 rounded",
                            p.id === currentParticipant.id && 'bg-secondary',
                            leaderId === p.id && 'border-l-4 border-yellow-500 pl-3'
                        )}
                    >
                        <div className="flex items-center gap-2">
                            {leaderId === p.id && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                            )}
                            <span className={p.id === currentParticipant.id ? 'font-medium' : ''}>
                                {p.name} {p.id === currentParticipant.id ? '(вы)' : ''}
                            </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                            {currentParticipantIndex === participants.indexOf(p)
                                ? 'Текущий ход'
                                : 'Ожидание'
                            }
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}