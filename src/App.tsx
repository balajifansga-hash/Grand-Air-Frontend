import React, { useState, useEffect } from 'react';
import { Product, ProductUnit, ManufacturingBatch, AnalyticsSummary } from './types';
import { StorageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { DashboardView } from './views/DashboardView';
import { ProductionView } from './views/ProductionView';
import { QRStationView } from './views/QRStationView';
import { ProductsView } from './views/ProductsView';
import { LedgerView } from './views/LedgerView';
import { VerificationView } from './views/VerificationView';
import { ApiService } from './services/api';
import { QRLabelCard } from './components/QRLabelCard';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('grand_air_logged_in_user') || sessionStorage.getItem('grand_air_logged_in_user');
  });

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(() => StorageService.getProducts());
  const [batches, setBatches] = useState<ManufacturingBatch[]>(() => StorageService.getBatches());
  const [units, setUnits] = useState<ProductUnit[]>(() => StorageService.getUnits());
  const [analytics, setAnalytics] = useState<AnalyticsSummary>(() => StorageService.getAnalytics());

  const [preselectedProductId, setPreselectedProductId] = useState<string | undefined>(undefined);
  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string | undefined>(undefined);
  const [verifySerial, setVerifySerial] = useState<string | undefined>(undefined);
  const [inspectingUnit, setInspectingUnit] = useState<ProductUnit | null>(null);
  const [bannerToast, setBannerToast] = useState<string | null>(null);

  // Load and refresh state from Backend API (with fallback to StorageService)
  const refreshData = async () => {
    StorageService.init();
    try {
      const online = await ApiService.isBackendOnline();
      setIsBackendConnected(online);

      if (online) {
        const [p, b, u, a] = await Promise.all([
          ApiService.getProducts(),
          ApiService.getBatches(),
          ApiService.getUnits(),
          ApiService.getAnalytics()
        ]);
        
        const localUnits = StorageService.getUnits();
        const localBatches = StorageService.getBatches();

        if (p && p.length > 0) {
          setProducts(p);
        } else {
          setProducts(StorageService.getProducts());
        }

        // Non-destructive merge: never drop units if user produced more locally!
        const unitMap = new Map<string, ProductUnit>();
        (localUnits || []).forEach((item: ProductUnit) => unitMap.set(item.serialNumber.toUpperCase(), item));
        (u || []).forEach((item: ProductUnit) => {
          const key = item.serialNumber.toUpperCase();
          if (!unitMap.has(key)) {
            unitMap.set(key, item);
          } else {
            unitMap.set(key, { ...unitMap.get(key)!, ...item });
          }
        });
        const combinedUnits = Array.from(unitMap.values());
        setUnits(combinedUnits);
        StorageService.saveAllUnits(combinedUnits);

        const batchMap = new Map<string, ManufacturingBatch>();
        (localBatches || []).forEach((item: ManufacturingBatch) => batchMap.set(item.id, item));
        (b || []).forEach((item: ManufacturingBatch) => batchMap.set(item.id, item));
        const combinedBatches = Array.from(batchMap.values());
        setBatches(combinedBatches);
        StorageService.saveAllBatches(combinedBatches);

        // If local had new units that backend didn't have yet, sync them up immediately!
        if (combinedUnits.length > (u?.length || 0)) {
          ApiService.syncFactoryState({ units: combinedUnits, batches: combinedBatches }).catch(() => {});
        }

        if (a) setAnalytics(a);
        return;
      }
    } catch {
      setIsBackendConnected(false);
    }

    // Local fallback
    setProducts(StorageService.getProducts());
    setBatches(StorageService.getBatches());
    setUnits(StorageService.getUnits());
    setAnalytics(StorageService.getAnalytics());
  };

  useEffect(() => {
    refreshData();

    // Check if user arrived via scanning a QR code (e.g. ?verify=GA-CF-202611-B01-0001 or ?sn=...)
    const params = new URLSearchParams(window.location.search);
    const snParam = params.get('verify') || params.get('sn') || params.get('code');
    if (snParam) {
      setVerifySerial(snParam);
      setCurrentTab('verify');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('grand_air_logged_in_user');
    sessionStorage.removeItem('grand_air_logged_in_user');
    setCurrentUser(null);
  };

  // Handlers for cross-tab actions
  const handleBatchCreated = (batch: ManufacturingBatch, newUnits: ProductUnit[]) => {
    setBatches(prev => [batch, ...prev.filter(b => b.id !== batch.id)]);
    setUnits(prev => [...newUnits, ...prev.filter(u => !newUnits.some(nu => nu.id === u.id))]);
    setProducts(prev => prev.map(p => {
      const matchId = batch.productId;
      if (p.id === matchId || (p as any)._id === matchId) {
        return {
          ...p,
          totalManufactured: (p.totalManufactured || 0) + newUnits.length,
          inStock: (p.inStock || 0) + newUnits.length
        };
      }
      return p;
    }));
    setAnalytics(prev => ({
      ...prev,
      totalBatches: prev.totalBatches + 1,
      totalUnitsManufactured: prev.totalUnitsManufactured + newUnits.length,
      activeWarrantyCount: prev.activeWarrantyCount + newUnits.length
    }));
  };

  const handleProductsUpdated = async (updatedProduct?: Product) => {
    if (updatedProduct) {
      const matchId = updatedProduct.id || (updatedProduct as any)._id;
      setProducts(prev => {
        const exists = prev.some(p => (p.id || (p as any)._id) === matchId);
        if (exists) {
          return prev.map(p => (p.id || (p as any)._id) === matchId ? updatedProduct : p);
        } else {
          return [updatedProduct, ...prev];
        }
      });
    }
    await refreshData();
  };

  const handleNavigateToProduction = (productId?: string) => {
    setPreselectedProductId(productId);
    setCurrentTab('manufacture');
  };

  const handleNavigateToQRStation = (batchId?: string) => {
    setSelectedBatchFilter(batchId);
    setCurrentTab('qr-station');
  };

  const handleNavigateToVerify = (serial: string) => {
    setVerifySerial(serial);
    setCurrentTab('verify');
  };

  const handleQuickProduce = async (productId: string, quantity: number) => {
    let createdBatch: ManufacturingBatch | undefined;
    let createdUnits: ProductUnit[] = [];

    // 1. Try manufacturing via MongoDB Atlas backend
    if (isBackendConnected) {
      try {
        const res = await ApiService.manufactureBatch({
          productId,
          quantity,
          assemblyLine: 'Line 1 - Active Air Ceiling Fan Assembly',
          inspectorName: 'K. Rajesh (Lead QC Auditor)'
        });
        if (res && res.batch && Array.isArray(res.units) && res.units.length > 0) {
          createdBatch = res.batch;
          createdUnits = res.units;
        }
      } catch (e) {
        console.warn('Backend API manufacture error, falling back locally:', e);
      }
    }

    // 2. Local fallback if backend is offline or returned empty
    if (!createdBatch || createdUnits.length === 0) {
      const localResult = StorageService.manufactureBatch({
        productId,
        quantity,
        assemblyLine: 'Line 1 - Active Air Ceiling Fan Assembly',
        inspectorName: 'K. Rajesh (Lead QC Auditor)'
      });
      createdBatch = localResult.batch;
      createdUnits = localResult.units;
    }

    // 3. IMMEDIATELY update React state in-memory (0ms UI reactivity!)
    if (createdBatch && createdUnits.length > 0) {
      const b = createdBatch;
      const u = createdUnits;
      setBatches(prev => [b, ...prev.filter(item => item.id !== b.id)]);
      setUnits(prev => [...u, ...prev.filter(item => !u.some(nu => nu.id === item.id))]);
      setProducts(prev => prev.map(p => {
        const matchId = b.productId;
        if (p.id === matchId || (p as any)._id === matchId) {
          return {
            ...p,
            totalManufactured: (p.totalManufactured || 0) + u.length,
            inStock: (p.inStock || 0) + u.length
          };
        }
        return p;
      }));
      setAnalytics(prev => ({
        ...prev,
        totalBatches: prev.totalBatches + 1,
        totalUnitsManufactured: prev.totalUnitsManufactured + u.length,
        activeWarrantyCount: prev.activeWarrantyCount + u.length
      }));

      // Ensure backend API receives manufactured units immediately
      ApiService.syncFactoryState({ units: u, batches: [b] }).catch(() => {});
    }
  };

  const handleResetData = async () => {
    const ok = window.confirm(
      '⚠️ RESET MANUFACTURING DATA & QR CODES?\n\n' +
      '• All manufactured QR code stickers will be deleted (Units: 0)\n' +
      '• All production batches will be deleted (Batches: 0)\n' +
      '• The 3 Grand Air Fan Models will PERMANENTLY REMAIN in the catalog\n' +
      '• Both MongoDB Atlas and local storage will be cleared of test units\n\n' +
      'Click OK to wipe units and start manufacturing from scratch.'
    );

    if (!ok) return;

    // 1. Immediately reset in-memory React state in 0ms (UI updates on screen immediately!)
    const preservedProducts = StorageService.getProducts().map(p => ({
      ...p,
      totalManufactured: 0,
      inStock: 0
    }));

    setBatches([]);
    setUnits([]);
    setProducts(preservedProducts);
    setAnalytics({
      totalProducts: preservedProducts.length,
      totalUnitsManufactured: 0,
      totalBatches: 0,
      activeWarrantyCount: 0,
      qcPassRate: 100,
      categoryBreakdown: {
        ceiling_fan: 0,
        table_fan: 0,
        pedestal_fan: 0,
        exhaust_fan: 0,
        wall_fan: 0,
        industrial_fan: 0
      }
    });

    // 2. Clear local storage immediately
    StorageService.clearAll();

    // 3. Notify user with floating toast
    setBannerToast('🧹 All manufactured QR units and batches cleared! 3 Active Air models preserved.');
    setTimeout(() => setBannerToast(null), 4000);

    // 4. Wipe MongoDB Atlas backend asynchronously (No tab change, no freezing!)
    try {
      await ApiService.clearAll();
    } catch (e) {
      console.warn('Backend clear warning:', e);
    }
  };

  // If not logged in and not viewing verification page from QR scan, show Login Screen
  if (!currentUser && currentTab !== 'verify') {
    return <LoginScreen onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenQuickProduce={() => handleNavigateToProduction()}
        onResetData={handleResetData}
        totalManufacturedCount={analytics.totalUnitsManufactured}
        isBackendConnected={isBackendConnected}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          <DashboardView
            products={products}
            batches={batches}
            units={units}
            analytics={analytics}
            onNavigateToProduction={handleNavigateToProduction}
            onNavigateToQRStation={handleNavigateToQRStation}
            onNavigateToVerify={handleNavigateToVerify}
            onQuickProduce={handleQuickProduce}
          />
        )}

        {currentTab === 'manufacture' && (
          <ProductionView
            products={products}
            onBatchCreated={handleBatchCreated}
            onNavigateToQRStation={handleNavigateToQRStation}
            onNavigateToVerify={handleNavigateToVerify}
            preselectedProductId={preselectedProductId}
          />
        )}

        {currentTab === 'qr-station' && (
          <QRStationView
            units={units}
            batches={batches}
            products={products}
            selectedBatchFilter={selectedBatchFilter}
            onNavigateToVerify={handleNavigateToVerify}
            onOpenProduce={() => handleNavigateToProduction()}
          />
        )}

        {currentTab === 'products' && (
          <ProductsView
            products={products}
            onProductsUpdated={handleProductsUpdated}
            onManufactureProduct={handleNavigateToProduction}
          />
        )}

        {currentTab === 'ledger' && (
          <LedgerView
            units={units}
            onUnitsUpdated={refreshData}
            onNavigateToVerify={handleNavigateToVerify}
            onInspectUnit={(unit) => setInspectingUnit(unit)}
          />
        )}

        {currentTab === 'verify' && (
          <VerificationView
            initialSerial={verifySerial}
            onNavigateToQRStation={() => setCurrentTab('qr-station')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-800 font-bold">Grand Air Electronics</strong> • Manufacturing & Serialization Portal
          </div>
          <div className="text-slate-500">
            Active Air Ceiling Fan Serialization • Unique QR Generator • MongoDB Atlas
          </div>
        </div>
      </footer>

      {/* Floating Notification Toast */}
      {bannerToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-3 animate-fade-in">
          <span>{bannerToast}</span>
          <button 
            onClick={() => setBannerToast(null)} 
            className="text-slate-400 hover:text-white text-xs bg-slate-800 hover:bg-slate-700 px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}

      {/* Single Label Inspection Modal */}
      {inspectingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print animate-fade-in">
          <div className="relative max-w-sm w-full">
            <button
              onClick={() => setInspectingUnit(null)}
              className="absolute -top-10 right-0 p-1.5 text-white hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <QRLabelCard
              unit={inspectingUnit}
              onVerify={(u) => {
                setInspectingUnit(null);
                handleNavigateToVerify(u.serialNumber);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
