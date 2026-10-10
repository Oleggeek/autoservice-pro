import { ReactNode, useState } from 'react';
import { useAppContext } from '../store';

interface LayoutProps {
  children: ReactNode;
  onLogout: () => void;
  onReset: () => void;
}

export default function Layout({ children, onLogout, onReset }: LayoutProps) {
  const { state, setState } = useAppContext();
  const user = state.currentUser;
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = state.notifications.filter(n => n.userId === user?.id && !n.read).length;
  const userNotifications = state.notifications
    .filter(n => n.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const markAllRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.userId === user?.id ? { ...n, read: true } : n
      )
    }));
  };

  return (
    <div className="h-screen flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔧</span>
          <h1 className="text-xl font-bold">Автосервис Pro</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border z-50 text-slate-800">
                <div className="p-3 border-b flex justify-between items-center">
                  <span className="font-semibold text-sm">Уведомления</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">Прочитать все</button>
                  )}
                </div>
                <div className="max-h-64 overflow-auto">
                  {userNotifications.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">Нет уведомлений</p>
                  ) : (
                    userNotifications.map(n => (
                      <div key={n.id} className={`p-3 border-b text-sm ${!n.read ? 'bg-blue-50' : ''}`}>
                        <p className="text-slate-700">{n.message}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('ru')}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 bg-slate-700 px-3 py-1.5 rounded-lg">
            <span className="text-sm">👤 {user?.name}</span>
            <span className="text-xs text-slate-400">({user?.role === 'admin' ? 'Админ' : 'Механик'})</span>
          </div>
          <button onClick={onReset} className="text-xs bg-slate-600 hover:bg-slate-500 px-2 py-1.5 rounded transition-colors" title="Сбросить все данные">
            🔄
          </button>
          <button onClick={onLogout} className="text-sm bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition-colors">
            Выйти
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
