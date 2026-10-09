import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EvidenceVerificationModal from '../../components/tasks/EvidenceVerificationModal';
import { verifyTaskEvidence } from '../../store/slices/taskSlice';

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

vi.mock('../../store/slices/taskSlice', () => ({
  verifyTaskEvidence: vi.fn((payload) => ({ type: 'tasks/verifyTaskEvidence', payload })),
}));

describe('EvidenceVerificationModal Component (Gatekeeper & Form Testing)', () => {
  const mockTask = {
    id: 'task-abc-123',
    title: 'Precision Foliar Fungicide Spray',
    assignedWorkerName: 'Kasun Bandara',
    fieldId: 'field-paddy-04',
    evidence: {
      photoUrl: 'https://storage.agriops.local/evidence/field04.jpg',
      notes: 'Applied copper hydroxide spray adhering strictly to wind safety speed.',
      submittedAt: '2026-10-08T09:00:00Z',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal with task metadata, worker notes, and proof image', () => {
    render(<EvidenceVerificationModal task={mockTask} onClose={() => {}} />);

    expect(screen.getByText('Task Evidence Verification')).toBeInTheDocument();
    expect(screen.getByText('Gatekeeper')).toBeInTheDocument();
    expect(screen.getByText('Precision Foliar Fungicide Spray')).toBeInTheDocument();
    expect(screen.getByText('Kasun Bandara')).toBeInTheDocument();
    expect(screen.getByText('field-paddy-04')).toBeInTheDocument();
    expect(screen.getByText(/"Applied copper hydroxide spray adhering strictly to wind safety speed."/i)).toBeInTheDocument();

    const img = screen.getByAltText('Field Evidence');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockTask.evidence.photoUrl);
  });

  it('submits approval with default feedback when manager leaves feedback input blank', () => {
    const mockClose = vi.fn();
    render(<EvidenceVerificationModal task={mockTask} onClose={mockClose} />);

    const approveBtn = screen.getByRole('button', { name: /verify & mark completed/i });
    fireEvent.click(approveBtn);

    expect(verifyTaskEvidence).toHaveBeenCalledWith({
      taskId: 'task-abc-123',
      isApproved: true,
      feedback: 'Task verified and approved.',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks/verifyTaskEvidence',
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('submits approval with custom review comments when typed by manager', () => {
    const mockClose = vi.fn();
    render(<EvidenceVerificationModal task={mockTask} onClose={mockClose} />);

    const commentInput = screen.getByPlaceholderText(/verified spray coverage & dosage/i);
    fireEvent.change(commentInput, { target: { value: 'Dosage verified with chemical log.' } });

    const approveBtn = screen.getByRole('button', { name: /verify & mark completed/i });
    fireEvent.click(approveBtn);

    expect(verifyTaskEvidence).toHaveBeenCalledWith({
      taskId: 'task-abc-123',
      isApproved: true,
      feedback: 'Dosage verified with chemical log.',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks/verifyTaskEvidence',
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  it('submits rejection and requests rework with reason when Reject button is clicked', () => {
    const mockClose = vi.fn();
    render(<EvidenceVerificationModal task={mockTask} onClose={mockClose} />);

    const commentInput = screen.getByPlaceholderText(/verified spray coverage & dosage/i);
    fireEvent.change(commentInput, { target: { value: 'Incomplete coverage on row 4.' } });

    const rejectBtn = screen.getByRole('button', { name: /reject \/ request rework/i });
    fireEvent.click(rejectBtn);

    expect(verifyTaskEvidence).toHaveBeenCalledWith({
      taskId: 'task-abc-123',
      isApproved: false,
      feedback: 'Incomplete coverage on row 4.',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'tasks/verifyTaskEvidence',
      })
    );
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
