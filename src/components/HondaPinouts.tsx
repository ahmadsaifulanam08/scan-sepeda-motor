import { useState } from 'react';
import { Search, Info, HelpCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';

interface Pin {
  number: number;
  label: string;
  color: string;
  colorHex: string;
  function: string;
  voltage: string;
}

interface EcuModel {
  id: string;
  name: string;
  code: string;
  connectorType: string;
  description: string;
  pins: Pin[];
}

const HONDA_ECU_DATABASE: EcuModel[] = [
  {
    id: 'k44',
    name: 'Honda Beat eSP / Scoopy eSP (K44)',
    code: 'Keihin 33-Pin (Starter Halus / ACG)',
    connectorType: '33-Pin Connector (Single-Plug)',
    description: 'ECU Keihin 33-Pin digunakan pada mesin starter halus Honda (ACG Starter) 110cc generasi Beat eSP, Scoopy eSP, dan Vario 110 eSP kisaran tahun 2014-2019.',
    pins: [
      { number: 1, label: 'PG', color: 'Hijau (G)', colorHex: '#22c55e', function: 'Power Ground (Massa Utama ECU)', voltage: '0V' },
      { number: 5, label: 'IG_SW', color: 'Hitam/Putih (B/W)', colorHex: '#1e293b', function: 'Ignition Switch Input (+12V dari Kunci Kontak)', voltage: '12V (Key ON)' },
      { number: 8, label: 'ECT', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Engine Coolant Temp Sensor (Suhu Mesin)', voltage: '0.5V - 4.5V' },
      { number: 9, label: 'TPS', color: 'Kuning/Merah (Y/R)', colorHex: '#eab308', function: 'Throttle Position Sensor (Sensor Bukaan Gas)', voltage: '0.5V (Idle) - 4.5V (Full)' },
      { number: 10, label: 'O2', color: 'Merah/Putih (R/W)', colorHex: '#ef4444', function: 'Oxygen Sensor Input', voltage: '0.1V (Lean) - 0.9V (Rich)' },
      { number: 11, label: 'INJ', color: 'Merah/Kuning (R/Y)', colorHex: '#ef4444', function: 'Injector Output (Sinyal Pulsa Negatif Injektor)', voltage: '12V / Pulsa Ground' },
      { number: 13, label: 'IG_COIL', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Ignition Coil Trigger (Pulsa Koil Pengapian)', voltage: 'Pulsa Negatif' },
      { number: 14, label: 'K-LINE', color: 'Oranye/Putih (O/W)', colorHex: '#f97316', function: 'Jalur Komunikasi K-Line (Soket DLC Merah Pin 1)', voltage: '9V - 12V (Data)' },
      { number: 18, label: 'SG', color: 'Hijau/Hitam (G/B)', colorHex: '#22c55e', function: 'Sensor Ground (Massa Bersama Sensor)', voltage: '0V (ECU Ref)' },
      { number: 20, label: 'VCC_S', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Sensor Power Reference (+5V ke TPS / MAP)', voltage: '5.0V (Stabil)' },
      { number: 22, label: 'F_PUMP', color: 'Cokelat (Br)', colorHex: '#78350f', function: 'Fuel Pump Relay Trigger (Sinyal Pompa Bensin)', voltage: '0V (Aktif)' },
      { number: 24, label: 'SCS', color: 'Biru/Muda (Bu/W)', colorHex: '#3b82f6', function: 'SCS Connector (Kabel Jumper Baca Kode Manual)', voltage: '5V/0V (Jumpered)' },
      { number: 28, label: 'CKP_U', color: 'Biru/Kuning (Bu/Y)', colorHex: '#3b82f6', function: 'Crank Position Sensor - Phase U', voltage: 'Pulsa Hall 0-5V' },
      { number: 29, label: 'CKP_V', color: 'Putih/Biru (W/Bu)', colorHex: '#cbd5e1', function: 'Crank Position Sensor - Phase V', voltage: 'Pulsa Hall 0-5V' },
      { number: 30, label: 'CKP_W', color: 'Putih/Merah (W/R)', colorHex: '#cbd5e1', function: 'Crank Position Sensor - Phase W', voltage: 'Pulsa Hall 0-5V' }
    ]
  },
  {
    id: 'kzr',
    name: 'Honda Vario 125 LED / Non-LED (KZR)',
    code: 'Keihin 33-Pin (Starter Kasar / Halus)',
    connectorType: '33-Pin Connector',
    description: 'ECU KZR dipasang pada Honda Vario 125 generasi pertama (Non-ISS dan ISS) kisaran tahun 2012-2015 dengan starter halus pertama.',
    pins: [
      { number: 1, label: 'PG', color: 'Hijau (G)', colorHex: '#22c55e', function: 'Power Ground Utama', voltage: '0V' },
      { number: 5, label: 'IG_SW', color: 'Hitam/Putih (B/W)', colorHex: '#1e293b', function: 'Input Kunci Kontak (+12V)', voltage: '12V' },
      { number: 8, label: 'ECT', color: 'Pink/Putih (P/W)', colorHex: '#ec4899', function: 'ECT Sensor Input (Suhu Mesin)', voltage: '0.5V - 4.5V' },
      { number: 9, label: 'TPS', color: 'Kuning/Merah (Y/R)', colorHex: '#eab308', function: 'TPS Sensor Input', voltage: '0.5V - 4.5V' },
      { number: 10, label: 'O2', color: 'Merah/Putih (R/W)', colorHex: '#ef4444', function: 'O2 Sensor Signal Input', voltage: '0.1V - 0.9V' },
      { number: 11, label: 'INJ', color: 'Pink/Biru (P/Bu)', colorHex: '#ec4899', function: 'Injektor Sinyal Pulsa Ground', voltage: '12V / Pulsa Ground' },
      { number: 13, label: 'IG_COIL', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Koil Pengapian Trigger', voltage: 'Pulsa Ground' },
      { number: 14, label: 'K-LINE', color: 'Oranye/Putih (O/W)', colorHex: '#f97316', function: 'K-Line Diagnostic Comm (DLC Merah)', voltage: '12V Data' },
      { number: 18, label: 'SG', color: 'Hijau/Hitam (G/B)', colorHex: '#22c55e', function: 'Sensor Ground Ref', voltage: '0V' },
      { number: 20, label: 'VCC_S', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Sensor +5V VCC Supply', voltage: '5.0V' },
      { number: 22, label: 'F_PUMP', color: 'Cokelat/Hitam (Br/B)', colorHex: '#78350f', function: 'Fuel Pump Relay Sinyal Ground', voltage: '0V (Aktif)' },
      { number: 28, label: 'CKP', color: 'Biru/Kuning (Bu/Y)', colorHex: '#3b82f6', function: 'CKP Crankshaft Pulse Sensor', voltage: '0-5V Pulsa' }
    ]
  },
  {
    id: 'k59',
    name: 'Honda Vario 150 / PCX 150 (K59/K97)',
    code: 'Shindengen / Keihin 33-Pin',
    connectorType: '33-Pin Connector',
    description: 'ECU Shindengen 33-pin digunakan untuk seri skutik Honda premium Vario 150, PCX 150 LED, serta ADV 150. Dilengkapi fitur Keyless smartkey input pin.',
    pins: [
      { number: 1, label: 'PG', color: 'Hijau (G)', colorHex: '#22c55e', function: 'Power Ground Utama', voltage: '0V' },
      { number: 5, label: 'IG_SW', color: 'Hitam/Putih (B/W)', colorHex: '#1e293b', function: 'Kunci Kontak +12V', voltage: '12V' },
      { number: 8, label: 'ECT', color: 'Pink/Putih (P/W)', colorHex: '#ec4899', function: 'Sensor Temperatur ECT', voltage: '0.5V - 4.2V' },
      { number: 9, label: 'TPS', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Sensor Gas TPS', voltage: '0.5V - 4.5V' },
      { number: 10, label: 'O2', color: 'Hitam (B)', colorHex: '#1e293b', function: 'O2 Sensor', voltage: '0.1V - 0.9V' },
      { number: 11, label: 'INJ', color: 'Pink/Biru (P/Bu)', colorHex: '#ec4899', function: 'Sinyal Injektor', voltage: 'Pulsa Ground' },
      { number: 13, label: 'IG_COIL', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Sinyal Koil Busi', voltage: 'Pulsa Ground' },
      { number: 14, label: 'K-LINE', color: 'Oranye/Putih (O/W)', colorHex: '#f97316', function: 'K-Line DLC Pin 1', voltage: '9-12V' },
      { number: 18, label: 'SG', color: 'Hijau/Hitam (G/B)', colorHex: '#22c55e', function: 'Sensor Ground', voltage: '0V' },
      { number: 20, label: 'VCC_S', color: 'Kuning/Merah (Y/R)', colorHex: '#eab308', function: 'Sensor Supply +5V', voltage: '5.0V' },
      { number: 22, label: 'F_PUMP', color: 'Cokelat (Br)', colorHex: '#78350f', function: 'Fuel Pump Relay Sinyal', voltage: '0V' },
      { number: 28, label: 'CKP', color: 'Biru/Kuning (Bu/Y)', colorHex: '#3b82f6', function: 'CKP Sensor Magnet', voltage: 'Pulsa 0-5V' }
    ]
  },
  {
    id: 'k45',
    name: 'Honda CB150R LED / CBR150R FI (K45G/K45R)',
    code: 'Keihin 33-Pin Sport Series',
    connectorType: '33-Pin Connector (Single)',
    description: 'ECU Keihin Sport Series ini dirancang khusus untuk motor kopling sport Honda CB150R Streetfire LED, CBR150R Facelift, dan Sonic 150R DOHC.',
    pins: [
      { number: 1, label: 'PG_1', color: 'Hijau (G)', colorHex: '#22c55e', function: 'Power Ground 1', voltage: '0V' },
      { number: 2, label: 'PG_2', color: 'Hijau/Hitam (G/B)', colorHex: '#22c55e', function: 'Power Ground 2', voltage: '0V' },
      { number: 5, label: 'IG_SW', color: 'Hitam/Putih (B/W)', colorHex: '#1e293b', function: 'Ignition +12V Power', voltage: '12V' },
      { number: 8, label: 'ECT', color: 'Pink/Putih (P/W)', colorHex: '#ec4899', function: 'ECT Sensor DOHC', voltage: '0.5V - 4.5V' },
      { number: 9, label: 'TPS', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'TPS Sensor Sinyal', voltage: '0.5V - 4.5V' },
      { number: 10, label: 'O2', color: 'Hitam (B)', colorHex: '#1e293b', function: 'O2 Sensor Emisi', voltage: '0.1V - 0.9V' },
      { number: 11, label: 'INJ', color: 'Pink/Biru (P/Bu)', colorHex: '#ec4899', function: 'Injector Sinyal Ground', voltage: 'Pulsa Ground' },
      { number: 12, label: 'FAN_RLY', color: 'Hitam/Biru (B/Bu)', colorHex: '#1e293b', function: 'Radiator Fan Relay Trigger (Kipas Radiator)', voltage: '0V (Aktif >98°C)' },
      { number: 13, label: 'IG_COIL', color: 'Kuning/Biru (Y/Bu)', colorHex: '#eab308', function: 'Koil Pengapian DOHC', voltage: 'Pulsa Ground' },
      { number: 14, label: 'K-LINE', color: 'Oranye/Putih (O/W)', colorHex: '#f97316', function: 'K-Line Diagnostic DLC', voltage: '9V-12V' },
      { number: 18, label: 'SG', color: 'Hijau/Oranye (G/O)', colorHex: '#22c55e', function: 'Sensor Ground Shield', voltage: '0V' },
      { number: 20, label: 'VCC_S', color: 'Kuning/Merah (Y/R)', colorHex: '#eab308', function: 'Sensor +5V Supply', voltage: '5.0V' },
      { number: 22, label: 'F_PUMP', color: 'Cokelat (Br)', colorHex: '#78350f', function: 'Fuel Pump Relay Sinyal', voltage: '0V' },
      { number: 23, label: 'BAS', color: 'Merah/Biru (R/Bu)', colorHex: '#ef4444', function: 'Bank Angle Sensor (Sensor Kemiringan / Jatuh)', voltage: '0.5V - 1.2V (Normal)' },
      { number: 28, label: 'CKP', color: 'Biru/Kuning (Bu/Y)', colorHex: '#3b82f6', function: 'CKP Pick-up Coil', voltage: 'Pulsa 0-5V' }
    ]
  }
];

export default function HondaPinouts() {
  const [selectedModel, setSelectedModel] = useState<EcuModel>(HONDA_ECU_DATABASE[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [highlightedPin, setHighlightedPin] = useState<number | null>(null);

  const filteredModels = HONDA_ECU_DATABASE.filter(model => 
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="honda-pinouts-container">
      {/* KIRI: Daftar Pilihan Motor Honda */}
      <div className="lg:col-span-4 bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#1c2230] pb-3">
          <Layers className="text-orange-500 h-5 w-5" />
          <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
            Model ECU Honda FI
          </h3>
        </div>

        {/* Kotak Cari */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Cari model motor / ECU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#0a0c10] border border-[#1c2230] rounded-lg text-xs font-mono text-slate-200 outline-none focus:border-orange-500 placeholder-slate-600"
          />
        </div>

        {/* Model List */}
        <div className="flex-1 space-y-2 max-h-[350px] overflow-y-auto pr-1">
          {filteredModels.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model);
                setHighlightedPin(null);
              }}
              className={`w-full text-left p-3 rounded-lg border text-xs transition-all flex flex-col gap-1 cursor-pointer ${
                selectedModel.id === model.id
                  ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold'
                  : 'bg-[#0a0c10] border-[#1c2230] text-slate-300 hover:bg-[#11141b]'
              }`}
            >
              <span className="font-semibold">{model.name}</span>
              <span className="text-[10px] font-mono text-slate-500">{model.code}</span>
            </button>
          ))}
          {filteredModels.length === 0 && (
            <p className="text-xs text-slate-600 font-mono text-center py-6">Model tidak ditemukan.</p>
          )}
        </div>

        {/* Diagnostic info box */}
        <div className="bg-[#0a0c10] border border-[#181d29] p-3.5 rounded-lg text-xs text-slate-400 space-y-2">
          <p className="font-bold text-slate-300 font-mono flex items-center gap-1 text-[11px]">
            <Info className="h-3.5 w-3.5 text-orange-500" />
            PANDUAN ALAT UKUR (MULTITESTER)
          </p>
          <p className="leading-relaxed text-[11px]">
            Gunakan probe hitam multitester ke pin <span className="text-orange-400 font-mono">PG (Pin 1)</span> sebagai Massa Utama ECU, lalu gunakan probe merah untuk membaca voltase pin sensor yang sedang didiagnosa.
          </p>
        </div>
      </div>

      {/* KANAN: Visualisasi & Detail Pin Out */}
      <div className="lg:col-span-8 bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl flex flex-col gap-6">
        <div>
          <span className="text-[10px] bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded font-mono font-bold">
            {selectedModel.connectorType}
          </span>
          <h2 className="text-xl font-bold text-slate-100 font-display mt-2">{selectedModel.name}</h2>
          <p className="text-xs text-slate-400 leading-relaxed mt-1">{selectedModel.description}</p>
        </div>

        {/* Visual Connector Render */}
        <div className="bg-[#0a0c10] border border-[#1c2230] rounded-xl p-6 flex flex-col items-center justify-center relative">
          <span className="absolute top-2.5 right-3 text-[9px] text-slate-600 font-mono">
            TAMPILAN SOKET ECU (PIN DARI BELAKANG KABEL)
          </span>

          {/* Keihin 33-Pin Block Representation */}
          <div className="border-4 border-slate-700 bg-slate-900 rounded-lg p-3 max-w-full overflow-x-auto shadow-inner flex flex-col gap-2 relative">
            {/* Top index clip */}
            <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 w-10 h-3 bg-slate-700 rounded-b"></div>

            {/* Grid 3 rows of pins */}
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((row) => (
                <div key={row} className="flex gap-1.5 items-center">
                  <span className="text-[9px] font-mono text-slate-500 w-4 text-right">R{row}</span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: 11 }).map((_, col) => {
                      // Calculate Pin number based on Keihin layout (1 to 33)
                      // Row 1: 1-11, Row 2: 12-22, Row 3: 23-33
                      const pinNum = (row - 1) * 11 + col + 1;
                      const hasData = selectedModel.pins.find(p => p.number === pinNum);
                      const isHighlighted = highlightedPin === pinNum;

                      return (
                        <div
                          key={pinNum}
                          onMouseEnter={() => hasData && setHighlightedPin(pinNum)}
                          onMouseLeave={() => setHighlightedPin(null)}
                          className={`w-7 h-7 rounded border font-mono text-[10px] flex items-center justify-center transition-all cursor-pointer select-none ${
                            isHighlighted
                              ? 'bg-orange-500 border-white text-white font-extrabold scale-110 shadow-lg shadow-orange-500/20'
                              : hasData
                              ? 'bg-[#11141b] border-[#1c2230] text-orange-400 hover:border-orange-500 hover:text-slate-200'
                              : 'bg-slate-800 border-slate-750 text-slate-600 cursor-not-allowed opacity-40'
                          }`}
                          title={hasData ? `${hasData.label} (Pin ${pinNum})` : `Empty Pin ${pinNum}`}
                        >
                          {pinNum}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex gap-4 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-orange-500/20 border border-orange-500 rounded inline-block"></span>
              Pin Terpasang (Sensor/Aktuator)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-slate-800 border border-slate-750 rounded inline-block opacity-40"></span>
              Pin Kosong / Cadangan (NC)
            </span>
          </div>
        </div>

        {/* Pinout Detail Table */}
        <div className="flex-1">
          <h3 className="text-xs font-bold text-slate-300 font-mono mb-3 uppercase tracking-wider">
            Tabel Pin Out ECU ({selectedModel.pins.length} Kabel Terdeteksi)
          </h3>
          <div className="overflow-x-auto border border-[#1c2230] rounded-lg">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a0c10] text-slate-400 border-b border-[#1c2230] font-bold">
                  <th className="p-3 text-center w-12">Pin</th>
                  <th className="p-3 w-20">Kode</th>
                  <th className="p-3 w-40">Warna Kabel</th>
                  <th className="p-3">Fungsi Pinout ECU</th>
                  <th className="p-3 w-28 text-right">Voltase Standar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#181d29] bg-[#11141b]/30">
                {selectedModel.pins.map((pin) => {
                  const isHighlighted = highlightedPin === pin.number;
                  return (
                    <tr
                      key={pin.number}
                      onMouseEnter={() => setHighlightedPin(pin.number)}
                      onMouseLeave={() => setHighlightedPin(null)}
                      className={`transition-colors ${
                        isHighlighted ? 'bg-orange-500/10 text-orange-400' : 'hover:bg-[#0a0c10]/20'
                      }`}
                    >
                      <td className="p-2.5 text-center font-bold">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          isHighlighted ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {pin.number}
                        </span>
                      </td>
                      <td className="p-2.5 font-bold text-slate-200">{pin.label}</td>
                      <td className="p-2.5 text-slate-400 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-2 h-4 rounded-sm border border-slate-700"
                            style={{ backgroundColor: pin.colorHex }}
                          ></span>
                          {pin.color}
                        </div>
                      </td>
                      <td className="p-2.5 text-slate-300 font-sans text-[11px] leading-relaxed">{pin.function}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-400 text-[10px]">{pin.voltage}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
