import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CropAnalysisView from '../../components/crop-analysis/CropAnalysisView';
import { runAgentAnalysis } from '../../store/slices/cropAnalysisSlice';

const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
  useSelector: (selector) =>
    selector({
      cropAnalysis: {
        activeAnalysisResult: null,
        isAnalyzing: false,
      },
    }),
}));

vi.mock('../../store/slices/cropAnalysisSlice', () => ({
  runAgentAnalysis: vi.fn((payload) => ({ type: 'cropAnalysis/runAgentAnalysis', payload })),
}));

describe('CropAnalysisView Component (Form Validation & Quick-Fill Presets)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders crop observation form with fields and preset triggers', () => {
    render(<CropAnalysisView />);

    expect(screen.getByText('AI Crop Analysis Sandbox')).toBeInTheDocument();
    expect(screen.getByText('Gemini 3.8 Flash')).toBeInTheDocument();
    expect(screen.getByText('Pest Preset')).toBeInTheDocument();
    expect(screen.getByText('Routine')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /execute diagnostic graph/i })).toBeInTheDocument();
  });

  it('updates form fields when Pest Preset is clicked', () => {
    render(<CropAnalysisView />);

    const pestBtn = screen.getByRole('button', { name: /pest preset/i });
    fireEvent.click(pestBtn);

    const observationTextarea = screen.getByDisplayValue(/caterpillars and worms eating holes through tomato fruits/i);
    expect(observationTextarea).toBeInTheDocument();

    const fieldInput = screen.getByDisplayValue('field-plot-pest-42');
    expect(fieldInput).toBeInTheDocument();
  });

  it('updates form fields when Routine preset is clicked', () => {
    render(<CropAnalysisView />);

    const routineBtn = screen.getByRole('button', { name: /routine/i });
    fireEvent.click(routineBtn);

    const observationTextarea = screen.getByDisplayValue(/routine check, healthy growth, minor dust on leaves/i);
    expect(observationTextarea).toBeInTheDocument();
  });

  it('prevents form submission when observation is blank', () => {
    render(<CropAnalysisView />);

    // Clear the observation field
    const textarea = screen.getByPlaceholderText(/describe leaf discolorations/i);
    fireEvent.change(textarea, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /execute diagnostic graph/i });
    fireEvent.click(submitBtn);

    expect(runAgentAnalysis).not.toHaveBeenCalled();
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it('dispatches runAgentAnalysis when valid form is submitted', () => {
    render(<CropAnalysisView />);

    const pestBtn = screen.getByRole('button', { name: /pest preset/i });
    fireEvent.click(pestBtn);

    const submitBtn = screen.getByRole('button', { name: /execute diagnostic graph/i });
    fireEvent.click(submitBtn);

    expect(runAgentAnalysis).toHaveBeenCalledWith(
      expect.objectContaining({
        fieldId: 'field-plot-pest-42',
        cropVariety: 'Tomato',
        observation: 'caterpillars and worms eating holes through tomato fruits',
      })
    );
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'cropAnalysis/runAgentAnalysis',
      })
    );
  });
});
