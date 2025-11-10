import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nf-login-page">
      <div className="nf-login-card">
        <h1>NutriFlow</h1>
        <p className="nf-login-subtitle">Вход для нутрициолога</p>

        <form onSubmit={handleSubmit} className="nf-login-form">
          <label className="nf-login-label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="nf-login-input"
            />
          </label>

          <label className="nf-login-label">
            Пароль
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="nf-login-input"
            />
          </label>

          {error && <div className="nf-login-error">{error}</div>}

          <button
            type="submit"
            className="nf-login-button"
            disabled={loading}
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;