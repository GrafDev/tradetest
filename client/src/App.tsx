import { ThemeProvider } from "@/providers/theme-provider.tsx"
import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AuctionRoom from "@/pages/AuctionRoom.tsx";
import OrganizerPanel from "@/components/OrganizerPanel.tsx";
import NotFound from "@/pages/NotFound.tsx";
import Layout from "@/components/Layout.tsx";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="auction/:id" element={<AuctionRoom />} />
                    <Route path="organizer" element={<OrganizerPanel />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </ThemeProvider>
    )
}

export default App