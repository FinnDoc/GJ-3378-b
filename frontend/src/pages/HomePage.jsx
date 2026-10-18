import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleX,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiRequest } from '../api';
import { useAuth } from '../AuthContext';

const PAGE_SIZE = 6;

function formatDate(value) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value));
}

function NewsCard({ item, index }) {
  const featured = index === 0;
  const categoryCode = (item.category || 'С').slice(0, 1).toUpperCase();

  return (
    <article className={`news-card ${featured ? 'news-card--featured' : ''}`}>
      <Link className="news-card-link" to={`/news/${item.id}`} aria-label={`Открыть: ${item.title}`}>
        <div className={`card-art card-art--${index % 4}`} aria-hidden="true">
          <span className="art-orbit art-orbit--one" />
          <span className="art-orbit art-orbit--two" />
          <span className="art-stamp">{categoryCode}</span>
          <span className="art-caption">ИСТОРИЯ<br />ДНЯ</span>
          <span className="art-number">{String(item.id).padStart(2, '0')}</span>
        </div>
        <div className="news-card-content">
          <div className="card-meta-row">
            <span className="category-label"><span className="category-dot" />{item.category}</span>
            {!item.is_published && <span className="draft-label">Черновик</span>}
          </div>
          <h2>{item.title}</h2>
          <p className="card-excerpt">{item.content}</p>
          <div className="card-footer">
            <span className="card-author">{item.author || 'Редакция'}</span>
            <span className="card-date"><CalendarDays size={13} />{formatDate(item.published_at)}</span>
          </div>
        </div>
        <span className="card-open-icon" aria-hidden="true"><ArrowUpRight size={17} /></span>
      </Link>
    </article>
  );
}

function NewsSkeleton() {
  return (
    <div className="news-grid" aria-label="Загружаем новости">
      {Array.from({ length: 4 }, (_, index) => (
        <div className={`skeleton-card ${index === 0 ? 'skeleton-card--featured' : ''}`} key={index}>
          <div className="skeleton-art" />
          <div className="skeleton-line skeleton-line--short" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--medium" />
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeQuery = searchParams.get('q') || '';
  const activeCategory = searchParams.get('category') || '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const [searchInput, setSearchInput] = useState(activeQuery);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    let active = true;
    apiRequest('/categories')
      .then((data) => { if (active) setCategories(data); })
      .catch(() => {});
    apiRequest('/stats')
      .then((data) => { if (active) setStats(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), page_size: String(PAGE_SIZE) });
    if (activeQuery) params.set('q', activeQuery);
    if (activeCategory) params.set('category', activeCategory);

    setLoading(true);
    setError('');
    apiRequest(`/news?${params.toString()}`)
      .then((data) => { if (active) setResult(data); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [activeQuery, activeCategory, page]);

  function submitSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);
    const query = searchInput.trim();
    if (query) next.set('q', query);
    else next.delete('q');
    next.delete('page');
    setSearchParams(next);
  }

  function selectCategory(category) {
    const next = new URLSearchParams(searchParams);
    if (category) next.set('category', category);
    else next.delete('category');
    next.delete('page');
    setSearchParams(next);
  }

  function changePage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) next.delete('page');
    else next.set('page', String(nextPage));
    setSearchParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleCount = stats?.published ?? total;

  return (
    <div className="home-page page-wrap">
      <section className="home-hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-dot" />НЕЗАВИСИМОЕ ГОРОДСКОЕ МЕДИА</div>
          <h1>Важное —<br /><em>сразу к делу.</em></h1>
          <p>События, решения и истории, которые помогают понять, что происходит вокруг.</p>
          <div className="hero-actions">
            <a className="hero-scroll-link" href="#news-list">Читать ленту <ArrowRight size={16} /></a>
            {user && <Link className="hero-create-link" to="/news/new"><Plus size={15} /> Добавить новость</Link>}
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-art-top"><span>ВЫПУСК</span><span>№ 09 / 24</span></div>
          <div className="hero-sun" />
          <div className="hero-rings"><span /><span /><span /></div>
          <div className="hero-art-bottom"><Sparkles size={14} /><span>город в фокусе</span></div>
          <span className="hero-art-mark">С</span>
        </div>
      </section>

      <section className="stats-strip" aria-label="Статистика новостной ленты">
        <div className="stats-intro"><span className="stats-kicker">КОРОТКО О ГЛАВНОМ</span><span>Открытая лента — без регистрации</span></div>
        <div className="stat-item"><strong>{visibleCount}</strong><span>публикаций</span></div>
        <div className="stat-item"><strong>{categories.length || '—'}</strong><span>тем</span></div>
        <div className="stat-live"><span className="live-pulse" />лента обновляется</div>
      </section>

      <section className="news-section" id="news-list">
        <div className="section-heading">
          <div>
            <div className="eyebrow eyebrow--muted">ЛЕНТА / СЕГОДНЯ</div>
            <h2>Читайте по существу<span>.</span></h2>
          </div>
          <span className="section-count">{loading ? '…' : `${total} ${total === 1 ? 'материал' : 'материалов'}`}</span>
        </div>

        <div className="filters-panel">
          <form className="search-form" onSubmit={submitSearch} role="search">
            <Search size={18} />
            <input
              type="search"
              aria-label="Поиск по новостям"
              placeholder="Найти новость или тему…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            {searchInput && (
              <button className="clear-search" type="button" aria-label="Очистить поиск" onClick={() => setSearchInput('')}>
                <CircleX size={16} />
              </button>
            )}
            <button className="search-submit" type="submit">Найти</button>
          </form>
          <div className="category-filters" aria-label="Фильтр по темам">
            <button className={`filter-chip ${!activeCategory ? 'filter-chip--active' : ''}`} type="button" onClick={() => selectCategory('')}>Все темы</button>
            {categories.map((category) => (
              <button
                key={category}
                className={`filter-chip ${activeCategory === category ? 'filter-chip--active' : ''}`}
                type="button"
                onClick={() => selectCategory(category)}
              >{category}</button>
            ))}
          </div>
        </div>

        {error && (
          <div className="message message--error" role="alert">
            <span>{error}</span>
            <button type="button" className="text-button" onClick={() => window.location.reload()}>Повторить</button>
          </div>
        )}

        {loading ? <NewsSkeleton /> : error ? null : result?.items?.length ? (
          <div className="news-grid">
            {result.items.map((item, index) => <NewsCard key={item.id} item={item} index={index} />)}
          </div>
        ) : (
          <div className="empty-state">
            <span className="empty-icon"><Search size={20} /></span>
            <h3>Ничего не нашлось</h3>
            <p>{activeQuery || activeCategory ? 'Попробуйте изменить запрос или выбрать другую тему.' : 'Пока здесь тихо. Первая новость скоро появится.'}</p>
            {(activeQuery || activeCategory) && <button className="button button-outline" type="button" onClick={() => { setSearchInput(''); setSearchParams({}); }}>Сбросить фильтры</button>}
          </div>
        )}

        {!loading && !error && totalPages > 1 && (
          <nav className="pagination" aria-label="Страницы новостей">
            <button className="pagination-button" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} aria-label="Предыдущая страница"><ChevronLeft size={18} /></button>
            <span>Страница <strong>{page}</strong> из {totalPages}</span>
            <button className="pagination-button" type="button" disabled={page >= totalPages} onClick={() => changePage(page + 1)} aria-label="Следующая страница"><ChevronRight size={18} /></button>
          </nav>
        )}

        {!loading && result?.items?.length > 0 && totalPages === 1 && (
          <div className="list-end"><span />Вы дочитали ленту<span /></div>
        )}
      </section>

      <section className="editor-note">
        <div className="editor-note-mark">С<span>.</span></div>
        <div><span className="eyebrow eyebrow--muted">ВАШ ГОРОД — ВАШ ГОЛОС</span><h2>Есть чем поделиться?</h2><p>Войдите, чтобы добавить материал, обновить публикацию или сохранить важное в ленте.</p></div>
        {user ? <Link className="button button-primary" to="/news/new">Написать новость <ArrowUpRight size={16} /></Link> : <Link className="button button-outline" to="/login">Войти в редакцию <ArrowUpRight size={16} /></Link>}
      </section>
    </div>
  );
}
