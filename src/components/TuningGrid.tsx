import { useState } from 'react';
import { TuningTable, DEFAULT_FUEL_TABLE, DEFAULT_IGNITION_TABLE, ECUFile } from '../types';
import { FileCode, Sliders, Save, Plus, Minus, RotateCcw, Upload, Download, Table, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';

interface TuningGridProps {
  onNotify: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function TuningGrid({ onNotify }: TuningGridProps) {
  const [currentTable, setCurrentTable] = useState<'fuel' | 'ignition'>('fuel');
  const [fuelTable, setFuelTable] = useState<TuningTable>(JSON.parse(JSON.stringify(DEFAULT_FUEL_TABLE)));
  const [ignitionTable, setIgnitionTable] = useState<TuningTable>(JSON.parse(JSON.stringify(DEFAULT_IGNITION_TABLE)));
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<ECUFile[]>([
    { name: 'yamaha_aerox155_stock.bin', size: 32768, type: 'bin', uploadTime: 'Preloaded Default', contentSummary: 'ECU Bin: 32KB Keihin MCU', status: 'active' },
    { name: 'honda_beat_fi_k81.xdf', size: 12450, type: 'xdf', uploadTime: 'Preloaded Default', contentSummary: 'Definitions: 10x9 VE Table, RevLimit', status: 'parsed' }
  ]);
  const [revLimiter, setRevLimiter] = useState<number>(10200); // RPM Limiter

  const table = currentTable === 'fuel' ? fuelTable : ignitionTable;
  const setTable = currentTable === 'fuel' ? setFuelTable : setIgnitionTable;

  // Find min & max to generate color scales
  const flatData = table.data.flat();
  const minVal = Math.min(...flatData);
  const maxVal = Math.max(...flatData);

  const getHeatmapColor = (val: number) => {
    const pct = (val - minVal) / (maxVal - minVal || 1);
    if (table.type === 'fuel') {
      // Fuel VE table: Blue (low fuel) to Red (high fuel volumetric efficiency)
      const r = Math.round(30 + pct * 200);
      const g = Math.round(41 - pct * 10);
      const b = Math.round(59 - pct * 20);
      return `rgba(${r}, ${g}, ${b}, ${0.1 + pct * 0.7})`;
    } else {
      // Ignition Advance table: Blue (retarded spark) to Yellow/Orange (advanced spark BTDC)
      const r = Math.round(30 + pct * 210);
      const g = Math.round(41 + pct * 140);
      const b = Math.round(59 - pct * 30);
      return `rgba(${r}, ${g}, ${b}, ${0.1 + pct * 0.7})`;
    }
  };

  const handleCellChange = (rIdx: number, cIdx: number, val: string) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      const updatedData = [...table.data];
      updatedData[rIdx][cIdx] = num;
      setTable({ ...table, data: updatedData });
    }
  };

  const handleBulkModify = (action: 'add' | 'sub' | 'pct_add' | 'pct_sub', factor: number) => {
    const updatedData = table.data.map((row, rIdx) => 
      row.map((cell, cIdx) => {
        // If a specific cell is selected, only modify that one
        if (selectedCell && (selectedCell.r !== rIdx || selectedCell.c !== cIdx)) {
          return cell;
        }
        let newVal = cell;
        if (action === 'add') newVal = cell + factor;
        if (action === 'sub') newVal = cell - factor;
        if (action === 'pct_add') newVal = cell * (1 + factor / 100);
        if (action === 'pct_sub') newVal = cell * (1 - factor / 100);
        
        // Decimals rounding
        return table.type === 'ignition' ? Math.round(newVal * 10) / 10 : Math.round(newVal);
      })
    );
    setTable({ ...table, data: updatedData });
    onNotify(`Tabel ${table.name} berhasil dimodifikasi!`, 'success');
  };

  const handleReset = () => {
    if (currentTable === 'fuel') {
      setFuelTable(JSON.parse(JSON.stringify(DEFAULT_FUEL_TABLE)));
    } else {
      setIgnitionTable(JSON.parse(JSON.stringify(DEFAULT_IGNITION_TABLE)));
    }
    setSelectedCell(null);
    onNotify(`Tabel ${table.name} dikembalikan ke nilai bawaan pabrik.`, 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'bin' && extension !== 'xdf' && extension !== 'adx') {
      onNotify('Format file tidak didukung! Pastikan mengunggah file .bin, .xdf, atau .adx', 'error');
      return;
    }

    const newFile: ECUFile = {
      name: file.name,
      size: file.size,
      type: extension as 'bin' | 'xdf' | 'adx',
      uploadTime: new Date().toLocaleTimeString(),
      status: 'active',
      contentSummary: extension === 'bin' 
        ? `ECU Bin: ${Math.round(file.size / 1024)}KB Binary` 
        : extension === 'xdf' 
        ? 'Definisi Tabel Parameter TunerPro XML' 
        : 'Definisi Aliran Data Akuisisi Log ADX'
    };

    setUploadedFiles([newFile, ...uploadedFiles]);

    // Simulate different curves loaded on .bin upload
    if (extension === 'bin') {
      const scaleMultiplier = 1.05; // Simulate a slightly aggressive tune bin
      const updatedFuel = { ...fuelTable };
      updatedFuel.data = fuelTable.data.map(row => row.map(v => Math.round(v * scaleMultiplier)));
      setFuelTable(updatedFuel);
      
      const updatedIgn = { ...ignitionTable };
      updatedIgn.data = ignitionTable.data.map(row => row.map(v => Math.round((v + 1) * 10) / 10));
      setIgnitionTable(updatedIgn);

      setRevLimiter(10800); // Up limiter
      onNotify(`Suksess mengunggah ${file.name}. Peta komparasi ECU dimuat!`, 'success');
    } else {
      onNotify(`File definisi ${file.name} berhasil ditautkan ke penjelajah port FTDI.`, 'success');
    }
  };

  const handleDownloadBin = () => {
    // Generate real-time CSV or BIN simulation array text
    const headers = 'RPM / TPS (%),' + table.cols.map(c => `${c}%`).join(',');
    const rows = table.rows.map((r, rIdx) => `${r} RPM,` + table.data[rIdx].join(',')).join('\n');
    const fullCsv = `# ECU Map: ${table.name}\n# Limiter RPM: ${revLimiter}\n\n${headers}\n${rows}`;

    const blob = new Blob([fullCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tuned_${table.id}_${currentTable}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onNotify('File modifikasi peta ECU berhasil diekspor!', 'success');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="tuning-grid-tab">
      {/* KIRI: Bin & Definitions Upload */}
      <div className="xl:col-span-3 space-y-6" id="binary-files-explorer">
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-slate-200 font-mono mb-4 flex items-center gap-1.5 font-display">
            <Upload className="h-4 w-4 text-orange-500" />
            UNGGAH FILE ECU (.BIN / .XDF / .ADX)
          </h3>
          
          {/* File drag n drop mock area */}
          <div className="border border-dashed border-[#1c2230] hover:border-orange-500/50 bg-[#0a0c10] p-6 rounded-lg text-center cursor-pointer transition-all relative">
            <input 
              type="file" 
              accept=".bin,.xdf,.adx" 
              onChange={handleFileUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <FileCode className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-300 font-semibold mb-1">Seret & Jatuhkan file di sini</p>
            <p className="text-[10px] text-slate-500 font-mono">Ekstensi .bin, .xdf, atau .adx (Maks 1MB)</p>
          </div>

          <div className="mt-5 space-y-3" id="loaded-ecu-files-list">
            <span className="text-[10px] text-slate-500 font-mono block">FILE AKTIF DALAM MEMORI FTDI:</span>
            {uploadedFiles.map((f, idx) => (
              <div key={idx} className="flex items-start justify-between bg-[#0a0c10] p-2.5 rounded border border-[#181d29]">
                <div className="space-y-0.5">
                  <p className="text-xs font-mono font-semibold text-slate-200 truncate max-w-[140px]">{f.name}</p>
                  <p className="text-[9px] text-slate-400">{f.contentSummary}</p>
                  <span className="text-[8px] bg-slate-800 text-orange-400 px-1 rounded inline-block font-mono">
                    {f.uploadTime}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded font-mono border border-orange-500/20">
                    OK
                  </span>
                  <p className="text-[9px] text-slate-500 font-mono mt-1">{(f.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rev Limiter & Quick Tuner configuration */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl" id="revlimiter-panel">
          <h3 className="text-sm font-bold text-slate-200 font-mono mb-4 flex items-center gap-1.5 font-display">
            <Cpu className="h-4 w-4 text-orange-500" />
            KONFIGURASI ECU PARAMETER
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-slate-400 font-mono">REV LIMITER (RPM):</label>
                <span className="text-xs font-mono font-bold text-orange-400">{revLimiter} RPM</span>
              </div>
              <input 
                type="range" 
                min="8000" 
                max="14000" 
                step="100" 
                value={revLimiter} 
                onChange={(e) => {
                  setRevLimiter(parseInt(e.target.value));
                  onNotify(`RPM Limiter disesuaikan ke ${e.target.value} RPM!`, 'info');
                }}
                className="w-full h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono mt-1">
                <span>8000 (Safety)</span>
                <span>11000 (Road Race)</span>
                <span>14000 (Extrem)</span>
              </div>
            </div>

            <div className="bg-[#0a0c10] p-3 rounded-lg border border-[#181d29] text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1 font-bold text-orange-500 font-mono mb-1 text-xs">
                <AlertTriangle className="h-3.5 w-3.5" />
                DONGKRAK LIMITER WARNING
              </div>
              Mengubah limiter RPM di atas <span className="text-slate-200 font-semibold">10500 RPM</span> pada mesin standar berisiko menyebabkan tabrakan klep (valve float). Pastikan per klep (valve spring) sudah ditingkatkan (racing).
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: MAP EDITOR GRID */}
      <div className="xl:col-span-9 bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl flex flex-col" id="ecu-map-editor">
        {/* Tab & Controls Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6" id="editor-grid-controls">
          <div className="flex bg-[#0a0c10] border border-[#1c2230] p-1 rounded-lg">
            <button
              onClick={() => { setCurrentTable('fuel'); setSelectedCell(null); }}
              className={`px-4 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTable === 'fuel'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="h-3.5 w-3.5" />
              Base Fuel Map (VE %)
            </button>
            <button
              onClick={() => { setCurrentTable('ignition'); setSelectedCell(null); }}
              className={`px-4 py-2 rounded-md text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                currentTable === 'ignition'
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              Ignition Timing (°BTDC)
            </button>
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-[#0a0c10] hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-mono font-semibold border border-[#1c2230] flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              Kembalikan Default
            </button>
            <button
              onClick={handleDownloadBin}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold font-mono flex items-center gap-1.5 shadow transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              Ekspor File Tuned
            </button>
          </div>
        </div>

        {/* Table Description */}
        <div className="mb-4 bg-[#0a0c10]/60 p-3 rounded-lg border border-[#181d29]">
          <p className="text-xs text-slate-300 font-semibold">{table.name}</p>
          <p className="text-[11px] text-slate-500 leading-relaxed font-mono mt-0.5">{table.description}</p>
        </div>

        {/* Interactive Grid Table Wrapper */}
        <div className="flex-1 overflow-x-auto border border-[#1c2230] rounded-lg" id="table-grid-wrapper">
          <table className="w-full min-w-[700px] text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-[#0a0c10] border-b border-[#1c2230]">
                <th className="p-3 text-slate-400 border-r border-[#1c2230] font-bold sticky left-0 bg-[#0a0c10]">
                  RPM \ TPS (%)
                </th>
                {table.cols.map((col, idx) => (
                  <th key={idx} className="p-3 text-center text-slate-300 font-semibold border-r border-[#1c2230]">
                    {col}%
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-[#181d29] hover:bg-slate-900/30">
                  <td className="p-2.5 font-bold text-slate-300 border-r border-[#1c2230] sticky left-0 bg-[#0a0c10]">
                    {row} RPM
                  </td>
                  {table.cols.map((col, cIdx) => {
                    const cellVal = table.data[rIdx][cIdx];
                    const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                    return (
                      <td 
                        key={cIdx} 
                        onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                        style={{ backgroundColor: getHeatmapColor(cellVal) }}
                        className={`p-1.5 text-center border-r border-[#181d29] cursor-pointer transition-all hover:ring-2 hover:ring-orange-500/60 ${
                          isSelected ? 'ring-2 ring-orange-500 font-extrabold text-white scale-105 z-10' : 'text-slate-200'
                        }`}
                      >
                        {isSelected ? (
                          <input
                            type="text"
                            value={cellVal}
                            autoFocus
                            onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                            onBlur={() => setSelectedCell(null)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === 'Escape') {
                                setSelectedCell(null);
                              }
                            }}
                            className="w-full bg-[#0a0c10] text-orange-400 font-bold text-center border border-orange-500 rounded outline-none p-0.5"
                          />
                        ) : (
                          <span>{cellVal}{table.type === 'ignition' ? '°' : '%'}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bulk Modifiers Panel at Footer */}
        <div className="mt-5 bg-[#0a0c10] border border-[#181d29] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between" id="bulk-modifier-panel">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-1">
              <Sliders className="h-3.5 w-3.5 text-orange-500" />
              ALAT PENGUBAH PARAMETER INSTAN
            </h4>
            <p className="text-[10px] text-slate-500 leading-tight">
              {selectedCell 
                ? 'Sel terpilih: Tekan tombol untuk memodifikasi sel saja.' 
                : 'Tidak ada sel terpilih: Perubahan akan diterapkan ke SELURUH isi peta tabel.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Quick increase */}
            <button 
              onClick={() => handleBulkModify('add', table.type === 'ignition' ? 0.5 : 2)}
              className="px-2.5 py-1.5 bg-[#0a0c10] hover:bg-slate-850 text-slate-200 rounded border border-[#1c2230] flex items-center gap-1 text-xs font-semibold font-mono transition-all cursor-pointer"
            >
              <Plus className="h-3 w-3 text-orange-500" />
              {table.type === 'ignition' ? '+0.5°' : '+2%'}
            </button>
            <button 
              onClick={() => handleBulkModify('sub', table.type === 'ignition' ? 0.5 : 2)}
              className="px-2.5 py-1.5 bg-[#0a0c10] hover:bg-slate-850 text-slate-200 rounded border border-[#1c2230] flex items-center gap-1 text-xs font-semibold font-mono transition-all cursor-pointer"
            >
              <Minus className="h-3 w-3 text-orange-500" />
              {table.type === 'ignition' ? '-0.5°' : '-2%'}
            </button>

            {/* Quick scale */}
            <div className="h-6 w-px bg-[#1c2230] mx-1"></div>

            <button 
              onClick={() => handleBulkModify('pct_add', 5)}
              className="px-2.5 py-1.5 bg-[#0a0c10] hover:bg-slate-850 text-slate-200 rounded border border-[#1c2230] flex items-center gap-1 text-xs font-semibold font-mono transition-all cursor-pointer"
            >
              +5% Scale
            </button>
            <button 
              onClick={() => handleBulkModify('pct_sub', 5)}
              className="px-2.5 py-1.5 bg-[#0a0c10] hover:bg-slate-850 text-slate-200 rounded border border-[#1c2230] flex items-center gap-1 text-xs font-semibold font-mono transition-all cursor-pointer"
            >
              -5% Scale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
