import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import ProtectedRoute from './components/common/protectedRoutes';

// Operations & Workforce (Component 2)
import TaskKanbanBoard from './components/tasks/TaskKanbanBoard';
import PendingApprovalsInbox from './components/crop-analysis/PendingApprovalsInbox';
import CropAnalysisView from './components/crop-analysis/CropAnalysisView';
import WorkerManagementView from './components/workers/WorkerManagementView';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskCreationPage from './pages/TaskCreationPage';
import ApprovalDossierPage from './pages/ApprovalDossierPage';
import WorkerProfilePage from './pages/WorkerProfilePage';

// Farm & Crop Lifecycle (Component 1 & Agent 1)
import FarmsPage from './pages/FarmsPage';
import FarmDetailPage from './pages/FarmDetailPage';
import FieldDetailPage from './pages/FieldDetailPage';
import CropsPage from './pages/CropsPage';
import CropSeasonDetailPage from './pages/CropSeasonDetailPage';
import AgentPlannerPage from './pages/AgentPlannerPage';

// Inventory & Procurement (Component 3 & Agent 3)
import LiveWorkspace from './LiveWorkspace';

// Analytics, User Administration & Audit (Component 4 & Agent 4)
import AnalyticsPage from './pages/AnalaticsPage';
import AuditLogsPage from './pages/admin/auditLogsPage';
import UsersAdminPage from './pages/admin/userAdminPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';

// Pre-defined role sets for web access
const ALL_WEB_ROLES = ['Administrator', 'FarmManager', 'Agronomist'];
const MANAGER_AND_ADMIN = ['Administrator', 'FarmManager'];
const ADMIN_ONLY = ['Administrator'];

export default function App() {
  const location = useLocation();

  const routes = (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/register" element={<Navigate to="/signup" replace />} />

      {/* Operations & Tasks (Component 2) */}
      <Route
        path="/workspace"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <TaskKanbanBoard />
          </ProtectedRoute>
        }
      />
      <Route path="/tasks" element={<Navigate to="/workspace" replace />} />
      <Route
        path="/tasks/new"
        element={
          <ProtectedRoute roles={MANAGER_AND_ADMIN}>
            <TaskCreationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks/:id"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <TaskDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals"
        element={
          <ProtectedRoute roles={MANAGER_AND_ADMIN}>
            <PendingApprovalsInbox />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/:id"
        element={
          <ProtectedRoute roles={MANAGER_AND_ADMIN}>
            <ApprovalDossierPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analysis"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <CropAnalysisView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workers"
        element={
          <ProtectedRoute roles={MANAGER_AND_ADMIN}>
            <WorkerManagementView />
          </ProtectedRoute>
        }
      />
      <Route
        path="/workers/:id"
        element={
          <ProtectedRoute roles={MANAGER_AND_ADMIN}>
            <WorkerProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Farm & Crop Management (Component 1 & Agent 1) */}
      <Route
        path="/farms"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <FarmsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/farms/:id"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <FarmDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/fields/:id"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <FieldDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/crops"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <CropsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cropseasons/:id"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <CropSeasonDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/agent-planner"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <AgentPlannerPage />
          </ProtectedRoute>
        }
      />

      {/* Inventory & Supply Chain (Component 3 & Agent 3) */}
      <Route
        path="/inventory"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <LiveWorkspace />
          </ProtectedRoute>
        }
      />

      {/* Analytics & Governance (Component 4 & Agent 4) */}
      <Route
        path="/analytics"
        element={
          <ProtectedRoute roles={ALL_WEB_ROLES}>
            <AnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={ADMIN_ONLY}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/audit-logs" element={<Navigate to="/audit-logs" replace />} />
      <Route
        path="/users"
        element={
          <ProtectedRoute roles={ADMIN_ONLY}>
            <UsersAdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="/admin/users" element={<Navigate to="/users" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  const usesPublicShell = ['/', '/login', '/signup', '/register'].includes(location.pathname);
  return usesPublicShell ? routes : <Layout>{routes}</Layout>;
}
