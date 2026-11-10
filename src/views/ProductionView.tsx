import React, { useState } from 'react';
import { Product, ProductUnit, ManufacturingBatch } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { QRLabelCard } from '../components/QRLabelCard';
import { 
  Factory, 
  Sparkles, 
  CheckCircle2, 
  Printer, 
  Eye, 
  Hash, 
  ShieldCheck,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface ProductionViewProps {
  products: Product[];
  onBatchCreated: (batch: ManufacturingBatch, units: ProductUnit[]) => void;
  onNavigateToQRStation: (batchId?: string) => void;
  onNavigateToVerify: (serial: string) => void;
  preselectedProductId?: string;
}

export const ProductionView: React.FC<ProductionViewProps> = ({
  products,
  onBatchCreated,
  onNavigateToQRStation,
  onNavigateToVerify,
  preselectedProductId
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProductId || products[0]?.id || (products[0] as any)?._id || ''
  );
  const [quantity, setQuantity] = useState<number>(5); // default 5 as requested!
  const [assemblyLine, setAssemblyLine] = useState<string>('Line 1 - Active Air Ceiling Fan Assembly');
  const [plantLocation, setPlantLocation] = useState<string>('Grand Air Plant #1 - Coimbatore');
  const [inspectorName, setInspectorName] = useState<string>('K. Rajesh (Lead QC Auditor)');
  const [notes, setNotes] = useState<string>('Active breeze fan with excellent performance. Tested for 270 CMM air delivery, vibration, and noise.');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastProducedResult, setLastProducedResult] = useState<{
    batch: ManufacturingBatch;
    units: ProductUnit[];
  } | null>(null);

  React.useEffect(() => {
    if (!selectedProductId && products.length > 0) {
      setSelectedProductId(products[0].id || (products[0] as any)._id);
    }
  }, [products, selectedProductId]);

  const selectedProduct = products.find(p => (p.id || (p as any)._id) === selectedProductId) || products[0];

  const handleManufacture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    setIsGenerating(true);
    const targetProdId = selectedProduct.id || (selectedProduct as any)._id;

    try {
      const isOnline = await ApiService.isBackendOnline();
      let result: { batch: ManufacturingBatch; units: ProductUnit[] };

      if (isOnline) {
        result = await ApiService.manufactureBatch({
          productId: targetProdId,
          quantity: Number(quantity),
          plantLocation,
          assemblyLine,
          inspectorName,
          notes
        });
      } else {
        result = StorageService.manufactureBatch({
          productId: targetProdId,
          quantity: Number(quantity),
          plantLocation,
          assemblyLine,
          inspectorName,
          notes
        });
      }

      setLastProducedResult(result);
      onBatchCreated(result.batch, result.units);
    } catch (err) {
      console.error('Manufacturing API error, falling back locally:', err);
      // fallback to local storage
      const result = StorageService.manufactureBatch({
        productId: targetProdId,
        quantity: Number(quantity),
        plantLocation,
        assemblyLine,
        inspectorName,
        notes
      });
      setLastProducedResult(result);
      onBatchCreated(result.batch, result.units);
    } finally {
      setIsGenerating(false);
    }
  };

  const quantityPresets = [1, 5, 10, 25, 50, 100];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Factory className="w-4 h-4" />
            <span>Grand Air Manufacturing Line</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Batch Production & Unique QR Code Generator
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Register new manufactured electronics products. The system instantly generates consecutive 
            unique serial numbers and individual QR code stickers for each physical unit.
          </p>
        </div>

        {lastProducedResult && (
          <button
            onClick={() => onNavigateToQRStation(lastProducedResult.batch.id)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>View Last Batch ({lastProducedResult.units.length} QR Codes)</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Production Configuration Form */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleManufacture} className="space-y-6">
            {/* Step 1: Select Fan Model */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Fan Product to Manufacture
              </label>
              {products.length === 0 ? (
                <div className="p-6 bg-slate-50 border-2 border-slate-200 border-dashed rounded-xl text-center space-y-2">
                  <p className="text-xs font-bold text-slate-800">No Product Models in Catalog</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Please go to the <strong>Product Catalog</strong> tab and click "+ Add New Product Model" to create your fan model first.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((prod) => {
                    const prodId = prod.id || (prod as any)._id;
                    const isSelected = selectedProductId === prodId;
                    return (
                      <div
                        key={prodId}
                        onClick={() => setSelectedProductId(prodId)}
                        className={`cursor-pointer p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-600 shadow-sm ring-1 ring-blue-500'
                            : 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                            {prod.modelNumber}
                          </span>
                          <span className="text-[10px] uppercase font-semibold text-slate-500">
                            {prod.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="font-bold text-slate-900 text-sm mt-2 line-clamp-1">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>{prod.specs.sweepMm}mm Sweep</span>
                          <span>•</span>
                          <span>{prod.specs.rpm} RPM</span>
                          <span>•</span>
                          <span>{prod.specs.powerWatts}W</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Quantity to Manufacture */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Quantity to Manufacture (Number of Units)
                </label>
                <span className="text-xs font-mono text-blue-700 font-bold">
                  {quantity} Unique QR Codes will be generated
                </span>
              </div>

              {/* Quantity Preset Chips */}
              <div className="flex flex-wrap gap-2 mb-3">
                {quantityPresets.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      quantity === num
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {num === 5 ? '★ 5 Units (Ceiling Fans)' : `${num} Units`}
                  </button>
                ))}
              </div>

              {/* Custom Number Input */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    placeholder="Enter custom quantity"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400">units</span>
                </div>
              </div>
            </div>

            {/* Step 3: Assembly Line & Quality Control Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Assembly Line
                </label>
                <select
                  value={assemblyLine}
                  onChange={(e) => setAssemblyLine(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="Line 1 - Active Air Ceiling Fan Assembly">Line 1 - Active Air Ceiling Fan Assembly</option>
                  <option value="Line 2 - Precision Ceiling Fan Balancing Line">Line 2 - Precision Balancing Line</option>
                  <option value="Line 3 - Winding & Dynamic Stator Line">Line 3 - Winding & Stator Line</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Plant / Facility Location
                </label>
                <input
                  type="text"
                  value={plantLocation}
                  onChange={(e) => setPlantLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Lead QC Inspector Name
                </label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={(e) => setInspectorName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Quality Audit Stamp
                </label>
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs text-emerald-700 font-mono font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>QC-PASSED-ISO9001:2015</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Batch Manufacturing Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                placeholder="Vibration test, winding insulation check, power factor readings..."
              />
            </div>

            {/* Action Submit Button */}
            <button
              type="submit"
              disabled={isGenerating || !selectedProduct}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating {quantity} Unique Serials & QR Codes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-blue-200" />
                  <span>Manufacture {quantity} Units & Generate Unique QR Codes</span>
                  <ArrowRight className="w-4 h-4 text-blue-200" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Selected Fan Specifications & Live Generation Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fan Specifications Card */}
          {selectedProduct && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="h-44 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/active-air-fan.jpg')) {
                      target.src = '/active-air-fan.jpg';
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-600 text-white font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                      Target Fan
                    </span>
                    <span className="text-xs font-mono text-blue-200 font-bold">
                      {selectedProduct.sku}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1 line-clamp-1">
                    {selectedProduct.name}
                  </h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Motor Type</span>
                    <span className="text-slate-800 font-semibold">{selectedProduct.specs.motorType}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Sweep Diameter</span>
                    <span className="text-slate-800 font-semibold">{selectedProduct.specs.sweepMm} mm ({Math.round(selectedProduct.specs.sweepMm / 25.4)}")</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Maximum Speed</span>
                    <span className="text-slate-800 font-semibold">{selectedProduct.specs.rpm} RPM</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Power Rating</span>
                    <span className="text-blue-700 font-mono font-bold">{selectedProduct.specs.powerWatts} Watts</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Standard Warranty</span>
                    <span className="text-emerald-700 font-bold">{selectedProduct.specs.warrantyMonths} Months</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Body Finish / Color</span>
                    <span className="text-slate-800 font-semibold">{selectedProduct.specs.color}</span>
                  </div>
                </div>

                {/* Serial Sequence Preview */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 text-blue-700 font-bold text-[11px] uppercase tracking-wider">
                    <Hash className="w-3.5 h-3.5" />
                    <span>Serial Scheme Preview</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Every unit gets a unique tamper-evident serial key + QR code:
                  </p>
                  <div className="font-mono text-slate-800 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="text-blue-700 font-semibold">GA-CF-202611-BXX-0001 (Unit #1)</div>
                    <div className="text-slate-400 pl-4">...</div>
                    <div className="text-blue-700 font-semibold">GA-CF-202611-BXX-000{quantity} (Unit #{quantity})</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Production Result Output (When a batch was manufactured) */}
      {lastProducedResult && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-lg space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Production Successful
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    {lastProducedResult.batch.batchNumber}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mt-1">
                  Manufactured {lastProducedResult.units.length} Units of {lastProducedResult.batch.productName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigateToQRStation(lastProducedResult.batch.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>Print All {lastProducedResult.units.length} QR Stickers</span>
              </button>
            </div>
          </div>

          {/* Quick Stats on the batch */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Serial Range</span>
              <span className="font-mono text-blue-700 font-bold block truncate">
                {lastProducedResult.batch.serialRangeStart}
              </span>
              <span className="text-slate-400 text-[10px] block">to {lastProducedResult.batch.serialRangeEnd}</span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Manufactured</span>
              <span className="text-lg font-bold text-slate-900 font-mono">
                {lastProducedResult.units.length} Units
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">QC Status</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 100% Passed
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Inspector</span>
              <span className="text-slate-800 font-semibold block truncate">
                {lastProducedResult.batch.inspectorName}
              </span>
            </div>
          </div>

          {/* Individual QR Codes Generated for Each Unit */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Generated QR Codes & Labels for this Batch
                </h3>
                <p className="text-xs text-slate-500">
                  Each physical fan has its own distinct QR code encoding unique serial number and authenticity cryptographic token.
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-50 px-2.5 py-1 rounded-lg text-blue-700 border border-blue-200 font-bold">
                {lastProducedResult.units.length} Labels Generated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {lastProducedResult.units.map((unit) => (
                <QRLabelCard
                  key={unit.id}
                  unit={unit}
                  onVerify={(u) => onNavigateToVerify(u.serialNumber)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
