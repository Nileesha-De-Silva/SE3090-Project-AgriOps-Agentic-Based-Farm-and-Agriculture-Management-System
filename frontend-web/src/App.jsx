import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import TaskKanbanBoard from './components/tasks/TaskKanbanBoard';
import PendingApprovalsInbox from './components/crop-analysis/PendingApprovalsInbox';
import CropAnalysisView from './components/crop-analysis/CropAnalysisView';
import WorkerManagementView from './components/workers/WorkerManagementView';

// Dedicated Standalone Full-Page Views (Multi-Tab UIs)
import TaskDetailPage from './pages/TaskDetailPage';
import TaskCreationPage from './pages/TaskCreationPage';
import ApprovalDossierPage from './pages/ApprovalDossierPage';
import WorkerProfilePage from './pages/WorkerProfilePage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TaskKanbanBoard />} />
        <Route path="/tasks" element={<Navigate to="/" replace />} />
        
        {/* Dedicated Full-Page Routes */}
        <Route path="/tasks/new" element={<TaskCreationPage />} />
        <Route path="/tasks/:id" element={<TaskDetailPage />} />
        <Route path="/approvals" element={<PendingApprovalsInbox />} />
        <Route path="/approvals/:id" element={<ApprovalDossierPage />} />
        <Route path="/analysis" element={<CropAnalysisView />} />
        <Route path="/workers" element={<WorkerManagementView />} />
        <Route path="/workers/:id" element={<WorkerProfilePage />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
