const API_BASE = 'http://localhost:5000/api';

export const ApiService = {
  async isBackendOnline(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
      return res.ok;
    } catch {
      return false;
    }
  },

  async clearAll() {
    try {
      const res = await fetch(`${API_BASE}/clear-all`);
      const json = await res.json();
      return json.success;
    } catch {
      return false;
    }
  },

  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    const json = await res.json();
    return json.data;
  },

  async createProduct(product: any) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const json = await res.json();
    return json.data;
  },

  async updateProduct(id: string, updates: any) {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    return json.data;
  },

  async deleteProduct(id: string) {
    const res = await fetch(`${API_BASE}/products/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    return json.success;
  },

  async getBatches() {
    const res = await fetch(`${API_BASE}/batches`);
    const json = await res.json();
    return json.data;
  },

  async getUnits(params?: { batchId?: string; productId?: string; status?: string; search?: string }) {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`${API_BASE}/units${query ? `?${query}` : ''}`);
    const json = await res.json();
    return json.data;
  },

  async manufactureBatch(params: {
    productId: string;
    quantity: number;
    plantLocation?: string;
    assemblyLine?: string;
    inspectorName?: string;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE}/batches/manufacture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const json = await res.json();
    return json.data;
  },

  async updateUnitStatus(serialNumber: string, status: string, notes?: string) {
    const res = await fetch(`${API_BASE}/units/${encodeURIComponent(serialNumber)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    const json = await res.json();
    return json.data;
  },

  async verifyUnit(serialNumber: string) {
    const res = await fetch(`${API_BASE}/verify/${encodeURIComponent(serialNumber)}`);
    return await res.json();
  },

  async registerWarranty(serialNumber: string, registration: any) {
    const res = await fetch(`${API_BASE}/units/${encodeURIComponent(serialNumber)}/register-warranty`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registration)
    });
    return await res.json();
  },

  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`);
    const json = await res.json();
    return json.data;
  },

  async syncFactoryState(data: { units?: any[]; batches?: any[]; products?: any[] }) {
    try {
      const res = await fetch(`${API_BASE}/units/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch {
      return null;
    }
  }
};

