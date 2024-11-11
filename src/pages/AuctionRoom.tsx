import {useParams} from "react-router-dom"
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card.tsx"
import {Button} from "@/components/ui/button.tsx"
import {Input} from "@/components/ui/input.tsx"
import {useState} from "react"

export default function AuctionRoom() {
    const {id} = useParams()
    const [currentBid, setCurrentBid] = useState<number>(0)
    const [timeLeft, setTimeLeft] = useState<number>(30) // 30 seconds for move
    const [isMyTurn, setIsMyTurn] = useState<boolean>(false)

    // Здесь будет подключение к Firebase/Supabase для real-time обновлений

    return (
        <div className="container mx-auto p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Аукцион #{id}</CardTitle>
                    <CardDescription>
                        Время на ход: {timeLeft} секунд
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="flex justify-between items-center">
                            <span>Текущая ставка:</span>
                            <span className="text-2xl font-bold">{currentBid} ₽</span>
                        </div>
                        {isMyTurn && (
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    placeholder="Ваша ставка"
                                    min={currentBid + 1}
                                    onChange={(e) => setCurrentBid(Number(e.target.value))}
                                />
                                <Button variant="default">
                                    Сделать ставку
                                </Button>
                            </div>
                        )}
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="font-semibold mb-2">Участники:</h3>
                            <ul className="space-y-2">
                                <li className="flex justify-between">
                                    <span>Участник 1</span>
                                    <span>Ожидание хода</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Участник 2</span>
                                    <span className="text-green-500">Текущий ход</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-between">
                    <Button variant="outline" disabled={!isMyTurn}>
                        Пропустить ход
                    </Button>
                    <div className="text-sm text-muted-foreground">
                        До конца торгов: 14:30
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}