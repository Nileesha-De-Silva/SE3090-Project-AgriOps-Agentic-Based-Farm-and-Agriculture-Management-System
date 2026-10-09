import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

describe('LoadingSpinner Component', () => {
  it('renders with default loading label', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom label when provided', () => {
    render(<LoadingSpinner label="Fetching Farm Data..." />);
    expect(screen.getByText('Fetching Farm Data...')).toBeInTheDocument();
  });
});
