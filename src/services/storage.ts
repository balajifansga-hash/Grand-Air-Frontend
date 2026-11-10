import { Product, ProductUnit, ManufacturingBatch, AnalyticsSummary, ProductCategory, UnitStatus, WarrantyRegistration } from '../types';

const STORAGE_KEYS = {
  PRODUCTS: 'grand_air_products_v4',
  UNITS: 'grand_air_units_v4',
  BATCHES: 'grand_air_batches_v4',
  INIT: 'grand_air_initialized_v4'
};

// Standard Grand Air Active Air Ceiling Fan catalog
export const DEFAULT_ACTIVE_AIR_PRODUCTS: Product[] = [
  {
    id: 'prod-active-air-1200',
    sku: 'GA-CF-AA1200',
    modelNumber: 'Active Air 1200mm',
    name: 'Grand Air Active Air Ceiling Fan (1200mm / 48")',
    category: 'ceiling_fan',
    description: 'Active breeze fan with excellent performance. Premium 3-blade aerodynamic design with 270 CMM high air delivery.',
    price: 2499,
    imageUrl: '/active-air-fan.jpg',
    specs: {
      sweepMm: 1200,
      bladeCount: 3,
      motorType: 'Heavy Duty 100% Copper Winding Motor',
      rpm: 370,
      powerWatts: 55,
      airDeliveryCmm: 270,
      voltage: '220-240V, 50Hz',
      color: 'Glossy Rich Brown / Black',
      hasRemote: false,
      warrantyMonths: 24
    },
    status: 'active',
    totalManufactured: 5,
    inStock: 5,
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z'
  },
  {
    id: 'prod-active-air-900',
    sku: 'GA-CF-AA900',
    modelNumber: 'Active Air 900mm',
    name: 'Grand Air Active Air Ceiling Fan (900mm / 36")',
    category: 'ceiling_fan',
    description: 'Active breeze fan with compact sweep, engineered for bedrooms, cabins, and dining spaces. 170 CMM air delivery.',
    price: 2199,
    imageUrl: '/active-air-fan.jpg',
    specs: {
      sweepMm: 900,
      bladeCount: 3,
      motorType: 'High-Torque 100% Copper Winding Motor',
      rpm: 370,
      powerWatts: 55,
      airDeliveryCmm: 170,
      voltage: '220-240V, 50Hz',
      color: 'Glossy Rich Brown / Black',
      hasRemote: false,
      warrantyMonths: 24
    },
    status: 'active',
    totalManufactured: 0,
    inStock: 0,
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z'
  },
  {
    id: 'prod-active-air-600',
    sku: 'GA-CF-AA600',
    modelNumber: 'Active Air 600mm',
    name: 'Grand Air Active Air High-Speed Ceiling Fan (600mm / 24")',
    category: 'ceiling_fan',
    description: 'High-speed 850 RPM compact ceiling fan for kitchens, balconies, and shops. 125 CMM instant breeze.',
    price: 1899,
    imageUrl: '/active-air-fan.jpg',
    specs: {
      sweepMm: 600,
      bladeCount: 3,
      motorType: 'Ultra High-Speed Induction Motor',
      rpm: 850,
      powerWatts: 75,
      airDeliveryCmm: 125,
      voltage: '220-240V, 50Hz',
      color: 'Glossy Rich Brown / Black',
      hasRemote: false,
      warrantyMonths: 24
    },
    status: 'active',
    totalManufactured: 1,
    inStock: 1,
    createdAt: '2026-11-09T10:00:00.000Z',
    updatedAt: '2026-11-09T10:00:00.000Z'
  }
];

const INITIAL_PRODUCTS: Product[] = DEFAULT_ACTIVE_AIR_PRODUCTS;

function generateToken(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

function getCategoryCode(cat: ProductCategory): string {
  switch (cat) {
    case 'ceiling_fan': return 'CF';
    case 'table_fan': return 'TF';
    case 'pedestal_fan': return 'PF';
    case 'exhaust_fan': return 'EF';
    default: return 'CF';
  }
}

// Clean initialization: 0 manufactured units, 0 old QRs!
function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  const initialized = localStorage.getItem(STORAGE_KEYS.INIT);
  if (!initialized) {
    // Clear legacy versions
    localStorage.removeItem('grand_air_products');
    localStorage.removeItem('grand_air_units');
    localStorage.removeItem('grand_air_batches');
    localStorage.removeItem('grand_air_initialized_v1');
    localStorage.removeItem('grand_air_products_v2');
    localStorage.removeItem('grand_air_units_v2');
    localStorage.removeItem('grand_air_batches_v2');
    localStorage.removeItem('grand_air_initialized_v2');
    localStorage.removeItem('grand_air_products_v3');
    localStorage.removeItem('grand_air_units_v3');
    localStorage.removeItem('grand_air_batches_v3');
    localStorage.removeItem('grand_air_initialized_v3');

    // Start with the standard 3 Active Air Fan models
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_ACTIVE_AIR_PRODUCTS));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INIT, 'true');
  }
}

export const StorageService = {
  init(): void {
    initializeStorage();
  },

  getProducts(): Product[] {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const parsed = data ? JSON.parse(data) : [];
    if (!parsed || parsed.length === 0) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(DEFAULT_ACTIVE_AIR_PRODUCTS));
      return DEFAULT_ACTIVE_AIR_PRODUCTS;
    }
    return parsed;
  },

  clearAll(): void {
    // Keep the 3 fan models permanently, only wipe manufactured units and batches!
    const current = this.getProducts();
    const preserved = (current && current.length > 0 ? current : DEFAULT_ACTIVE_AIR_PRODUCTS).map(p => ({
      ...p,
      totalManufactured: 0,
      inStock: 0
    }));
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(preserved));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.INIT, 'true');
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  },

  saveProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalManufactured' | 'inStock'>): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      totalManufactured: 0,
      inStock: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    products.unshift(newProduct);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
    return newProduct;
  },

  updateProduct(id: string, updates: Partial<Product>): Product | null {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;

    products[index] = {
      ...products[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage update failed:', e);
    }
    return products[index];
  },

  deleteProduct(id: string): boolean {
    const products = this.getProducts().filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('LocalStorage delete failed:', e);
    }
    return true;
  },

  getBatches(): ManufacturingBatch[] {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return data ? JSON.parse(data) : [];
  },

  saveAllBatches(batches: ManufacturingBatch[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
    } catch (e) {
      console.warn('saveAllBatches warning:', e);
    }
  },

  getUnits(): ProductUnit[] {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEYS.UNITS);
    return data ? JSON.parse(data) : [];
  },

  saveAllUnits(units: ProductUnit[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    } catch (e) {
      console.warn('saveAllUnits warning:', e);
    }
  },

  getUnitBySerial(serial: string): ProductUnit | undefined {
    const clean = serial.trim().toUpperCase();
    return this.getUnits().find(u => u.serialNumber.toUpperCase() === clean);
  },

  getUnitsByBatch(batchId: string): ProductUnit[] {
    return this.getUnits().filter(u => u.batchId === batchId);
  },

  updateUnitStatus(serialNumber: string, status: UnitStatus, notes?: string): ProductUnit | null {
    const units = this.getUnits();
    const index = units.findIndex(u => u.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
    if (index === -1) return null;

    units[index].status = status;
    if (notes) units[index].notes = notes;
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    return units[index];
  },

  registerWarranty(serialNumber: string, registration: WarrantyRegistration): ProductUnit | null {
    const units = this.getUnits();
    const index = units.findIndex(u => u.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
    if (index === -1) return null;

    units[index].status = 'sold';
    units[index].warrantyRegistration = registration;
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    return units[index];
  },

  recordScan(serialNumber: string): ProductUnit | null {
    const units = this.getUnits();
    const index = units.findIndex(u => u.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase());
    if (index === -1) return null;

    units[index].scannedCount = (units[index].scannedCount || 0) + 1;
    units[index].lastScannedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(units));
    return units[index];
  },

  manufactureBatch(params: {
    productId: string;
    quantity: number;
    plantLocation?: string;
    assemblyLine?: string;
    inspectorName?: string;
    notes?: string;
  }): { batch: ManufacturingBatch; units: ProductUnit[] } {
    initializeStorage();
    const product = this.getProductById(params.productId) || this.getProducts()[0];
    if (!product) {
      throw new Error(`Product not found.`);
    }

    const qty = Math.max(1, Math.min(params.quantity, 1000));
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const day = String(now.getDate()).padStart(2, '0');
    
    const existingBatches = this.getBatches();
    const batchSeq = existingBatches.length + 1;
    const batchNumber = `GA-B${yearMonth}${day}-${String(batchSeq).padStart(3, '0')}`;
    const batchId = `batch-${Date.now()}`;

    const catCode = getCategoryCode(product.category);
    const plantLocation = params.plantLocation || 'Grand Air Main Plant #1 (Coimbatore)';
    const assemblyLine = params.assemblyLine || 'Line 1 - Active Air Ceiling Fan Assembly';
    const inspectorName = params.inspectorName || 'K. Rajesh (Lead QC Auditor)';

    const allUnits = this.getUnits();
    const catUnitsCount = allUnits.filter(u => u.category === product.category).length;

    const newUnits: ProductUnit[] = [];
    const unitIds: string[] = [];
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

    for (let i = 1; i <= qty; i++) {
      const seq = catUnitsCount + i;
      const serialNumber = `GA-${catCode}-${yearMonth}-B${String(batchSeq).padStart(2, '0')}-${String(seq).padStart(4, '0')}`;
      const vcode = generateToken();
      const uId = `unit-${serialNumber}-${Date.now()}`;
      unitIds.push(uId);

      // Clean, high-speed scannable QR payload: serial number directly for instant 0.05s camera decode
      const qrPayload = serialNumber;

      const expiry = new Date(now);
      expiry.setMonth(expiry.getMonth() + (product.specs.warrantyMonths || 24));

      const unit: ProductUnit = {
        id: uId,
        serialNumber,
        batchId,
        batchNumber,
        productId: product.id,
        productName: product.name,
        modelNumber: product.modelNumber,
        category: product.category,
        manufacturingDate: now.toISOString(),
        plantLocation,
        inspectorName,
        qcPassed: true,
        qcStamp: 'QC-PASSED-ISO9001',
        status: 'manufactured',
        verificationCode: vcode,
        qrPayload,
        specsSnapshot: {
          sweepMm: product.specs.sweepMm,
          rpm: product.specs.rpm,
          powerWatts: product.specs.powerWatts,
          color: product.specs.color,
          warrantyMonths: product.specs.warrantyMonths
        },
        warrantyExpiryDate: expiry.toISOString(),
        notes: params.notes || `Active Air Batch ${batchNumber} production run`,
        scannedCount: 0
      };

      newUnits.push(unit);
    }

    const batch: ManufacturingBatch = {
      id: batchId,
      batchNumber,
      productId: product.id,
      productName: product.name,
      category: product.category,
      quantity: qty,
      plantLocation,
      assemblyLine,
      inspectorName,
      status: 'completed',
      serialRangeStart: newUnits[0].serialNumber,
      serialRangeEnd: newUnits[newUnits.length - 1].serialNumber,
      createdAt: now.toISOString(),
      unitIds
    };

    existingBatches.unshift(batch);
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(existingBatches));

    const updatedUnits = [...newUnits, ...allUnits];
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(updatedUnits));

    this.updateProduct(product.id, {
      totalManufactured: (product.totalManufactured || 0) + qty,
      inStock: (product.inStock || 0) + qty
    });

    return { batch, units: newUnits };
  },

  getAnalytics(): AnalyticsSummary {
    const products = this.getProducts();
    const units = this.getUnits();
    const batches = this.getBatches();

    const categoryBreakdown: Record<ProductCategory, number> = {
      ceiling_fan: units.length,
      table_fan: 0,
      pedestal_fan: 0,
      exhaust_fan: 0,
      wall_fan: 0,
      industrial_fan: 0
    };

    const activeWarranty = units.filter(u => new Date(u.warrantyExpiryDate) > new Date()).length;
    const passedQc = units.filter(u => u.qcPassed).length;
    const qcPassRate = units.length > 0 ? Math.round((passedQc / units.length) * 100) : 100;

    return {
      totalProducts: products.length,
      totalUnitsManufactured: units.length,
      totalBatches: batches.length,
      activeWarrantyCount: activeWarranty,
      qcPassRate,
      categoryBreakdown
    };
  },

  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.INIT);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.UNITS);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    initializeStorage();
  }
};
