import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkerManagementView from '../../components/workers/WorkerManagementView';
import { workerApi } from '../../services/workerApi';

vi.mock('../../services/workerApi', () => ({
  workerApi: {
    getAllWorkers: vi.fn(),
  },
}));

describe('WorkerManagementView Component (Directory & Roster UI)', () => {
  const mockWorkers = [
    {
      id: 'worker-1',
      name: 'Kumara Senanayake',
      role: 'Lead Agronomist',
      isAvailable: true,
      skills: ['CropScouting', 'SoilTesting', 'PesticideCertified'],
      hourlyRate: 25,
      activeTasksCount: 0,
      contact: '+94 77 123 4567',
    },
    {
      id: 'worker-2',
      name: 'Anura Wickramasinghe',
      role: 'Heavy Machinery Operator',
      isAvailable: false,
      skills: ['TractorOperation', 'Harvesting'],
      hourlyRate: 20,
      activeTasksCount: 2,
      contact: '+94 71 987 6543',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    workerApi.getAllWorkers.mockResolvedValue(mockWorkers);
  });

  it('renders worker directory header and personnel roster', async () => {
    render(<WorkerManagementView />);

    expect(screen.getByText('Field Worker Directory')).toBeInTheDocument();
    expect(screen.getByText('Field Operations Personnel')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Kumara Senanayake')).toBeInTheDocument();
      expect(screen.getByText('Anura Wickramasinghe')).toBeInTheDocument();
    });

    expect(screen.getByText('Lead Agronomist')).toBeInTheDocument();
    expect(screen.getByText('Heavy Machinery Operator')).toBeInTheDocument();
    expect(screen.getByText('PesticideCertified')).toBeInTheDocument();
    expect(screen.getByText('TractorOperation')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
  });

  it('re-fetches workers when Sync Workers button is clicked', async () => {
    render(<WorkerManagementView />);

    await waitFor(() => {
      expect(screen.getByText('Kumara Senanayake')).toBeInTheDocument();
    });

    expect(workerApi.getAllWorkers).toHaveBeenCalledTimes(1);

    const syncBtn = screen.getByRole('button', { name: /sync workers/i });
    fireEvent.click(syncBtn);

    await waitFor(() => {
      expect(workerApi.getAllWorkers).toHaveBeenCalledTimes(2);
    });
  });
});
