import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ProductUnit } from '../types';
import { CheckCircle2, Download, Printer, ShieldCheck, Copy, Check } from 'lucide-react';

interface QRLabelCardProps {
  unit: ProductUnit;
  onVerify?: (unit: ProductUnit) => void;
  onPrintSingle?: (unit: ProductUnit) => void;
}

export const QRLabelCard: React.FC<QRLabelCardProps> = ({ unit, onVerify }) => {
  const [copied, setCopied] = React.useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const handleCopySerial = () => {
    navigator.clipboard.writeText(unit.serialNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQrCode = () => {
    // Strictly target the QR Code SVG from qrContainerRef (not the Shield icon in the header)
    const svg = qrContainerRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // High resolution 500x560 for crisp printable sticker
    canvas.width = 500;
    canvas.height = 560;

    img.onload = () => {
      if (ctx) {
        // Clean White Card Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Slate Outer Border
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 3;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

        // Header Background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(15, 15, canvas.width - 30, 65);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, 80);
        ctx.lineTo(canvas.width - 15, 80);
        ctx.stroke();

        // Header Title
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('GRAND AIR', 32, 48);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
        ctx.fillText('ACTIVE AIR SERIALIZED FAN TAG', 32, 68);

        // QC Stamp Badge in Header
        ctx.fillStyle = '#ecfdf5';
        ctx.strokeStyle = '#a7f3d0';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(canvas.width - 130, 32, 98, 28, 6);
        } else {
          ctx.rect(canvas.width - 130, 32, 98, 28);
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#059669';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('QC PASSED', canvas.width - 81, 50);

        // Product Name
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(unit.productName, canvas.width / 2, 115);

        // Model & Batch Info
        ctx.fillStyle = '#475569';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`MODEL: ${unit.modelNumber}  |  BATCH: ${unit.batchNumber}`, canvas.width / 2, 138);

        // Draw The Actual QR Code Image
        const qrSize = 230;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY = 155;
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Serial Number
        ctx.fillStyle = '#1d4ed8';
        ctx.font = 'bold 18px monospace';
        ctx.fillText(unit.serialNumber, canvas.width / 2, 435);

        // Security V-CODE
        ctx.fillStyle = '#334155';
        ctx.font = 'bold 13px monospace';
        ctx.fillText(`SECURITY CODE: ${unit.verificationCode}`, canvas.width / 2, 462);

        // Specs
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.fillText(`${unit.specsSnapshot.sweepMm}mm Sweep  •  ${unit.specsSnapshot.rpm} RPM  •  ${unit.specsSnapshot.powerWatts}W  •  ${unit.specsSnapshot.color}`, canvas.width / 2, 492);

        // Guidance Footer
        ctx.fillStyle = '#94a3b8';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText('Scan QR to verify genuine product authenticity & warranty', canvas.width / 2, 525);

        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR-${unit.serialNumber}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const printSingleLabel = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    // Strictly target the QR Code SVG from qrContainerRef
    const svg = qrContainerRef.current?.querySelector('svg');
    const svgHtml = svg ? svg.outerHTML : '';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Grand Air Active Air Label - ${unit.serialNumber}</title>
          <style>
            @page { size: auto; margin: 10mm; }
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 15px; color: #000; }
            .label-box {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 16px;
              max-width: 380px;
              margin: 0 auto;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid #000;
              padding-bottom: 8px;
              margin-bottom: 12px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .brand-title { font-size: 18px; font-weight: 800; letter-spacing: 1px; }
            .tagline { font-size: 9px; color: #555; text-transform: uppercase; font-weight: 600; }
            .prod-title { font-size: 14px; font-weight: 700; margin: 4px 0; }
            .model-badge { display: inline-block; background: #eee; padding: 2px 6px; font-size: 11px; font-weight: 600; border-radius: 4px; }
            .qr-center { text-align: center; margin: 14px 0; }
            .serial-no { font-family: monospace; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-align: center; margin: 6px 0; }
            .grid-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 8px; margin-top: 8px; }
            .qc-stamp { border: 1.5px solid #16a34a; color: #16a34a; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; }
            .vcode { font-family: monospace; font-size: 10px; color: #444; }
          </style>
        </head>
        <body>
          <div class="label-box">
            <div class="header">
              <div>
                <div class="brand-title">GRAND AIR</div>
                <div class="tagline">Active Air Ceiling Fan Tag</div>
              </div>
              <div class="qc-stamp">QC PASSED</div>
            </div>
            
            <div class="prod-title">${unit.productName}</div>
            <div>
              <span class="model-badge">MODEL: ${unit.modelNumber}</span>
              <span class="model-badge" style="margin-left: 4px;">BATCH: ${unit.batchNumber}</span>
            </div>

            <div class="qr-center">
              ${svgHtml}
            </div>

            <div class="serial-no">${unit.serialNumber}</div>
            <div style="text-align: center;" class="vcode">V-CODE: ${unit.verificationCode}</div>

            <div class="grid-specs">
              <div><strong>SIZE:</strong> ${unit.specsSnapshot.sweepMm} mm</div>
              <div><strong>SPEED:</strong> ${unit.specsSnapshot.rpm} RPM</div>
              <div><strong>POWER:</strong> ${unit.specsSnapshot.powerWatts} W</div>
              <div><strong>COLOR:</strong> ${unit.specsSnapshot.color}</div>
              <div><strong>MFG DATE:</strong> ${new Date(unit.manufacturingDate).toLocaleDateString()}</div>
              <div><strong>WARRANTY:</strong> ${unit.specsSnapshot.warrantyMonths} Months</div>
            </div>
            <div style="font-size: 8px; text-align: center; color: #666; margin-top: 10px;">
              Scan QR to verify authenticity & warranty at Grand Air Portal
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      ref={cardRef} 
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group print-label-item"
    >
      {/* Label Header */}
      <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-sm">
            GA
          </div>
          <div>
            <div className="text-xs font-black tracking-wider text-slate-900">GRAND AIR</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-tight font-semibold">Active Air Fan Tag</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>QC PASSED</span>
        </div>
      </div>

      {/* Product Details Header */}
      <div className="px-4 pt-3 pb-2">
        <div className="text-sm font-bold text-slate-900 line-clamp-1" title={unit.productName}>
          {unit.productName}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded font-semibold">
            {unit.modelNumber}
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {unit.batchNumber}
          </span>
        </div>
      </div>

      {/* QR Code Container */}
      <div 
        ref={qrContainerRef} 
        className="px-4 py-3 flex flex-col items-center justify-center bg-white mx-3 my-1 rounded-xl border border-slate-200 shadow-inner"
      >
        <div className="p-1 bg-white">
          <QRCodeSVG
            value={unit.serialNumber || unit.qrPayload}
            size={135}
            level="M"
            includeMargin={false}
          />
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 flex items-center gap-1">
          <span>Scan to Verify Authenticity</span>
        </div>
      </div>

      {/* Serial Number & Security Code */}
      <div className="px-4 py-2 space-y-1">
        <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          <div className="space-y-0.5 overflow-hidden">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Unique Serial Number</div>
            <div className="text-xs font-mono font-black text-blue-700 truncate">
              {unit.serialNumber}
            </div>
          </div>
          <button
            onClick={handleCopySerial}
            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
            title="Copy Serial Number"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 pt-1 font-mono">
          <span>V-CODE: <strong className="text-slate-800">{unit.verificationCode}</strong></span>
          <span>{new Date(unit.manufacturingDate).toLocaleDateString()}</span>
        </div>
      </div>

      {/* Specifications Footer */}
      <div className="px-4 py-2.5 mt-auto border-t border-slate-200 bg-slate-50/70 grid grid-cols-2 gap-y-1 text-[11px] text-slate-700">
        <div><span className="text-slate-500">Sweep:</span> <strong>{unit.specsSnapshot.sweepMm}mm</strong></div>
        <div><span className="text-slate-500">Speed:</span> <strong>{unit.specsSnapshot.rpm} RPM</strong></div>
        <div><span className="text-slate-500">Power:</span> <strong className="text-blue-700">{unit.specsSnapshot.powerWatts}W</strong></div>
        <div><span className="text-slate-500">Warranty:</span> <strong>{unit.specsSnapshot.warrantyMonths}m</strong></div>
      </div>

      {/* Action buttons (hidden on print) */}
      <div className="px-3 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between gap-1.5 no-print">
        <button
          onClick={printSingleLabel}
          className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          title="Print Label"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print</span>
        </button>

        <button
          onClick={downloadQrCode}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition-colors"
          title="Download QR PNG"
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {onVerify && (
          <button
            onClick={() => onVerify(unit)}
            className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verify</span>
          </button>
        )}
      </div>
    </div>
  );
};
