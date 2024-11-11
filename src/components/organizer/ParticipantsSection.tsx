import  { memo } from 'react';
import { ParticipantsTable } from './ParticipantsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Auction, AuctionParticipant } from '@/types/types';

interface ParticipantsSectionProps {
    participants: AuctionParticipant[];
    currentAuction: Auction;
    leaderId?: string;
    onCopyUrl: (url: string) => Promise<void>;
    onRemoveParticipant: (id: string) => Promise<void>;
}

const ParticipantsSection = memo(({
                                      participants,
                                      currentAuction,
                                      leaderId,
                                      onCopyUrl,
                                      onRemoveParticipant
                                  }: ParticipantsSectionProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Участники торгов</CardTitle>
                <CardDescription>
                    Управление участниками аукциона
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ParticipantsTable
                    participants={participants}
                    currentAuction={currentAuction}
                    leaderId={leaderId}
                    onCopyUrl={onCopyUrl}
                    onRemoveParticipant={onRemoveParticipant}
                />
            </CardContent>
        </Card>
    );
});

ParticipantsSection.displayName = 'ParticipantsSection';

export default ParticipantsSection;