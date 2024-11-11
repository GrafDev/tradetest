import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from "@/providers/auth-provider.tsx";
import React from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        // Сохраняем текущий URL, чтобы вернуться после авторизации
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <>{children}</>;
}