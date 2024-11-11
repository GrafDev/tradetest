// src/pages/NotFound
import { Button } from "../components/ui/button"
import { useNavigate } from "react-router-dom"

export default function NotFound() {
    const navigate = useNavigate()

    return (
        <div className="container mx-auto flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <h1 className="text-4xl font-bold">404</h1>
            <p className="text-xl text-muted-foreground">
                Страница не найдена
            </p>
            <Button
                variant="default"
                onClick={() => navigate('/')}
            >
                Вернуться на главную
            </Button>
        </div>
    )
}