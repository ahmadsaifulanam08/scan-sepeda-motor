import { useState } from 'react';
import { Cpu, Cable, AlertCircle, Info, CheckCircle, RefreshCw } from 'lucide-react';

interface PinoutDetail {
  pin: string;
  color: string;
  desc: string;
}

export default function WiringDiagram() {
  const [selectedBrand, setSelectedBrand] = useState<'honda_kline' | 'honda_euro5' | 'yamaha_kline' | 'yamaha_euro5'>('honda_kline');

  const hondaKlinePins: PinoutDetail[] = [
    { pin: 'Pin 1 (GND)', color: 'bg-black text-white', desc: 'Massa / Ground Aki (-)' },
    { pin: 'Pin 2 (VCC 12V)', color: 'bg-red-600 text-white', desc: 'Tegangan Aki (+) dari Kunci Kontak' },
    { pin: 'Pin 3 (K-Line)', color: 'bg-blue-600 text-white', desc: 'Jalur Komunikasi Serial Satu-Kabel (K-Line)' },
    { pin: 'Pin 4 (SCS)', color: 'bg-green-600 text-white', desc: 'Service Connector Switch (Hubungkan ke GND untuk Reset Manual)' },
  ];

  const yamahaKlinePins: PinoutDetail[] = [
    { pin: 'Pin 1 (K-Line)', color: 'bg-blue-600 text-white', desc: 'Jalur Komunikasi Serial K-Line (Biru/Hitam atau Hijau)' },
    { pin: 'Pin 2 (GND)', color: 'bg-black text-white', desc: 'Massa / Ground Aki (-)' },
    { pin: 'Pin 3 (VCC 12V)', color: 'bg-red-600 text-white', desc: 'Tegangan Aki (+) dari Kunci Kontak' },
  ];

  const euro5Pins: PinoutDetail[] = [
    { pin: 'Pin 1 (CAN-H)', color: 'bg-orange-500 text-white', desc: 'CAN High Communication (Standar OBD2 ISO 15765-4)' },
    { pin: 'Pin 2 (CAN-L)', color: 'bg-yellow-500 text-black', desc: 'CAN Low Communication (Standar OBD2 ISO 15765-4)' },
    { pin: 'Pin 3 (K-Line)', color: 'bg-blue-600 text-white', desc: 'K-Line Communication (Jalur komunikasi cadangan)' },
    { pin: 'Pin 4 (GND)', color: 'bg-black text-white', desc: 'Ground Mesin/Aki (-)' },
    { pin: 'Pin 5 (VCC 12V)', color: 'bg-red-600 text-white', desc: 'Tegangan Baterai (+) Konstan dari Sekring ECU' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="wiring-diagram-container">
      {/* Kiri: Selector & Panduan Koneksi */}
      <div className="lg:col-span-5 bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl" id="wiring-guide-panel">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-display">
          <Cable className="text-orange-500 h-5 w-5" />
          Konfigurasi Koneksi FTDI
        </h3>

        {/* Brand/Type Selector */}
        <div className="space-y-2 mb-6" id="wiring-brand-selector">
          <label className="text-xs text-slate-400 font-mono block">Merek & Tipe Protokol Motor:</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setSelectedBrand('honda_kline')}
              className={`p-3 rounded-lg text-xs font-semibold border text-left transition-all ${
                selectedBrand === 'honda_kline'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-[#0a0c10] border-[#1c2230] text-slate-300 hover:border-slate-700'
              }`}
            >
              Honda 4-Pin Red (K-Line)
            </button>
            <button
              onClick={() => setSelectedBrand('honda_euro5')}
              className={`p-3 rounded-lg text-xs font-semibold border text-left transition-all ${
                selectedBrand === 'honda_euro5'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-[#0a0c10] border-[#1c2230] text-slate-300 hover:border-slate-700'
              }`}
            >
              Honda 6-Pin Red (Euro 5)
            </button>
            <button
              onClick={() => setSelectedBrand('yamaha_kline')}
              className={`p-3 rounded-lg text-xs font-semibold border text-left transition-all ${
                selectedBrand === 'yamaha_kline'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-[#0a0c10] border-[#1c2230] text-slate-300 hover:border-slate-700'
              }`}
            >
              Yamaha 3-Pin Grey (K-Line)
            </button>
            <button
              onClick={() => setSelectedBrand('yamaha_euro5')}
              className={`p-3 rounded-lg text-xs font-semibold border text-left transition-all ${
                selectedBrand === 'yamaha_euro5'
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400'
                  : 'bg-[#0a0c10] border-[#1c2230] text-slate-300 hover:border-slate-700'
              }`}
            >
              Yamaha 6-Pin Black (Euro 5)
            </button>
          </div>
        </div>

        {/* Pengaturan Serial Port */}
        <div className="bg-[#0a0c10] border border-[#1c2230] rounded-lg p-4 mb-6" id="serial-settings-card">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-1.5 font-mono">
            <Cpu className="h-4 w-4 text-orange-500" />
            PENGATURAN PORT SERIAL (FTDI FT232RL)
          </h4>
          <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
            <div className="text-slate-400">Baud Rate:</div>
            <div className="text-orange-450 font-bold">
              {selectedBrand.includes('euro5') ? '115200 bps (CAN)' : '10400 bps (K-Line)'}
            </div>
            <div className="text-slate-400">Data Bits:</div>
            <div className="text-slate-200">8</div>
            <div className="text-slate-400">Stop Bits:</div>
            <div className="text-slate-200">1</div>
            <div className="text-slate-400">Parity:</div>
            <div className="text-slate-200">None (Tanpa Parity)</div>
            <div className="text-slate-400">Flow Control:</div>
            <div className="text-slate-200">None</div>
            <div className="text-slate-400">K-Line Pull-up:</div>
            <div className="text-orange-400">
              {selectedBrand.includes('euro5') ? 'Tidak Perlu' : 'Resistor 510Ω ke VCC 12V'}
            </div>
          </div>
        </div>

        {/* Penjelasan Pinout */}
        <div className="space-y-3" id="pinout-detail-list">
          <span className="text-xs text-slate-400 font-mono block">Fungsi Pin Soket DLC Motor:</span>
          {(selectedBrand === 'honda_kline'
            ? hondaKlinePins
            : selectedBrand === 'yamaha_kline'
            ? yamahaKlinePins
            : euro5Pins
          ).map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start bg-[#0a0c10] p-2.5 rounded-lg border border-[#1c2230]">
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${item.color}`}>
                {item.pin}
              </span>
              <p className="text-xs text-slate-300 leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Kanan: Diagram Skema Interaktif (SVG) */}
      <div className="lg:col-span-7 bg-[#11141b] border border-[#1c2230] rounded-xl p-6 flex flex-col shadow-xl" id="wiring-schematic-panel">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2 font-display">
            <Info className="text-orange-500 h-5 w-5" />
            Skema Pengkabelan & Rangkaian K-Line
          </h3>
          <span className="text-[10px] bg-[#0a0c10] text-slate-400 px-2 py-0.5 rounded font-mono">
            Interactive Vector Diagram
          </span>
        </div>

        {/* DIY Adapter Guide Alert */}
        <div className="mb-4 bg-orange-950/20 border border-orange-900/50 p-3.5 rounded-lg flex gap-2.5" id="diy-circuit-alert">
          <AlertCircle className="text-orange-400 h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-orange-400">PENTING: Komunikasi K-Line (Satu Kabel)</span> memerlukan penggabungan jalur <span className="font-semibold text-orange-400">TX</span> dan <span className="font-semibold text-sky-400">RX</span> pada FTDI. Anda dapat menghubungkan TX ke RX melalui sebuah <span className="underline decoration-orange-400 font-mono">Dioda Fast-Switching 1N4148</span> (Kandela/garis hitam menghadap ke TX) agar sinyal tidak bertabrakan, ditambah Resistor Pull-Up ke Jalur Aki +12V.
          </div>
        </div>

        {/* Diagram SVG Box */}
        <div className="flex-1 bg-[#0a0c10] rounded-lg p-4 border border-[#1c2230] flex items-center justify-center min-h-[300px]" id="svg-schematic-container">
          <svg viewBox="0 0 600 320" className="w-full h-auto max-h-[380px]">
            {/* Background Grid */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.03" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" rx="8" />

            {/* FTDI CHIP BOARD (Left) */}
            <g id="ftdi-visual-board">
              <rect x="30" y="40" width="130" height="150" rx="8" fill="#1b365d" stroke="#3b82f6" strokeWidth="2" />
              <text x="95" y="65" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                FTDI FT232RL
              </text>
              <text x="95" y="80" fill="#93c5fd" fontSize="9" textAnchor="middle" fontFamily="monospace">
                USB-to-TTL Adapter
              </text>

              {/* FTDI Microchip inside */}
              <rect x="65" y="95" width="60" height="40" fill="#1e293b" rx="2" stroke="#64748b" />
              <text x="95" y="118" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">FTDICHIP</text>

              {/* FTDI Pins */}
              <g transform="translate(160, 0)" fontSize="10" fontFamily="monospace" fontWeight="bold">
                {/* RXD */}
                <line x1="0" y1="60" x2="15" y2="60" stroke="#38bdf8" strokeWidth="2" />
                <rect x="15" y="52" width="25" height="16" rx="2" fill="#0284c7" />
                <text x="27.5" y="64" fill="#ffffff" textAnchor="middle" fontSize="9">RX</text>

                {/* TXD */}
                <line x1="0" y1="90" x2="15" y2="90" stroke="#10b981" strokeWidth="2" />
                <rect x="15" y="82" width="25" height="16" rx="2" fill="#059669" />
                <text x="27.5" y="94" fill="#ffffff" textAnchor="middle" fontSize="9">TX</text>

                {/* GND */}
                <line x1="0" y1="120" x2="15" y2="120" stroke="#64748b" strokeWidth="2" />
                <rect x="15" y="112" width="25" height="16" rx="2" fill="#475569" />
                <text x="27.5" y="124" fill="#ffffff" textAnchor="middle" fontSize="9">GND</text>

                {/* VCC 5V */}
                <line x1="0" y1="150" x2="15" y2="150" stroke="#ef4444" strokeWidth="2" />
                <rect x="15" y="142" width="25" height="16" rx="2" fill="#dc2626" />
                <text x="27.5" y="154" fill="#ffffff" textAnchor="middle" fontSize="9">V5</text>
              </g>
            </g>

            {/* DIY Circuit K-Line Mixer (Center) */}
            {!selectedBrand.includes('euro5') ? (
              <g id="kline-mixing-circuit">
                {/* Blue RX wiring line */}
                <path d="M 200 60 L 260 60 L 260 110" fill="none" stroke="#38bdf8" strokeWidth="2" />
                {/* Green TX wiring line */}
                <path d="M 200 90 L 225 90" fill="none" stroke="#10b981" strokeWidth="2" />

                {/* Diode 1N4148 */}
                <rect x="225" y="82" width="24" height="16" rx="2" fill="#ea580c" />
                <text x="237" y="93" fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">D1</text>
                {/* Diode line markings */}
                <line x1="229" y1="82" x2="229" y2="98" stroke="#ffffff" strokeWidth="1.5" />
                {/* Connection after diode to Rx line */}
                <line x1="249" y1="90" x2="260" y2="90" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="260" cy="90" r="3" fill="#38bdf8" />

                {/* Resistor Pull Up to +12V VCC */}
                <line x1="260" y1="110" x2="260" y2="135" stroke="#38bdf8" strokeWidth="2" />
                {/* Zigzag Resistor shape */}
                <path d="M 260 135 L 255 138 L 265 142 L 255 146 L 265 150 L 255 154 L 260 157" fill="none" stroke="#fbbf24" strokeWidth="2" />
                <text x="275" y="148" fill="#fbbf24" fontSize="8" fontWeight="bold" fontFamily="monospace">R1 (510Ω)</text>
                <line x1="260" y1="157" x2="260" y2="180" stroke="#ef4444" strokeWidth="2" />

                {/* Connection to +12V (Red line from DLC) */}
                <path d="M 260 180 L 410 180" fill="none" stroke="#ef4444" strokeWidth="2" />
                <text x="320" y="174" fill="#ef4444" fontSize="8" fontWeight="bold" fontFamily="monospace">+12V Aki</text>

                {/* Common K-Line going to DLC */}
                <path d="M 260 110 L 410 110" fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                <text x="320" y="102" fill="#60a5fa" fontSize="8" fontWeight="bold" fontFamily="monospace">K-Line Bus</text>

                {/* GND line directly to DLC */}
                <path d="M 200 120 L 410 120" fill="none" stroke="#64748b" strokeWidth="2" />
                <text x="320" y="132" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">Massa / GND</text>
              </g>
            ) : (
              <g id="canbus-direct-circuit">
                {/* Direct Euro 5 / CAN communication paths */}
                <path d="M 200 60 L 410 60" fill="none" stroke="#f97316" strokeWidth="2" strokeDasharray="3,3" />
                <text x="290" y="52" fill="#fb923c" fontSize="8" fontWeight="bold" fontFamily="monospace">CAN-H (Baud 115200)</text>

                <path d="M 200 90 L 410 90" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray="3,3" />
                <text x="290" y="82" fill="#facc15" fontSize="8" fontWeight="bold" fontFamily="monospace">CAN-L (Baud 115200)</text>

                <path d="M 200 120 L 410 120" fill="none" stroke="#64748b" strokeWidth="2" />
                <text x="290" y="132" fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="monospace">GND</text>

                <path d="M 200 150 L 410 150" fill="none" stroke="#ef4444" strokeWidth="2" />
                <text x="290" y="162" fill="#f87171" fontSize="8" fontWeight="bold" fontFamily="monospace">VCC +12V Aki</text>
              </g>
            )}

            {/* DIAGNOSTIC PORT SOKET DLC (Right) */}
            <g id="motorbike-dlc-port">
              {/* Connector outline */}
              <rect x="410" y="40" width="160" height="170" rx="10" fill="#1e293b" stroke="#ef4444" strokeWidth="2" />
              <text x="490" y="60" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {selectedBrand.includes('honda') ? 'HONDA DLC RED' : 'YAMAHA DLC'}
              </text>
              <text x="490" y="74" fill="#ef4444" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                {selectedBrand.includes('euro5') ? 'EURO 5 (6-PIN)' : selectedBrand === 'honda_kline' ? '4-PIN PORT' : '3-PIN PORT'}
              </text>

              {/* Pin slots circle visualizations */}
              {selectedBrand === 'honda_kline' && (
                <g transform="translate(425, 90)">
                  {/* Pin 1 - GND */}
                  <circle cx="25" cy="20" r="10" fill="#000000" stroke="#64748b" strokeWidth="1" />
                  <text x="25" y="23" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">1</text>
                  <text x="40" y="23" fill="#94a3b8" fontSize="7" fontFamily="monospace">GND</text>

                  {/* Pin 2 - VCC */}
                  <circle cx="25" cy="45" r="10" fill="#dc2626" />
                  <text x="25" y="48" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">2</text>
                  <text x="40" y="48" fill="#f87171" fontSize="7" fontFamily="monospace">12V</text>

                  {/* Pin 3 - KLine */}
                  <circle cx="100" cy="20" r="10" fill="#2563eb" />
                  <text x="100" y="23" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">3</text>
                  <text x="115" y="23" fill="#60a5fa" fontSize="7" fontFamily="monospace">KLine</text>

                  {/* Pin 4 - SCS */}
                  <circle cx="100" cy="45" r="10" fill="#16a34a" />
                  <text x="100" y="48" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">4</text>
                  <text x="115" y="48" fill="#4ade80" fontSize="7" fontFamily="monospace">SCS</text>
                </g>
              )}

              {selectedBrand === 'yamaha_kline' && (
                <g transform="translate(425, 90)">
                  {/* Pin 1 - KLine */}
                  <circle cx="25" cy="30" r="10" fill="#2563eb" />
                  <text x="25" y="33" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">1</text>
                  <text x="40" y="33" fill="#60a5fa" fontSize="7" fontFamily="monospace">KLine</text>

                  {/* Pin 2 - GND */}
                  <circle cx="100" cy="15" r="10" fill="#000000" stroke="#64748b" strokeWidth="1" />
                  <text x="100" y="18" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">2</text>
                  <text x="115" y="18" fill="#94a3b8" fontSize="7" fontFamily="monospace">GND</text>

                  {/* Pin 3 - VCC */}
                  <circle cx="100" cy="45" r="10" fill="#dc2626" />
                  <text x="100" y="48" fill="#ffffff" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">3</text>
                  <text x="115" y="48" fill="#f87171" fontSize="7" fontFamily="monospace">12V</text>
                </g>
              )}

              {selectedBrand.includes('euro5') && (
                <g transform="translate(420, 90)" fontSize="7" fontFamily="monospace">
                  {/* 6-Pin Grid matrix */}
                  {/* row 1 */}
                  <circle cx="20" cy="15" r="8" fill="#ea580c" />
                  <text x="20" y="18" fill="#fff" textAnchor="middle" fontSize="6">1</text>
                  <text x="32" y="18" fill="#fca5a5" fontSize="6">CAN-H</text>

                  <circle cx="90" cy="15" r="8" fill="#ca8a04" />
                  <text x="90" y="18" fill="#fff" textAnchor="middle" fontSize="6">2</text>
                  <text x="102" y="18" fill="#fef08a" fontSize="6">CAN-L</text>

                  {/* row 2 */}
                  <circle cx="20" cy="35" r="8" fill="#2563eb" />
                  <text x="20" y="38" fill="#fff" textAnchor="middle" fontSize="6">3</text>
                  <text x="32" y="38" fill="#93c5fd" fontSize="6">KLine</text>

                  <circle cx="90" cy="35" r="8" fill="#000000" stroke="#64748b" />
                  <text x="90" y="38" fill="#fff" textAnchor="middle" fontSize="6">4</text>
                  <text x="102" y="38" fill="#94a3b8" fontSize="6">GND</text>

                  {/* row 3 */}
                  <circle cx="20" cy="55" r="8" fill="#dc2626" />
                  <text x="20" y="58" fill="#fff" textAnchor="middle" fontSize="6">5</text>
                  <text x="32" y="58" fill="#fca5a5" fontSize="6">VCC</text>

                  <circle cx="90" cy="55" r="8" fill="#475569" />
                  <text x="90" y="58" fill="#fff" textAnchor="middle" fontSize="6">6</text>
                  <text x="102" y="58" fill="#cbd5e1" fontSize="6">NC</text>
                </g>
              )}
            </g>

            {/* Bottom Info Status text */}
            <text x="300" y="300" fill="#94a3b8" fontSize="10" textAnchor="middle" fontFamily="sans-serif">
              *Gunakan kawat jumper padat atau pin pogo 2.54mm untuk kontak ke soket ECU motor yang stabil.
            </text>
          </svg>
        </div>

        {/* Diagnostic Tips Card */}
        <div className="mt-4 bg-[#0a0c10] border border-[#1c2230] p-4 rounded-lg" id="connection-tips">
          <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1 mb-2">
            <CheckCircle className="text-orange-500 h-3.5 w-3.5" />
            LANGKAH PENGKONEKSIAN YANG BENAR:
          </h4>
          <ol className="text-xs text-slate-400 list-decimal pl-4 space-y-1.5 leading-relaxed">
            <li>Pastikan kunci kontak motor dalam posisi <span className="text-slate-200 font-bold">OFF</span> sebelum merangkai kabel.</li>
            <li>Hubungkan pin <span className="text-slate-200 font-semibold">GND, TX/RX (K-Line), dan VCC 12V</span> dari FTDI ke Soket DLC Motor sesuai skema di atas.</li>
            <li>Colokkan kabel USB FTDI ke komputer / perangkat laptop Anda.</li>
            <li>Putar kunci kontak motor ke posisi <span className="text-slate-200 font-bold">ON</span> (Mesin jangan dinyalakan dulu).</li>
            <li>Pilih port serial yang sesuai (misal <span className="text-orange-500 font-mono">COM3</span> atau <span className="text-orange-500 font-mono">/dev/ttyUSB0</span>) dan klik <span className="text-slate-200 font-bold">Hubungkan</span> di aplikasi.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
