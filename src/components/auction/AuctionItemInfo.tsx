import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AuctionItem } from "@/types/types";

interface AuctionItemInfoProps {
    item: AuctionItem;
}

export function AuctionItemInfo({ item }: AuctionItemInfoProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>Минимальный шаг: {item.minStep.toLocaleString()} ₽</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
            </CardContent>
        </Card>
    );
}