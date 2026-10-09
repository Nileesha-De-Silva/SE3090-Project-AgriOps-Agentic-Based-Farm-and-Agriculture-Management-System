import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PendingApprovalsInbox from '../../components/crop-analysis/PendingApprovalsInbox';
import { approveAlert, rejectAlert } from '../../store/slices/cropAnalysisSlice';

const mockDispatch = vi.fn();
let mockState = {
  cropAnalysis: {
    pendingApprovals: [],
    status: 'idle',
  },
};

vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) => selector(mockState),
}));

vi.mock('../../store/slices/cropAnalysisSlice', () => ({
  fetchPendingApprovals: vi.fn(() => ({ type: 'cropAnalysis/fetchPendingApprovals' })),
  approveAlert: vi.fn((payload) => ({ type: 'cropAnalysis/approveAlert', payload })),
  rejectAlert: vi.fn((payload) => ({ type: 'cropAnalysis/rejectAlert', payload })),
}));

describe('PendingApprovalsInbox Component (UI-State & Gatekeeper Decision Testing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Inbox Zero empty UI state when there are no pending high-risk alerts', () => {
    mockState = {
      cropAnalysis: {
        pendingApprovals: [],
        status: 'idle',
      },
    };

    render(<PendingApprovalsInbox />);

    expect(screen.getByText('Human-in-the-Loop Approval Inbox')).toBeInTheDocument();
    expect(screen.getByText('Agent 2 Gatekeeper')).toBeInTheDocument();
    expect(screen.getByText('Inbox Zero: All High-Risk Alerts Cleared')).toBeInTheDocument();
    expect(
      screen.getByText(/no pending crop analyses are awaiting manager sign-off/i)
    ).toBeInTheDocument();
  });

  it('renders alert cards with risk badge, confidence score, and handbook citations when alerts exist', () => {
    mockState = {
      cropAnalysis: {
        pendingApprovals: [
          {
            id: 'ana-9001',
            threadId: 'thread-9001',
            fieldId: 'field-south-4',
            category: 'Pest/Invasive',
            riskLevel: 'Critical',
            primaryIndicator: 'Severe Fall Armyworm Infestation',
            observation: 'Widespread leaf chewing and whorl damage on corn canopy.',
            recommendedProtocol: 'Apply targeted biological Bacillus thuringiensis spray.',
            sourceHandbook: 'Corn-IPM-Handbook',
            confidenceScore: 0.94,
            suggestedTaskType: 'PesticideApplication',
          },
        ],
        status: 'idle',
      },
    };

    render(<PendingApprovalsInbox />);

    expect(screen.getByText('Critical Risk')).toBeInTheDocument();
    expect(screen.getByText('field-south-4')).toBeInTheDocument();
    expect(screen.getByText('Severe Fall Armyworm Infestation')).toBeInTheDocument();
    expect(screen.getByText(/"Widespread leaf chewing and whorl damage on corn canopy."/i)).toBeInTheDocument();
    expect(screen.getByText('Apply targeted biological Bacillus thuringiensis spray.')).toBeInTheDocument();
    expect(screen.getByText('Source: Corn-IPM-Handbook')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getByText('PesticideApplication')).toBeInTheDocument();
  });

  it('dispatches approveAlert with manager note when Approve & Dispatch is clicked', () => {
    const alertItem = {
      id: 'ana-9001',
      threadId: 'thread-9001',
      fieldId: 'field-south-4',
      category: 'Pest/Invasive',
      riskLevel: 'Critical',
      primaryIndicator: 'Severe Fall Armyworm Infestation',
      observation: 'Chewed leaves',
      recommendedProtocol: 'Apply spray',
      sourceHandbook: 'Corn-IPM-Handbook',
      confidenceScore: 0.94,
      suggestedTaskType: 'PesticideApplication',
    };

    mockState = {
      cropAnalysis: {
        pendingApprovals: [alertItem],
        status: 'idle',
      },
    };

    render(<PendingApprovalsInbox />);

    const noteInput = screen.getByPlaceholderText(/optional manager notes/i);
    fireEvent.change(noteInput, { target: { value: 'Approved for morning dispatch.' } });

    const approveBtn = screen.getByRole('button', { name: /approve & dispatch/i });
    fireEvent.click(approveBtn);

    expect(approveAlert).toHaveBeenCalledWith({
      analysisId: 'ana-9001',
      threadId: 'thread-9001',
      comments: 'Approved for morning dispatch.',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cropAnalysis/approveAlert',
      })
    );
  });

  it('dispatches rejectAlert when Reject Proposal button is clicked', () => {
    const alertItem = {
      id: 'ana-9002',
      threadId: 'thread-9002',
      fieldId: 'field-south-4',
      category: 'Weed',
      riskLevel: 'High',
      primaryIndicator: 'Broadleaf weed cluster',
      observation: 'Isolated weed patch',
      recommendedProtocol: 'Hand weeding',
      sourceHandbook: 'Weed-IPM',
      confidenceScore: 0.88,
      suggestedTaskType: 'Weeding',
    };

    mockState = {
      cropAnalysis: {
        pendingApprovals: [alertItem],
        status: 'idle',
      },
    };

    render(<PendingApprovalsInbox />);

    const rejectBtn = screen.getByRole('button', { name: /reject proposal/i });
    fireEvent.click(rejectBtn);

    expect(rejectAlert).toHaveBeenCalledWith({
      analysisId: 'ana-9002',
      threadId: 'thread-9002',
      reason: 'Rejected by Farm Manager. Alternative protocol scheduled.',
    });
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cropAnalysis/rejectAlert',
      })
    );
  });
});
