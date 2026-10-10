import { useAppContext } from '../store';

interface Props {
  repairId: string | null;
  setPage: (page: string) => void;
}

export default function PrintInvoice({ repairId, setPage }: Props) {
  const { state } = useAppContext();
  const repair = state.repairs.find(r => r.id === repairId);

  if (!repair) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-slate-500">Ремонт не найден</p>
        <button onClick={() => setPage('repairs')} className="mt-4 text-blue-600 hover:underline">← Назад к ремонтам</button>
      </div>
    );
  }

  const vehicle = state.vehicles.find(v => v.id === repair.vehicleId);
  const client = state.clients.find(c => c.id === repair.clientId);
  const partsTotal = repair.parts.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const totalCost = repair.laborCost + partsTotal;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print flex gap-3 mb-4">
        <button onClick={() => setPage('repairs')} className="text-blue-600 hover:underline">← Назад к ремонтам</button>
        <button onClick={handlePrint} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">🖨️ Печать</button>
      </div>

      <div className="print-area bg-white border-2 border-slate-300 rounded-xl p-8" id="printable-invoice">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold">АВТОСЕРВИС</h1>
          <p className="text-sm text-slate-600">Памятка-накладная для клиента</p>
          <p className="text-xs text-slate-500 mt-1">№ {repair.id.slice(0, 8).toUpperCase()} от {new Date(repair.date).toLocaleDateString('ru')}</p>
        </div>

        {/* Client Info */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-bold text-sm mb-1">КЛИЕНТ:</h3>
            <p className="text-sm">{client?.name || '—'}</p>
            <p className="text-sm text-slate-600">Тел: {client?.phone || '—'}</p>
            {client?.email && <p className="text-sm text-slate-600">Email: {client.email}</p>}
          </div>
          <div>
            <h3 className="font-bold text-sm mb-1">АВТОМОБИЛЬ:</h3>
            <p className="text-sm">{vehicle?.make} {vehicle?.model} ({vehicle?.year})</p>
            <p className="text-sm text-slate-600">Гос. номер: {vehicle?.plateNumber || '—'}</p>
            <p className="text-sm text-slate-600">VIN: {vehicle?.vin || '—'}</p>
          </div>
        </div>

        {/* Repair Details */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2">ВЫПОЛНЕННЫЕ РАБОТЫ:</h3>
          <p className="text-sm bg-slate-50 p-3 rounded">{repair.description}</p>
          <div className="mt-2 text-sm">
            <span className="font-medium">Дата:</span> {new Date(repair.date).toLocaleDateString('ru')} | 
            <span className="font-medium ml-2">Пробег:</span> {repair.mileage.toLocaleString()} км
          </div>
        </div>

        {/* Parts Table */}
        {repair.parts.length > 0 && (
          <div className="mb-6">
            <h3 className="font-bold text-sm mb-2">ИСПОЛЬЗОВАННЫЕ ЗАПЧАСТИ И РАСХОДНИКИ:</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2">№</th>
                  <th className="text-left py-2">Наименование</th>
                  <th className="text-center py-2">Кол-во</th>
                  <th className="text-right py-2">Цена</th>
                  <th className="text-right py-2">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {repair.parts.map((part, idx) => (
                  <tr key={part.id} className="border-b">
                    <td className="py-1.5">{idx + 1}</td>
                    <td className="py-1.5">{part.name}</td>
                    <td className="py-1.5 text-center">{part.quantity}</td>
                    <td className="py-1.5 text-right">{part.price.toLocaleString()} ₽</td>
                    <td className="py-1.5 text-right font-medium">{(part.quantity * part.price).toLocaleString()} ₽</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Cost Summary */}
        <div className="border-t-2 border-slate-300 pt-4 mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Стоимость работ:</span>
            <span className="font-medium">{repair.laborCost.toLocaleString()} ₽</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span>Стоимость запчастей:</span>
            <span className="font-medium">{partsTotal.toLocaleString()} ₽</span>
          </div>
          <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t">
            <span>ИТОГО К ОПЛАТЕ:</span>
            <span>{totalCost.toLocaleString()} ₽</span>
          </div>
        </div>

        {/* Recommendations */}
        <div className="mb-6">
          <h3 className="font-bold text-sm mb-2">РЕКОМЕНДАЦИИ:</h3>
          <div className="text-sm text-slate-600 bg-yellow-50 border border-yellow-200 rounded p-3">
            <p>• Следующее ТО рекомендуется через 10 000 км или через 6 месяцев</p>
            <p>• При появлении посторонних шумов или вибраций обратитесь в сервис</p>
            <p>• Используйте рекомендованные расходные материалы</p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-slate-800 pt-4 mt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <p className="text-xs text-slate-500 mb-8">Механик:</p>
              <div className="border-b border-slate-400 w-48"></div>
              <p className="text-xs text-slate-500 mt-1">
                {state.users.find(u => u.id === repair.createdBy)?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-8">Клиент принял работу:</p>
              <div className="border-b border-slate-400 w-48"></div>
              <p className="text-xs text-slate-500 mt-1">{client?.name || '—'}</p>
            </div>
          </div>
          <div className="text-center text-xs text-slate-400 mt-6">
            <p>Гарантия на выполненные работы — 30 дней или 2000 км пробега</p>
            <p>Дата печати: {new Date().toLocaleDateString('ru')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
