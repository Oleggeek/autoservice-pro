import { useState, useEffect } from 'react';
import { AppContext, loadState, saveState, addAuditLog, addNotification } from './store';
import { AppState } from './store';
import { v4 as uuidv4 } from 'uuid';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Clients from './components/Clients';
import Vehicles from './components/Vehicles';
import Repairs from './components/Repairs';
import Inventory from './components/Inventory';
import AuditLogView from './components/AuditLogView';
import PrintInvoice from './components/PrintInvoice';
import UserSelect from './components/UserSelect';

function App() {
  const [state, setStateRaw] = useState<AppState>(loadState);

  const setState = (updater: (prev: AppState) => AppState) => {
    setStateRaw(prev => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  const handleLogin = (userId: string) => {
    const user = state.users.find(u => u.id === userId);
    if (user) {
      setState(prev => ({ ...prev, currentUser: user }));
    }
  };

  const handleLogout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const handleReset = () => {
    if (confirm('Сбросить все данные? Это действие нельзя отменить.')) {
      localStorage.removeItem('autoservice_state');
      window.location.reload();
    }
  };

  // Check for parts delivery notifications
  useEffect(() => {
    if (!state.currentUser) return;
    state.repairs.forEach(repair => {
      if (repair.status === 'waiting_parts') {
        const allDelivered = repair.parts.every(p => p.status === 'delivered' || p.status === 'used' || p.status === 'written_off');
        if (allDelivered && repair.parts.length > 0) {
          const existingNotif = state.notifications.find(
            n => n.repairId === repair.id && n.userId === state.currentUser?.id && n.message.includes('все запчасти доставлены')
          );
          if (!existingNotif) {
            const vehicle = state.vehicles.find(v => v.id === repair.vehicleId);
            setState(prev => ({
              ...prev,
              notifications: [
                ...prev.notifications,
                addNotification(prev, prev.currentUser?.id || '', `Все запчасти для ремонта ${vehicle?.plateNumber || ''} доставлены на склад. Можно начинать работу!`, repair.id, repair.vehicleId)
              ]
            }));
          }
        }
      }
    });
  }, [state.repairs, state.currentUser]);

  if (!state.currentUser) {
    return <UserSelect users={state.users} onLogin={handleLogin} />;
  }

  return (
    <AppContext.Provider value={{ state, setState }}>
      <Layout onLogout={handleLogout} onReset={handleReset}>
        <Routes />
      </Layout>
    </AppContext.Provider>
  );
}

function Routes() {
  const [page, setPage] = useState<string>('dashboard');
  const [selectedRepairId, setSelectedRepairId] = useState<string | null>(null);

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard setPage={setPage} />;
      case 'clients': return <Clients setPage={setPage} />;
      case 'vehicles': return <Vehicles setPage={setPage} />;
      case 'repairs': return <Repairs setPage={setPage} setSelectedRepairId={setSelectedRepairId} />;
      case 'inventory': return <Inventory />;
      case 'audit': return <AuditLogView />;
      case 'print': return <PrintInvoice repairId={selectedRepairId} setPage={setPage} />;
      default: return <Dashboard setPage={setPage} />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <nav className="bg-slate-800 text-white px-4 py-2 flex gap-2 flex-wrap">
        {[
          { key: 'dashboard', label: '📊 Главная' },
          { key: 'clients', label: '👥 Клиенты' },
          { key: 'vehicles', label: '🚗 Автомобили' },
          { key: 'repairs', label: '🔧 Ремонты' },
          { key: 'inventory', label: '📦 Склад' },
          { key: 'audit', label: '📋 Журнал' },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setPage(item.key)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              page === item.key ? 'bg-blue-600 text-white' : 'bg-slate-700 hover:bg-slate-600'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex-1 overflow-auto p-4 bg-gray-50">
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
