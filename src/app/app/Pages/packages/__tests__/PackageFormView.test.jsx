import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import PackageFormView from '../PackageFormView';
import React from 'react';
const baseProps = {
  formValues: {},
  errors: {},
  packages: [],
  branches: [],
  permissions: {},
  singleBranch: true,
  onFieldChange: vi.fn(),
  onPackageSelect: vi.fn(),
  onSubmit: vi.fn(),
  onDelete: vi.fn()
};

test('renders Packages title', () => {
  render(<PackageFormView {...baseProps} />);
  screen.getByRole('heading', { name: 'Packages' })
});

test('shows Update Package button when package id exists', () => {
  render(
    <PackageFormView
      {...baseProps}
      formValues={{ id: '123' }}
    />
  );
  expect(screen.getByText('Update Package')).toBeInTheDocument();
  expect(screen.getByText('Clear Selection')).toBeInTheDocument();
});

test('renders Branch dropdown when multi-branch and permitted', () => {
  render(
    <PackageFormView
      {...baseProps}
      singleBranch={false}
      permissions={{ canManageBranches: true }}
      branches={[{ id: 'b1', name: 'Main Branch' }]}
      formValues={{ branch_id: 'b1' }}
    />
  );
  expect(screen.getByRole('button', { name: /branch/i })).toBeInTheDocument();
});

test('does not render Branch dropdown when singleBranch', () => {
  render(<PackageFormView {...baseProps} />);
    expect(screen.queryByRole('button', { name: /branch/i })).not.toBeInTheDocument();
});

test('renders all form input fields', () => {
  render(<PackageFormView {...baseProps} />);

    expect(screen.getByRole('button', {
        name: /packages/i
    })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /package type/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /package name/i })).toBeInTheDocument();
});

test('displays validation errors', () => {
  render(
    <PackageFormView
      {...baseProps}
      errors={{
        name: 'Required',
        duration: 'Invalid duration'
      }}
    />
  );

  expect(screen.getByText('Required')).toBeInTheDocument();
  expect(screen.getByText('Invalid duration')).toBeInTheDocument();
});

test('calls onPackageSelect when package is selected', () => {
  const onPackageSelect = vi.fn();

  render(
    <PackageFormView
      {...baseProps}
      packages={[{ id: 'p1', name: 'Gold' }]}
      onPackageSelect={onPackageSelect}
    />
  );

  // 1️⃣ Open dropdown
  fireEvent.click(
    screen.getByRole('button', { name: /packages/i })
  );

  // 2️⃣ Click option
  fireEvent.click(screen.getByText('Gold'));

  // 3️⃣ Assert handler called
  expect(onPackageSelect).toHaveBeenCalled();
});
