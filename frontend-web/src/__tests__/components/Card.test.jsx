import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Card from '../../components/common/Card';

describe('Card Component', () => {
  it('renders card container with children content', () => {
    render(
      <Card>
        <h3>Card Header</h3>
        <p>Card body content</p>
      </Card>
    );
    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Card body content')).toBeInTheDocument();
  });

  it('applies custom className alongside card base class', () => {
    const { container } = render(<Card className="custom-shadow">Content</Card>);
    expect(container.firstChild).toHaveClass('card');
    expect(container.firstChild).toHaveClass('custom-shadow');
  });
});
