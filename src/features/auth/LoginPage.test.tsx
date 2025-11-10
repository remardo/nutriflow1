import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from './LoginPage';
import * as authApi from '../../api/auth';

// Мокаем auth-api один раз на уровне файла, чтобы избежать реального import.meta в auth.ts
jest.mock('../../api/auth', () => ({
  login: jest.fn(),
}));

// Мокаем react-router-dom с useNavigate в самом верху файла (как требует Jest)
const navigateMock = jest.fn();
jest.mock('react-router-dom', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(jest.requireActual('react-router-dom') as any),
  useNavigate: () => navigateMock,
}));

describe('LoginPage', () => {
  const mockedLogin = authApi.login as jest.Mock;

  beforeEach(() => {
    mockedLogin.mockReset();
    navigateMock.mockReset();
  });

  it('успешный логин вызывает login и редиректит на /dashboard', async () => {
    mockedLogin.mockResolvedValue('token');

    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/пароль/i) as HTMLInputElement;
    const submit = screen.getByRole('button', { name: /войти/i });

    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'admin@example.com');
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'admin123');
    await userEvent.click(submit);

    expect(mockedLogin).toHaveBeenCalledWith('admin@example.com', 'admin123');
    expect(navigateMock).toHaveBeenCalledWith('/dashboard');
  });

  it('показывает ошибку при неуспешном логине', async () => {
    mockedLogin.mockRejectedValue(new Error('Ошибка входа'));

    render(<LoginPage />);

    const submit = screen.getByRole('button', { name: /войти/i });
    await userEvent.click(submit);

    const error = await screen.findByText('Ошибка входа');
    expect(error).toBeInTheDocument();
  });
});