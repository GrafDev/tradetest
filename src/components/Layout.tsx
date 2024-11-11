import { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function Layout() {
    const { user, logout } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleLogout = async () => {
        try {
            setIsLoading(true);
            await logout();
        } catch (error) {
            console.error('Ошибка при выходе:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="w-full flex justify-between h-14 items-center px-4">
                    <div className="mr-4 hidden md:flex">
                        <Link to="/" className="mr-6 flex items-center space-x-2">
                            <span className="hidden font-bold sm:inline-block">
                                TradeTest
                            </span>
                        </Link>
                        <nav className="flex items-center space-x-6 text-sm font-medium">
                            <Link to="/organizer" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                Организатор
                            </Link>
                            <a href="https://github.com/GrafDev/tradetest" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                GitHub
                            </a>
                        </nav>
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                        </div>
                        <nav className="flex items-center space-x-2">
                            {user && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleLogout}
                                    disabled={isLoading}
                                    className="mr-2"
                                >
                                    <LogOut className="h-[1.2rem] w-[1.2rem]" />
                                    <span className="sr-only">Выйти</span>
                                </Button>
                            )}
                            <ModeToggle />
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 w-full">
                <div className="container max-w-screen-lg mx-auto py-6">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-auto py-6 md:px-8 md:py-0 w-full border-t">
                <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Разработан {" "}
                        <a href="https://greg-yakovlev.web.app" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                            Gregory Iakovlev
                        </a>
                        . Исходный код доступен на {" "}
                        <a href="https://github.com/GrafDev/tradetest" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </footer>
        </div>
    )
}