import { useState } from 'react';
import { useAppContext, addAuditLog } from '../store';
import { Vehicle, Note } from '../types';
import { v4 as uuidv4 } from 'uuid';
import NotesPanel from './NotesPanel';

interface Props {
  setPage: (page: string) => void;
}

export default function Vehicles({ setPage }: Props) {
  const { state, setState } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filterClient, setFilterClient] = useState('');

  const filtered = state.vehicles.filter(v => {
    const matchesSearch = `${v.make} ${v.model} ${v.plateNumber} ${v.vin}`.toLowerCase().includes(search.toLowerCase());
    const matchesClient = !filterClient || v.clientId === filterClient;
    return matchesSearch && matchesClient;
  });

  const getClientName = (clientId: string) => state.clients.find(c => c.id === clientId)?.name || '—';

  const handleSave = (vehicle: Partial<Vehicle>) => {
    if (editingVehicle) {
      setState(prev => ({
        ...prev,
        vehicles: prev.vehicles.map(v => v.id === editingVehicle.id ? { ...v, ...vehicle } as Vehicle : v),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'обновил', 'автомобиль', editingVehicle.id, `${vehicle.make} ${vehicle.model}`)]
      }));
    } else {
      const newVehicle: Vehicle = {
        id: uuidv4(),
        clientId: vehicle.clientId || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || new Date().getFullYear(),
        vin: vehicle.vin || '',
        plateNumber: vehicle.plateNumber || '',
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.id || '',
        notes: [],
      };
      setState(prev => ({
        ...prev,
        vehicles: [...prev.vehicles, newVehicle],
        auditLog: [...prev.auditLog, addAuditLog(prev, 'создал', 'автомобиль', newVehicle.id, `${newVehicle.make} ${newVehicle.model}`)]
      }));
    }
    setShowForm(false);
    setEditingVehicle(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить автомобиль?')) {
      setState(prev => ({
        ...prev,
        vehicles: prev.vehicles.filter(v => v.id !== id),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'удалил', 'автомобиль', id, '')]
      }));
    }
  };

  const handleNotesUpdate = (vehicleId: string, notes: Note[]) => {
    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === vehicleId ? { ...v, notes } : v),
      auditLog: [...prev.auditLog, addAuditLog(prev, 'добавил заметку к', 'автомобилю', vehicleId, '')]
    }));
  };

  if (selectedVehicle) {
    const vehicleRepairs = state.repairs.filter(r => r.vehicleId === selectedVehicle.id);
    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedVehicle(null)} className="mb-4 text-blue-600 hover:underline">← Назад к списку</button>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})</h2>
              <p className="text-slate-500">🔢 {selectedVehicle.plateNumber} | VIN: {selectedVehicle.vin || '—'}</p>
              <p className="text-slate-500">👤 Клиент: {getClientName(selectedVehicle.clientId)}</p>
            </div>
            <button onClick={() => { setEditingVehicle(selectedVehicle); setShowForm(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Редактировать</button>
          </div>

          {/* Repair History */}
          <div className="mt-6">
            <h3 className="font-semibold text-slate-700 mb-2">🔧 История ремонтов</h3>
            {vehicleRepairs.length === 0 ? (
              <p className="text-slate-400 text-sm">Нет ремонтов</p>
            ) : (
              <div className="space-y-2">
                {vehicleRepairs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">{new Date(r.date).toLocaleDateString('ru')}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'waiting_parts' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                        {r.status === 'completed' ? 'Завершён' : r.status === 'waiting_parts' ? 'Ожидание запчастей' : 'В работе'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mt-1">{r.description}</p>
                    <p className="text-xs text-slate-400">Пробег: {r.mileage.toLocaleString()} км</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="mt-6">
            <NotesPanel notes={selectedVehicle.notes} onUpdate={(notes) => handleNotesUpdate(selectedVehicle.id, notes)} entityType="автомобиль" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Автомобили</h2>
        <button onClick={() => { setShowForm(true); setEditingVehicle(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Добавить авто
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все клиенты</option>
          {state.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {showForm && (
        <VehicleForm vehicle={editingVehicle} clients={state.clients} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingVehicle(null); }} />
      )}

      <div className="grid gap-3">
        {filtered.map(vehicle => (
          <div key={vehicle.id} className="bg-white rounded-xl border p-4 flex justify-between items-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedVehicle(vehicle)}>
            <div>
              <div className="font-semibold text-slate-800">{vehicle.make} {vehicle.model} <span className="text-slate-500">({vehicle.year})</span></div>
              <div className="text-sm text-slate-500">🔢 {vehicle.plateNumber} | 👤 {getClientName(vehicle.clientId)}</div>
              <div className="text-xs text-slate-400 mt-1">
                Ремонтов: {state.repairs.filter(r => r.vehicleId === vehicle.id).length} | 
                Создан: {new Date(vehicle.createdAt).toLocaleDateString('ru')}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={(e) => { e.stopPropagation(); setEditingVehicle(vehicle); setShowForm(true); }} className="text-blue-600 hover:text-blue-800">✏️</button>
              <button onClick={(e) => { e.stopPropagation(); handleDelete(vehicle.id); }} className="text-red-600 hover:text-red-800">🗑️</button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Автомобили не найдены</p>}
      </div>
    </div>
  );
}

function VehicleForm({ vehicle, clients, onSave, onCancel }: { vehicle: Vehicle | null; clients: { id: string; name: string }[]; onSave: (v: Partial<Vehicle>) => void; onCancel: () => void }) {
  const [clientId, setClientId] = useState(vehicle?.clientId || '');
  const [make, setMake] = useState(vehicle?.make || '');
  const [model, setModel] = useState(vehicle?.model || '');
  const [year, setYear] = useState(vehicle?.year || new Date().getFullYear());
  const [vin, setVin] = useState(vehicle?.vin || '');
  const [plateNumber, setPlateNumber] = useState(vehicle?.plateNumber || '');

  return (
    <div className="bg-white rounded-xl border p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">{vehicle ? 'Редактировать авто' : 'Новый автомобиль'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Клиент *</label>
          <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Выберите клиента</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Гос. номер *</label>
          <input value={plateNumber} onChange={e => setPlateNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Марка *</label>
          <input value={make} onChange={e => setMake(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Модель *</label>
          <input value={model} onChange={e => setModel(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Год выпуска</label>
          <input type="number" value={year} onChange={e => setYear(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">VIN</label>
          <input value={vin} onChange={e => setVin(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave({ clientId, make, model, year, vin, plateNumber })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
        <button onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Отмена</button>
      </div>
    </div>
  );
}
