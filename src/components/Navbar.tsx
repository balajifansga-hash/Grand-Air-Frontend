import React from 'react';
import { 
  Fan, 
  QrCode, 
  Factory, 
  LayoutDashboard, 
  Boxes, 
  FileSpreadsheet, 
  CheckCircle,
  LogOut,
  UserCheck,
  Trash2
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenQuickProduce?: () => void;
  onResetData?: () => void;
  totalManufacturedCount: number;
  isBackendConnected?: boolean;
  currentUser?: string | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  totalManufacturedCount,
  isBackendConnected = true,
  currentUser = 'admin',
  onLogout,
  onResetData
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Boxes },
    { id: 'manufacture', label: 'Production', icon: Factory },
    { id: 'qr-station', label: 'QR Station', icon: QrCode },
    { id: 'ledger', label: 'Units Ledger', icon: FileSpreadsheet },
    { id: 'verify', label: 'Scan & Verify', icon: CheckCircle },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 no-print shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo & Title (Left) */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none flex-shrink-0" 
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 group">
              <Fan className="w-5 h-5 text-white group-hover:rotate-180 transition-transform duration-700" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wider text-slate-900 whitespace-nowrap">
                GRAND AIR
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                Admin
              </span>
            </div>
          </div>

          {/* Navigation Links (Center) */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Status & User Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Database status indicator */}
            <div 
              title={isBackendConnected ? "Connected to MongoDB Atlas Cloud" : "Running on Local Storage Fallback"}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border select-none ${
                isBackendConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isBackendConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">{isBackendConnected ? 'MongoDB Atlas' : 'Local Storage'}</span>
              <span className="sm:hidden">{isBackendConnected ? 'Online' : 'Offline'}</span>
            </div>

            {/* Total units badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Units:</span>
              <span className="font-mono font-bold text-slate-900">{totalManufacturedCount}</span>
            </div>

            {/* Clear Manufacturing Data Button */}
            {onResetData && (
              <button
                onClick={onResetData}
                title="Wipe all manufactured QR units and batches while keeping the 3 fan models permanently"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-xs active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Clear QR & Batches</span>
              </button>
            )}

            {/* User Profile & Sign Out */}
            {currentUser && onLogout && (
              <div className="flex items-center gap-1 border-l border-slate-200 pl-2 sm:pl-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold px-2 py-1 bg-slate-100 rounded-lg">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-mono text-[11px]">{currentUser}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign Out of Admin Portal"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Responsive Mobile / Tablet Navigation Row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
