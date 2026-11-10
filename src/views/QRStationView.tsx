import React, { useState, useMemo } from 'react';
import { ProductUnit, ManufacturingBatch, Product } from '../types';
import { QRLabelCard } from '../components/QRLabelCard';
import { 
  Printer, 
  Search, 
  QrCode, 
  Sparkles, 
  FileSpreadsheet
} from 'lucide-react';

interface QRStationViewProps {
  units: ProductUnit[];
  batches: ManufacturingBatch[];
  products: Product[];
  selectedBatchFilter?: string;
  onNavigateToVerify: (serial: string) => void;
  onOpenProduce: () => void;
}

export const QRStationView: React.FC<QRStationViewProps> = ({
  units,
  batches,
  products,
  selectedBatchFilter,
  onNavigateToVerify,
  onOpenProduce
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>(selectedBatchFilter || 'all');
  const [productFilter, setProductFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  React.useEffect(() => {
    if (selectedBatchFilter) {
      setBatchFilter(selectedBatchFilter);
    }
  }, [selectedBatchFilter]);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesSerial = u.serialNumber.toLowerCase().includes(q);
        const matchesProduct = u.productName.toLowerCase().includes(q);
        const matchesBatch = u.batchNumber.toLowerCase().includes(q);
        const matchesVcode = u.verificationCode.toLowerCase().includes(q);
        if (!matchesSerial && !matchesProduct && !matchesBatch && !matchesVcode) return false;
      }

      // Batch
      if (batchFilter !== 'all' && u.batchId !== batchFilter) return false;

      // Product
      if (productFilter !== 'all' && u.productId !== productFilter) return false;

      // Status
      if (statusFilter !== 'all' && u.status !== statusFilter) return false;

      return true;
    });
  }, [units, searchQuery, batchFilter, productFilter, statusFilter]);

  const handlePrintAll = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = [
      'Serial Number',
      'Product Name',
      'Model Number',
      'Category',
      'Batch Number',
      'Manufacturing Date',
      'QC Passed',
      'Status',
      'Verification Code',
      'Plant Location',
      'Sweep (mm)',
      'RPM',
      'Power (W)',
      'Color'
    ];

    const rows = filteredUnits.map(u => [
      `"${u.serialNumber}"`,
      `"${u.productName}"`,
      `"${u.modelNumber}"`,
      `"${u.category}"`,
      `"${u.batchNumber}"`,
      `"${new Date(u.manufacturingDate).toLocaleDateString()}"`,
      `"${u.qcPassed ? 'YES' : 'NO'}"`,
      `"${u.status}"`,
      `"${u.verificationCode}"`,
      `"${u.plantLocation}"`,
      u.specsSnapshot.sweepMm,
      u.specsSnapshot.rpm,
      u.specsSnapshot.powerWatts,
      `"${u.specsSnapshot.color}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GrandAir-Manufactured-Units-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header (Hidden on Print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 no-print">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <QrCode className="w-4 h-4" />
            <span>Label Management & Sticker Printing Station</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Manufactured Product QR Codes ({filteredUnits.length} Units)
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse, inspect, and mass-print individual sticker labels with unique serialized QR codes for fan boxes and warranty registration.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Export filtered records as CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintAll}
            disabled={filteredUnits.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Print {filteredUnits.length} Sticker Labels</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar (Hidden on Print) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search serial no, model, batch, or V-code..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Batch Filter */}
          <div className="lg:col-span-3">
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="all">All Production Batches ({batches.length})</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber} ({b.quantity} units - {b.productName})
                </option>
              ))}
            </select>
          </div>

          {/* Product Filter */}
          <div className="lg:col-span-3">
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="all">All Fan Models ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.modelNumber} - {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="all">All Statuses</option>
              <option value="manufactured">Manufactured</option>
              <option value="packaged">Packaged</option>
              <option value="dispatched">Dispatched</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <div>
            Showing <strong className="text-slate-900 font-bold">{filteredUnits.length}</strong> of{' '}
            <span className="text-slate-500">{units.length} total manufactured units</span>
          </div>
          {(batchFilter !== 'all' || productFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setBatchFilter('all');
                setProductFilter('all');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-700 text-xs font-bold"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Grid of QR Sticker Cards */}
      {filteredUnits.length === 0 ? (
        <div className="bg-white border-2 border-slate-200 border-dashed rounded-3xl p-12 text-center space-y-4 no-print shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
            <QrCode className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No Manufactured Units Found</h3>
            <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">
              There are no units matching your search or filters. Produce a new batch of fans to generate unique QR stickers.
            </p>
          </div>
          <button
            onClick={onOpenProduce}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Manufacture Batch of Fans</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 print-grid">
          {filteredUnits.map((unit) => (
            <QRLabelCard
              key={unit.id}
              unit={unit}
              onVerify={(u) => onNavigateToVerify(u.serialNumber)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
