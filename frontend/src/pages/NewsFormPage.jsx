import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Eye, FileText, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../api';

const initialForm = {
  title: '',
  content: '',
  category: '',
  author: '',
  is_published: true,
};

export default function NewsFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/categories').then((data) => { if (active) setCategories(data); }).catch(() => {});
    if (!editing) return () => { active = false; };

    apiRequest(`/news/${id}`)
      .then((item) => {
        if (!active) return;
        setForm({
          title: item.title,
          content: item.content,
          category: item.category,
          author: item.author || '',
          is_published: item.is_published,
        });
      })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editing, id]);

  function updateField(event) {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      category: form.category.trim(),
      is_published: form.is_published,
    };
    if (form.author.trim()) payload.author = form.author.trim();

    try {
      const saved = await apiRequest(editing ? `/news/${id}` : '/news', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });
      navigate(`/news/${saved.id}`);
    } catch (requestError) {
      setError(requestError.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="page-wrap form-loader"><span className="spinner" />Открываем материал…</div>;
  if (editing && error && !form.title) {
    return <div className="page-wrap form-error"><p className="message message--error">{error}</p><Link className="back-link" to="/"><ArrowLeft size={16} /> Вернуться к ленте</Link></div>;
  }

  return (
    <div className="page-wrap form-page">
      <div className="form-topline">
        <Link className="back-link" to={editing ? `/news/${id}` : '/'}><ArrowLeft size={16} /> Отмена</Link>
        <span className="form-step">РЕДАКЦИЯ / {editing ? 'ИЗМЕНЕНИЕ' : 'НОВЫЙ МАТЕРИАЛ'}</span>
      </div>

      <div className="form-heading">
        <div className="form-heading-icon"><FileText size={21} /></div>
        <div>
          <span className="eyebrow eyebrow--muted">РАБОЧЕЕ МЕСТО РЕДАКТОРА</span>
          <h1>{editing ? 'Редактировать новость' : 'Новая публикация'}</h1>
          <p>Заполните основные поля. Все изменения сохраняются через REST API.</p>
        </div>
      </div>

      <form className="news-form" onSubmit={submit}>
        {error && <div className="message message--error" role="alert">{error}</div>}
        <div className="form-field">
          <div className="field-heading"><label htmlFor="title">Заголовок <span>*</span></label><span>{form.title.length}/200</span></div>
          <input id="title" name="title" type="text" maxLength={200} minLength={3} required value={form.title} onChange={updateField} placeholder="О чём эта новость?" />
          <small>Коротко и понятно: от 3 до 200 символов.</small>
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="category">Тема <span>*</span></label>
            <input id="category" name="category" type="text" list="news-categories" minLength={2} maxLength={50} required value={form.category} onChange={updateField} placeholder="Например, Город" />
            <datalist id="news-categories">{categories.map((category) => <option key={category} value={category} />)}</datalist>
          </div>
          <div className="form-field">
            <label htmlFor="author">Автор</label>
            <input id="author" name="author" type="text" maxLength={100} value={form.author} onChange={updateField} placeholder="По умолчанию — ваш логин" />
          </div>
        </div>

        <div className="form-field">
          <div className="field-heading"><label htmlFor="content">Текст новости <span>*</span></label><span>{form.content.length} символов</span></div>
          <textarea id="content" name="content" minLength={10} required rows={10} value={form.content} onChange={updateField} placeholder="Расскажите, что произошло. Добавьте детали и важный контекст…" />
          <small>Минимум 10 символов. Можно использовать переносы строк.</small>
        </div>

        <label className={`publish-switch ${form.is_published ? 'publish-switch--on' : ''}`}>
          <input type="checkbox" name="is_published" checked={form.is_published} onChange={updateField} />
          <span className="switch-track"><span /></span>
          <span className="switch-copy"><strong>{form.is_published ? 'Опубликовать сразу' : 'Сохранить как черновик'}</strong><small>{form.is_published ? 'Материал появится в открытой ленте.' : 'Черновик будет доступен после входа.'}</small></span>
          <span className="switch-icon">{form.is_published ? <Eye size={17} /> : <FileText size={17} />}</span>
        </label>

        <div className="form-actions">
          <Link className="button button-quiet" to={editing ? `/news/${id}` : '/'}>Отмена</Link>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? <span className="button-spinner" /> : form.is_published ? <Send size={16} /> : <Check size={16} />}
            {saving ? 'Сохраняем…' : editing ? 'Сохранить изменения' : form.is_published ? 'Опубликовать новость' : 'Сохранить черновик'}
          </button>
        </div>
      </form>
      <p className="form-footnote"><span>*</span> обязательные поля · API проверит данные перед сохранением</p>
    </div>
  );
}
