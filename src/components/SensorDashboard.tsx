import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, 
  Thermometer, 
  Battery, 
  Wind, 
  Compass, 
  AlertTriangle, 
  Gauge, 
  Activity, 
  Droplet,
  Flame,
  Gauge as SpeedIcon,
  RefreshCw,
  Sliders,
  CheckCircle,
  XCircle,
  AlertCircle,
  Cpu
} from 'lucide-react';
import { SensorData, MotorBrand, ConnectionState, MOTORCYCLE_PROFILES } from '../types';

interface SensorDashboardProps {
  sensors: SensorData;
  setSensors: React.Dispatch<React.SetStateAction<SensorData>>;
  connection: ConnectionState;
  brand: MotorBrand;
  onNotify: (text: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  appendHexLog: (msg: string) => void;
  triggerDynoTest: () => void;
  sweepActive: boolean;
  selectedProfileId: string;
}

export default function SensorDashboard({
  sensors,
  setSensors,
  connection,
  brand,
  onNotify,
  appendHexLog,
  triggerDynoTest,
  sweepActive,
  selectedProfileId
}: SensorDashboardProps) {
  const [testPreset, setTestPreset] = useState<string>('idle');
  const activeProfile = MOTORCYCLE_PROFILES.find(p => p.id === selectedProfileId);

  // Triggering visual alerts
  const isOverheating = sensors.ect >= 100;
  const isLowBattery = sensors.battery < 11.8;
  const isRedline = sensors.rpm >= 9500;
  const isAfrUnstable = sensors.rpm > 0 && (sensors.afr < 12.0 || sensors.afr > 15.5);

  // Quick Ride Presets
  const applyPreset = (preset: 'idle' | 'cruise' | 'wot' | 'decel') => {
    if (connection === 'disconnected') {
      onNotify('Koneksikan port FTDI atau klik Simulasi terlebih dahulu!', 'warning');
      return;
    }

    setTestPreset(preset);
    let updatedSensors: Partial<SensorData> = {};

    switch (preset) {
      case 'idle':
        updatedSensors = {
          rpm: 1500,
          tps: 0,
          tpsVoltage: 0.52,
          ect: 82,
          iat: 32,
          map: 38,
          afr: 14.7,
          battery: 13.8,
          sparkAdvance: 15,
          o2Voltage: 0.45,
          injectorDuration: 2.1,
          speed: 0,
          egt: 220,
          purgeValve: 10
        };
        onNotify('Preset: Mesin Stasioner (Stasioner / Idling) diaktifkan', 'success');
        appendHexLog(`USER_PRESET: Simulasi mesin stasioner (1500 RPM, TPS 0%)`);
        break;
      case 'cruise':
        updatedSensors = {
          rpm: 5200,
          tps: 28,
          tpsVoltage: 1.62,
          ect: 86,
          iat: 34,
          map: 65,
          afr: 14.2,
          battery: 14.1,
          sparkAdvance: 24,
          o2Voltage: 0.62,
          injectorDuration: 3.8,
          speed: 62,
          egt: 450,
          purgeValve: 25
        };
        onNotify('Preset: Akselerasi Cruising (Jalan Santai) diaktifkan', 'success');
        appendHexLog(`USER_PRESET: Simulasi melaju santai (5200 RPM, TPS 28%)`);
        break;
      case 'wot':
        updatedSensors = {
          rpm: 9200,
          tps: 100,
          tpsVoltage: 4.5,
          ect: 94,
          iat: 38,
          map: 100,
          afr: 12.6,
          battery: 14.2,
          sparkAdvance: 28,
          o2Voltage: 0.85,
          injectorDuration: 8.4,
          speed: 114,
          egt: 680,
          purgeValve: 40
        };
        onNotify('Preset: Akselerasi Penuh / Wide Open Throttle (Gas Pol!)', 'success');
        appendHexLog(`USER_PRESET: Simulasi Tarikan Penuh / WOT (9200 RPM, TPS 100%)`);
        break;
      case 'decel':
        updatedSensors = {
          rpm: 3200,
          tps: 0,
          tpsVoltage: 0.52,
          ect: 88,
          iat: 33,
          map: 22,
          afr: 16.0,
          battery: 13.6,
          sparkAdvance: 8,
          o2Voltage: 0.12,
          injectorDuration: 0.8,
          speed: 48,
          egt: 310,
          purgeValve: 5
        };
        onNotify('Preset: Deselerasi / Engine Brake diaktifkan', 'success');
        appendHexLog(`USER_PRESET: Simulasi Deselerasi (3200 RPM, TPS 0%, Injector Cut)`);
        break;
    }

    setSensors((prev) => ({
      ...prev,
      ...updatedSensors
    }));
  };

  // Helper for computing gauge progress coordinates
  const getCoordinatesForPercent = (percent: number, radius = 50) => {
    const angle = (percent / 100) * 1.5 * Math.PI + 0.75 * Math.PI; // 270 degree arc
    const x = 60 + radius * Math.cos(angle);
    const y = 60 + radius * Math.sin(angle);
    return { x, y };
  };

  const rpmPercentage = Math.min(100, (sensors.rpm / 12000) * 100);
  const tpsPercentage = Math.min(100, sensors.tps);
  const speedPercentage = Math.min(100, (sensors.speed / 140) * 100);

  return (
    <div className="space-y-6" id="dashboard-tab-container">
      {/* Top Banner Status Info */}
      <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-md font-bold text-white flex items-center gap-2 font-display">
            <Gauge className="text-orange-500 h-5 w-5" />
            INSTRUMENT CLUSTER & DATA SENSOR {brand.toUpperCase()}
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Tampilan panel dashboard digital bengkel interaktif membaca semua parameter ECU secara presisi
          </p>
        </div>

        {/* Quick Simulator Control Presets */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto" id="dashboard-presets">
          <span className="text-[10px] text-slate-500 font-mono font-bold uppercase block mr-1">SIMULASI BERKENDARA:</span>
          <button
            onClick={() => applyPreset('idle')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              testPreset === 'idle' && connection !== 'disconnected'
                ? 'bg-orange-500 text-white shadow shadow-orange-500/15'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-850'
            }`}
          >
            Stasioner
          </button>
          <button
            onClick={() => applyPreset('cruise')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              testPreset === 'cruise' && connection !== 'disconnected'
                ? 'bg-orange-500 text-white shadow shadow-orange-500/15'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-850'
            }`}
          >
            Cruising
          </button>
          <button
            onClick={() => applyPreset('wot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              testPreset === 'wot' && connection !== 'disconnected'
                ? 'bg-orange-500 text-white shadow shadow-orange-500/15'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-850'
            }`}
          >
            Gas Pol (WOT)
          </button>
          <button
            onClick={() => applyPreset('decel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              testPreset === 'decel' && connection !== 'disconnected'
                ? 'bg-orange-500 text-white shadow shadow-orange-500/15'
                : 'bg-slate-950 text-slate-400 hover:bg-slate-900 border border-slate-850'
            }`}
          >
            Deselerasi
          </button>
        </div>
      </div>

      {/* SCAN DETAILS DISPLAY: Motorcycle Model, Production Year, ECU Code */}
      <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl relative overflow-hidden" id="scanner-motor-display-panel">
        <div className="absolute top-0 right-0 p-3 opacity-[0.03]">
          <Cpu className="h-32 w-32 text-orange-500" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`p-3 rounded-lg flex items-center justify-center ${
              connection !== 'disconnected' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-900 text-slate-500'
            }`}>
              <Activity className={`h-6 w-6 ${connection !== 'disconnected' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest block uppercase">
                STATUS KONEKSI ECU:
              </span>
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${connection !== 'disconnected' ? 'bg-emerald-500 animate-ping' : 'bg-slate-700'}`} />
                <span className="text-xs font-mono font-bold text-slate-300">
                  {connection === 'simulated' ? 'MENERIMA DATA DIAGNOSA (SIMULASI)' :
                   connection === 'connected' ? 'SINKRONISASI FTDI SELESAI' :
                   'MENUNGGU KONEKSI PORT SERIAL...'}
                </span>
              </div>
            </div>
          </div>

          {/* Real Scan Info requested by User */}
          {connection !== 'disconnected' && activeProfile && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full md:w-auto flex flex-col md:flex-row gap-4 md:gap-8 bg-[#0a0c10] border border-[#1c2230] p-4 rounded-xl"
            >
              <div className="min-w-[180px]">
                <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider">
                  MOTOR & TAHUN PRODUKSI:
                </span>
                <span className="text-sm font-black text-white font-mono tracking-tight block mt-0.5">
                  {activeProfile.model} <span className="text-xs text-orange-400 font-bold">({activeProfile.year})</span>
                </span>
              </div>
              <div className="md:border-l md:border-[#1c2230]/50 md:pl-6 flex flex-col justify-center">
                <span className="text-[9px] text-slate-500 font-mono font-bold block uppercase tracking-wider">
                  SERI KODE ECU MOTOR:
                </span>
                <span className="text-xs font-mono font-bold text-orange-500 block mt-1 tracking-wider bg-orange-500/10 px-2.5 py-1 rounded border border-orange-500/20">
                  {activeProfile.ecuCode}
                </span>
              </div>
            </motion.div>
          )}

          {connection === 'disconnected' && (
            <div className="text-xs font-mono text-slate-500 italic bg-[#0a0c10] px-4 py-2.5 rounded-lg border border-[#181d29] w-full md:w-auto text-center md:text-left">
              Hubungkan scanner ke motor untuk membaca Model Motor, Tahun Produksi, dan Seri Kode ECU.
            </div>
          )}
        </div>
      </div>

      {/* Main Gauges Section - Visually Stunning Round Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="primary-gauges">
        {/* Gauge 1: Tachometer (RPM) */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-between relative overflow-hidden">
          {/* Circular SVG Arc for Tachometer */}
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-0" viewBox="0 0 120 120">
              {/* Background Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Colored Indicator Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke={isRedline ? '#f43f5e' : '#f97316'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="235.6"
                strokeDashoffset={235.6 - (235.6 * rpmPercentage) / 100}
                className="transition-all duration-300"
              />
              {/* Redline Zone Marker */}
              <path
                d="M 80.3 35.3 A 50 50 0 0 1 95.3 95.3"
                fill="none"
                stroke="#ef4444"
                strokeWidth="4"
                strokeDasharray="4 4"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">TACHOMETER</span>
              <span className={`text-3xl font-black font-mono tracking-tight transition-colors ${isRedline ? 'text-red-500 animate-pulse' : 'text-slate-100'}`}>
                {sensors.rpm}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">RPM</span>
            </div>
          </div>

          <div className="w-full text-center mt-2 border-t border-[#1c2230] pt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2">
              <span>Limit: 10,500 RPM</span>
              <span className={isRedline ? 'text-red-400 font-bold animate-pulse' : 'text-slate-400'}>
                {isRedline ? 'REDLINE / IGNITION CUT!' : sensors.rpm > 0 ? 'MESIN HIDUP' : 'OFF'}
              </span>
            </div>
          </div>
        </div>

        {/* Gauge 2: Speedometer */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-between relative overflow-hidden">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-0" viewBox="0 0 120 120">
              {/* Background Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Colored Indicator Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="235.6"
                strokeDashoffset={235.6 - (235.6 * speedPercentage) / 100}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">SPEEDOMETER</span>
              <span className="text-3xl font-black font-mono text-slate-100 tracking-tight">
                {sensors.speed}
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">KM/H</span>
            </div>
          </div>

          <div className="w-full text-center mt-2 border-t border-[#1c2230] pt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2">
              <span>Kecepatan Roda</span>
              <span className="text-blue-400 font-bold">
                {sensors.speed > 80 ? 'HIGH SPEED' : sensors.speed > 0 ? 'MELAJU' : 'DIAM'}
              </span>
            </div>
          </div>
        </div>

        {/* Gauge 3: Throttle Position Sensor (TPS) */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-2xl p-5 shadow-lg flex flex-col items-center justify-between relative overflow-hidden">
          <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-0" viewBox="0 0 120 120">
              {/* Background Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke="#1e293b"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Colored Indicator Arc */}
              <path
                d="M 24.6 95.3 A 50 50 0 1 1 95.3 95.3"
                fill="none"
                stroke="#10b981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="235.6"
                strokeDashoffset={235.6 - (235.6 * tpsPercentage) / 100}
                className="transition-all duration-300"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-widest uppercase">BUKAAN GAS TPS</span>
              <span className="text-3xl font-black font-mono text-slate-100 tracking-tight">
                {sensors.tps}<span className="text-lg text-slate-500">%</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono font-semibold">{sensors.tpsVoltage} VOLTS</span>
            </div>
          </div>

          <div className="w-full text-center mt-2 border-t border-[#1c2230] pt-3">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono px-2">
              <span>Sinyal Potensiometer</span>
              <span className="text-emerald-400 font-bold">
                {sensors.tps >= 85 ? 'WOT (GAS POL)' : sensors.tps > 0 ? 'PARTIAL' : 'IDLE (TUTUP)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Status Panel (Mock Motorcycle Dashboard Indicators) */}
      <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow-xl" id="dashboard-indicator-lights">
        <span className="text-[9px] text-slate-500 font-mono font-bold uppercase block mb-3">PANEL INDIKATOR SEPEDA MOTOR (DASHBOARD LAMPS):</span>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {/* MIL Indicator */}
          <div className={`p-3 rounded-lg border flex items-center gap-2.5 font-mono text-xs transition-all ${
            sensors.milStatus
              ? 'bg-amber-500/10 border-amber-500 text-amber-400 animate-pulse'
              : 'bg-[#0a0c10] border-[#1c2230] text-slate-600'
          }`}>
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block font-bold">MIL (CHECK ENGINE)</span>
              <span className="font-bold">{sensors.milStatus ? 'KEDIP KESALAHAN' : 'NORMAL / MATI'}</span>
            </div>
          </div>

          {/* ECT Overheat Lamp */}
          <div className={`p-3 rounded-lg border flex items-center gap-2.5 font-mono text-xs transition-all ${
            isOverheating
              ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
              : 'bg-[#0a0c10] border-[#1c2230] text-slate-600'
          }`}>
            <Thermometer className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block font-bold">TEMP RAD / ENGIN</span>
              <span className="font-bold">{isOverheating ? 'OVERHEAT! ALARM' : 'SUHU AMAN'}</span>
            </div>
          </div>

          {/* Battery Charge warning */}
          <div className={`p-3 rounded-lg border flex items-center gap-2.5 font-mono text-xs transition-all ${
            isLowBattery
              ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
              : 'bg-[#0a0c10] border-[#1c2230] text-slate-600'
          }`}>
            <Battery className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block font-bold">CHARGE LEVEL AKI</span>
              <span className="font-bold">{isLowBattery ? 'DROP / UNDERCHARGE' : 'PENGISIAN OK'}</span>
            </div>
          </div>

          {/* AFR Danger (Lean/Rich Warning) */}
          <div className={`p-3 rounded-lg border flex items-center gap-2.5 font-mono text-xs transition-all ${
            isAfrUnstable
              ? 'bg-amber-500/10 border-amber-500 text-amber-400'
              : 'bg-[#0a0c10] border-[#1c2230] text-slate-600'
          }`}>
            <Flame className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block font-bold">AIR-FUEL WARNING</span>
              <span className="font-bold">
                {sensors.rpm === 0 ? 'IDLE' : sensors.afr > 15.2 ? 'MISFIRE (MISKIN)' : sensors.afr < 12.2 ? 'RICH (BOROS)' : 'STOIKIO OK'}
              </span>
            </div>
          </div>

          {/* Limiter Lamp */}
          <div className={`p-3 rounded-lg border flex items-center gap-2.5 font-mono text-xs transition-all col-span-2 sm:col-span-1 ${
            isRedline
              ? 'bg-red-600/10 border-red-600 text-red-400 animate-pulse'
              : 'bg-[#0a0c10] border-[#1c2230] text-slate-600'
          }`}>
            <Zap className="h-5 w-5 shrink-0" />
            <div>
              <span className="text-[9px] text-slate-500 block font-bold">RPM LIMIT LIGHT</span>
              <span className="font-bold">{isRedline ? 'LIMIT BOUNCING' : 'RPM AMAN'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of All Engine Sensors (12 Detailed Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="all-engine-sensors-grid">
        {/* Card 1: ECT Temperature */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">ECT (SUHU MESIN / RADIATOR)</span>
              <p className={`text-2xl font-extrabold font-mono mt-1 ${isOverheating ? 'text-red-400' : 'text-slate-200'}`}>
                {sensors.ect} <span className="text-xs text-slate-500 font-normal">°C</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-orange-400">
              <Thermometer className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${isOverheating ? 'bg-red-500' : 'bg-orange-500'}`}
                style={{ width: `${Math.min(100, (sensors.ect / 130) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Suhu Normal: 75°C - 95°C</span>
              <span>Max: 130°C</span>
            </div>
          </div>
        </div>

        {/* Card 2: AFR Air-Fuel Ratio */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">AFR (AIR FUEL RATIO)</span>
              <p className={`text-2xl font-extrabold font-mono mt-1 ${sensors.afr < 12.5 ? 'text-sky-400' : sensors.afr > 15.0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {sensors.afr} <span className="text-xs text-slate-500 font-normal">:1</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-sky-400">
              <Flame className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, ((sensors.afr - 10) / 8) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Lean: &gt;14.7 | Rich: &lt;14.7</span>
              <span className="text-emerald-400 font-semibold">
                {sensors.afr === 14.7 ? 'Stoikiometris' : sensors.afr < 14.7 ? 'Kaya Bensin' : 'Kurus Udara'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Battery Voltage */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">AKI / BATTERY (TEGANGAN)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.battery} <span className="text-xs text-slate-500 font-normal">V</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-emerald-400">
              <Battery className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.battery / 16) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Min: 11.5V (Kritis)</span>
              <span>Sistem Pengisian: OK</span>
            </div>
          </div>
        </div>

        {/* Card 4: Injector Timing */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">INJECTOR DURATION (PULSE)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.injectorDuration} <span className="text-xs text-slate-500 font-normal">ms</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-indigo-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.injectorDuration / 12) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Lama katup menyembur bensin</span>
              <span>Max Beban: 10ms</span>
            </div>
          </div>
        </div>

        {/* Card 5: MAP Pressure */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">MAP (TEKANAN MANIFOLD)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.map} <span className="text-xs text-slate-500 font-normal">kPa</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-sky-400">
              <Wind className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.map / 110) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Tekanan hampa: 20 kPa</span>
              <span>Udara Bebas: 101 kPa</span>
            </div>
          </div>
        </div>

        {/* Card 6: Spark Advance */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">SPARK ADVANCE (BUSI)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.sparkAdvance} <span className="text-xs text-slate-500 font-normal">°BTDC</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-yellow-400">
              <Zap className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.sparkAdvance / 45) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Sudut Pengapian Busi</span>
              <span>Sesuai Peta Ignition Map</span>
            </div>
          </div>
        </div>

        {/* Card 7: IAT Temp */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">IAT (SUHU UDARA MASUK)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.iat} <span className="text-xs text-slate-500 font-normal">°C</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-blue-400">
              <Compass className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.iat / 70) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Suhu di Box Filter</span>
              <span>Udara luar masuk ke mesin</span>
            </div>
          </div>
        </div>

        {/* Card 8: O2 Sensor Voltage */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">SENSOR O2 (TEGANGAN)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.o2Voltage} <span className="text-xs text-slate-500 font-normal">V</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-purple-400">
              <Droplet className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.o2Voltage / 1.0) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>0.1V (Miskin) - 0.9V (Kaya)</span>
              <span className="text-slate-400 font-semibold">Tegangan Bolak-balik</span>
            </div>
          </div>
        </div>

        {/* Card 9: EGT Exhaust Gas Temp */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">EGT (SUHU GAS BUANG/LEHER)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.egt} <span className="text-xs text-slate-500 font-normal">°C</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-red-400">
              <Flame className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300"
                style={{ width: `${Math.min(100, (sensors.egt / 900) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Climbs under engine load</span>
              <span>Max aman: 850°C</span>
            </div>
          </div>
        </div>

        {/* Card 10: Purge Valve Duty */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">PURGE VALVE EVAP DUTY</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.purgeValve} <span className="text-xs text-slate-500 font-normal">%</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-amber-500">
              <Wind className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${sensors.purgeValve}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Sirkulasi Uap Bensin (Euro 5)</span>
              <span>Dinamis diatur ECU</span>
            </div>
          </div>
        </div>

        {/* Card 11: Short Term Fuel Trim (STFT) */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">STFT (KOREKSI BBM JANGKA PENDEK)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.shortTrim} <span className="text-xs text-slate-500 font-normal">%</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-indigo-400">
              <Activity className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${50 + (sensors.shortTrim * 2)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Koreksi instan O2 Feedback</span>
              <span>Ideal: 0% (&plusmn;10% batas toleransi)</span>
            </div>
          </div>
        </div>

        {/* Card 12: Long Term Fuel Trim (LTFT) */}
        <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4.5 shadow flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] text-slate-500 font-mono block font-bold">LTFT (KOREKSI BBM JANGKA PANJANG)</span>
              <p className="text-2xl font-extrabold font-mono text-slate-200 mt-1">
                {sensors.longTrim} <span className="text-xs text-slate-500 font-normal">%</span>
              </p>
            </div>
            <div className="p-2 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-emerald-400">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="w-full mt-3">
            <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${50 + (sensors.longTrim * 2)}%` }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-slate-500 font-mono mt-1.5">
              <span>Pelajaran adaptasi bensin ECU</span>
              <span>Penyimpangan kebiasaan injektor</span>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Slide Knobs control panel specifically for simulator tuning */}
      <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl" id="simulator-sliders-panel">
        <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center gap-1.5 border-b border-[#181d29] pb-3 mb-5">
          <Sliders className="text-orange-500 h-4.5 w-4.5" />
          METER PENYESUAIAN MANUAL (TUNING SIMULATOR KNOBS)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Knob 1: Throttle position */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">Tarik Throttle Gas (TPS %):</span>
              <span className="text-emerald-400 font-bold">{sensors.tps}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={sensors.tps}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors((prev) => {
                  const isEngineOn = prev.rpm > 0;
                  let calculatedRpm = prev.rpm;
                  if (isEngineOn) {
                    calculatedRpm = Math.round(1500 + (val / 100) * 8000);
                  }
                  return {
                    ...prev,
                    tps: val,
                    tpsVoltage: parseFloat((0.5 + (val / 100) * 4.0).toFixed(2)),
                    rpm: calculatedRpm,
                    speed: val > 0 ? Math.round((val / 100) * 115) : 0,
                    map: isEngineOn ? Math.round(101 - (calculatedRpm / 120) * (1 - val / 100)) : 101,
                    injectorDuration: isEngineOn ? Math.round((1.8 + (calculatedRpm / 4000) * (1 + val / 40)) * 10) / 10 : 0
                  };
                });
              }}
              disabled={connection === 'disconnected'}
              className="w-full h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>0% (0.5V)</span>
              <span>100% (4.5V)</span>
            </div>
          </div>

          {/* Knob 2: Engine Speed (RPM) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">Putaran Mesin (RPM):</span>
              <span className="text-orange-500 font-bold">{sensors.rpm} RPM</span>
            </div>
            <input
              type="range"
              min={sensors.rpm > 0 ? "1200" : "0"}
              max="10500"
              value={sensors.rpm}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors((prev) => {
                  const isEngineOn = val > 0;
                  return {
                    ...prev,
                    rpm: val,
                    speed: isEngineOn ? Math.round((prev.tps / 100) * 115) : 0,
                    injectorDuration: isEngineOn ? Math.round((1.8 + (val / 4000) * (1 + prev.tps / 40)) * 10) / 10 : 0
                  };
                });
              }}
              disabled={connection === 'disconnected'}
              className="w-full h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Idling: 1500</span>
              <span>Redline: 9500+</span>
            </div>
          </div>

          {/* Knob 3: Suhu Pendingin ECT */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">Suhu Mesin ECT (°C):</span>
              <span className="text-red-400 font-bold">{sensors.ect}°C</span>
            </div>
            <input
              type="range"
              min="20"
              max="130"
              value={sensors.ect}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setSensors((prev) => ({ ...prev, ect: val }));
              }}
              disabled={connection === 'disconnected'}
              className="w-full h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>Dingin: 20°C</span>
              <span>Overheat: 100°C+</span>
            </div>
          </div>

          {/* Knob 4: Air-Fuel Ratio (AFR) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400 font-semibold">Rasio Bahan Bakar (AFR):</span>
              <span className="text-sky-400 font-bold">{sensors.afr}:1</span>
            </div>
            <input
              type="range"
              min="100"
              max="180"
              value={Math.round(sensors.afr * 10)}
              onChange={(e) => {
                const val = parseFloat(e.target.value) / 10;
                setSensors((prev) => ({ ...prev, afr: val }));
              }}
              disabled={connection === 'disconnected'}
              className="w-full h-1.5 bg-[#0a0c10] rounded-lg appearance-none cursor-pointer accent-orange-500 disabled:opacity-40"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-mono">
              <span>10.0 (Sangat Kaya)</span>
              <span>18.0 (Sangat Kurus)</span>
            </div>
          </div>
        </div>

        {/* Info panel */}
        <div className="mt-5 p-3.5 bg-[#0a0c10] border border-[#1c2230] rounded-lg text-[11px] text-slate-400 flex items-start gap-2.5">
          <Activity className="h-4.5 w-4.5 text-orange-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed font-sans">
            <strong className="text-slate-200">Tips Kalibrasi Bengkel WAHYU MOTOR JRT TECH:</strong> Ketika mendiagnosa TPS yang bermasalah, geser slider TPS di atas secara perlahan dari 0% ke 100%. Amati tegangan sensor (Volts) di gauge kanan. Jika ada lonjakan tegangan yang tiba-tiba turun ke nol sebelum 100%, hal tersebut menandakan tahanan karbon sirkuit TPS tergores/putus dan TPS harus diganti baru.
          </p>
        </div>
      </div>
    </div>
  );
}
