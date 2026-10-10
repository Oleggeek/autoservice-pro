import { useAppContext } from '../store';

interface Props {
  setPage: (page: string) => void;
}

export default function Dashboard({ setPage }: Props) {
  const { state, setState } = useAppContext();
  const user = state.currentUser;

  const markAllRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.userId === user?.id ? { ...n, read: true } : n
      )
    }));
  };

  const activeRepairs = state.repairs.filter(r => r.status !== 'completed');
  const waitingParts = state.repairs.filter(r => r.status === 'waiting_parts');
  const unreadNotifs = state.notifications.filter(n => n.userId === user?.id && !n.read);
  const lowStock = state.inventory.filter(i => i.quantity <= i.minQuantity);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Панель управления</h2>
      
      {/* Notifications */}
      {unreadNotifs.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">🔔 Уведомления</h3>
          {unreadNotifs.map(n => (
            <div key={n.id} className="text-sm text-yellow-700 py-1 border-b border-yellow-100 last:border-0">
              {n.message}
              <span className="text-xs text-yellow-500 ml-2">{new Date(n.createdAt).toLocaleString('ru')}</span>
            </div>
          ))}
          <button 
            onClick={() => markAllRead()}
            className="mt-2 text-sm text-yellow-800 underline"
          >
            Отметить все как прочитанные
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="Клиенты" value={state.clients.length} onClick={() => setPage('clients')} color="blue" />
        <StatCard icon="🚗" label="Автомобили" value={state.vehicles.length} onClick={() => setPage('vehicles')} color="green" />
        <StatCard icon="🔧" label="Активные ремонты" value={activeRepairs.length} onClick={() => setPage('repairs')} color="orange" />
        <StatCard icon="⏳" label="Ожидают запчасти" value={waitingParts.length} onClick={() => setPage('repairs')} color="red" />
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-2">⚠️ Заканчиваются на складе</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {lowStock.map(item => (
              <div key={item.id} className="text-sm text-red-700 flex justify-between">
                <span>{item.name}</span>
                <span className="font-mono">{item.quantity} шт. (мин. {item.minQuantity})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-slate-800 mb-3">📋 Последние действия</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {state.auditLog.slice(-10).reverse().map(log => (
            <div key={log.id} className="text-sm flex gap-2 py-1 border-b border-slate-100">
              <span className="text-slate-400 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ru')}</span>
              <span className="font-medium text-blue-600">{log.userName}</span>
              <span className="text-slate-600">{log.action} {log.entity}</span>
            </div>
          ))}
          {state.auditLog.length === 0 && (
            <p className="text-slate-400 text-sm">Нет записей</p>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, onClick, color }: { icon: string; label: string; value: number; onClick: () => void; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    orange: 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    red: 'bg-red-50 border-red-200 hover:bg-red-100',
  };
  return (
    <button onClick={onClick} className={`p-4 rounded-xl border text-left transition-colors ${colors[color]}`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </button>
  );
}
