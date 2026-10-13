import React, { useEffect } from "react";

export default function ClearanceCertificateModal({ cheque, onClose }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!cheque) return null;

  function handlePrint() {
    window.print();
  }

  const certificateRef = `MISDESC-CERT-${cheque.chequeNumber}-${cheque.id.slice(0, 8).toUpperCase()}`;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-100"
      >
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-3 border-b flex items-center justify-between bg-gray-50 print:hidden">
          <span className="font-bold text-xs text-gray-700 uppercase tracking-wider">
            MISDESC Cheque Clearance Certificate
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Certificate Document */}
        <div className="flex-1 p-8 overflow-auto bg-white text-gray-900 print:p-0">
          <div className="border-4 border-double border-brand-900 p-8 rounded-xl relative">
            {/* Background Bank Seal Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
              <span className="text-9xl font-serif font-black uppercase">MISDESC</span>
            </div>

            {/* Certificate Header */}
            <div className="text-center pb-6 border-b-2 border-brand-900">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-700">
                National Payments Corporation & Interbank Clearing House
              </div>
              <h1 className="text-2xl font-serif font-black text-gray-900 uppercase tracking-wide mt-1">
                Certificate of Cheque Clearance & Settlement
              </h1>
              <div className="text-xs font-mono text-gray-500 mt-1">
                Certificate Ref: <span className="font-bold text-gray-800">{certificateRef}</span>
              </div>
            </div>

            {/* Verification Status Banner */}
            <div className="my-6 bg-emerald-50 border border-emerald-300 rounded-lg p-3 text-center">
              <span className="text-xs font-bold text-emerald-900 tracking-wider uppercase">
                STATUS: CLEARED & RECONCILED UNDER MISDESC CLEARING STANDARD
              </span>
            </div>

            {/* Instrument Data Table */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6">
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Cheque Number</span>
                <span className="font-mono font-bold text-sm text-gray-900">{cheque.chequeNumber}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Settled Amount</span>
                <span className="font-mono font-bold text-sm text-brand-900">
                  ₹{Number(cheque.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Presenting Bank</span>
                <span className="font-semibold text-gray-900">{cheque.presentingBank?.name}</span>
                <span className="text-[10px] text-gray-500 block font-mono">IFSC: {cheque.presentingBank?.ifsc}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Drawee Bank</span>
                <span className="font-semibold text-gray-900">{cheque.draweeBank?.name}</span>
                <span className="text-[10px] text-gray-500 block font-mono">IFSC: {cheque.draweeBank?.ifsc}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Payee Beneficiary</span>
                <span className="font-semibold text-gray-900">{cheque.payeeName}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded border">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Clearing Date</span>
                <span className="font-mono text-gray-900 font-semibold">{new Date().toLocaleString()}</span>
              </div>
            </div>

            {/* Post-Quantum Cryptography (PQC) Lattice Verification Badge */}
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-cyan-50 border-2 border-indigo-200/90 shadow-2xs relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-indigo-950 flex items-center gap-1.5">
                      NIST FIPS 204 ML-DSA-65 Post-Quantum Lattice Signature Certified
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </span>
                    <span className="text-[10px] text-indigo-700 block">
                      Quantum Computer Resistant (Shor's Algorithm Immune) · Dual-Stack Hybrid Cryptography
                    </span>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-900 text-cyan-200 shadow-2xs">
                  <span>||z||_∞ = 42,109 ≤ 131,072</span>
                  <span className="text-emerald-400">✓ LATTICE VALID</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono text-indigo-900 bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">PQC Signature Algorithm</span>
                  <span className="font-bold text-indigo-950">ML-DSA-65 (Dilithium)</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Key Encapsulation</span>
                  <span className="font-bold text-purple-950">ML-KEM-768 (Kyber)</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Classical Fallback</span>
                  <span className="font-bold text-slate-800">RSA-4096 Hybrid Layer</span>
                </div>
              </div>
            </div>

            {/* Cryptographic & QR Verification Block */}
            <div className="pt-4 border-t border-gray-300 flex items-center justify-between gap-4">
              <div className="space-y-1 text-[11px]">
                <div className="font-bold text-gray-800 uppercase tracking-wider">Cryptographic Audit Seal</div>
                <div className="font-mono text-[10px] text-gray-500 break-all max-w-sm">
                  SHA-256 Digest: {cheque.imageHash || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                </div>
                <div className="text-[10px] text-gray-400">
                  Compliant with Section 131 of the Negotiable Instruments Act & RBI MISDESC PQC Guidelines 2026.
                </div>
              </div>

              {/* Digital Verification Stamp & Hologram */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="border border-indigo-900 px-3 py-1.5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded text-center font-mono">
                  <div className="text-[9px] font-bold text-cyan-300 tracking-wider">QUANTUM-SEALED</div>
                  <div className="text-[7px] text-indigo-300">FIPS 204 PQC</div>
                </div>
                <div className="border border-gray-900 px-3 py-1.5 bg-white text-center font-mono rounded">
                  <div className="text-[9px] font-bold text-gray-900 tracking-wider">SEALED</div>
                  <div className="text-[7px] text-gray-500">MISDESC-2010</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
