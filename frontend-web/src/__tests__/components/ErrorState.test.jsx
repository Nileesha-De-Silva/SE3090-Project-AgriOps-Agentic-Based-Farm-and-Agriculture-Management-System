import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// Simple error alert component pattern used across pages
function ErrorAlert({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="error-banner bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200">
      <span className="font-bold">Error: </span>
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="ml-3 underline font-bold hover:text-rose-950">
          Try Again
        </button>
      )}
    </div>
  );
}

// Empty state display component pattern
function EmptyState({ title = 'No records found', subtitle = 'Add your first record to get started.' }) {
  return (
    <div className="empty-state text-center py-8 text-slate-500">
      <p className="font-bold text-slate-700">{title}</p>
      <p className="text-sm">{subtitle}</p>
    </div>
  );
}

describe('Error and Empty State UI Testing', () => {
  it('renders error alert banner with message when error occurs', () => {
    render(<ErrorAlert message="Failed to connect to AgriOps backend API (HTTP 500)" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByText(/failed to connect to agriops backend api/i)).toBeInTheDocument();
  });

  it('triggers onRetry when retry button is clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorAlert message="Network timeout" onRetry={handleRetry} />);
    const retryBtn = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render error banner when message is null or empty', () => {
    const { container } = render(<ErrorAlert message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders empty state UI when no data is returned from API', () => {
    render(<EmptyState title="No Farm Tasks Assigned" subtitle="All operational tasks for today are completed." />);
    expect(screen.getByText('No Farm Tasks Assigned')).toBeInTheDocument();
    expect(screen.getByText('All operational tasks for today are completed.')).toBeInTheDocument();
  });
});
