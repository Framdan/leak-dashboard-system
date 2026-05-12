import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import NodeProvider from "./context/NodeContext";

import MainLayout from "./components/layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Nodes from "./pages/Nodes";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import MapView from "./pages/MapView";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <NodeProvider>
        <Toaster position="top-right" containerStyle={{ top: '80px' }} />
        <Routes>

          <Route path="/login" element={<Login />} />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/nodes" element={<Nodes />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/map" element={<MapView />} />
                  <Route path="/alerts-page" element={<Alerts />} />
                  <Route path="/settings" element={<Settings />} />

                  {/* Catch-all for protected area */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </NodeProvider>
    </BrowserRouter>
  );
}


export default App;