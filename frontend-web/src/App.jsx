import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import TaskKanbanBoard from './components/tasks/TaskKanbanBoard';
import PendingApprovalsInbox from './components/crop-analysis/PendingApprovalsInbox';
import CropAnalysisView from './components/crop-analysis/CropAnalysisView';
import WorkerManagementView from './components/workers/WorkerManagementView';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TaskKanbanBoard />} />
        <Route path="/tasks" element={<Navigate to="/" replace />} />
        <Route path="/approvals" element={<PendingApprovalsInbox />} />
        <Route path="/analysis" element={<CropAnalysisView />} />
        <Route path="/workers" element={<WorkerManagementView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
