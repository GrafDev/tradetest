// src/pages/OrganizerPanel.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useState } from "react"

export default function OrganizerPanel() {
    const [isAuctionActive, setIsAuctionActive] = useState(false)

    return (
        <div className="container mx-auto p-4">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Панель организатора</CardTitle>
                        <CardDescription>
                            Управление текущим аукционом
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4">
                            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                <div>
                                    <h3 className="font-semibold">Статус аукциона</h3>
                                    <p className={isAuctionActive ? "text-green-500" : "text-yellow-500"}>
                                        {isAuctionActive ? "Активен" : "Ожидание"}
                                    </p>
                                </div>
                                <Button
                                    variant={isAuctionActive ? "destructive" : "default"}
                                    onClick={() => setIsAuctionActive(!isAuctionActive)}
                                >
                                    {isAuctionActive ? "Завершить торги" : "Начать торги"}
                                </Button>
                            </div>

                            <Table>
                                <TableCaption>Список участников торгов</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Участник</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>URL для входа</TableHead>
                                        <TableHead>Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell>Участник 1</TableCell>
                                        <TableCell>Активен</TableCell>
                                        <TableCell>
                                            <code className="bg-muted px-2 py-1 rounded">
                                                /auction/1?token=abc123
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                Копировать URL
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full">
                            Добавить участника
                        </Button>
                    </CardFooter>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>История ставок</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Время</TableHead>
                                    <TableHead>Участник</TableHead>
                                    <TableHead>Ставка</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>12:30:45</TableCell>
                                    <TableCell>Участник 1</TableCell>
                                    <TableCell>100,000 ₽</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}