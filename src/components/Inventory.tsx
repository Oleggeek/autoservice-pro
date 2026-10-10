import { useState } from 'react';
import { useAppContext, addAuditLog } from '../store';
import { InventoryItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function Inventory() {
  const { state, setState } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showDelivery, setShowDelivery] = useState<string | null>(null);
  const [deliveryQty, setDeliveryQty] = useState(1);

  const categories = [...new Set(state.inventory.map(i => i.category))];

  const filtered = state.inventory.filter(item => {
    const matchesSearch = `${item.name} ${item.partNumber}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSave = (item: Partial<InventoryItem>) => {
    if (editingItem) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.id === editingItem.id ? { 
          ...i, ...item, updatedAt: new Date().toISOString(), updatedBy: prev.currentUser?.id || '' 
        } as InventoryItem : i),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'обновил', 'позицию склада', editingItem.id, item.name || '')]
      }));
    } else {
      const newItem: InventoryItem = {
        id: uuidv4(),
        name: item.name || '',
        category: item.category || '',
        partNumber: item.partNumber || '',
        quantity: item.quantity || 0,
        minQuantity: item.minQuantity || 0,
        price: item.price || 0,
        supplier: item.supplier || '',
        orderedQuantity: 0,
        createdAt: new Date().toISOString(),
        createdBy: state.currentUser?.id || '',
        updatedAt: new Date().toISOString(),
        updatedBy: state.currentUser?.id || '',
      };
      setState(prev => ({
        ...prev,
        inventory: [...prev.inventory, newItem],
        auditLog: [...prev.auditLog, addAuditLog(prev, 'создал', 'позицию склада', newItem.id, newItem.name)]
      }));
    }
    setShowForm(false);
    setEditingItem(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить позицию?')) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== id),
        auditLog: [...prev.auditLog, addAuditLog(prev, 'удалил', 'позицию склада', id, '')]
      }));
    }
  };

  const handleOrder = (id: string, qty: number) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === id ? { ...i, orderedQuantity: i.orderedQuantity + qty } : i),
      auditLog: [...prev.auditLog, addAuditLog(prev, `заказал ${qty} шт.`, 'позицию склада', id, '')]
    }));
  };

  const handleReceive = (id: string, qty: number) => {
    setState(prev => ({
      ...prev,
      inventory: prev.inventory.map(i => i.id === id ? { 
        ...i, 
        quantity: i.quantity + qty, 
        orderedQuantity: Math.max(0, i.orderedQuantity - qty),
        updatedAt: new Date().toISOString(),
        updatedBy: prev.currentUser?.id || ''
      } : i),
      auditLog: [...prev.auditLog, addAuditLog(prev, `принял ${qty} шт.`, 'позицию склада', id, '')]
    }));
    setShowDelivery(null);
    setDeliveryQty(1);
  };

  const handleWriteOff = (id: string, qty: number) => {
    if (confirm(`Списать ${qty} шт. без проведения через ремонт?`)) {
      setState(prev => ({
        ...prev,
        inventory: prev.inventory.map(i => i.id === id ? { 
          ...i, 
          quantity: Math.max(0, i.quantity - qty),
          updatedAt: new Date().toISOString(),
          updatedBy: prev.currentUser?.id || ''
        } : i),
        auditLog: [...prev.auditLog, addAuditLog(prev, `списал ${qty} шт. (без ремонта)`, 'позицию склада', id, '')]
      }));
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Склад запчастей</h2>
        <button onClick={() => { setShowForm(true); setEditingItem(null); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          + Добавить позицию
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <input type="text" placeholder="Поиск по названию или артикулу..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все категории</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showForm && (
        <InventoryForm item={editingItem} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingItem(null); }} />
      )}

      {/* Delivery Modal */}
      {showDelivery && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
          <h4 className="font-medium text-green-800 mb-2">Приёмка товара</h4>
          <p className="text-sm text-green-700 mb-2">
            {state.inventory.find(i => i.id === showDelivery)?.name} | Заказано: {state.inventory.find(i => i.id === showDelivery)?.orderedQuantity} шт.
          </p>
          <div className="flex gap-2 items-center">
            <input type="number" min={1} value={deliveryQty} onChange={e => setDeliveryQty(Number(e.target.value))} className="border rounded-lg px-3 py-2 w-24" />
            <span className="text-sm text-slate-600">шт.</span>
            <button onClick={() => handleReceive(showDelivery, deliveryQty)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Принять</button>
            <button onClick={() => setShowDelivery(null)} className="bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm">Отмена</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-white rounded-xl border">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left py-3 px-4">Наименование</th>
              <th className="text-left py-3 px-4">Артикул</th>
              <th className="text-left py-3 px-4">Категория</th>
              <th className="text-center py-3 px-4">Остаток</th>
              <th className="text-center py-3 px-4">Заказано</th>
              <th className="text-center py-3 px-4">Мин.</th>
              <th className="text-right py-3 px-4">Цена</th>
              <th className="text-left py-3 px-4">Поставщик</th>
              <th className="text-center py-3 px-4">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <tr key={item.id} className={`border-b hover:bg-slate-50 ${item.quantity <= item.minQuantity ? 'bg-red-50' : ''}`}>
                <td className="py-2 px-4 font-medium">{item.name}</td>
                <td className="py-2 px-4 text-slate-500 font-mono text-xs">{item.partNumber}</td>
                <td className="py-2 px-4 text-slate-500">{item.category}</td>
                <td className={`py-2 px-4 text-center font-bold ${item.quantity <= item.minQuantity ? 'text-red-600' : 'text-green-600'}`}>{item.quantity}</td>
                <td className="py-2 px-4 text-center text-blue-600">{item.orderedQuantity > 0 ? item.orderedQuantity : '—'}</td>
                <td className="py-2 px-4 text-center text-slate-400">{item.minQuantity}</td>
                <td className="py-2 px-4 text-right">{item.price.toLocaleString()} ₽</td>
                <td className="py-2 px-4 text-slate-500">{item.supplier}</td>
                <td className="py-2 px-4 text-center">
                  <div className="flex gap-1 justify-center flex-wrap">
                    <button onClick={() => { setEditingItem(item); setShowForm(true); }} className="text-blue-600 hover:text-blue-800 text-xs px-1" title="Редактировать">✏️</button>
                    <button onClick={() => handleOrder(item.id, 1)} className="text-blue-600 hover:text-blue-800 text-xs px-1" title="Заказать">📦</button>
                    {item.orderedQuantity > 0 && (
                      <button onClick={() => { setShowDelivery(item.id); setDeliveryQty(1); }} className="text-green-600 hover:text-green-800 text-xs px-1" title="Принять">📥</button>
                    )}
                    <button onClick={() => handleWriteOff(item.id, 1)} className="text-orange-600 hover:text-orange-800 text-xs px-1" title="Списать">📤</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800 text-xs px-1" title="Удалить">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Позиции не найдены</p>}
    </div>
  );
}

function InventoryForm({ item, onSave, onCancel }: { item: InventoryItem | null; onSave: (i: Partial<InventoryItem>) => void; onCancel: () => void }) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [partNumber, setPartNumber] = useState(item?.partNumber || '');
  const [quantity, setQuantity] = useState(item?.quantity || 0);
  const [minQuantity, setMinQuantity] = useState(item?.minQuantity || 0);
  const [price, setPrice] = useState(item?.price || 0);
  const [supplier, setSupplier] = useState(item?.supplier || '');

  return (
    <div className="bg-white rounded-xl border p-6 mb-4">
      <h3 className="font-semibold text-lg mb-4">{item ? 'Редактировать позицию' : 'Новая позиция'}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-slate-600">Наименование *</label>
          <input value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Артикул</label>
          <input value={partNumber} onChange={e => setPartNumber(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Категория</label>
          <input value={category} onChange={e => setCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder="Масла, Фильтры, Тормоза..." />
        </div>
        <div>
          <label className="text-sm text-slate-600">Остаток на складе</label>
          <input type="number" value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Минимальный остаток</label>
          <input type="number" value={minQuantity} onChange={e => setMinQuantity(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Цена (₽)</label>
          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full border rounded-lg px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Поставщик</label>
          <input value={supplier} onChange={e => setSupplier(e.target.value)} className="w-full border rounded-lg px-3 py-2" />
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={() => onSave({ name, category, partNumber, quantity, minQuantity, price, supplier })} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Сохранить</button>
        <button onClick={onCancel} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300">Отмена</button>
      </div>
    </div>
  );
}
