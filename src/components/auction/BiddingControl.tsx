// src/components/auction/BiddingControl.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { TimeProgress } from "@/components/organizer/TimeProgress";
import type { Auction } from "@/types/types";

interface BiddingControlProps {
    auction: Auction;
    isMyTurn: boolean;
    loading: boolean;
    timeLeft: number; // Переименовываем с moveTimeLeft на timeLeft
    onPlaceBid: (amount: number) => Promise<void>;
    onSkip: () => Promise<void>;
}

export function BiddingControl({
                                   auction,
                                   isMyTurn,
                                   loading,
                                   timeLeft,
                                   onPlaceBid,
                                   onSkip
                               }: BiddingControlProps) {
    const minStep = auction.item?.minStep || 100;
    const [bidAmount, setBidAmount] = useState<number>(
        auction.currentPrice + minStep
    );
    const [error, setError] = useState<string>("");

    // Валидация и отправка ставки
    const handleSubmit = async () => {
        try {
            setError("");

            if (bidAmount <= auction.currentPrice) {
                setError(`Ставка должна быть больше текущей цены: ${auction.currentPrice} ₽`);
                return;
            }

            const minAllowedBid = auction.currentPrice + minStep;
            if (bidAmount < minAllowedBid) {
                setError(`Минимальный шаг ставки: ${minStep} ₽`);
                return;
            }

            await onPlaceBid(bidAmount);
        } catch (error) {
            setError(error instanceof Error ? error.message : "Не удалось сделать ставку");
        }
    };

    // Если не мой ход
    if (!isMyTurn) {
        return (
            <Alert className="bg-muted">
                <AlertDescription>
                    Ожидание хода других участников...
                </AlertDescription>
            </Alert>
        );
    }

    return (
        <div className="space-y-4">
            {/* Используем существующий компонент TimeProgress */}
            <TimeProgress moveTimeLeft={timeLeft} />

            {/* Основной контент */}
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Сейчас ваш ход! Сделайте ставку или пропустите ход
                </AlertDescription>
            </Alert>

            {/* Сообщение об ошибке */}
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Форма ставки */}
            <div className="flex gap-2">
                <div className="flex-1">
                    <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(Number(e.target.value))}
                        className="text-lg"
                        min={auction.currentPrice + minStep}
                        step={minStep}
                        disabled={loading}
                        placeholder={`Минимальная ставка: ${auction.currentPrice + minStep} ₽`}
                    />
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || bidAmount <= auction.currentPrice}
                    className="min-w-[140px]"
                >
                    {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <>
                            Сделать ставку
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>

            {/* Пропуск хода */}
            <Button
                variant="outline"
                onClick={onSkip}
                disabled={loading}
                className="w-full"
            >
                Пропустить ход
            </Button>

            {/* Подсказка по минимальной ставке */}
            <div className="text-sm text-muted-foreground text-center">
                Минимальный шаг ставки: {minStep} ₽
            </div>
        </div>
    );
}