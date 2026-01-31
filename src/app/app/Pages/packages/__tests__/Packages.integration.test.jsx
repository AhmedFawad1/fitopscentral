import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { vi } from 'vitest';
import PackagesContainer from '../PackagesContainer';
import authReducer from '@/store/authSlice';

vi.mock('@/hooks/useConfirm', () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true)
  })
}));

vi.mock('../packageService', () => ({
  packageService: {
    fetch: vi.fn(),
    save: vi.fn(),
    softDelete: vi.fn()
  }
}));

import { packageService } from '../packageService';

const createTestStore = () =>
  configureStore({
    reducer: {
      auth: authReducer
    },
    preloadedState: {
      auth: {
        user: {
          id: 'u1',
          gym_id: 'g1',
          branch_id: 'b1',
          max_branches: 1,
          role: 'admin',
          role_manager: {
            admin: { canManageBranches: true }
          },
          all_branches_json: [{ id: 'b1', name: 'Main Branch' }]
        }
      }
    }
  });

  const renderPackages = async () => {
  const store = createTestStore();

  render(
    <Provider store={store}>
      <PackagesContainer />
    </Provider>
  );

  // wait for initial fetch
  await waitFor(() => {
    expect(packageService.fetch).toHaveBeenCalled();
  });
};

test('fetches packages on load', async () => {
  packageService.fetch.mockResolvedValueOnce([]);

  await renderPackages();

  expect(packageService.fetch).toHaveBeenCalledWith('g1', 'b1');
});

test('adds a new package successfully', async () => {
  packageService.fetch.mockResolvedValueOnce([]);
  packageService.save.mockResolvedValueOnce({});

  await renderPackages();

  fireEvent.change(
    screen.getByRole('textbox', { name: /package name/i }),
    { target: { value: 'Gold Package' } }
    );
  fireEvent.change(
    screen.getByRole('textbox', { name: /^duration$/i }),
    { target: { value: '3' } }
    );
  fireEvent.change(
    screen.getByRole('textbox', { name: /^package fee$/i }),
    { target: { value: '5000' } }
    );  

  fireEvent.click(
    screen.getByRole('button', { name: /package type/i })
  );
  fireEvent.click(screen.getByText('Months'));

  fireEvent.click(
    screen.getByRole('button', { name: /add package/i })
  );

  await waitFor(() => {
    expect(packageService.save).toHaveBeenCalled();
  });
});
test('deletes a package successfully', async () => {
  packageService.fetch.mockResolvedValueOnce([
    { id: 'p1', name: 'Silver Package', duration: 1, price: 2000, duration_type: 'months' }
  ]);
  packageService.softDelete.mockResolvedValueOnce({});
  await renderPackages();

  fireEvent.click(
    screen.getByRole('button', { name: /packages/i }),
  );
  fireEvent.click(screen.getByText('Silver Package'));
  fireEvent.click(
    screen.getByRole('button', { name: /delete package/i })
  );
  await waitFor(() => {
    expect(packageService.softDelete).toHaveBeenCalledWith('p1', 'g1');
  });
});
