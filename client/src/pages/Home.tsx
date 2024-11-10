// src/pages/Home.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "react-router-dom"
import {MessageCircleWarningIcon} from "lucide-react"

export default function Home() {
    return (
        <div className="container mx-auto px-4">
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
                        Добро пожаловать в TradeTest
                    </h1>
                    <p className="text-muted-foreground">
                        Платформа для проведения онлайн-торгов в реальном времени
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Организатор торгов</CardTitle>
                            <CardDescription>
                                Создавайте и управляйте торгами
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Создание новых торгов</li>
                                <li>Управление участниками</li>
                                <li>Мониторинг процесса</li>
                                <li>Просмотр истории ставок</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full">
                                <Link to="/organizer">
                                    Войти как организатор
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Участник торгов</CardTitle>
                            <CardDescription>
                                Участвуйте в торгах по полученной ссылке
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                                <li>Участие в торгах</li>
                                <li>Размещение ставок</li>
                                <li>Отслеживание хода торгов</li>
                                <li>Просмотр статистики</li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">
                                Войти по ссылке
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="flex flex-col items-center space-y-4 text-center">
                    <p className="text-muted-foreground">
                        Нужна помощь? Свяжитесь с нашей службой поддержки
                    </p>
                    <Button variant="link" asChild>
                        <a
                            href="https://t.me/GregoryYakovlev"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <MessageCircleWarningIcon/>
                            Связаться с поддержкой ➟ @GregoryYakovlev
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
}