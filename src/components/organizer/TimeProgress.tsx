import { Progress } from "@/components/ui/progress";

interface TimeProgressProps {
    moveTimeLeft: number;
}

export function TimeProgress({ moveTimeLeft }: TimeProgressProps) {
    return (
        <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
                <span>Время на текущий ход</span>
                <span className={moveTimeLeft < 10 ? "text-destructive" : ""}>
                    {moveTimeLeft} сек
                </span>
            </div>
            <Progress value={(moveTimeLeft / 30) * 100} />
        </div>
    );
}