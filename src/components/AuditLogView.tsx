import { useState } from 'react';
import { useAppContext } from '../store';

export default function AuditLogView() {
  const { state } = useAppContext();
  const [filterUser, setFilterUser] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const filtered = state.auditLog.filter(log => {
    const matchesUser = !filterUser || log.userId === filterUser;
    const matchesEntity = !filterEntity || log.entity.includes(filterEntity);
    return matchesUser && matchesEntity;
  }).reverse();

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Журнал действий</h2>

      <div className="flex gap-3 mb-4">
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все пользователи</option>
          {state.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} className="border rounded-lg px-4 py-2">
          <option value="">Все объекты</option>
          <option value="клиент">Клиенты</option>
          <option value="автомобиль">Автомобили</option>
          <option value="ремонт">Ремонты</option>
          <option value="склад">Склад</option>
          <option value="запчасть">Запчасти</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="text-left py-3 px-4">Дата/Время</th>
              <th className="text-left py-3 px-4">Пользователь</th>
              <th className="text-left py-3 px-4">Действие</th>
              <th className="text-left py-3 px-4">Объект</th>
              <th className="text-left py-3 px-4">Детали</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => (
              <tr key={log.id} className="border-b hover:bg-slate-50">
                <td className="py-2 px-4 text-slate-500 text-xs whitespace-nowrap">{new Date(log.timestamp).toLocaleString('ru')}</td>
                <td className="py-2 px-4 font-medium text-blue-700">{log.userName}</td>
                <td className="py-2 px-4">{log.action}</td>
                <td className="py-2 px-4 text-slate-600">{log.entity}</td>
                <td className="py-2 px-4 text-slate-500 text-xs">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-slate-400 text-center py-8">Нет записей</p>}
      </div>
    </div>
  );
}
