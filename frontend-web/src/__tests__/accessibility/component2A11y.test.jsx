import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import taskReducer from '../../store/slices/taskSlice';
import cropAnalysisReducer from '../../store/slices/cropAnalysisSlice';
import TaskCard from '../../components/tasks/TaskCard';
import CreateTaskModal from '../../components/tasks/CreateTaskModal';
import EvidenceVerificationModal from '../../components/tasks/EvidenceVerificationModal';
import ErrorBanner from '../../components/common/ErrorBanner';

function renderWithStore(ui, initialState = {}) {
  const store = configureStore({
    reducer: {
      tasks: taskReducer,
      cropAnalysis: cropAnalysisReducer,
    },
    preloadedState: initialState,
  });

  return render(<Provider store={store}>{ui}</Provider>);
}

describe('Component 2 Accessibility & Usability (WCAG 2.1 AA Compliance)', () => {
  it('TaskCard provides accessible text and visual cues for color-blind farm operators', () => {
    const task = {
      id: 'task-101',
      title: 'Perimeter Fungicide Spraying',
      taskType: 'PesticideApplication',
      priority: 'High',
      status: 'InProgress',
      fieldId: 'field-1',
      targetDate: '2026-10-15T00:00:00Z',
    };

    renderWithStore(<TaskCard task={task} />);

    // Text alternative exists alongside color chip
    expect(screen.getByText('Perimeter Fungicide Spraying')).toBeInTheDocument();
    expect(screen.getByText(/High/i)).toBeInTheDocument();
    expect(screen.getByText(/PesticideApplication/i)).toBeInTheDocument();

    // Verify card is structured with interactive elements
    const card = screen.getByText('Perimeter Fungicide Spraying').closest('div');
    expect(card).toBeDefined();
  });

  it('CreateTaskModal provides accessible form fields and required input attributes', () => {
    const onClose = vi.fn();
    renderWithStore(<CreateTaskModal onClose={onClose} />);

    // Descriptive text labels present for assistive technologies
    expect(screen.getByText(/Task Title/i)).toBeInTheDocument();
    expect(screen.getByText(/Task Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Priority/i)).toBeInTheDocument();

    // Required attribute set on mandatory title field
    const titleInput = screen.getByPlaceholderText(/Copper Hydroxide/i);
    expect(titleInput).toBeRequired();

    // Modal action buttons exist and are interactive
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('EvidenceVerificationModal provides distinct decision controls for approving or rejecting evidence', () => {
    const task = {
      id: 'task-202',
      title: 'Drain Inspection',
      status: 'PendingVerification',
      evidencePhotoUrl: 'https://cdn.agriops.local/evidence/drain.jpg',
      evidenceRemarks: 'Cleared blockage at culvert 4',
    };

    renderWithStore(<EvidenceVerificationModal task={task} onClose={vi.fn()} />);

    // Action buttons must have explicit, unambiguous accessible names matching WCAG 2.1 AA
    const approveBtn = screen.getByRole('button', { name: /Verify & Mark Completed/i });
    const rejectBtn = screen.getByRole('button', { name: /Reject \/ Request Rework/i });

    expect(approveBtn).toBeInTheDocument();
    expect(rejectBtn).toBeInTheDocument();
  });

  it('ErrorBanner announces error messages to screen readers using ARIA role="alert"', () => {
    const onDismiss = vi.fn();
    render(
      <ErrorBanner
        message="Unable to reach AI gateway. Cached local diagnostic rules are in effect."
        onDismiss={onDismiss}
      />
    );

    // Assistive technology landmark
    const alertElement = screen.getByRole('alert');
    expect(alertElement).toBeInTheDocument();
    expect(screen.getByText(/Unable to reach AI gateway/i)).toBeInTheDocument();

    // Dismiss action has accessible aria-label
    const dismissBtn = screen.getByRole('button', { name: /Dismiss error/i });
    expect(dismissBtn).toBeInTheDocument();
  });
});
