import { useState } from 'react';
import { useAppContext, addAuditLog, addNotification } from '../store';
import { Repair, RepairPart, Note } from '../types';
import { v4 as uuidv4 } from 'uuid';
import NotesPanel from './NotesPanel';

interface Props {
  setPage: (page: string) => void;
  setSelectedRepairId: (id: string | null) => void;
}

export default function Repairs({ setPage, setSelectedRepairId }: Props) {
  const { state, setState } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null);
  const [selectedRepair, setSelectedRepair] = useState<Repair | null>(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');

  const getVehicleLabel = (vehicleId: string) => {
    const v = state.vehicles.find(v => v.id === vehicleId);
    if (!v) return '—';
    const client = state.clients.find(c => c.id === v.clientId);
    return `${v.make} ${v.model} (${v.plateNumber}) — ${client?.name || ''}`;
  };

  const filtered = state.repairs.filter(r => {
    const matchesStatus = !filterStatus || r.status === filterStatus;
    const matchesVehicle = !filterVehicle || r.vehicleId === filterVehicle;
    return matchesStatus && matchesVehicle;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSave = (repair: Partial<Repair>) => {
    if (editingRepair) {
      setState(prev => ({
        ...prev,
        repairs: prev.repairs.map(r => r.id === editingRepair.id ? { ...r, ...repair } as Repair : r),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'обновил', 'ремонт', editingRepair.id, repair.description || '')]
      }));
    } else {
      const newRepair: Repair = {
        id: uuidv4(),
        vehicleId: repair.vehicleId || '',
        clientId: repair.clientId || '',
        date: repair.date || new Date().toISOString().split('T')[0],
        mileage: repair.mileage || 0,
        description: repair.description || '',
        status: 'in_progress',
        parts: repair.parts || [],
        laborCost: repair.laborCost || 0,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.id || '',
        notes: [],
      };
      setState(prev => ({
        ...prev,
        repairs: [...prev.repairs, newRepair],
        auditLog: [...prev.auditLog, addAuditLog(prev, 'создал', 'ремонт', newRepair.id, newRepair.description)]
      }));
    }
    setShowForm(false);
    setEditingRepair(null);
  };

  const handleStatusChange = (repairId: string, status: Repair['status']) => {
    setState(prev => {
      const repair = prev.repairs.find(r => r.id === repairId);
      if (!repair) return prev;
      const updated = { ...repair, status, completedAt: status === 'completed' ? new Date().toISOString() : repair.completedAt };
      
      let newNotifications = [...prev.notifications];
      if (status === 'completed') {
        // Notify all users
        prev.users.forEach(u => {
          newNotifications.push(addNotification(prev, u.id, `Ремонт ${getVehicleLabel(repair.vehicleId)} завершён`, repairId, repair.vehicleId));
        });
      }
      
      return {
        ...prev,
        repairs: prev.repairs.map(r => r.id === repairId ? updated : r),
        notifications: newNotifications,
        auditLog: [...prev.auditLog, addAuditLog(prev, `изменил статус на "${status}"`, 'ремонт', repairId, '')]
      };
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить запись о ремонте?')) {
      setState(prev => ({
        ...prev,
        repairs: prev.repairs.filter(r => r.id !== id),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'удалил', 'ремонт', id, '')]
      }));
    }
  };

  const handleNotesUpdate = (repairId: string, notes: Note[]) => {
    setState(prev => ({
      ...prev,
      repairs: prev.repairs.map(r => r.id === repairId ? { ...r, notes } : r),
      auditLog: [...prev.auditLog, addAuditLog(prev, 'добавил заметку к', 'ремонту', repairId, '')]
    }));
  };

  const handlePrint = (repairId: string) => {
    setSelectedRepairId(repairId);
    setPage('print');
  };

  if (selectedRepair) {
    const repair = state.repairs.find(r => r.id === selectedRepair.id) || selectedRepair;
    const vehicle = state.vehicles.find(v => v.id === repair.vehicleId);
    const client = state.clients.find(c => c.id === repair.clientId);
    const allPartsDelivered = repair.parts.length > 0 && repair.parts.every(p => p.status === 'delivered' || p.status === 'used' || p.status === 'written_off');

    return (
      <div className="max-w-4xl mx-auto">
        <button onClick={() => setSelectedRepair(null)} className="mb-4 text-blue-600 hover:underline">← Назад к списку</button>
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Ремонт от {new Date(repair.date).toLocaleDateString('ru')}</h2>
              <p className="text-slate-500">{vehicle?.make} {vehicle?.model} ({vehicle?.plateNumber}) — {client?.name}</p>
              <p className="text-slate-500">Пробег: {repair.mileage.toLocaleString()} км</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <select value={repair.status} onChange={e => handleStatusChange(repair.id, e.target.value as Repair['status'])} className="border rounded-lg px-3 py-1.5 text-sm">
                <option value="in_progress">В работе</option>
                <option value="waiting_parts">Ожидание запчастей</option>
                <option value="completed">Завершён</option>
              </select>
              <button onClick={() => { setEditingRepair(repair); setShowForm(true); }} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Редактировать</button>
              <button onClick={() => handlePrint(repair.id)} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">🖨️ Накладная</button>
            </div>
          </div>

          {allPartsDelivered && repair.status === 'waiting_parts' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-700 font-medium">✅ Все запчасти доставлены! Можно начинать работу.</p>
            </div>
          )}

          <div className="mb-4">
            <h3 className="font-semibold text-slate-700 mb-1">Описание работ</h3>
            <p className="text-slate-600 bg-slate-50 rounded-lg p-3">{repair.description}</p>
          </div>

          {/* Parts */}
          <div className="mb-4">
            <h3 className="font-semibold text-slate-700 mb-2">Запчасти и расходники</h3>
            {repair.parts.length === 0 ? (
              <p className="text-slate-400 text-sm">Нет запчастей</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Наименование</th>
                    <th className="py-2">Кол-во</th>
                    <th className="py-2">Цена</th>
                    <th className="py-2">Статус</th>
                    <th className="py-2">Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {repair.parts.map(part => (
                    <tr key={part.id} className="border-b">
                      <td className="py-2">{part.name}</td>
                      <td className="py-2">{part.quantity}</td>
                      <td className="py-2">{part.price.toLocaleString()} ₽</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          part.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                          part.status === 'delivered' ? 'bg-green-100 text-green-700' :
                          part.status === 'used' ? 'bg-purple-100 text-purple-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {part.status === 'ordered' ? 'Заказано' : part.status === 'delivered' ? 'Доставлено' : part.status === 'used' ? 'Использовано' : 'Списано'}
                        </span>
                      </td>
                      <td className="py-2 font-medium">{(part.quantity * part.price).toLocaleString()} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-2 text-right font-semibold">
              Стоимость работ: {repair.laborCost.toLocaleString()} ₽ | 
              Запчасти: {repair.parts.reduce((sum, p) => sum + p.quantity * p.price, 0).toLocaleString()} ₽ | 
              Итого: {(repair.laborCost + repair.parts.reduce((sum, p) => sum + p.quantity * p.price, 0)).toLocaleString()} ₽
            </div>
          </div>

          {/* Notes */}
          <div className="mt-6">
            <NotesPanel notes={repair.notes} onUpdate={(notes) => handleNotesUpdate(repair.id, notes)} entityType="ремонту" />
          </div>

          <div className="mt-4 text-xs text-slate-400">
            Создан: {new Date(repair.createdAt).toLocaleString('ru')} | 
            Автор: {state.users.find(u => u.id === repair.createdBy)?.name || '—'}
            {repair.completedAt && ` | Завершён: ${new Date(repair.completedAt).toLocaleString('ru')}`}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Ремонты</h2>
        <button onClick={() => { setShowForm(true); setEditingRepair(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Новый ремонт
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все статусы</option>
          <option value="in_progress">В работе</option>
          <option value="waiting_parts">Ожидание запчастей</option>
          <option value="completed">Завершён</option>
        </select>
        <select value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все авто</option>
          {state.vehicles.map(v => <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber})</option>)}
        </select>
      </div>

      {showForm && (
        <RepairForm repair={editingRepair} vehicles={state.vehicles} clients={state.clients} inventory={state.inventory} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingRepair(null); }} state={state} setState={setState} />
      )}

      <div className="grid gap-3">
        {filtered.map(repair => {
          const allPartsDelivered = repair.parts.length > 0 && repair.parts.every(p => p.status === 'delivered' || p.status === 'used' || p.status === 'written_off');
          return (
            <div key={repair.id} className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedRepair(repair)}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-slate-800">{getVehicleLabel(repair.vehicleId)}</div>
                  <div className="text-sm text-slate-500">📅 {new Date(repair.date).toLocaleDateString('ru')} | Пробег: {repair.mileage.toLocaleString()} км</div>
                  <div className="text-sm text-slate-600 mt-1 line-clamp-2">{repair.description}</div>
                  {allPartsDelivered && repair.status === 'waiting_parts' && (
                    <div className="text-xs text-green-600 font-medium mt-1">✅ Все запчасти доставлены!</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    repair.status === 'completed' ? 'bg-green-100 text-green-700' :
                    repair.status === 'waiting_parts' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {repair.status === 'completed' ? 'Завершён' : repair.status === 'waiting_parts' ? 'Ожидание' : 'В работе'}
                  </span>
                  <span className="text-xs text-slate-400">{state.users.find(u => u.id === repair.createdBy)?.name}</span>
                  <div className="flex gap-1 mt-1">
                    <button onClick={(e) => { e.stopPropagation(); handlePrint(repair.id); }} className="text-green-600 hover:text-green-800 text-xs">🖨️</button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(repair.id); }} className="text-red-600 hover:text-red-800 text-xs">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Ремонты не найдены</p>}
      </div>
    </div>
  );
}

function RepairForm({ repair, vehicles, clients, inventory, onSave, onCancel, state, setState }: any) {
  const vehicle = repair ? vehicles.find((v: any) => v.id === repair.vehicleId) : null;
  const [vehicleId, setVehicleId] = useState(repair?.vehicleId || '');
  const [date, setDate] = useState(repair?.date || new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState(repair?.mileage || 0);
  const [description, setDescription] = useState(repair?.description || '');
  const [laborCost, setLaborCost] = useState(repair?.laborCost || 0);
  const [parts, setParts] = useState<RepairPart[]>(repair?.parts || []);
  const [showAddPart, setShowAddPart] = useState(false);
  const [partSearch, setPartSearch] = useState('');
  const [customPart, setCustomPart] = useState({ name: '', quantity: 1, price: 0 });

  const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);
  const clientId = selectedVehicle?.clientId || '';

  const filteredInventory = inventory.filter((item: any) =>
    item.name.toLowerCase().includes(partSearch.toLowerCase()) ||
    item.partNumber.toLowerCase().includes(partSearch.toLowerCase())
  );

  const addPartFromInventory = (item: any) => {
    const newPart: RepairPart = {
      id: uuidv4(),
      inventoryItemId: item.id,
      name: item.name,
      quantity: 1,
      price: item.price,
      status: 'ordered',
      orderedAt: new Date().toISOString(),
    };
    setParts([...parts, newPart]);
    setShowAddPart(false);
    setPartSearch('');
  };

  const addCustomPart = () => {
    if (!customPart.name) return;
    const newPart: RepairPart = {
      id: uuidv4(),
      inventoryItemId: '',
      name: customPart.name,
      quantity: customPart.quantity,
      price: customPart.price,
      status: 'ordered',
      orderedAt: new Date().toISOString(),
    };
    setParts([...parts, newPart]);
    setCustomPart({ name: '', quantity: 1, price: 0 });
  };

  const updatePartStatus = (partId: string, status: RepairPart['status']) => {
    setParts(parts.map(p => {
      if (p.id !== partId) return p;
      const updated = { ...p, status };
      if (status === 'delivered') updated.deliveredAt = new Date().toISOString();
      if (status === 'used') {
        updated.usedAt = new Date().toISOString();
        // Decrease inventory
        if (p.inventoryItemId) {
          setState((prev: any) => ({
            ...prev,
            inventory: prev.inventory.map((item: any) => 
              item.id === p.inventoryItemId ? { ...item, quantity: Math.max(0, item.quantity - p.quantity) } : item
            ),
            auditLog: [...prev.auditLog, addAuditLog(prev, 'использовал', 'запчасть', p.inventoryItemId, `${p.name} x${p.quantity}`)]
          }));
        }
      }
      if (status === 'written_off') {
        // Write off even without inventory tracking
        if (p.inventoryItemId) {
          setState((prev: any) => ({
            ...prev,
            inventory: prev.inventory.map((item: any) => 
              item.id === p.inventoryItemId ? { ...item, quantity: Math.max(0, item.quantity - p.quantity) } : item
            ),
            auditLog: [...prev.auditLog, addAuditLog(prev, 'списал', 'запчасть', p.inventoryItemId, `${p.name} x${p.quantity} (внe учета)`)]
          }));
        } else {
          setState((prev: any) => ({
            ...prev,
            auditLog: [...prev.auditLog, addAuditLog(prev, 'списал без учета', 'запчасть', partId, `${p.name} x${p.quantity}`)]
          }));
        }
      }
      return updated;
    }));
  };

  const removePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  return (
    <div className="bg-white rounded-xl border p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">{repair ? 'Редактировать ремонт' : 'Новый ремонт'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-sm text-slate-600">Автомобиль *</label>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} className="w-full border rounded-lg px-3 py-2">
            <option value="">Выберите авто</option>
            {vehicles.map((v: any) => {
              const client = clients.find((c: any) => c.id === v.clientId);
              return <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plateNumber}) — {client?.name}</option>;
            })}
          </select>
        </div>
        <div>
          <label className="text-sm text-slate-600">Дата *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Пробег (км)</label>
          <input type="number" value={mileage} onChange={e => setMileage(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Стоимость работ (₽)</label>
          <input type="number" value={laborCost} onChange={e => setLaborCost(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="mb-4">
        <label className="text-sm text-slate-600">Описание работ *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border rounded-lg px-3 py-2" />
      </div>

      {/* Parts section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-medium text-slate-700">Запчасти и расходники</h4>
          <div className="flex gap-2">
            <button onClick={() => setShowAddPart(!showAddPart)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200">+ Из склада</button>
            <button onClick={addCustomPart} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200">+ Без учета</button>
          </div>
        </div>

        {showAddPart && (
          <div className="bg-slate-50 rounded-lg p-3 mb-3">
            <input value={partSearch} onChange={e => setPartSearch(e.target.value)} placeholder="Поиск по названию или артикулу..." className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
            <div className="max-h-40 overflow-auto">
              {filteredInventory.map((item: any) => (
                <button key={item.id} onClick={() => addPartFromInventory(item)} className="w-full text-left p-2 hover:bg-blue-50 rounded text-sm flex justify-between">
                  <span>{item.name} ({item.partNumber})</span>
                  <span className="text-slate-500">Остаток: {item.quantity} | {item.price} ₽</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom part input */}
        <div className="bg-purple-50 rounded-lg p-3 mb-3 flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs text-slate-500">Название</label>
            <input value={customPart.name} onChange={e => setCustomPart({...customPart, name: e.target.value})} placeholder="Название запчасти" className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div className="w-20">
            <label className="text-xs text-slate-500">Кол-во</label>
            <input type="number" value={customPart.quantity} onChange={e => setCustomPart({...customPart, quantity: Number(e.target.value)})} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
          <div className="w-28">
            <label className="text-xs text-slate-500">Цена ₽</label>
            <input type="number" value={customPart.price} onChange={e => setCustomPart({...customPart, price: Number(e.target.value)})} className="w-full border rounded px-2 py-1 text-sm" />
          </div>
        </div>

        {parts.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-1">Наименование</th>
                <th className="py-1">Кол-во</th>
                <th className="py-1">Цена</th>
                <th className="py-1">Статус</th>
                <th className="py-1"></th>
              </tr>
            </thead>
            <tbody>
              {parts.map(part => (
                <tr key={part.id} className="border-b">
                  <td className="py-1">{part.name}</td>
                  <td className="py-1">{part.quantity}</td>
                  <td className="py-1">{part.price} ₽</td>
                  <td className="py-1">
                    <select value={part.status} onChange={e => updatePartStatus(part.id, e.target.value as RepairPart['status'])} className="border rounded px-2 py-0.5 text-xs">
                      <option value="ordered">Заказано</option>
                      <option value="delivered">Доставлено</option>
                      <option value="used">Использовано</option>
                      <option value="written_off">Списано</option>
                    </select>
                  </td>
                  <td className="py-1">
                    <button onClick={() => removePart(part.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-2">
        <button onClick={() => onSave({ vehicleId, clientId, date, mileage, description, laborCost, parts })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
        <button onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Отмена</button>
      </div>
    </div>
  );
}
