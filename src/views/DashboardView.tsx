import React from 'react';
import { Product, ProductUnit, ManufacturingBatch, AnalyticsSummary } from '../types';
import { 
  Boxes, 
  Factory, 
  QrCode, 
  ShieldCheck, 
  Zap, 
  Printer, 
  ArrowRight, 
  Search,
  Sparkles,
  Fan,
  CheckCircle
} from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  batches: ManufacturingBatch[];
  units: ProductUnit[];
  analytics: AnalyticsSummary;
  onNavigateToProduction: (productId?: string) => void;
  onNavigateToQRStation: (batchId?: string) => void;
  onNavigateToVerify: (serial: string) => void;
  onQuickProduce: (productId: string, quantity: number) => Promise<void> | void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  batches,
  units,
  analytics,
  onNavigateToProduction,
  onNavigateToQRStation,
  onNavigateToVerify,
  onQuickProduce
}) => {
  const [quickProductId, setQuickProductId] = React.useState<string>(
    () => products[0]?.id || (products[0] as any)?._id || 'prod-active-air-1200'
  );
  const [quickQty, setQuickQty] = React.useState<number>(5);
  const [verifyInput, setVerifyInput] = React.useState<string>('');
  const [isProducing, setIsProducing] = React.useState<boolean>(false);
  const [justProducedNotice, setJustProducedNotice] = React.useState<{ count: number; name: string } | null>(null);

  // Keep quickProductId synced if products load or change
  React.useEffect(() => {
    const validFirst = products[0]?.id || (products[0] as any)?._id;
    if ((!quickProductId || !products.some(p => (p.id || (p as any)._id) === quickProductId)) && validFirst) {
      setQuickProductId(validFirst);
    }
  }, [products]);

  const ceilingFanProduct = products.find(p => p.category === 'ceiling_fan') || products[0];

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyInput.trim()) {
      onNavigateToVerify(verifyInput.trim());
    }
  };

  const handleQuickProduceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = quickProductId || products[0]?.id || (products[0] as any)?._id || 'prod-active-air-1200';
    if (!targetId || quickQty <= 0) return;

    try {
      setIsProducing(true);
      await onQuickProduce(targetId, quickQty);
      const prodName = products.find(p => (p.id || (p as any)._id) === targetId)?.name || 'Active Air Fan';
      setJustProducedNotice({ count: quickQty, name: prodName });
      setTimeout(() => setJustProducedNotice(null), 6000);
    } catch (err) {
      console.error('Quick produce error:', err);
    } finally {
      setIsProducing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 border border-blue-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <Fan className="w-96 h-96 text-white rotate-12" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/20 text-white border border-white/30 backdrop-blur-sm">
              Manufacturing Operational Control
            </span>
            <span className="text-blue-100 text-xs">ISO 9001:2015 Facility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Grand Air Manufacturing & Unique QR Tracking Hub
          </h1>
          <p className="text-blue-100 text-sm mt-2 leading-relaxed">
            Generate individual serial keys, tamper-proof QR labels, and digital certificates of authenticity 
            for every Active Air ceiling fan and electronics product produced on your assembly lines.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={() => onNavigateToProduction(ceilingFanProduct?.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-blue-900 font-bold text-xs shadow-md shadow-black/10 transition-all active:scale-95"
            >
              <Factory className="w-4 h-4 text-blue-700" />
              <span>Manufacture Batch of Fans</span>
            </button>

            <button
              onClick={() => onNavigateToQRStation()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white border border-blue-400/30 text-xs font-semibold backdrop-blur-sm transition-all"
            >
              <QrCode className="w-4 h-4 text-blue-200" />
              <span>View & Print Sticker Labels ({units.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Units Manufactured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Units Manufactured
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {analytics.totalUnitsManufactured}
            </span>
            <span className="text-xs text-emerald-600 font-semibold">Unique Serials</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Each fan has an individual unique QR code
          </div>
        </div>

        {/* KPI 2: Total Batches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Production Batches
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {analytics.totalBatches}
            </span>
            <span className="text-xs text-slate-500 font-medium">Completed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Tracked across all assembly lines
          </div>
        </div>

        {/* KPI 3: Fan Models In Catalog */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Product Models
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
              <Fan className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              {analytics.totalProducts}
            </span>
            <span className="text-xs text-blue-600 font-semibold">Active SKUs</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Active Air 1200mm, 900mm, 600mm
          </div>
        </div>

        {/* KPI 4: QC Pass Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              QC Pass Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 font-mono">
              {analytics.qcPassRate}%
            </span>
            <span className="text-xs text-emerald-700 font-semibold">Quality Guaranteed</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Tested for safety, balance & motor power
          </div>
        </div>
      </div>

      {/* Quick Production & Quick Lookup Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Produce Widget: "Manufacture 5 Fans" */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Quick Production Launcher</h3>
                <p className="text-xs text-slate-500">Simulate or register a live manufacturing output instantly</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
              1-Click Batch
            </span>
          </div>

          {products.length === 0 ? (
            <div className="py-6 text-center space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4">
              <Boxes className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                No product models added yet
              </div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Add your fans or electronics products in the Product Catalog to start manufacturing and generating QR codes.
              </p>
              <button
                type="button"
                onClick={() => onNavigateToProduction()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
              >
                + Add Product Model
              </button>
            </div>
          ) : (
            <form onSubmit={handleQuickProduceSubmit} className="space-y-4">
              {justProducedNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between text-emerald-800 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      <strong>Success!</strong> Manufactured {justProducedNotice.count} unit{justProducedNotice.count > 1 ? 's' : ''} of {justProducedNotice.name}. Serial numbers and QR codes are ready!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigateToQRStation()}
                    className="ml-2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] transition-all shadow-xs flex-shrink-0"
                  >
                    View QR Labels →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-8">
                  <label className="block text-[11px] text-slate-600 uppercase font-bold mb-1">
                    Product Fan Model
                  </label>
                  <select
                    value={quickProductId || products[0]?.id || (products[0] as any)?._id || ''}
                    onChange={(e) => setQuickProductId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  >
                    {products.map((p) => {
                      const pId = p.id || (p as any)._id;
                      return (
                        <option key={pId} value={pId}>
                          {p.name} ({p.sku})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] text-slate-600 uppercase font-bold mb-1">
                    Quantity (Units)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 5, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setQuickQty(n)}
                        className={`flex-1 py-1.5 rounded text-xs font-bold transition-all ${
                          quickQty === n
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs flex items-center justify-between">
                <div className="text-slate-700">
                  Will generate <strong className="text-blue-700 font-mono font-bold">{quickQty} unique serial numbers</strong> & QR codes.
                </div>
                <button
                  type="submit"
                  disabled={isProducing}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-xs rounded-lg shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  {isProducing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Manufacturing {quickQty}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Manufacture {quickQty} Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Quick QR Serial Lookup / Scanner */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Authenticity Serial Verification</h3>
                <p className="text-xs text-slate-500">Verify genuine Grand Air electronics unit</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-2">
              Enter any serial number (or scan QR code) to check manufacturing timestamp, warranty validity, and genuine certificate.
            </p>

            <form onSubmit={handleVerifySubmit} className="mt-4 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={verifyInput}
                  onChange={(e) => setVerifyInput(e.target.value)}
                  placeholder="e.g. GA-CF-202611-B01-0001"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-24 py-2.5 text-xs text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-sm"
                >
                  Verify
                </button>
              </div>

              {units.length > 0 && (
                <div className="text-[11px] text-slate-500 pt-1">
                  Sample serial:{' '}
                  <button
                    type="button"
                    onClick={() => onNavigateToVerify(units[0].serialNumber)}
                    className="font-mono text-blue-600 font-semibold hover:underline"
                  >
                    {units[0].serialNumber}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Recent Production Batches Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Manufacturing Batches</h3>
            <p className="text-xs text-slate-500">Latest production runs and serial ranges generated</p>
          </div>
          <button
            onClick={() => onNavigateToQRStation()}
            className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
          >
            <span>View All QR Codes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] bg-slate-50/80">
                <th className="py-3 px-3">Batch ID</th>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">Quantity</th>
                <th className="py-3 px-3">Serial Key Range</th>
                <th className="py-3 px-3">Assembly Line</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {batches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No production batches yet. Click "Manufacture Batch of Fans" or use the 1-Click launcher above!
                  </td>
                </tr>
              ) : (
                batches.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 font-bold text-blue-600">{b.batchNumber}</td>
                    <td className="py-3 px-3 font-sans font-semibold text-slate-900">{b.productName}</td>
                    <td className="py-3 px-3 font-sans">
                      <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold border border-blue-100">
                        {b.quantity} Fans
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      <span className="text-slate-800">{b.serialRangeStart}</span>
                      <span className="text-slate-400"> → </span>
                      <span className="text-slate-800">{b.serialRangeEnd}</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-500">{b.assemblyLine}</td>
                    <td className="py-3 px-3 font-sans text-slate-500">
                      {new Date(b.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-right font-sans">
                      <button
                        onClick={() => onNavigateToQRStation(b.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg border border-slate-300 text-xs font-semibold shadow-sm transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-600" />
                        <span>Print Labels</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
