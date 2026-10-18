import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, CalendarDays, Edit3, Trash2, UserRound } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api';
import { useAuth } from '../AuthContext';

function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

export default function NewsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiRequest(`/news/${id}`)
      .then((data) => { if (active) setItem(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  async function deleteNews() {
    if (!window.confirm('Удалить эту новость? Отменить действие будет нельзя.')) return;
    setDeleting(true);
    try {
      await apiRequest(`/news/${id}`, { method: 'DELETE' });
      navigate('/', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
      setDeleting(false);
    }
  }

  if (loading) {
    return <div className="page-wrap detail-loader"><span className="spinner" />Загружаем материал…</div>;
  }

  if (error || !item) {
    return (
      <section className="page-wrap detail-error">
        <span className="eyebrow">МАТЕРИАЛ НЕ НАЙДЕН</span>
        <h1>{error || 'Этой новости больше нет.'}</h1>
        <Link className="button button-primary" to="/"><ArrowLeft size={16} /> Вернуться к ленте</Link>
      </section>
    );
  }

  return (
    <article className="article-page page-wrap">
      <div className="article-toolbar">
        <Link className="back-link" to="/"><ArrowLeft size={16} /> К ленте</Link>
        {user && (
          <div className="article-actions">
            <Link className="button button-outline button-small" to={`/news/${item.id}/edit`}><Edit3 size={14} /> Редактировать</Link>
            <button className="button button-danger button-small" type="button" disabled={deleting} onClick={deleteNews}>
              <Trash2 size={14} />{deleting ? 'Удаляем…' : 'Удалить'}
            </button>
          </div>
        )}
      </div>
      {error && <div className="message message--error" role="alert">{error}</div>}

      <header className="article-header">
        <div className="article-kicker-row">
          <span className="category-label"><span className="category-dot" />{item.category}</span>
          {!item.is_published && <span className="draft-label">Черновик</span>}
          <span className="article-issue">МАТЕРИАЛ №{String(item.id).padStart(3, '0')}</span>
        </div>
        <h1>{item.title}</h1>
        <div className="article-byline">
          <span className="byline-avatar"><UserRound size={18} /></span>
          <span><small>АВТОР</small><strong>{item.author || 'Редакция'}</strong></span>
          <span className="byline-divider" />
          <span className="article-date"><CalendarDays size={15} />{formatDate(item.published_at)}</span>
        </div>
      </header>

      <div className="article-visual" aria-hidden="true">
        <div className="article-visual-grid" />
        <span className="article-visual-word">СВОДКА</span>
        <span className="article-visual-big">{(item.category || 'С').slice(0, 1).toUpperCase()}</span>
        <span className="article-visual-note">ГОРОД<br />В ФОКУСЕ</span>
        <span className="article-visual-index">{String(item.id).padStart(2, '0')} / 24</span>
      </div>

      <div className="article-content-layout">
        <aside className="article-aside"><span>01</span><span>ТЕКСТ<br />МАТЕРИАЛА</span></aside>
        <div className="article-body">
          {item.content.split(/\n+/).filter(Boolean).map((paragraph, index) => (
            <p className={index === 0 ? 'article-lead' : ''} key={`${item.id}-${index}`}>{paragraph}</p>
          ))}
          <Link className="article-back-cta" to="/">Все новости <ArrowUpRight size={16} /></Link>
        </div>
      </div>

      <div className="article-bottom-rule"><span>КОНЕЦ МАТЕРИАЛА</span><span>СВОДКА · {formatDate(item.published_at)}</span></div>
    </article>
  );
}
