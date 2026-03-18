export interface DashboardStats {
  materials: number;
  tools: number;
  keys: number;
  users: number;
  maxUsers: number;
  lowStockCount: number;
  expiringCount: number;
  overdueToolsCount: number;
}

export interface ScanResult {
  type: "material" | "tool" | "key" | null;
  item: Record<string, unknown> | null;
}

export interface Commission {
  id: string;
  name: string;
  number: number | null;
  manualNumber: string | null;
  status: string;
  notes: string | null;
  targetLocationId: string | null;
  targetLocationName: string | null;
  customerId: string | null;
  customerName: string | null;
  responsibleId: string | null;
  responsibleName: string | null;
  entryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionEntry {
  id: string;
  commissionId: string;
  materialId: string | null;
  materialName: string | null;
  materialNumber: string | null;
  materialUnit: string | null;
  toolId: string | null;
  toolName: string | null;
  toolNumber: string | null;
  quantity: number;
  pickedQuantity: number;
  status: string;
  notes: string | null;
  createdAt: string;
}
