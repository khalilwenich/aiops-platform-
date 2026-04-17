import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppShell } from './components/layout/AppShell.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { PipelinesPage } from './pages/PipelinesPage.jsx';
import { AnalysisPage } from './pages/AnalysisPage.jsx';
import { PipelineDetail } from './pages/PipelineDetail.jsx';
import { SecurityPanel } from './pages/SecurityPanel.jsx';

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pipelines" element={<PipelinesPage />} />
          <Route path="/pipelines/:id" element={<PipelineDetail />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/security" element={<SecurityPanel />} />
          <Route path="/settings" element={<div className="text-text-muted">Settings coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
