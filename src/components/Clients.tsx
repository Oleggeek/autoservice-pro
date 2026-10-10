import { useState } from 'react';
import { useAppContext, addAuditLog } from '../store';
import { Client, Note } from '../types';
import { v4 as uuidv4 } from 'uuid';
import NotesPanel from './NotesPanel';

interface Props {
  setPage: (page: string) => void;
}

export default function Clients({ setPage }: Props) {
  const { state, setState } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const filtered = state.clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const handleSave = (client: Partial<Client>) => {
    if (editingClient) {
      setState(prev => ({
        ...prev,
        clients: prev.clients.map(c => c.id === editingClient.id ? { ...c, ...client } as Client : c),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'обновил', 'клиента', editingClient.id, client.name || '')]
      }));
    } else {
      const newClient: Client = {
        id: uuidv4(),
        name: client.name || '',
        phone: client.phone || '',
        email: client.email || '',
        address: client.address || '',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.id || '',
        notes: [],
      };
      setState(prev => ({
        ...prev,
        clients: [...prev.clients, newClient],
        auditLog: [...prev.auditLog, addAuditLog(prev, 'создал', 'клиента', newClient.id, newClient.name)]
      }));
    }
    setShowForm(false);
    setEditingClient(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить клиента?')) {
      setState(prev => ({
        ...prev,
        clients: prev.clients.filter(c => c.id !== id),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'удалил', 'клиента', id, '')]
      }));
    }
  };

  const handleNotesUpdate = (clientId: string, notes: Note[]) => {
    setState(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === clientId ? { ...c, notes } : c),
      auditLog: [...prev.auditLog, addAuditLog(prev, 'добавил заметку к', 'клиенту', clientId, '')]
    }));
  };

  if (selectedClient) {
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedClient(null)} className="mb-4 text-blue-600 hover:underline">← Назад к списку</button>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedClient.name}</h2>
              <p className="text-slate-500">📞 {selectedClient.phone} {selectedClient.email && `| ✉️ ${selectedClient.email}`}</p>
              {selectedClient.address && <p className="text-slate-500">📍 {selectedClient.address}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditingClient(selectedClient); setShowForm(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Редактировать</button>
            </div>
          </div>
          
          {/* Client vehicles */}
          <div className="mt-6">
            <h3 className="font-semibold text-slate-700 mb-2">🚗 Автомобили клиента</h3>
            {state.vehicles.filter(v => v.clientId === selectedClient.id).length === 0 ? (
              <p className="text-slate-400 text-sm">Нет автомобилей</p>
            ) : (
              <div className="space-y-2">
                {state.vehicles.filter(v => v.clientId === selectedClient.id).map(v => (
                  <div key={v.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                    <div>
                      <span className="font-medium">{v.make} {v.model}</span>
                      <span className="text-slate-500 text-sm ml-2">{v.year} г. | {v.plateNumber}</span>
                    </div>
                    <span className="text-xs text-slate-400">VIN: {v.vin || '—'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mt-6">
            <NotesPanel notes={selectedClient.notes} onUpdate={(notes) => handleNotesUpdate(selectedClient.id, notes)} entityType="клиент" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Клиенты</h2>
        <button onClick={() => { setShowForm(true); setEditingClient(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          + Добавить клиента
        </button>
      </div>

      <input
        type="text"
        placeholder="Поиск по имени или телефону..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full mb-4 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />

      {showForm && (
        <ClientForm client={editingClient} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingClient(null); }} />
      )}

      <div className="grid gap-3">
        {filtered.map(client => (
          <div key={client.id} className="bg-white rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedClient(client)}>
            <div>
              <div className="font-semibold text-slate-800">{client.name}</div>
              <div className="text-sm text-slate-500">📞 {client.phone} {client.email && `| ✉️ ${client.email}`}</div>
              <div className="text-xs text-slate-400 mt-1">
                Авто: {state.vehicles.filter(v => v.clientId === client.id).length} | 
                Создан: {new Date(client.createdAt).toLocaleDateString('ru')} | 
                от: {state.users.find(u => u.id === client.createdBy)?.name || '—'}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setEditingClient(client); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 text-sm">✏️</button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }} className="text-red-600 hover:text-red-800 text-sm">🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Клиенты не найдены</p>}
      </div>
    </div>
  );
}

function ClientForm({ client, onSave, onCancel }: { client: Client | null; onSave: (c: Partial<Client>) => void; onCancel: () => void }) {
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [email, setEmail] = useState(client?.email || '');
  const [address, setAddress] = useState(client?.address || '');

  return (
    <div className="bg-white rounded-xl border p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">{client ? 'Редактировать клиента' : 'Новый клиент'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Имя *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Телефон *</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Адрес</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave({ name, phone, email, address })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
        <button onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Отмена</button>
      </div>
    </div>
  );
}
