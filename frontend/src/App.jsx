import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ModalProvider } from "./context/ModalContext";
import { CallProvider } from "./context/CallContext";
import Layout from "./components/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Goals from "./pages/Goals";
import AICopilot from "./pages/AICopilot";
import Insights from "./pages/Insights";
import BucketList from "./pages/BucketList";
import Collections from "./pages/Collections";
import Settings from "./pages/Settings";
import PlaceholderPage from "./pages/PlaceholderPage";
import { LineChart, Bookmark, Library } from "lucide-react";
import "./index.css";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen bg-[#0B0B0F] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ModalProvider>
          <CallProvider>
            <Routes>
            <Route path="/login" element={<Auth />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="goals" element={<Goals />} />
              <Route path="ai" element={<AICopilot />} />
              <Route path="insights" element={<Insights />} />
              <Route path="bucket" element={<BucketList />} />
              <Route path="collections" element={<Collections />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
          </CallProvider>
        </ModalProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
