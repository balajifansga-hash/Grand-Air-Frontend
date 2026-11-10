export type ProductCategory = 
  | 'ceiling_fan'
  | 'table_fan'
  | 'pedestal_fan'
  | 'exhaust_fan'
  | 'wall_fan'
  | 'industrial_fan';

export type ProductStatus = 'active' | 'draft' | 'discontinued';

export interface ProductSpecs {
  sweepMm: number; // e.g. 1200 mm
  bladeCount: number; // e.g. 3 or 4
  motorType: string; // e.g. "BLDC Smart Motor" or "Copper Induction"
  rpm: number; // e.g. 380 RPM
  powerWatts: number; // e.g. 28W or 55W
  airDeliveryCmm: number; // e.g. 230 CMM
  voltage: string; // e.g. "220V - 240V ~ 50Hz"
  color: string;
  hasRemote: boolean;
  warrantyMonths: number;
}

export interface Product {
  id: string;
  sku: string; // e.g. GA-CF-AURA12
  modelNumber: string; // e.g. GA-2026-AURA
  name: string; // e.g. Grand Air Aura BLDC Ceiling Fan
  category: ProductCategory;
  description: string;
  price: number; // in INR / local currency
  imageUrl: string;
  specs: ProductSpecs;
  status: ProductStatus;
  totalManufactured: number;
  inStock: number;
  createdAt: string;
  updatedAt: string;
}

export type UnitStatus = 
  | 'manufactured' 
  | 'qc_passed' 
  | 'packaged' 
  | 'dispatched' 
  | 'sold' 
  | 'in_service';

export interface WarrantyRegistration {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerUpiId?: string;
  redeemAmount?: number;
  redeemStatus?: string;
  customerCity?: string;
  dealerName?: string;
  invoiceNumber?: string;
  registeredAt: string;
}

export interface ProductUnit {
  id: string;
  serialNumber: string; // e.g. GA-CF-202611-B01-0001
  batchId: string;
  batchNumber: string; // e.g. BATCH-2026-11-001
  productId: string;
  productName: string;
  modelNumber: string;
  category: ProductCategory;
  manufacturingDate: string; // ISO string
  plantLocation: string; // e.g. "Plant #2, Coimbatore Line 4"
  inspectorName: string; // e.g. "R. Sharma (Senior QC Engineer)"
  qcPassed: boolean;
  qcStamp: string; // e.g. "QC-PASSED-ISO9001"
  status: UnitStatus;
  verificationCode: string; // 8-char secure verification token e.g. "9F4A-82B1"
  qrPayload: string; // text embedded in the QR code
  specsSnapshot: {
    sweepMm: number;
    rpm: number;
    powerWatts: number;
    color: string;
    warrantyMonths: number;
  };
  warrantyExpiryDate: string;
  notes?: string;
  scannedCount: number;
  lastScannedAt?: string;
  warrantyRegistration?: WarrantyRegistration;
}

export interface ManufacturingBatch {
  id: string;
  batchNumber: string; // e.g. BATCH-2026-11-001
  productId: string;
  productName: string;
  category: ProductCategory;
  quantity: number;
  plantLocation: string;
  assemblyLine: string;
  inspectorName: string;
  status: 'completed' | 'in_progress' | 'cancelled';
  serialRangeStart: string;
  serialRangeEnd: string;
  createdAt: string;
  unitIds: string[];
}

export interface AnalyticsSummary {
  totalProducts: number;
  totalUnitsManufactured: number;
  totalBatches: number;
  activeWarrantyCount: number;
  qcPassRate: number;
  categoryBreakdown: Record<ProductCategory, number>;
}

