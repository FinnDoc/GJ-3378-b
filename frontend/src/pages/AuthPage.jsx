import { useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, Newspaper, UserRound } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isReady, signIn, register } = useAuth();
  const isRegister = location.pathname === '/register';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (user && isReady) return <Navigate to="/" replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (isRegister) await register(username.trim(), password);
      else await signIn(username.trim(), password);
      navigate(location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth-page page-wrap">
      <div className="auth-back"><Link className="back-link" to="/"><ArrowLeft size={16} /> На главную</Link></div>
      <section className="auth-card">
        <div className="auth-visual">
          <div className="auth-visual-top"><span>СВОДКА</span><span>РЕДАКЦИЯ</span></div>
          <div className="auth-visual-mark"><Newspaper size={38} strokeWidth={1.2} /></div>
          <span className="auth-visual-big">С.</span>
          <p>Город начинается<br />с хорошей истории.</p>
          <div className="auth-visual-bottom"><span>ОТКРЫТАЯ ЛЕНТА</span><span>01 — 24</span></div>
        </div>

        <div className="auth-content">
          <span className="eyebrow eyebrow--muted">{isRegister ? 'НОВЫЙ АВТОР' : 'РАБОЧЕЕ МЕСТО'}</span>
          <h1>{isRegister ? 'Создать аккаунт' : 'С возвращением'}</h1>
          <p className="auth-intro">{isRegister ? 'Зарегистрируйтесь, чтобы публиковать новости и управлять материалами.' : 'Войдите, чтобы добавлять и редактировать публикации.'}</p>

          {error && <div className="message message--error" role="alert">{error}</div>}
          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field" htmlFor="username">
              <span>Логин</span>
              <span className="auth-input-wrap"><UserRound size={17} /><input id="username" type="text" autoComplete="username" minLength={3} maxLength={50} required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Ваш логин" /></span>
            </label>
            <label className="auth-field" htmlFor="password">
              <span>Пароль</span>
              <span className="auth-input-wrap"><LockKeyhole size={17} /><input id="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={6} maxLength={100} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Не менее 6 символов" /></span>
            </label>
            <button className="button button-primary auth-submit" type="submit" disabled={busy || !isReady}>
              {busy ? <span className="button-spinner" /> : <KeyRound size={16} />}
              {busy ? 'Подождите…' : isRegister ? 'Зарегистрироваться' : 'Войти в аккаунт'}
              {!busy && <ArrowRight size={16} />}
            </button>
          </form>

          {!isRegister && (
            <div className="demo-access">
              <div className="demo-icon"><KeyRound size={16} /></div>
              <div><strong>Демо-доступ</strong><span>Логин <code>admin</code> · пароль <code>admin123</code></span></div>
              <button type="button" className="demo-fill" onClick={() => { setUsername('admin'); setPassword('admin123'); }}>Заполнить</button>
            </div>
          )}

          <p className="auth-switch">
            {isRegister ? 'Уже есть аккаунт?' : 'Впервые в редакции?'}{' '}
            <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Войти' : 'Создать аккаунт'}</Link>
          </p>
        </div>
      </section>
      <div className="auth-footnote"><span className="auth-footnote-lock"><LockKeyhole size={13} /></span>Доступ редактора защищён JWT-токеном</div>
    </div>
  );
}
