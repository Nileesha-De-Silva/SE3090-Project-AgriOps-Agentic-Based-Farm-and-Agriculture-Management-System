import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import TaskKanbanBoard from './components/tasks/TaskKanbanBoard';
import PendingApprovalsInbox from './components/crop-analysis/PendingApprovalsInbox';
import CropAnalysisView from './components/crop-analysis/CropAnalysisView';
import WorkerManagementView from './components/workers/WorkerManagementView';

// Dedicated Standalone Full-Page Views (Component 2)
import TaskDetailPage from './pages/TaskDetailPage';
import TaskCreationPage from './pages/TaskCreationPage';
import ApprovalDossierPage from './pages/ApprovalDossierPage';
import WorkerProfilePage from './pages/WorkerProfilePage';

// Farm & Crop Management Views (Component 1 & Agent 1)
import FarmsPage from './pages/FarmsPage';
import FarmDetailPage from './pages/FarmDetailPage';
import FieldDetailPage from './pages/FieldDetailPage';
import CropsPage from './pages/CropsPage';
import CropSeasonDetailPage from './pages/CropSeasonDetailPage';
import AgentPlannerPage from './pages/AgentPlannerPage';

// Inventory & Procurement Views (Component 3 & Agent 3 - Dinali / Thisara)
import LiveWorkspace from './LiveWorkspace';

// Analytics, User Administration & Audit Views (Component 4 & Agent 4 - Sahas)
import AnalyticsPage from './pages/AnalaticsPage';
import AuditLogsPage from './pages/admin/auditLogsPage';
import UsersAdminPage from './pages/admin/userAdminPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        {/* Operations & Tasks (Component 2) */}
        <Route path="/" element={<TaskKanbanBoard />} />
        <Route path="/tasks" element={<Navigate to="/" replace />} />
        <Route path="/tasks/new" element={<TaskCreationPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/approvals" element={<PendingApprovalsInbox />} />
        <Route path="/approvals/:id" element={<ApprovalDossierPage />} />
        <Route path="/analysis" element={<CropAnalysisView />} />
        <Route path="/workers" element={<WorkerManagementView />} />
        <Route path="/workers/:id" element={<WorkerProfilePage />} />

        {/* Farm & Crop Management (Component 1 & Agent 1) */}
        <Route path="/farms" element={<FarmsPage />} />
        <Route path="/farms/:id" element={<FarmDetailPage />} />
        <Route path="/fields/:id" element={<FieldDetailPage />} />
        <Route path="/crops" element={<CropsPage />} />
        <Route path="/cropseasons/:id" element={<CropSeasonDetailPage />} />
        <Route path="/agent-planner" element={<AgentPlannerPage />} />

        {/* Inventory & Supply Chain (Component 3 & Agent 3 - Dinali / Thisara) */}
        <Route path="/inventory" element={<LiveWorkspace />} />

        {/* Analytics & Governance (Component 4 & Agent 4 - Sahas) */}
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/admin/audit-logs" element={<Navigate to="/audit-logs" replace />} />
        <Route path="/users" element={<UsersAdminPage />} />
        <Route path="/admin/users" element={<Navigate to="/users" replace />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
