import React, { useState } from 'react';
import { ProductUnit, UnitStatus } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { 
  FileSpreadsheet, 
  Search, 
  QrCode, 
  ShieldCheck, 
  ExternalLink, 
  Copy, 
  Check,
  UserCheck,
  X,
  CreditCard,
  Mail,
  Phone,
  Calendar,
  Sparkles
} from 'lucide-react';

interface LedgerViewProps {
  units: ProductUnit[];
  onUnitsUpdated: () => void;
  onNavigateToVerify: (serial: string) => void;
  onInspectUnit: (unit: ProductUnit) => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  units,
  onUnitsUpdated,
  onNavigateToVerify,
  onInspectUnit
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [selectedCustomerUnit, setSelectedCustomerUnit] = useState<ProductUnit | null>(null);

  const filtered = units.filter((u) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const match = 
        u.serialNumber.toLowerCase().includes(q) ||
        u.productName.toLowerCase().includes(q) ||
        u.batchNumber.toLowerCase().includes(q) ||
        u.verificationCode.toLowerCase().includes(q) ||
        (u.warrantyRegistration?.customerName && u.warrantyRegistration.customerName.toLowerCase().includes(q)) ||
        (u.warrantyRegistration?.customerUpiId && u.warrantyRegistration.customerUpiId.toLowerCase().includes(q)) ||
        (u.warrantyRegistration?.customerPhone && u.warrantyRegistration.customerPhone.includes(q));
      if (!match) return false;
    }
    if (statusFilter === 'registered') {
      return !!u.warrantyRegistration;
    }
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });

  const handleCopy = (sn: string) => {
    navigator.clipboard.writeText(sn);
    setCopiedSerial(sn);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const handleStatusChange = async (serialNumber: string, newStatus: UnitStatus) => {
    try {
      if (await ApiService.isBackendOnline()) {
        await ApiService.updateUnitStatus(serialNumber, newStatus);
      }
    } catch {
      // fallback
    }
    StorageService.updateUnitStatus(serialNumber, newStatus);
    onUnitsUpdated();
  };

  const getStatusBadge = (status: UnitStatus) => {
    switch (status) {
      case 'manufactured':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'packaged':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'dispatched':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'sold':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Grand Air Unit Serialization Registry</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Manufactured Units Ledger ({units.length})
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Complete database of every individual fan unit manufactured, its cryptographic serial ID, batch lineage, and dispatch lifecycle.
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by serial number, batch, or fan model..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 whitespace-nowrap">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="all">All Units ({units.length})</option>
            <option value="registered">🌟 Customer Registered & UPI Redeem ({units.filter(u => !!u.warrantyRegistration).length})</option>
            <option value="manufactured">Manufactured</option>
            <option value="packaged">Packaged</option>
            <option value="dispatched">Dispatched</option>
            <option value="sold">Sold</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4">Unique Serial Number</th>
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Mfg Date</th>
                <th className="py-3.5 px-4">QC Stamp</th>
                <th className="py-3.5 px-4">Lifecycle & Registration</th>
                <th className="py-3.5 px-4">Security V-Code</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans text-xs">
                    No manufactured units found. Manufacture a batch to start the serialization ledger.
                  </td>
                </tr>
              ) : (
                filtered.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-blue-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{unit.serialNumber}</span>
                        <button
                          onClick={() => handleCopy(unit.serialNumber)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title="Copy Serial"
                        >
                          {copiedSerial === unit.serialNumber ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                      <div className="line-clamp-1 max-w-[200px]" title={unit.productName}>
                        {unit.productName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {unit.modelNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {unit.batchNumber}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500 whitespace-nowrap">
                      {new Date(unit.manufacturingDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>PASS</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <select
                        value={unit.status}
                        onChange={(e) => handleStatusChange(unit.serialNumber, e.target.value as UnitStatus)}
                        className={`text-[11px] font-semibold uppercase px-2 py-1 rounded border bg-white cursor-pointer focus:outline-none ${getStatusBadge(unit.status)}`}
                      >
                        <option value="manufactured">Manufactured</option>
                        <option value="packaged">Packaged</option>
                        <option value="dispatched">Dispatched</option>
                        <option value="sold">Sold</option>
                      </select>

                      {unit.warrantyRegistration && (
                        <div 
                          onClick={() => setSelectedCustomerUnit(unit)}
                          className="mt-1 cursor-pointer flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded transition-all"
                          title="Click to view Customer Profile & UPI Details"
                        >
                          <UserCheck className="w-3 h-3 text-emerald-600" />
                          <span className="truncate max-w-[130px]">{unit.warrantyRegistration.customerName}</span>
                          <span className="text-emerald-600 font-mono text-[9px]">₹{unit.warrantyRegistration.redeemAmount || 150}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-bold font-mono">
                      {unit.verificationCode}
                    </td>
                    <td className="py-3 px-4 text-right font-sans whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {unit.warrantyRegistration && (
                          <button
                            onClick={() => setSelectedCustomerUnit(unit)}
                            className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 transition-colors"
                            title="View Customer Warranty & UPI Claim"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                          </button>
                        )}
                        <button
                          onClick={() => onInspectUnit(unit)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                          title="View QR Label Sticker"
                        >
                          <QrCode className="w-3.5 h-3.5 text-blue-600" />
                        </button>
                        <button
                          onClick={() => onNavigateToVerify(unit.serialNumber)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                          title="Inspect Authenticity Certificate"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Warranty & UPI Claim Details Modal */}
      {selectedCustomerUnit && selectedCustomerUnit.warrantyRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden relative">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white relative">
              <button
                onClick={() => setSelectedCustomerUnit(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-white/20 border border-white/30">
                  Customer Claim Verified
                </span>
                <span className="text-emerald-100 text-xs">Grand Air Live Registry</span>
              </div>
              <h2 className="text-xl font-black">Customer Warranty Registration</h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Serial: <strong className="font-mono">{selectedCustomerUnit.serialNumber}</strong>
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase text-emerald-700 tracking-wider">
                    Redeem Cashback Payout
                  </div>
                  <div className="text-2xl font-black text-emerald-900 font-mono">
                    ₹{selectedCustomerUnit.warrantyRegistration.redeemAmount || 150}
                  </div>
                  <div className="text-[11px] text-emerald-700">
                    UPI: <strong className="font-mono">{selectedCustomerUnit.warrantyRegistration.customerUpiId || 'Not provided'}</strong>
                  </div>
                </div>
                <div className="px-3 py-1 bg-emerald-600 text-white rounded-full text-xs font-bold shadow-xs">
                  {selectedCustomerUnit.warrantyRegistration.redeemStatus || 'Processing'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Customer Name</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {selectedCustomerUnit.warrantyRegistration.customerName}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Mobile Number</div>
                  <div className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                    {selectedCustomerUnit.warrantyRegistration.customerPhone}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Customer Email</div>
                  <div className="text-slate-800 font-medium truncate mt-0.5">
                    {selectedCustomerUnit.warrantyRegistration.customerEmail || 'N/A'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">Registration Date</div>
                  <div className="text-slate-800 font-medium mt-0.5">
                    {new Date(selectedCustomerUnit.warrantyRegistration.registeredAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <div className="font-bold text-blue-900">Purchased Appliance Details:</div>
                <div className="text-slate-700">
                  Model: <strong>{selectedCustomerUnit.productName}</strong> ({selectedCustomerUnit.modelNumber})
                </div>
                <div className="text-slate-700">
                  Batch: <span className="font-mono">{selectedCustomerUnit.batchNumber}</span>
                </div>
                <div className="text-emerald-700 font-semibold">
                  Warranty Valid Until: {new Date(selectedCustomerUnit.warrantyExpiryDate).toLocaleDateString()} (24 Months)
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerUnit(null);
                    onNavigateToVerify(selectedCustomerUnit.serialNumber);
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Full Warranty Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomerUnit(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
