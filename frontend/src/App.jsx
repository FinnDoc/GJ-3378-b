import { useState } from 'react';
import {
  ArrowUpRight,
  LogIn,
  LogOut,
  Plus,
  UserRound,
} from 'lucide-react';
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useAuth } from './AuthContext';
import HomePage from './pages/HomePage';
import NewsDetailPage from './pages/NewsDetailPage';
import NewsFormPage from './pages/NewsFormPage';
import AuthPage from './pages/AuthPage';

function initials(name = '') {
  return name.slice(0, 2).toUpperCase();
}

function Header() {
  const { user, signOut, isReady } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSignOut() {
    signOut();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="Сводка — на главную">
          <span className="brand-mark"><span /></span>
          <span className="brand-copy">
            <strong>сводка<span>.</span></strong>
            <small>городское медиа</small>
          </span>
        </Link>

        <button
          className="mobile-menu-toggle icon-button"
          type="button"
          aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="menu-glyph">{menuOpen ? '×' : '☰'}</span>
        </button>

        <nav className={`main-nav ${menuOpen ? 'main-nav--open' : ''}`} aria-label="Основная навигация">
          <NavLink to="/" end onClick={() => setMenuOpen(false)}>Лента</NavLink>
          <a href="/api/docs" target="_blank" rel="noreferrer">API-документация <ArrowUpRight size={13} /></a>
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              <Link className="button button-primary header-create" to="/news/new">
                <Plus size={16} strokeWidth={2.5} />
                <span>Новая новость</span>
              </Link>
              <div className="user-chip" title={`Вы вошли как ${user.username}`}>
                <span className="user-avatar"><UserRound size={15} /></span>
                <span>{user.username}</span>
              </div>
              <button className="icon-button signout-button" type="button" onClick={handleSignOut} aria-label="Выйти">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <Link className="button button-outline header-login" to="/login">
              <LogIn size={16} />
              <span>{isReady ? 'Войти' : 'Вход…'}</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

function ProtectedRoute({ children }) {
  const { user, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <div className="route-loader"><span className="spinner" />Проверяем сессию…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AppLayout() {
  return (
    <>
      <Header />
      <main className="app-main"><Outlet /></main>
      <footer className="site-footer">
        <div className="footer-inner">
          <Link className="footer-brand" to="/">сводка<span>.</span></Link>
          <p>Новости без лишнего шума.</p>
          <span className="footer-note">REST API · React · учебный проект</span>
        </div>
      </footer>
    </>
  );
}

function NotFoundPage() {
  return (
    <section className="not-found page-wrap">
      <span className="eyebrow">СТРАНИЦА НЕ НАЙДЕНА</span>
      <h1>Кажется, эта новость затерялась.</h1>
      <Link className="button button-primary" to="/">Вернуться к ленте <ArrowUpRight size={16} /></Link>
    </section>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="news/new" element={<ProtectedRoute><NewsFormPage /></ProtectedRoute>} />
        <Route path="news/:id/edit" element={<ProtectedRoute><NewsFormPage /></ProtectedRoute>} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
