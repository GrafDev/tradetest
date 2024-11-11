// src/App.tsx
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import OrganizerPanel from "@/components/OrganizerPanel"
import NotFound from "@/pages/NotFound"
import Layout from "@/components/Layout"
import { LoginForm } from "@/components/LoginForm"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import AuctionRoom from "@/pages/AuctionRoom.tsx";

function App() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<LoginForm />} />
                <Route path="auction/:id" element={<AuctionRoom />} />
                <Route
                    path="organizer"
                    element={
                        <ProtectedRoute>
                            <OrganizerPanel />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    )
}

export default App