import { createContext, useContext } from 'react';
import { Client, Vehicle, Repair, InventoryItem, Notification, AuditLog, User } from './types';
import { v4 as uuidv4 } from 'uuid';

export interface AppState {
  users: User[];
  currentUser: User | null;
  clients: Client[];
  vehicles: Vehicle[];
  repairs: Repair[];
  inventory: InventoryItem[];
  notifications: Notification[];
  auditLog: AuditLog[];
}

const defaultUsers: User[] = [
  { id: '1', name: 'Иванов А.С.', role: 'mechanic' },
  { id: '2', name: 'Петров В.И.', role: 'mechanic' },
  { id: '3', name: 'Сидоров К.М.', role: 'admin' },
];

const demoState: Partial<AppState> = {
  clients: [
    {
      id: 'c1',
      name: 'Козлов Дмитрий Андреевич',
      phone: '+7 (916) 123-45-67',
      email: 'kozlov@mail.ru',
      address: 'г. Москва, ул. Ленина 15, кв. 42',
      createdAt: '2024-11-01T10:00:00.000Z',
      createdBy: '3',
      notes: [
        { id: 'n1', text: 'Клиент предпочитает оригинальные запчасти. Не торопит.', createdAt: '2024-11-01T10:00:00.000Z', createdBy: '1', createdByName: 'Иванов А.С.' }
      ],
    },
    {
      id: 'c2',
      name: 'Смирнова Елена Викторовна',
      phone: '+7 (925) 987-65-43',
      email: '',
      address: 'г. Москва, ул. Пушкина 8',
      createdAt: '2024-12-15T14:00:00.000Z',
      createdBy: '2',
      notes: [],
    },
    {
      id: 'c3',
      name: 'Новиков Сергей Петрович',
      phone: '+7 (903) 555-12-34',
      email: 'novikov.s@gmail.com',
      address: '',
      createdAt: '2025-01-10T09:00:00.000Z',
      createdBy: '1',
      notes: [
        { id: 'n2', text: 'Всегда приезжает без записи. Брать в порядке живой очереди.', createdAt: '2025-01-10T09:30:00.000Z', createdBy: '2', createdByName: 'Петров В.И.' }
      ],
    },
  ],
  vehicles: [
    { id: 'v1', clientId: 'c1', make: 'Toyota', model: 'Camry', year: 2019, vin: 'JTNBE46KX03012345', plateNumber: 'А123БВ 77', createdAt: '2024-11-01T10:00:00.000Z', createdBy: '3', notes: [] },
    { id: 'v2', clientId: 'c2', make: 'Kia', model: 'Rio', year: 2021, vin: 'Z94CB41ABMR123456', plateNumber: 'Е456ГД 77', createdAt: '2024-12-15T14:00:00.000Z', createdBy: '2', notes: [] },
    { id: 'v3', clientId: 'c3', make: 'Hyundai', model: 'Solaris', year: 2020, vin: 'Z94C241ABLR123456', plateNumber: 'К789МН 50', createdAt: '2025-01-10T09:00:00.000Z', createdBy: '1', notes: [] },
  ],
  repairs: [
    {
      id: 'r1',
      vehicleId: 'v1',
      clientId: 'c1',
      date: '2025-01-15',
      mileage: 85000,
      description: 'Замена масла и масляного фильтра. Замена воздушного фильтра. Диагностика ходовой части.',
      status: 'completed',
      parts: [
        { id: 'rp1', inventoryItemId: 'inv1', name: 'Масло моторное 5W-30 (4л)', quantity: 1, price: 3200, status: 'used', orderedAt: '2025-01-14T10:00:00.000Z', deliveredAt: '2025-01-14T16:00:00.000Z', usedAt: '2025-01-15T09:00:00.000Z' },
        { id: 'rp2', inventoryItemId: 'inv2', name: 'Фильтр масляный Toyota', quantity: 1, price: 650, status: 'used', orderedAt: '2025-01-14T10:00:00.000Z', deliveredAt: '2025-01-14T16:00:00.000Z', usedAt: '2025-01-15T09:00:00.000Z' },
        { id: 'rp3', inventoryItemId: 'inv3', name: 'Фильтр воздушный', quantity: 1, price: 800, status: 'used', orderedAt: '2025-01-14T10:00:00.000Z', deliveredAt: '2025-01-14T16:00:00.000Z', usedAt: '2025-01-15T09:00:00.000Z' },
      ],
      laborCost: 2500,
      createdAt: '2025-01-14T09:00:00.000Z',
      createdBy: '1',
      completedAt: '2025-01-15T14:00:00.000Z',
      notes: [
        { id: 'rn1', text: 'Подклинивает правый передний суппорт. Рекомендовать замену на следующем ТО.', createdAt: '2025-01-15T11:00:00.000Z', createdBy: '1', createdByName: 'Иванов А.С.' }
      ],
    },
    {
      id: 'r2',
      vehicleId: 'v2',
      clientId: 'c2',
      date: '2025-02-20',
      mileage: 42000,
      description: 'Замена тормозных колодок передних. Проточка тормозных дисков.',
      status: 'waiting_parts',
      parts: [
        { id: 'rp4', inventoryItemId: 'inv4', name: 'Колодки тормозные передние Kia Rio', quantity: 1, price: 2800, status: 'ordered', orderedAt: '2025-02-19T10:00:00.000Z' },
        { id: 'rp5', inventoryItemId: '', name: 'Смазка для суппортов', quantity: 1, price: 350, status: 'delivered', orderedAt: '2025-02-19T10:00:00.000Z', deliveredAt: '2025-02-20T08:00:00.000Z' },
      ],
      laborCost: 3000,
      createdAt: '2025-02-19T09:00:00.000Z',
      createdBy: '2',
      notes: [],
    },
    {
      id: 'r3',
      vehicleId: 'v3',
      clientId: 'c3',
      date: '2025-03-01',
      mileage: 67000,
      description: 'Замена ремня ГРМ, роликов и помпы. Замена антифриза.',
      status: 'in_progress',
      parts: [
        { id: 'rp6', inventoryItemId: 'inv5', name: 'Ремень ГРМ Hyundai Solaris', quantity: 1, price: 2100, status: 'delivered', orderedAt: '2025-02-28T10:00:00.000Z', deliveredAt: '2025-03-01T07:00:00.000Z' },
        { id: 'rp7', inventoryItemId: 'inv6', name: 'Ролик натяжной ГРМ', quantity: 1, price: 1500, status: 'delivered', orderedAt: '2025-02-28T10:00:00.000Z', deliveredAt: '2025-03-01T07:00:00.000Z' },
        { id: 'rp8', inventoryItemId: 'inv7', name: 'Помпа водяная', quantity: 1, price: 3500, status: 'delivered', orderedAt: '2025-02-28T10:00:00.000Z', deliveredAt: '2025-03-01T07:00:00.000Z' },
        { id: 'rp9', inventoryItemId: 'inv8', name: 'Антифриз G12 (5л)', quantity: 1, price: 1800, status: 'used', orderedAt: '2025-02-28T10:00:00.000Z', deliveredAt: '2025-03-01T07:00:00.000Z', usedAt: '2025-03-01T10:00:00.000Z' },
      ],
      laborCost: 6000,
      createdAt: '2025-02-28T09:00:00.000Z',
      createdBy: '1',
      notes: [
        { id: 'rn2', text: 'Клиент просит позвонить когда будет готово. Тел: +7 (903) 555-12-34', createdAt: '2025-03-01T08:00:00.000Z', createdBy: '2', createdByName: 'Петров В.И.' }
      ],
    },
  ],
  inventory: [
    { id: 'inv1', name: 'Масло моторное 5W-30 (4л)', category: 'Масла', partNumber: 'OIL-5W30-4L', quantity: 5, minQuantity: 3, price: 3200, supplier: 'АвтоМасла ООО', orderedQuantity: 0, createdAt: '2024-10-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-01-15T09:00:00.000Z', updatedBy: '1' },
    { id: 'inv2', name: 'Фильтр масляный Toyota', category: 'Фильтры', partNumber: '90915-YZZE1', quantity: 8, minQuantity: 5, price: 650, supplier: 'Тойота Центр', orderedQuantity: 0, createdAt: '2024-10-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-01-15T09:00:00.000Z', updatedBy: '1' },
    { id: 'inv3', name: 'Фильтр воздушный', category: 'Фильтры', partNumber: 'AF-UNIV-01', quantity: 2, minQuantity: 5, price: 800, supplier: 'Фильтр-Сервис', orderedQuantity: 10, createdAt: '2024-10-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-01-15T09:00:00.000Z', updatedBy: '1' },
    { id: 'inv4', name: 'Колодки тормозные передние Kia Rio', category: 'Тормоза', partNumber: '58101-D4110', quantity: 0, minQuantity: 2, price: 2800, supplier: 'Kia Parts', orderedQuantity: 2, createdAt: '2024-11-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-02-19T10:00:00.000Z', updatedBy: '2' },
    { id: 'inv5', name: 'Ремень ГРМ Hyundai Solaris', category: 'ГРМ', partNumber: '24312-25001', quantity: 3, minQuantity: 2, price: 2100, supplier: 'Hyundai Mobis', orderedQuantity: 0, createdAt: '2024-11-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-03-01T07:00:00.000Z', updatedBy: '1' },
    { id: 'inv6', name: 'Ролик натяжной ГРМ', category: 'ГРМ', partNumber: '24316-25030', quantity: 4, minQuantity: 2, price: 1500, supplier: 'Hyundai Mobis', orderedQuantity: 0, createdAt: '2024-11-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-03-01T07:00:00.000Z', updatedBy: '1' },
    { id: 'inv7', name: 'Помпа водяная', category: 'Охлаждение', partNumber: '25100-25001', quantity: 2, minQuantity: 1, price: 3500, supplier: 'Hyundai Mobis', orderedQuantity: 0, createdAt: '2024-11-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-03-01T07:00:00.000Z', updatedBy: '1' },
    { id: 'inv8', name: 'Антифриз G12 (5л)', category: 'Жидкости', partNumber: 'ANT-G12-5L', quantity: 6, minQuantity: 3, price: 1800, supplier: 'АвтоХим', orderedQuantity: 0, createdAt: '2024-10-01T10:00:00.000Z', createdBy: '3', updatedAt: '2025-03-01T10:00:00.000Z', updatedBy: '1' },
  ],
  notifications: [],
  auditLog: [],
};

const initialState: AppState = {
  users: defaultUsers,
  currentUser: null,
  clients: [],
  vehicles: [],
  repairs: [],
  inventory: [],
  notifications: [],
  auditLog: [],
};

export function loadState(): AppState {
  try {
    const saved = localStorage.getItem('autoservice_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...initialState, ...parsed, users: defaultUsers };
    }
  } catch (e) {
    console.error('Failed to load state', e);
  }
  // Return demo data on first launch
  return { ...initialState, ...demoState } as AppState;
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem('autoservice_state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state', e);
  }
}

export function addAuditLog(state: AppState, action: string, entity: string, entityId: string, details: string): AuditLog {
  return {
    id: uuidv4(),
    userId: state.currentUser?.id || '',
    userName: state.currentUser?.name || 'Неизвестно',
    action,
    entity,
    entityId,
    timestamp: new Date().toISOString(),
    details,
  };
}

export function addNotification(state: AppState, userId: string, message: string, repairId?: string, vehicleId?: string): Notification {
  return {
    id: uuidv4(),
    userId,
    message,
    repairId,
    vehicleId,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export interface AppContextType {
  state: AppState;
  setState: (updater: (prev: AppState) => AppState) => void;
}

export const AppContext = createContext<AppContextType>({
  state: initialState,
  setState: () => {},
});

export function useAppContext() {
  return useContext(AppContext);
}
