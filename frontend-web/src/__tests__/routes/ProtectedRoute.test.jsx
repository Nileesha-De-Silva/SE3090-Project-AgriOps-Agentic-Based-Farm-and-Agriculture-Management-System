import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../components/common/protectedRoutes';
import * as authContext from '../../contexts/authcontext';

vi.mock('../../contexts/authcontext', () => ({
  useAuth: vi.fn(),
}));

describe('Protected Route Component (Authentication & RBAC Testing)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when auth state is initializing', () => {
    authContext.useAuth.mockReturnValue({
      user: null,
      loading: true,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects unauthenticated user to /login', () => {
    authContext.useAuth.mockReturnValue({
      user: null,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('denies access when user role does not match required roles', () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'worker-1', username: 'kasun', roles: ['FieldWorker'] },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['FarmManager', 'Admin']}>
          <div>Manager Only Dossier</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(
      screen.getByText("You don't have permission to view this page.")
    ).toBeInTheDocument();
    expect(screen.queryByText('Manager Only Dossier')).not.toBeInTheDocument();
  });

  it('renders protected child component when user has required role', () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'mgr-1', username: 'nileesha', roles: ['FarmManager'] },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute roles={['FarmManager']}>
          <div>Manager Approval Dossier</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Manager Approval Dossier')).toBeInTheDocument();
  });

  it('renders child component for authenticated user when no specific roles are required', () => {
    authContext.useAuth.mockReturnValue({
      user: { id: 'usr-1', username: 'fieldstaff', roles: ['FieldWorker'] },
      loading: false,
    });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>General Operations Board</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('General Operations Board')).toBeInTheDocument();
  });
});
