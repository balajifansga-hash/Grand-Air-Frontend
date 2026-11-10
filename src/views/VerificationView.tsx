import React, { useState, useEffect, useRef } from 'react';
import { ProductUnit } from '../types';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Clock, 
  Award,
  Camera,
  CameraOff
} from 'lucide-react';

interface VerificationViewProps {
  initialSerial?: string;
  onNavigateToQRStation?: () => void;
}

export const VerificationView: React.FC<VerificationViewProps> = ({
  initialSerial
}) => {
  const [searchInput, setSearchInput] = useState<string>(initialSerial || '');
  const [searchedUnit, setSearchedUnit] = useState<ProductUnit | null | undefined>(undefined);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<any>(null);

  const performSearch = async (serial: string) => {
    if (!serial.trim()) return;
    setHasSearched(true);
    
    // Extract clean Grand Air serial if embedded in JSON or URL
    const match = serial.match(/GA-[A-Z0-9]{2,4}-\d{6}-B\d{2,4}-\d{3,5}/i);
    const cleanSerial = match ? match[0].toUpperCase() : serial.trim().toUpperCase();

    // Try backend verification first
    try {
      const result = await ApiService.verifyUnit(cleanSerial);
      if (result && result.genuine) {
        const u = StorageService.getUnitBySerial(cleanSerial);
        if (u) {
          setSearchedUnit({ ...u, scannedCount: result.certificate.verificationCount });
          return;
        }
      }
    } catch {
      // fallback
    }

    // Local storage lookup
    const unit = StorageService.getUnitBySerial(cleanSerial);
    if (unit) {
      StorageService.recordScan(unit.serialNumber);
    }
    setSearchedUnit(unit);
  };

  useEffect(() => {
    if (initialSerial) {
      setSearchInput(initialSerial);
      performSearch(initialSerial);
    }
  }, [initialSerial]);

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);

      // Start BarcodeDetector loop if supported
      if ('BarcodeDetector' in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const raw = barcodes[0].rawValue;
                handleScannedData(raw);
              }
            } catch (err) {
              console.error('QR detect error:', err);
            }
          }
        }, 400);
      }
    } catch {
      setCameraError('Camera access not granted or camera not available on this device.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleScannedData = (rawText: string) => {
    stopCamera();
    let serialToSearch = rawText.trim();

    // Direct Grand Air serial regex extractor (GA-CF-YYYYMM-BXX-XXXX)
    const match = rawText.match(/GA-[A-Z0-9]{2,4}-\d{6}-B\d{2,4}-\d{3,5}/i);
    if (match) {
      serialToSearch = match[0].toUpperCase();
    } else {
      // Try parsing JSON payload if it is structured
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.sn) serialToSearch = parsed.sn;
      } catch {
        // Check if URL has ?verify=... or ?sn=...
        try {
          const url = new URL(rawText);
          const sn = url.searchParams.get('verify') || url.searchParams.get('sn');
          if (sn) serialToSearch = sn;
        } catch {
          // use raw text
        }
      }
    }

    setSearchInput(serialToSearch);
    performSearch(serialToSearch);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchInput);
  };

  // Sample units for quick 1-click test
  const sampleUnits = StorageService.getUnits().slice(0, 3);

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-slate-200 pb-5">
        <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Grand Air Authenticity Portal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Active Air Serial & QR Verification
        </h1>
        <p className="text-slate-500 text-sm max-w-xl mx-auto">
          Scan the QR code printed on the Active Air box or enter the serial number to verify genuine manufacturing origin, air delivery ratings, and active warranty status.
        </p>
      </div>

      {/* Camera Live Viewfinder Modal/Box */}
      {isCameraActive && (
        <div className="bg-white border-2 border-blue-500 rounded-3xl p-4 shadow-2xl relative overflow-hidden text-center animate-fade-in">
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-bold uppercase text-blue-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Camera QR Scanner Active</span>
            </span>
            <button
              onClick={stopCamera}
              className="text-xs font-semibold px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200"
            >
              Close Camera
            </button>
          </div>

          <div className="relative max-w-md mx-auto aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            {/* Reticle Overlay */}
            <div className="absolute inset-0 border-2 border-white/50 m-8 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="w-16 h-16 border-t-2 border-b-2 border-blue-400 animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Hold the Grand Air QR code in front of the lens to scan automatically.
          </p>
        </div>
      )}

      {cameraError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 text-center">
          {cameraError}
        </div>
      )}

      {/* Serial Input Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="e.g. GA-CF-202611-B01-0001"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 shadow-inner"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify</span>
            </button>

            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              title="Scan with Camera"
            >
              {isCameraActive ? <CameraOff className="w-4 h-4 text-rose-500" /> : <Camera className="w-4 h-4 text-blue-600" />}
              <span className="hidden sm:inline">{isCameraActive ? 'Stop' : 'Camera'}</span>
            </button>
          </div>
        </form>

        {/* Quick test serial chips */}
        {sampleUnits.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
            <span>Quick Test:</span>
            {sampleUnits.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSearchInput(u.serialNumber);
                  performSearch(u.serialNumber);
                }}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded text-blue-700 font-mono font-semibold transition-colors"
              >
                {u.serialNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Verification Result: GENUINE PRODUCT CERTIFICATE */}
      {searchedUnit && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl animate-fade-in">
          {/* Certificate Top Banner */}
          <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center text-white">
                <ShieldCheck className="w-9 h-9" />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-extrabold bg-white/20 px-2 py-0.5 rounded">
                  Official Verification Certificate
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1">
                  100% Genuine Grand Air Product
                </h2>
                <div className="text-emerald-100 text-xs">
                  Active breeze fan with excellent performance • Quality Certified
                </div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur rounded-xl px-4 py-2 text-right">
              <div className="text-[10px] text-emerald-200 uppercase font-bold">Serial Number</div>
              <div className="font-mono font-bold text-white text-sm">{searchedUnit.serialNumber}</div>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QR and Security Code */}
              <div className="md:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center shadow-inner">
                <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 mb-2">
                  <QRCodeSVG
                    value={searchedUnit.qrPayload}
                    size={140}
                    level="H"
                  />
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  SECURITY V-CODE: <strong className="text-blue-700">{searchedUnit.verificationCode}</strong>
                </div>
                <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>QC Passed & Authenticated</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="md:col-span-8 space-y-4">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                    MODEL: {searchedUnit.modelNumber}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-2">
                    {searchedUnit.productName}
                  </h3>
                </div>

                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Size / Sweep</span>
                    <span className="text-slate-800 font-semibold">{searchedUnit.specsSnapshot.sweepMm} mm</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Revolution (Speed)</span>
                    <span className="text-slate-800 font-semibold">{searchedUnit.specsSnapshot.rpm} RPM</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Power Consumption</span>
                    <span className="text-blue-700 font-mono font-bold">{searchedUnit.specsSnapshot.powerWatts}W</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Color Finish</span>
                    <span className="text-slate-800 font-semibold">{searchedUnit.specsSnapshot.color}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Batch Number</span>
                    <span className="text-slate-800 font-mono font-semibold truncate block">{searchedUnit.batchNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Manufacturing Date</span>
                    <span className="text-slate-800 font-semibold">{new Date(searchedUnit.manufacturingDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Warranty Status Banner */}
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold text-emerald-800">
                        Warranty Active ({searchedUnit.specsSnapshot.warrantyMonths} Months Coverage)
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Valid until: <strong className="text-slate-900">{new Date(searchedUnit.warrantyExpiryDate).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded-lg shadow-sm">
                    Active Protection
                  </span>
                </div>
              </div>
            </div>

            {/* Manufacturing Traceability */}
            <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-500">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Plant Location</span>
                <span className="text-slate-800 font-medium">{searchedUnit.plantLocation}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Auditor & Inspector</span>
                <span className="text-slate-800 font-medium">{searchedUnit.inspectorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Count</span>
                <span className="text-blue-700 font-mono font-bold">{searchedUnit.scannedCount} times scanned</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Search State */}
      {hasSearched && searchedUnit === undefined && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-rose-900">Serial Number Not Found in Grand Air Registry</h3>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            The serial number <strong>"{searchInput}"</strong> is not recognized as a registered Grand Air unit. 
            Please check the spelling or manufacture a batch to create valid serialized units.
          </p>
        </div>
      )}
    </div>
  );
};
