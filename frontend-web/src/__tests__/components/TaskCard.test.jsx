import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../../components/tasks/TaskCard';

describe('TaskCard Component (Component 2)', () => {
  const mockTask = {
    id: 'task-101',
    title: 'Spray Bio-Pesticide for Leaf Curl',
    taskType: 'PesticideApplication',
    priority: 'High',
    status: 'Pending',
    fieldId: 'field-north-2',
    description: 'Target infected tomato plants with organic neem extract.',
    assignedWorkerName: 'Kamal Perera',
    estimatedHours: 3,
    sourceCropAnalysisId: 'analysis-77',
  };

  it('renders task title, priority, field ID, and description', () => {
    render(
      <TaskCard
        task={mockTask}
        onAssignClick={() => {}}
        onVerifyClick={() => {}}
        onStatusChange={() => {}}
      />
    );

    expect(screen.getByText('Spray Bio-Pesticide for Leaf Curl')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('field-north-2')).toBeInTheDocument();
    expect(
      screen.getByText('Target infected tomato plants with organic neem extract.')
    ).toBeInTheDocument();
    expect(screen.getByText('Kamal Perera')).toBeInTheDocument();
    expect(screen.getByText('3h')).toBeInTheDocument();
  });

  it('shows AI Dispatched badge when sourceCropAnalysisId is present', () => {
    render(
      <TaskCard
        task={mockTask}
        onAssignClick={() => {}}
        onVerifyClick={() => {}}
        onStatusChange={() => {}}
      />
    );

    expect(screen.getByText(/ai dispatched/i)).toBeInTheDocument();
  });

  it('shows assign worker button if no worker is assigned', () => {
    const unassignedTask = { ...mockTask, assignedWorkerName: null, assignedWorkerId: null };
    const handleAssign = vi.fn();

    render(
      <TaskCard
        task={unassignedTask}
        onAssignClick={handleAssign}
        onVerifyClick={() => {}}
        onStatusChange={() => {}}
      />
    );

    const assignBtn = screen.getByRole('button', { name: /assign worker/i });
    expect(assignBtn).toBeInTheDocument();
    fireEvent.click(assignBtn);
    expect(handleAssign).toHaveBeenCalledWith(unassignedTask);
  });

  it('shows review evidence button when task is PendingVerification', () => {
    const pendingVerificationTask = { ...mockTask, status: 'PendingVerification' };
    const handleVerify = vi.fn();

    render(
      <TaskCard
        task={pendingVerificationTask}
        onAssignClick={() => {}}
        onVerifyClick={handleVerify}
        onStatusChange={() => {}}
      />
    );

    const reviewBtn = screen.getByRole('button', { name: /review task evidence/i });
    expect(reviewBtn).toBeInTheDocument();
    fireEvent.click(reviewBtn);
    expect(handleVerify).toHaveBeenCalledWith(pendingVerificationTask);
  });
});
