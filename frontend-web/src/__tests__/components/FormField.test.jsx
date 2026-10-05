import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FormField from '../../components/common/FormField';

describe('FormField Component', () => {
  it('renders label and text input properly', () => {
    render(<FormField label="Farm Name" value="Green Acres" onChange={() => {}} />);
    expect(screen.getByLabelText(/farm name/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Green Acres')).toBeInTheDocument();
  });

  it('renders select dropdown with options', () => {
    const options = [
      { value: 'paddy', label: 'Paddy' },
      { value: 'corn', label: 'Corn' },
    ];
    render(
      <FormField
        label="Crop Type"
        type="select"
        value="paddy"
        options={options}
        onChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/crop type/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Paddy' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Corn' })).toBeInTheDocument();
  });

  it('renders textarea when type is textarea', () => {
    render(
      <FormField
        label="Description"
        type="textarea"
        placeholder="Enter notes"
        value=""
        onChange={() => {}}
      />
    );
    expect(screen.getByPlaceholderText('Enter notes')).toBeInTheDocument();
  });

  it('triggers onChange when text is entered', () => {
    const handleChange = vi.fn();
    render(<FormField label="Field Area" value="" onChange={handleChange} />);
    const input = screen.getByLabelText(/field area/i);
    fireEvent.change(input, { target: { value: '15.5' } });
    expect(handleChange).toHaveBeenCalled();
  });
});
