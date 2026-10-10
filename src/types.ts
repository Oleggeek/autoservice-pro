export interface User {
  id: string;
  name: string;
  role: 'mechanic' | 'admin';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  createdBy: string;
  notes: Note[];
}

export interface Vehicle {
  id: string;
  clientId: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  plateNumber: string;
  createdAt: string;
  createdBy: string;
  notes: Note[];
}

export interface Repair {
  id: string;
  vehicleId: string;
  clientId: string;
  date: string;
  mileage: number;
  description: string;
  status: 'in_progress' | 'waiting_parts' | 'completed';
  parts: RepairPart[];
  laborCost: number;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  notes: Note[];
}

export interface RepairPart {
  id: string;
  inventoryItemId: string;
  name: string;
  quantity: number;
  price: number;
  status: 'ordered' | 'delivered' | 'used' | 'written_off';
  orderedAt?: string;
  deliveredAt?: string;
  usedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  partNumber: string;
  quantity: number;
  minQuantity: number;
  price: number;
  supplier: string;
  orderedQuantity: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  repairId?: string;
  vehicleId?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  details: string;
}
