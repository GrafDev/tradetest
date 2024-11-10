// src/components/Layout.tsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import {ModeToggle} from "@/components/ModeToggle.tsx";

export default function Layout() {
    const [isLoading, setIsLoading] = useState<boolean>(false)

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-14 items-center">
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
                            <a href="https://github.com/yourusername/tradetest" target="_blank" rel="noreferrer" className="transition-colors hover:text-foreground/80 text-foreground/60">
                                GitHub
                            </a>
                        </nav>
                    </div>

                    <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                        <div className="w-full flex-1 md:w-auto md:flex-none">
                        </div>
                        <nav className="flex items-center space-x-2">
                            <ModeToggle />
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <div className="container py-6">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="py-6 md:px-8 md:py-0">
                <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        Built by{" "}
                        <a href="https://greg-yakovlev.web.app" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                            Your Name
                        </a>
                        . The source code is available on{" "}
                        <a href="https://github.com/yourusername/tradetest" target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4">
                            GitHub
                        </a>
                        .
                    </p>
                </div>
            </footer>
        </div>
    )
}