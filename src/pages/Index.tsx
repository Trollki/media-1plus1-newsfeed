import React, { useState, useEffect } from 'react';
import { Menu, X, Eye, Grid, List, Heart, Filter, User, LogOut, Plus } from 'lucide-react';

interface User {
  username: string;
  password: string;
  publishedCount: number;
  totalLikes: number;
  isAdmin?: boolean;
}

interface NewsItem {
  id: string;
  title: string;
  content: string;
  tags: string[];
  videoUrl?: string;
  likes: number;
  author: string;
  createdAt: string;
  likedBy: string[];
}

const USERS: User[] = [
  { username: 'Вадим', password: 'ЗМІ11', publishedCount: 0, totalLikes: 0, isAdmin: true },
  { username: 'Вася', password: 'ЗМІ1+1', publishedCount: 0, totalLikes: 0 }
];

const AVAILABLE_TAGS = [
  { id: 'politics', label: 'Політика', class: 'tag-politics' },
  { id: 'economy', label: 'Економіка', class: 'tag-economy' },
  { id: 'culture', label: 'Культура', class: 'tag-culture' },
  { id: 'world', label: 'Світ', class: 'tag-world' },
  { id: 'tech', label: 'Технології', class: 'tag-tech' }
];

const Index = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [currentUser, setCurrentUser] = useState<string | null>(localStorage.getItem('currentUser'));
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Адмін панель
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = localStorage.getItem('users');
    return savedUsers ? JSON.parse(savedUsers) : USERS;
  });
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userForm, setUserForm] = useState({ username: '', password: '' });
  
  // Авторизація
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showLoginForm, setShowLoginForm] = useState(false);
  
  // Новини
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsForm, setNewsForm] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    videoUrl: ''
  });

  // Завантаження даних при старті
  useEffect(() => {
    const savedNews = localStorage.getItem('news');
    if (savedNews) {
      setNews(JSON.parse(savedNews));
    }
  }, []);

  // Збереження новин в localStorage
  useEffect(() => {
    localStorage.setItem('news', JSON.stringify(news));
  }, [news]);

  // Збереження користувачів в localStorage
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  // Логін
  const handleLogin = () => {
    const user = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      localStorage.setItem('currentUser', user.username);
      setCurrentUser(user.username);
      setShowLoginForm(false);
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Невірний логін або пароль!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
    setCurrentPage('home');
  };

  // Публікація новини
  const handlePublishNews = () => {
    if (!newsForm.title || !newsForm.content || newsForm.tags.length === 0) {
      alert('Заповніть всі обов\'язкові поля!');
      return;
    }

    const newNews: NewsItem = {
      id: Date.now().toString(),
      title: newsForm.title,
      content: newsForm.content,
      tags: newsForm.tags,
      videoUrl: newsForm.videoUrl,
      likes: 0,
      author: currentUser!,
      createdAt: new Date().toISOString(),
      likedBy: []
    };

    setNews(prev => [newNews, ...prev]);
    setNewsForm({ title: '', content: '', tags: [], videoUrl: '' });
    setCurrentPage('home');
  };

  // Лайки
  const handleLike = (newsId: string) => {
    if (!currentUser) return;

    setNews(prev => prev.map(item => {
      if (item.id === newsId) {
        const isLiked = item.likedBy.includes(currentUser);
        return {
          ...item,
          likes: isLiked ? item.likes - 1 : item.likes + 1,
          likedBy: isLiked 
            ? item.likedBy.filter(user => user !== currentUser)
            : [...item.likedBy, currentUser]
        };
      }
      return item;
    }));
  };

  // Фільтрація новин
  const filteredNews = selectedTag 
    ? news.filter(item => item.tags.includes(selectedTag))
    : news;

  // Статистика
  const totalLikes = news.reduce((sum, item) => sum + item.likes, 0);
  const totalJournalists = new Set(news.map(item => item.author)).size;
  
  // Перевірка чи користувач адмін
  const isAdmin = () => {
    const user = users.find(u => u.username === currentUser);
    return user?.isAdmin || false;
  };

  // Адмін функції
  const handleAddUser = () => {
    if (!userForm.username || !userForm.password) {
      alert('Заповніть всі поля!');
      return;
    }
    
    if (users.some(u => u.username === userForm.username)) {
      alert('Користувач з таким іменем вже існує!');
      return;
    }

    setUsers(prev => [...prev, {
      username: userForm.username,
      password: userForm.password,
      publishedCount: 0,
      totalLikes: 0
    }]);
    setUserForm({ username: '', password: '' });
  };

  const handleDeleteUser = (username: string) => {
    if (username === 'Вадим') {
      alert('Неможна видалити головного адміністратора!');
      return;
    }
    setUsers(prev => prev.filter(u => u.username !== username));
  };

  // Лідерборд
  const getLeaderboard = () => {
    return users.map(user => {
      const userNews = news.filter(n => n.author === user.username);
      const userLikes = userNews.reduce((sum, n) => sum + n.likes, 0);
      return {
        ...user,
        publishedCount: userNews.length,
        totalLikes: userLikes
      };
    }).sort((a, b) => b.totalLikes - a.totalLikes);
  };

  // YouTube embed функція
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  const renderHeader = () => (
    <header className="bg-white shadow-[var(--shadow-header)] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">ЗМІ 1+1</h1>
          </div>

          {/* Десктопне меню */}
          <nav className="mobile-hidden flex items-center space-x-6">
            <button 
              onClick={() => setCurrentPage('home')}
              className={`btn-news-ghost ${currentPage === 'home' ? 'bg-[hsl(var(--news-red-light))]' : ''}`}
            >
              Головна
            </button>
            <button 
              onClick={() => setCurrentPage('about')}
              className={`btn-news-ghost ${currentPage === 'about' ? 'bg-[hsl(var(--news-red-light))]' : ''}`}
            >
              Про нас
            </button>
            <button 
              onClick={() => setCurrentPage('leaderboard')}
              className={`btn-news-ghost ${currentPage === 'leaderboard' ? 'bg-[hsl(var(--news-red-light))]' : ''}`}
            >
              Лідерборд
            </button>
            {currentUser ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setCurrentPage('publish')}
                  className="btn-news"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати новину
                </button>
                {isAdmin() && (
                  <button 
                    onClick={() => setShowAdminPanel(true)}
                    className="btn-news-outline"
                  >
                    Адмін панель
                  </button>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="w-4 h-4" />
                  {currentUser} {isAdmin() && '(Адмін)'}
                </div>
                <button onClick={handleLogout} className="btn-news-ghost">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setShowLoginForm(true)}
                className="btn-news"
              >
                Вхід
              </button>
            )}
          </nav>

          {/* Мобільне меню */}
          <button 
            className="mobile-only"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Мобільне меню розгорнуте */}
        {isMenuOpen && (
          <div className="mobile-only py-4 border-t border-border">
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }}
                className="btn-news-ghost justify-start"
              >
                Головна
              </button>
              <button 
                onClick={() => { setCurrentPage('about'); setIsMenuOpen(false); }}
                className="btn-news-ghost justify-start"
              >
                Про нас
              </button>
              <button 
                onClick={() => { setCurrentPage('leaderboard'); setIsMenuOpen(false); }}
                className="btn-news-ghost justify-start"
              >
                Лідерборд
              </button>
              {currentUser ? (
                <>
                  <button 
                    onClick={() => { setCurrentPage('publish'); setIsMenuOpen(false); }}
                    className="btn-news justify-start"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Додати новину
                  </button>
                  {isAdmin() && (
                    <button 
                      onClick={() => { setShowAdminPanel(true); setIsMenuOpen(false); }}
                      className="btn-news-outline justify-start"
                    >
                      Адмін панель
                    </button>
                  )}
                  <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    {currentUser} {isAdmin() && '(Адмін)'}
                  </div>
                  <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="btn-news-ghost justify-start">
                    <LogOut className="w-4 h-4 mr-2" />
                    Вийти
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => { setShowLoginForm(true); setIsMenuOpen(false); }}
                  className="btn-news justify-start"
                >
                  Вхід
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );

  const renderLoginModal = () => {
    if (!showLoginForm) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <h2 className="text-2xl font-bold text-primary mb-6">Вхід для журналістів</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Логін</label>
              <input
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))}
                className="form-input"
                placeholder="Введіть логін"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Пароль</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                className="form-input"
                placeholder="Введіть пароль"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleLogin} className="btn-news flex-1">
                Увійти
              </button>
              <button 
                onClick={() => setShowLoginForm(false)}
                className="btn-news-outline flex-1"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHomePage = () => (
    <div className="space-y-8">
      {/* Герой секція */}
      <section className="bg-gradient-to-r from-primary to-[hsl(var(--news-red-hover))] text-white py-16 rounded-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="hero-title">Новини від ЗМІ 1+1</h1>
          <p className="text-xl opacity-90 mb-8">Незалежна журналістика та достовірна інформація</p>
          {!currentUser && (
            <button 
              onClick={() => setShowLoginForm(true)}
              className="bg-white text-primary px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Стати журналістом
            </button>
          )}
        </div>
      </section>

      {/* Фільтри та керування */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Фільтри тегів */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              !selectedTag ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-gray-200'
            }`}
          >
            Всі новини
          </button>
          {AVAILABLE_TAGS.map(tag => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedTag === tag.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-gray-200'
              }`}
            >
              {tag.label}
            </button>
          ))}
        </div>

        {/* Перемикач виду */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-muted'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-muted'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Новини */}
      {filteredNews.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-muted-foreground">
            {selectedTag ? 'Новин за цим тегом поки що немає' : 'Новин поки що немає'}
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'news-card-grid' : 'news-card-list'}>
          {filteredNews.map(item => (
            <article key={item.id} className="news-card animate-in fade-in duration-300">
              {/* Бейджі */}
              <div className="flex gap-2 mb-4">
                {item.likes >= 10 && (
                  <span className="badge-hot">🔥 Гаряче</span>
                )}
                {item.likes >= 15 && (
                  <span className="badge-exclusive">⭐ Ексклюзив</span>
                )}
              </div>

              {/* Заголовок */}
              <h3 className="news-title">{item.title}</h3>

              {/* Контент */}
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {item.content.length > 200 ? `${item.content.substring(0, 200)}...` : item.content}
              </p>

              {/* Відео */}
              {item.videoUrl && (
                <div className="mb-4">
                  <iframe
                    src={getYouTubeEmbedUrl(item.videoUrl)}
                    className="w-full h-48 rounded-lg"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Теги */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.tags.map(tagId => {
                  const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
                  return tag ? (
                    <span key={tagId} className={tag.class}>
                      {tag.label}
                    </span>
                  ) : null;
                })}
              </div>

              {/* Підвал картки */}
              <div className="flex justify-between items-center pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {item.author} • {new Date(item.createdAt).toLocaleDateString('uk-UA')}
                </div>
                
                <button 
                  onClick={() => handleLike(item.id)}
                  className={`like-button ${item.likedBy.includes(currentUser || '') ? 'liked' : ''}`}
                  disabled={!currentUser}
                >
                  <Heart className={`w-4 h-4 ${item.likedBy.includes(currentUser || '') ? 'fill-current' : ''}`} />
                  {item.likes}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderPublishPage = () => (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Додати новину</h1>
      <div className="news-card">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Заголовок новини *</label>
            <input
              type="text"
              value={newsForm.title}
              onChange={(e) => setNewsForm(prev => ({ ...prev, title: e.target.value }))}
              className="form-input"
              placeholder="Введіть заголовок новини"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Основний текст *</label>
            <textarea
              value={newsForm.content}
              onChange={(e) => setNewsForm(prev => ({ ...prev, content: e.target.value }))}
              className="form-textarea"
              placeholder="Введіть текст новини"
              rows={8}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Теги *</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => {
                    setNewsForm(prev => ({
                      ...prev,
                      tags: prev.tags.includes(tag.id)
                        ? prev.tags.filter(t => t !== tag.id)
                        : [...prev.tags, tag.id]
                    }));
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    newsForm.tags.includes(tag.id) 
                      ? 'bg-primary text-white' 
                      : 'bg-muted text-muted-foreground hover:bg-gray-200'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Посилання на відео (опціонально)</label>
            <input
              type="url"
              value={newsForm.videoUrl}
              onChange={(e) => setNewsForm(prev => ({ ...prev, videoUrl: e.target.value }))}
              className="form-input"
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button 
              onClick={handlePublishNews}
              className="btn-news"
            >
              Опублікувати
            </button>
            <button 
              onClick={() => setCurrentPage('home')}
              className="btn-news-outline"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLeaderboardPage = () => {
    const leaderboard = getLeaderboard();
    
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🏆 Лідерборд журналістів</h1>
        
        <div className="grid gap-6">
          {leaderboard.map((user, index) => (
            <div key={user.username} className="news-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {user.username} 
                      {user.isAdmin && <span className="text-sm ml-2 px-2 py-1 bg-primary text-white rounded-full">Адмін</span>}
                    </h3>
                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                      <span>📰 {user.publishedCount} новин</span>
                      <span>❤️ {user.totalLikes} лайків</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{user.totalLikes}</div>
                  <div className="text-sm text-muted-foreground">загальний рейтинг</div>
                </div>
              </div>
            </div>
          ))}
          
          {leaderboard.length === 0 && (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">Поки що немає журналістів у списку</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAdminPanel = () => {
    if (!showAdminPanel || !isAdmin()) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">Адмін панель</h2>
            <button 
              onClick={() => setShowAdminPanel(false)}
              className="btn-news-ghost"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-8">
            {/* Додавання користувача */}
            <div className="news-card">
              <h3 className="text-xl font-bold mb-4">Додати нового журналіста</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className="form-input"
                  placeholder="Ім'я користувача"
                />
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Пароль"
                />
                <button onClick={handleAddUser} className="btn-news">
                  Додати
                </button>
              </div>
            </div>

            {/* Список користувачів */}
            <div className="news-card">
              <h3 className="text-xl font-bold mb-4">Управління журналістами</h3>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.username} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">
                          {user.username}
                          {user.isAdmin && <span className="text-sm ml-2 px-2 py-1 bg-primary text-white rounded-full">Адмін</span>}
                        </h4>
                        <div className="text-sm text-muted-foreground">
                          {news.filter(n => n.author === user.username).length} новин • 
                          {news.filter(n => n.author === user.username).reduce((sum, n) => sum + n.likes, 0)} лайків
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {user.username !== 'Вадим' && (
                        <button 
                          onClick={() => handleDeleteUser(user.username)}
                          className="btn-news-outline text-red-600 hover:bg-red-50"
                        >
                          Видалити
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Статистика */}
            <div className="news-card">
              <h3 className="text-xl font-bold mb-4">📊 Загальна статистика</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{users.length}</div>
                  <div className="text-sm text-muted-foreground">Журналістів</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{news.length}</div>
                  <div className="text-sm text-muted-foreground">Новин</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalLikes}</div>
                  <div className="text-sm text-muted-foreground">Лайків</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{totalJournalists}</div>
                  <div className="text-sm text-muted-foreground">Активних</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAboutPage = () => (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Про ЗМІ 1+1</h1>
      
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="news-card">
            <h2 className="text-2xl font-bold mb-4 text-primary">Наша місія</h2>
            <p className="text-lg leading-relaxed mb-6">
              ЗМІ 1+1 — це незалежне новинне медіа, що створене для забезпечення громадян України 
              достовірною та актуальною інформацією. Ми прагнемо підтримувати високі стандарти 
              журналістики та сприяти формуванню інформованого суспільства.
            </p>
            
            <h3 className="text-xl font-semibold mb-3">Наші принципи:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Об'єктивність та неупередженість</li>
              <li>• Перевірка фактів та достовірність</li>
              <li>• Швидке висвітлення подій</li>
              <li>• Підтримка демократичних цінностей</li>
              <li>• Прозорість та відкритість</li>
            </ul>

            <div className="mt-8 p-6 bg-[hsl(var(--news-red-light))] rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Важливо!</h4>
              <p className="text-sm text-muted-foreground">
                Сайт працює в демо-режимі. Всі дані зберігаються тимчасово в браузері 
                та можуть бути втрачені при очищенні кешу.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Статистика */}
          <div className="news-card">
            <h3 className="text-xl font-bold mb-4 text-primary">📊 Статистика</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Опубліковано новин:</span>
                <span className="font-semibold">{news.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Загальна кількість лайків:</span>
                <span className="font-semibold">{totalLikes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Активних журналістів:</span>
                <span className="font-semibold">{totalJournalists}</span>
              </div>
            </div>
          </div>

          {/* Топ журналісти */}
          {news.length > 0 && (
            <div className="news-card">
              <h3 className="text-xl font-bold mb-4 text-primary">🏆 Топ журналісти</h3>
              <div className="space-y-3">
                {Array.from(new Set(news.map(item => item.author)))
                  .map(author => {
                    const authorNews = news.filter(item => item.author === author);
                    const authorLikes = authorNews.reduce((sum, item) => sum + item.likes, 0);
                    return { author, count: authorNews.length, likes: authorLikes };
                  })
                  .sort((a, b) => b.likes - a.likes)
                  .slice(0, 3)
                  .map((author, index) => (
                    <div key={author.author} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                        <span className="font-medium">{author.author}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {author.count} новин • {author.likes} лайків
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {renderHeader()}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentPage === 'home' && renderHomePage()}
        {currentPage === 'publish' && currentUser && renderPublishPage()}
        {currentPage === 'about' && renderAboutPage()}
        {currentPage === 'leaderboard' && renderLeaderboardPage()}
        
        {currentPage === 'publish' && !currentUser && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground mb-4">
              Для публікації новин потрібно увійти в систему
            </p>
            <button 
              onClick={() => setShowLoginForm(true)}
              className="btn-news"
            >
              Увійти
            </button>
          </div>
        )}
      </main>

      {renderLoginModal()}
      {renderAdminPanel()}
      
      {/* Футер */}
      <footer className="bg-muted mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-2xl font-bold text-primary mb-4">ЗМІ 1+1</div>
          <p className="text-muted-foreground mb-4">
            Незалежна журналістика для інформованого суспільства
          </p>
          <div className="text-sm text-muted-foreground">
            © 2024 ЗМІ 1+1. Демо-версія сайту.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
