import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { AppShell } from './components/layout/AppShell.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { PipelinesPage } from './pages/PipelinesPage.jsx';
import { AnalysisPage } from './pages/AnalysisPage.jsx';
import { PipelineDetail } from './pages/PipelineDetail.jsx';
import { SecurityPanel } from './pages/SecurityPanel.jsx';
import Settings from './pages/Settings.jsx';
import KnowledgeBase from './pages/KnowledgeBase.jsx';
import HealthScore from './pages/HealthScore.jsx';
import WeeklyReport from './pages/WeeklyReport.jsx';
import Incidents from './pages/Incidents.jsx';
import IncidentDetail from './pages/IncidentDetail.jsx';
import MetricsPage from './pages/MetricsPage.jsx';
import OnCallPage from './pages/OnCallPage.jsx';
import TeamsPage from './pages/TeamsPage.jsx';

function ProtectedRoute({ children }) {
  const isAuthenticated = useSelector(s => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const user = useSelector(s => s.auth.user);
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;
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
          <Route path="/settings"   element={<Settings />} />
          <Route path="/knowledge"  element={<KnowledgeBase />} />
          <Route path="/health"     element={<HealthScore />} />
          <Route path="/reports"    element={<WeeklyReport />} />
          <Route path="/incidents"  element={<Incidents />} />
          <Route path="/incidents/:id" element={<IncidentDetail />} />
          <Route path="/metrics"    element={<MetricsPage />} />
          <Route path="/oncall"     element={<OnCallPage />} />
          <Route path="/teams"      element={<AdminRoute><TeamsPage /></AdminRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
