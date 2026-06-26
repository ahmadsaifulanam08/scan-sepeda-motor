/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cpu, 
  Activity, 
  AlertOctagon, 
  Settings, 
  FileCode, 
  Download, 
  Info, 
  Zap, 
  Terminal, 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Sparkles, 
  AlertCircle,
  FileText,
  Trash2,
  Gauge
} from 'lucide-react';
import { SensorData, DiagnosticTroubleCode, MotorBrand, ProtocolMode, ConnectionState, HONDA_DTC_DATABASE, YAMAHA_DTC_DATABASE, MOTORCYCLE_PROFILES } from './types';
import WiringDiagram from './components/WiringDiagram';
import TuningGrid from './components/TuningGrid';
import TelemetryGraphs from './components/TelemetryGraphs';
import AiAssistant from './components/AiAssistant';
import HondaPinouts from './components/HondaPinouts';
import SensorDashboard from './components/SensorDashboard';
import wahyuMotorBanner from './assets/images/wahyu_motor_banner_1782477892356.jpg';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'home' | 'dashboard' | 'diagnose' | 'dtc' | 'wiring'>('home');

  // Connection State
  const [selectedBrand, setSelectedBrand] = useState<MotorBrand>('Honda');
  const [selectedProfileId, setSelectedProfileId] = useState<string>('beat_k81');
  const activeProfile = MOTORCYCLE_PROFILES.find(p => p.id === selectedProfileId);
  const [protocol, setProtocol] = useState<ProtocolMode>('OBD2_ISO14230');
  const [connection, setConnection] = useState<ConnectionState>('disconnected');
  const [serialBaud, setSerialBaud] = useState<number>(10400);
  const [serialPortName, setSerialPortName] = useState<string>('COM3');
  
  // Console logging (HEX traffic representation)
  const [hexLogs, setHexLogs] = useState<string[]>([
    'SYSTEM: FTDI Scanner engine initialized.',
    'SYSTEM: Silakan pilih port serial dan hubungkan ke motor.'
  ]);
  const [rawHexInput, setRawHexInput] = useState<string>('');

  // Notifications
  const [notifications, setNotifications] = useState<{ id: number; text: string; type: 'info' | 'success' | 'warning' | 'error' }[]>([]);

  // Active DTC codes
  const [activeDtcs, setActiveDtcs] = useState<DiagnosticTroubleCode[]>([]);

  // Active Live Sensor Data
  const [sensors, setSensors] = useState<SensorData>({
    rpm: 0,
    tps: 0,
    ect: 28, // Engine Coolant Temp (starting at ambient)
    iat: 31, // Intake Air Temp
    map: 101, // Atmospheric Pressure kPa
    afr: 14.7, // Stoichiometric
    battery: 12.4, // Battery voltage
    sparkAdvance: 15, // Ignition spark advance
    o2Voltage: 0.45, // O2 voltage
    injectorDuration: 0.0, // Injector timing
    shortTrim: 0,
    longTrim: 0,
    speed: 0,
    tpsVoltage: 0.52,
    milStatus: false,
    egt: 150,
    purgeValve: 0
  });

  // Sensor History for real-time charting/logging
  const [history, setHistory] = useState<SensorData[]>([]);
  const [isLogging, setIsLogging] = useState<boolean>(false);
  const [recordedLogs, setRecordedLogs] = useState<{ timestamp: string; data: SensorData }[]>([]);

  // Dyno Sweep Simulation states
  const [sweepActive, setSweepActive] = useState<boolean>(false);
  const sweepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Add Notification utility
  const triggerNotification = (text: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setNotifications((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  };

  // Add Hex logs utility
  const appendHexLog = (msg: string) => {
    setHexLogs((prev) => [msg, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  // Auto-set standard baud rate on protocol change
  useEffect(() => {
    if (protocol === 'EURO5_CAN') {
      setSerialBaud(115200);
    } else {
      setSerialBaud(10400); // K-Line Honda/Yamaha
    }
  }, [protocol]);

  // Auto-default selected motorcycle model when brand changes
  useEffect(() => {
    const firstOfBrand = MOTORCYCLE_PROFILES.find(p => p.brand === selectedBrand);
    if (firstOfBrand) {
      setSelectedProfileId(firstOfBrand.id);
    }
  }, [selectedBrand]);

  // Connect/Disconnect simulation or real serial port
  const handleConnect = (mode: 'simulate' | 'real') => {
    const activeProfile = MOTORCYCLE_PROFILES.find(p => p.id === selectedProfileId);

    if (connection !== 'disconnected') {
      // Disconnect
      setConnection('disconnected');
      setSensors((prev) => ({ ...prev, rpm: 0, speed: 0, injectorDuration: 0, milStatus: false }));
      appendHexLog(`DISCONNECTED: Koneksi ke ECU ${activeProfile?.model || selectedBrand} diputus.`);
      triggerNotification('Koneksi ke ECU terputus', 'warning');
      return;
    }

    if (mode === 'simulate') {
      setConnection('simulated');
      appendHexLog(`CONNECTED: Menghubungkan lewat simulasi FTDI.`);
      appendHexLog(`SCAN: ${activeProfile?.model || selectedBrand} (${activeProfile?.year || 'N/A'})`);
      appendHexLog(`ECU: ${activeProfile?.ecuCode || 'N/A'} - Protocol Handshake sukses.`);
      appendHexLog(`TX: [K-LINE] 81 12 F1 81 05 (Fast Init Request)`);
      appendHexLog(`RX: [K-LINE] 80 F1 12 03 C1 01 8F (Success, Key Bytes: 8F)`);
      triggerNotification(`Terhubung ke ECU ${activeProfile?.model || selectedBrand} (Mode Simulasi)`, 'success');
    } else {
      // Mock Real Serial Port Request (Web Serial API placeholder)
      setConnection('connecting');
      appendHexLog(`FTDI: Membuka Port ${serialPortName} pada Baud Rate ${serialBaud}...`);
      
      setTimeout(() => {
        setConnection('connected');
        appendHexLog(`FTDI: Konektor Serial FT232RL terdeteksi.`);
        appendHexLog(`SCAN: Mendeteksi ${activeProfile?.model || selectedBrand} (${activeProfile?.year || 'N/A'})`);
        appendHexLog(`ECU: ${activeProfile?.ecuCode || 'N/A'} - Sinkronisasi Sukses.`);
        appendHexLog(`TX: [K-LINE] 81 12 F1 81 05`);
        appendHexLog(`RX: [K-LINE] 80 F1 12 03 C1 01 8F`);
        triggerNotification(`Sukses terhubung ke ${activeProfile?.model || selectedBrand} di ${serialPortName}`, 'success');
      }, 1500);
    }
  };

  // Telemetry stream generator (Runs when connected/simulated)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if ((connection === 'simulated' || connection === 'connected') && !sweepActive) {
      interval = setInterval(() => {
        setSensors((prev) => {
          const isEngineOn = prev.rpm > 0;
          
          // Small fluctuations
          const rpmNoise = isEngineOn ? Math.round((Math.random() - 0.5) * 80) : 0;
          const afrNoise = isEngineOn ? Math.round((Math.random() - 0.5) * 6) / 10 : 0;
          const batteryNoise = Math.round((Math.random() - 0.5) * 4) / 10;

          // Engine Warm-up simulation
          let newEct = prev.ect;
          if (isEngineOn && prev.ect < 85) {
            newEct = prev.ect + 0.1; // rise temp
          } else if (!isEngineOn && prev.ect > 30) {
            newEct = prev.ect - 0.05; // cool down
          }

          // MAP changes based on TPS & RPM
          const baseMap = 101; // Atm pressure
          const calculatedMap = isEngineOn 
            ? Math.round(baseMap - (prev.rpm / 120) * (1 - prev.tps / 100))
            : baseMap;

          // Duration injector based on TPS & RPM
          const baseInj = isEngineOn ? 1.8 : 0;
          const calculatedInj = isEngineOn 
            ? Math.round((baseInj + (prev.rpm / 4000) * (1 + prev.tps / 40)) * 100) / 100
            : 0;

          // O2 Sensor cycling (voltage toggling 0.1v lean to 0.9v rich)
          const newO2 = isEngineOn 
            ? Math.round((0.5 + Math.sin(Date.now() / 800) * 0.35 + (prev.afr - 14.7) * -0.15) * 100) / 100
            : 0.45;

          // Exhaust Gas Temp (EGT) climbs with load/RPM
          const targetEgt = isEngineOn ? 250 + (prev.rpm / 20) + (prev.tps * 3) : 120;
          const currentEgt = prev.egt + (targetEgt - prev.egt) * 0.1;

          // Purge Valve Duty Cycles periodically (Euro 5)
          const currentPurge = protocol === 'EURO5_CAN' && isEngineOn
            ? Math.round(15 + Math.sin(Date.now() / 5000) * 15)
            : 0;

          const updated: SensorData = {
            ...prev,
            rpm: isEngineOn ? Math.max(1200, Math.min(10500, prev.rpm + rpmNoise)) : 0,
            ect: parseFloat(newEct.toFixed(1)),
            map: Math.max(30, Math.min(105, calculatedMap)),
            afr: isEngineOn ? parseFloat(Math.max(11.2, Math.min(16.5, 14.2 + afrNoise)).toFixed(1)) : 14.7,
            battery: parseFloat((13.8 + batteryNoise).toFixed(1)),
            injectorDuration: calculatedInj,
            o2Voltage: Math.max(0.05, Math.min(0.95, newO2)),
            egt: Math.round(currentEgt),
            purgeValve: currentPurge
          };

          // Store in history
          setHistory((prevHistory) => [...prevHistory, updated].slice(-40)); // Keep last 40 ticks

          // Store in recorded logs if recording is on
          if (isLogging) {
            setRecordedLogs((prevRec) => [
              ...prevRec, 
              { timestamp: new Date().toLocaleTimeString(), data: updated }
            ]);
          }

          // Intermittently append Hex log stream to make it look active
          if (Math.random() > 0.75) {
            const hexRpm = updated.rpm.toString(16).toUpperCase().padStart(4, '0');
            const hexTps = Math.round(updated.tps * 2.55).toString(16).toUpperCase().padStart(2, '0');
            appendHexLog(`RX: [ECU_DATA] 83 F1 12 51 ${hexTps} ${hexRpm.slice(0, 2)} ${hexRpm.slice(2)} C2`);
          }

          return updated;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [connection, sweepActive, isLogging, protocol]);

  // Handle Dyno / TPS Sweep test sequence
  const triggerDynoTest = () => {
    if (connection === 'disconnected') {
      triggerNotification('Harap hubungkan scanner ke motor terlebih dahulu!', 'warning');
      return;
    }

    setSweepActive(true);
    triggerNotification('Memulai Tes Dyno & TPS Sweep! Jangan lepaskan throttle...', 'info');
    appendHexLog('TEST: Memulai rentetan pengujian TPS Sweep & Limiter Bounce.');

    let step = 0;
    // Turn engine on first if it was off
    setSensors(prev => ({ ...prev, rpm: 1500, tps: 0, speed: 0 }));

    sweepIntervalRef.current = setInterval(() => {
      setSensors((prev) => {
        let nextTps = prev.tps;
        let nextRpm = prev.rpm;
        let nextSpeed = prev.speed;
        let nextSpark = prev.sparkAdvance;
        let nextAfr = prev.afr;

        // Stage 1: Gradual full throttle (TPS climbing to 100%)
        if (step < 12) {
          nextTps = Math.min(100, prev.tps + 10);
          nextRpm = Math.min(10200, prev.rpm + 750);
          nextSpeed = Math.min(120, prev.speed + 10);
          nextSpark = 24 + Math.round(step * 0.5);
          nextAfr = 13.0; // Running rich
        }
        // Stage 2: Limiter bounce! (Bounce rapidly at max RPM)
        else if (step < 22) {
          nextTps = 100;
          // Bounce limiter cycle (Ignition Cut)
          if (prev.rpm >= 10200) {
            nextRpm = 9700; // instant cut
            nextSpark = -5; // retard ignition during cut
            nextAfr = 15.5; // lean out on fuel/ignition cut
            appendHexLog('ECU: !!! RPM LIMITER ACTIVE - IGNITION OUT !!!');
          } else {
            nextRpm = 10300;
            nextSpark = 28;
            nextAfr = 12.5;
          }
        }
        // Stage 3: Throttle release (Engine idle down)
        else if (step < 30) {
          nextTps = Math.max(0, prev.tps - 15);
          nextRpm = Math.max(1500, prev.rpm - 1100);
          nextSpeed = Math.max(0, prev.speed - 15);
          nextSpark = 15;
          nextAfr = 14.7;
        }
        // Stage 4: Test complete
        else {
          clearInterval(sweepIntervalRef.current!);
          setSweepActive(false);
          triggerNotification('Tes Dynometer & Grafik TPS selesai!', 'success');
          appendHexLog('TEST: Pengujian dyno tuntas. Parameter kembali stabil.');
        }

        step++;
        const updated = {
          ...prev,
          tps: nextTps,
          tpsVoltage: parseFloat((0.5 + (nextTps / 100) * 4.0).toFixed(2)),
          rpm: nextRpm,
          speed: nextSpeed,
          sparkAdvance: nextSpark,
          afr: parseFloat(nextAfr.toFixed(1))
        };

        setHistory((prevH) => [...prevH, updated].slice(-40));
        return updated;
      });
    }, 200);
  };

  // Turn engine on or off manually
  const toggleEngine = () => {
    if (connection === 'disconnected') {
      triggerNotification('Merekam data gagal. Hubungkan ke motor terlebih dahulu!', 'warning');
      return;
    }
    
    setSensors((prev) => {
      const isOn = prev.rpm > 0;
      if (isOn) {
        appendHexLog('USER: Mematikan kunci kontak (Koil & Pengapian OFF)');
        triggerNotification('Mesin motor dimatikan', 'info');
        return { ...prev, rpm: 0, speed: 0, injectorDuration: 0 };
      } else {
        appendHexLog('USER: Starter elektrik ditekan. Mesin dihidupkan.');
        triggerNotification('Mesin motor dihidupkan (Idling)', 'success');
        return { ...prev, rpm: 1500, speed: 0, injectorDuration: 2.1 };
      }
    });
  };

  // Simulate Fault codes generation (DTC interactive injector)
  const injectFault = (faultType: 'tps_circuit' | 'coolant_over' | 'o2_sensor') => {
    if (connection === 'disconnected') {
      triggerNotification('Harap hubungkan scanner untuk menyimulasikan kerusakan ECU!', 'warning');
      return;
    }

    setSensors((prev) => {
      let updated = { ...prev, milStatus: true };
      let newDtcs = [...activeDtcs];

      if (faultType === 'tps_circuit') {
        updated.tpsVoltage = 0.12; // broken low voltage
        updated.tps = 0;
        const code = selectedBrand === 'Honda' 
          ? HONDA_DTC_DATABASE.find(d => d.code === 'P0122')! 
          : YAMAHA_DTC_DATABASE.find(d => d.code === 'P0122')!;
        if (!newDtcs.some(d => d.code === code.code)) newDtcs.push(code);
        triggerNotification('Kerusakan diinjeksikan: TPS Sirkuit Tegangan Rendah', 'error');
        appendHexLog('ECU_ALERT: DTC Aktif Terdeteksi [P0122 - TPS Low Voltage]');
      } 
      else if (faultType === 'coolant_over') {
        updated.ect = 122; // Extreme hot
        const code = selectedBrand === 'Honda'
          ? HONDA_DTC_DATABASE.find(d => d.code === 'P0217')!
          : YAMAHA_DTC_DATABASE.find(d => d.code === 'P0117')!;
        if (!newDtcs.some(d => d.code === code.code)) newDtcs.push(code);
        triggerNotification('Suhu Mesin Panas Berlebih! Bahaya Overheat!', 'error');
        appendHexLog('ECU_ALERT: DTC Aktif Terdeteksi [P0217 / P0117 - Overheat]');
      }
      else {
        updated.o2Voltage = 0.02; // broken
        updated.afr = 16.5; // lean
        const code = selectedBrand === 'Honda'
          ? HONDA_DTC_DATABASE.find(d => d.code === 'P0131')!
          : YAMAHA_DTC_DATABASE.find(d => d.code === 'P0130')!;
        if (!newDtcs.some(d => d.code === code.code)) newDtcs.push(code);
        triggerNotification('Malfungsi Sensor O2 terdeteksi', 'error');
        appendHexLog('ECU_ALERT: DTC Aktif Terdeteksi Sensor O2 Sirkuit Terganggu.');
      }

      setActiveDtcs(newDtcs);
      return updated;
    });
  };

  // Clear DTC (Hapus kode kerusakan)
  const handleClearDtcs = () => {
    if (connection === 'disconnected') {
      triggerNotification('Koneksi scanner tidak aktif!', 'warning');
      return;
    }

    triggerNotification('Mengirim perintah penghapusan DTC ke RAM ECU...', 'info');
    appendHexLog('TX: [CLEAR_DTC] 14 FF FF FF (Clear All Diagnostic Codes)');

    setTimeout(() => {
      setActiveDtcs([]);
      setSensors((prev) => ({ 
        ...prev, 
        milStatus: false, 
        tpsVoltage: 0.52, 
        ect: Math.min(prev.ect, 85), 
        o2Voltage: 0.45 
      }));
      appendHexLog('RX: [CLEAR_DTC] 54 (ECU Memory reset successful)');
      triggerNotification('Semua kode kerusakan berhasil dihapus! MIL Mati.', 'success');
    }, 1500);
  };

  // Download logged data
  const handleDownloadCSV = () => {
    if (recordedLogs.length === 0) {
      triggerNotification('Tidak ada log terekam dalam database!', 'warning');
      return;
    }

    const headers = 'Waktu,RPM,TPS(%),ECT(°C),IAT(°C),MAP(kPa),AFR,Aki(V),Ignition(°),MIL_On';
    const rows = recordedLogs.map(l => 
      `${l.timestamp},${l.data.rpm},${l.data.tps},${l.data.ect},${l.data.iat},${l.data.map},${l.data.afr},${l.data.battery},${l.data.sparkAdvance},${l.data.milStatus ? 1 : 0}`
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EcuLog_${selectedBrand}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    triggerNotification(`Sukses mengunduh ${recordedLogs.length} baris log data!`, 'success');
  };

  // Sending manual HEX commands to FTDI
  const sendManualHex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawHexInput.trim()) return;
    if (connection === 'disconnected') {
      triggerNotification('Port Serial tidak terbuka!', 'warning');
      return;
    }

    const cleanInput = rawHexInput.toUpperCase().trim();
    appendHexLog(`TX: ${cleanInput}`);
    setRawHexInput('');

    // Simulated responses to manual hex inputs
    setTimeout(() => {
      if (cleanInput.startsWith('21 01') || cleanInput.startsWith('01 00')) {
        // PID request
        appendHexLog(`RX: 61 01 F5 03 D8 (Engine Speed: 1500 RPM)`);
      } else if (cleanInput === '09 02') {
        // VIN request
        appendHexLog(`RX: 49 02 01 MH1KC2109FK71...`);
      } else {
        // Standard ok
        appendHexLog(`RX: 7F ${cleanInput.slice(0, 2)} 11 (Subfunction Not Supported or General Response)`);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] text-slate-100 flex flex-col font-sans select-none" id="scanner-applet-root">
      {/* Top Banner Navigation & Status */}
      <header className="bg-[#11141b] border-b border-[#1c2230] px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500 rounded-lg text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-md font-extrabold font-display tracking-tight text-white flex items-center gap-1.5">
              WAHYU MOTOR JRT TECH
              <span className="text-[9px] bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded font-bold font-sans">
                PRO DIAGNOSTIC
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium font-sans">Sistem Scanner & Diagnosa ECU Pintar</p>
          </div>
        </div>

        {/* Global connection control bar */}
        <div className="flex flex-wrap items-center gap-3 bg-[#0a0c10] p-2 rounded-xl border border-[#1c2230]" id="connection-manager-bar">
          {/* Brand select */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">Merek:</span>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value as MotorBrand)}
              disabled={connection !== 'disconnected'}
              className="bg-[#11141b] text-xs text-slate-200 border border-[#1c2230] rounded px-2 py-1 font-mono outline-none"
            >
              <option value="Honda">Honda FI</option>
              <option value="Yamaha">Yamaha FI</option>
            </select>
          </div>

          {/* Model Motor select */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono pl-1.5">Model:</span>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              disabled={connection !== 'disconnected'}
              className="bg-[#11141b] text-xs text-slate-200 border border-[#1c2230] rounded px-2 py-1 font-mono outline-none max-w-[160px] truncate"
            >
              {MOTORCYCLE_PROFILES.filter(p => p.brand === selectedBrand).map(p => (
                <option key={p.id} value={p.id}>
                  {p.model}
                </option>
              ))}
            </select>
          </div>

          {/* Protocol type */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-500 font-mono">Protokol:</span>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as ProtocolMode)}
              disabled={connection !== 'disconnected'}
              className="bg-[#11141b] text-xs text-slate-200 border border-[#1c2230] rounded px-2 py-1 font-mono outline-none"
            >
              <option value="OBD2_ISO14230">K-Line (OBD2)</option>
              <option value="EURO5_CAN">Euro 5 (CAN-Bus)</option>
            </select>
          </div>

          {/* Connect Button */}
          <div className="flex items-center gap-2">
            {connection === 'disconnected' ? (
              <>
                <button
                  onClick={() => handleConnect('simulate')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono font-bold text-xs rounded transition-all cursor-pointer"
                >
                  Simulasi
                </button>
                <button
                  onClick={() => handleConnect('real')}
                  className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-xs rounded shadow transition-all cursor-pointer"
                >
                  Koneksi FTDI
                </button>
              </>
            ) : (
              <button
                onClick={() => handleConnect('real')}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded transition-all cursor-pointer flex items-center gap-1"
              >
                <XCircle className="h-3 w-3" />
                Disconnect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Framework Layout with Sidebar and Content View */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full md:w-60 bg-[#11141b] border-r border-[#1c2230] p-4 flex flex-col gap-6" id="applet-sidebar">
          
          {/* Quick Connection Status widget */}
          <div className="bg-[#0a0c10] border border-[#1c2230] rounded-xl p-3.5" id="sidebar-status-card">
            <span className="text-[9px] text-slate-500 font-mono block">STATUS KONEKSI PORT:</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`h-2.5 w-2.5 rounded-full ${
                connection === 'simulated' ? 'bg-amber-400 animate-pulse' :
                connection === 'connected' ? 'bg-emerald-400 animate-pulse' :
                connection === 'connecting' ? 'bg-sky-400 animate-spin border-t-2 border-slate-900' :
                'bg-slate-750'
              }`} />
              <span className="text-xs font-mono font-bold text-slate-200">
                {connection === 'simulated' ? 'SIMULASI AKTIF' :
                 connection === 'connected' ? 'FTDI HUBUNG' :
                 connection === 'connecting' ? 'CONNECTING...' :
                 'DISCONNECTED'}
              </span>
            </div>
            
            {/* Quick action: Engine Trigger */}
            <button
              onClick={toggleEngine}
              disabled={connection === 'disconnected'}
              className={`w-full py-2 mt-3 text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                sensors.rpm > 0
                  ? 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              {sensors.rpm > 0 ? 'MATIKAN MESIN' : 'HIDUPKAN MESIN'}
            </button>

            {connection !== 'disconnected' && activeProfile && (
              <div className="mt-3 pt-3 border-t border-[#1c2230] space-y-1">
                <span className="text-[9px] text-slate-500 font-mono block">MOTOR AKTIF:</span>
                <p className="text-[11px] font-bold font-mono text-white truncate">{activeProfile.model}</p>
                <p className="text-[10px] text-slate-400 font-mono">Tahun: {activeProfile.year}</p>
                <p className="text-[10px] text-orange-500 font-bold font-mono mt-1 border-t border-[#1c2230]/50 pt-1">ECU: {activeProfile.ecuCode}</p>
              </div>
            )}
          </div>

          {/* Menus / Tabs links list */}
          <nav className="flex flex-col gap-1" id="sidebar-nav-links">
            <span className="text-[10px] text-slate-500 font-mono block px-2 mb-1.5">BENGKEL MENU:</span>
            
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-[#181c25] text-orange-500 border-l-2 border-orange-500 shadow'
                  : 'text-slate-400 hover:bg-[#0a0c10]/80 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-4 w-4" />
              WAHYU MOTOR JRT
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#181c25] text-orange-500 border-l-2 border-orange-500 shadow'
                  : 'text-slate-400 hover:bg-[#0a0c10]/80 hover:text-slate-200'
              }`}
            >
              <Gauge className="h-4 w-4" />
              Dashboard Sensor
            </button>

            <button
              onClick={() => setActiveTab('diagnose')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'diagnose'
                  ? 'bg-[#181c25] text-orange-500 border-l-2 border-orange-500 shadow'
                  : 'text-slate-400 hover:bg-[#0a0c10]/80 hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              Diagnosa ECU
            </button>

            <button
              onClick={() => setActiveTab('dtc')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono text-left transition-all flex items-center gap-2.5 relative cursor-pointer ${
                activeTab === 'dtc'
                  ? 'bg-[#181c25] text-orange-500 border-l-2 border-orange-500 shadow'
                  : 'text-slate-400 hover:bg-[#0a0c10]/80 hover:text-slate-200'
              }`}
            >
              <AlertOctagon className="h-4 w-4" />
              Membaca DTC
              {activeDtcs.length > 0 && (
                <span className="absolute right-2 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-[9px] font-bold">
                  {activeDtcs.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('wiring')}
              className={`px-3 py-2.5 rounded-lg text-xs font-bold font-mono text-left transition-all flex items-center gap-2.5 cursor-pointer ${
                activeTab === 'wiring'
                  ? 'bg-[#181c25] text-orange-500 border-l-2 border-orange-500 shadow'
                  : 'text-slate-400 hover:bg-[#0a0c10]/80 hover:text-slate-200'
              }`}
            >
              <Settings className="h-4 w-4" />
              Pin Out ECU All Honda
            </button>
          </nav>
          
          {/* Hex Terminal Console Widget (Bottom Sidebar) */}
          <div className="flex-1 flex flex-col justify-end">
            <div className="bg-[#0a0c10] rounded-lg p-2.5 border border-[#1c2230]" id="terminal-widget">
              <span className="text-[8px] text-slate-500 font-mono flex items-center gap-1 mb-1">
                <Terminal className="h-3 w-3 text-orange-400" />
                HEX DATA TRAFFIC LOG
              </span>
              <div className="h-20 overflow-y-auto font-mono text-[8px] text-slate-400 flex flex-col gap-0.5 scrollbar-thin">
                {hexLogs.map((log, idx) => (
                  <div key={idx} className={log.startsWith('TX:') ? 'text-orange-400' : log.startsWith('RX:') ? 'text-sky-400' : 'text-slate-400'}>
                    {log}
                  </div>
                ))}
              </div>
              <form onSubmit={sendManualHex} className="mt-1.5 flex gap-1">
                <input 
                  type="text" 
                  placeholder="Kirim Hex..."
                  value={rawHexInput}
                  onChange={(e) => setRawHexInput(e.target.value)}
                  className="flex-1 bg-[#11141b] border border-[#1c2230] rounded px-1.5 py-0.5 text-[8px] font-mono outline-none text-slate-300 placeholder-slate-600 focus:border-orange-500"
                />
              </form>
            </div>
          </div>
        </aside>

        {/* NOTIFICATIONS PANEL FLOATING */}
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm" id="notifications-box">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`p-3.5 rounded-lg border text-xs font-mono font-semibold flex gap-2 items-start shadow-xl ${
                  n.type === 'success' ? 'bg-[#181c25]/95 border-orange-500 text-orange-400' :
                  n.type === 'error' ? 'bg-red-950/95 border-red-500 text-red-400' :
                  n.type === 'warning' ? 'bg-orange-950/95 border-orange-500 text-orange-400' :
                  'bg-[#11141b]/95 border-[#1c2230] text-slate-200'
                }`}
              >
                {n.type === 'success' && <CheckCircle className="h-4 w-4 shrink-0" />}
                {n.type === 'error' && <XCircle className="h-4 w-4 shrink-0" />}
                {n.type === 'warning' && <AlertCircle className="h-4 w-4 shrink-0" />}
                {n.type === 'info' && <Info className="h-4 w-4 shrink-0" />}
                <p>{n.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* MAIN DISPLAY CONTENT VIEWPORT */}
        <main className="flex-1 bg-[#0a0c10] p-6 overflow-y-auto" id="applet-viewport">
          <AnimatePresence mode="wait">
            {/* TAB: BERANDA WAHYU MOTOR JRT TECH */}
            {activeTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="tab-home"
              >
                {/* Hero Banner Section */}
                <div className="relative overflow-hidden rounded-2xl border border-[#1c2230] bg-[#11141b] shadow-2xl">
                  <div className="h-64 sm:h-80 md:h-96 w-full relative">
                    <img 
                      src={wahyuMotorBanner} 
                      alt="Wahyu Motor JRT Tech Banner" 
                      className="w-full h-full object-cover opacity-85"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-black/40"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="px-2.5 py-1 bg-orange-500 text-white font-mono text-[10px] font-bold rounded-md uppercase tracking-wider shadow">
                        Bengkel Spesialis & Tuning FI
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-extrabold font-display tracking-tight text-white mt-2 drop-shadow-md">
                        WAHYU MOTOR JRT TECH
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-200 font-mono mt-1 drop-shadow">
                        Solusi Pintar Diagnosa ECU, Remap, Kelistrikan, & Perawatan Motor Injeksi Honda & Yamaha
                      </p>
                    </div>
                  </div>
                </div>

                {/* Welcome cards grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card 1: Dashboard Sensor */}
                  <div 
                    onClick={() => setActiveTab('dashboard')}
                    className="bg-[#11141b] border border-[#1c2230] hover:border-orange-500/50 p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group"
                  >
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <Gauge className="h-6 w-6" />
                    </div>
                    <h3 className="text-md font-bold text-slate-100 mt-4 group-hover:text-orange-400 transition-colors">
                      Dashboard Sensor
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Panel instrumentasi utama membaca semua 12 parameter sensor motor secara sinkron dengan dial sirkuler dan status lampu peringatan.
                    </p>
                    <span className="text-xs font-mono text-orange-500 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Buka Dashboard &rarr;
                    </span>
                  </div>

                  {/* Card 2: Diagnostic */}
                  <div 
                    onClick={() => setActiveTab('diagnose')}
                    className="bg-[#11141b] border border-[#1c2230] hover:border-orange-500/50 p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group"
                  >
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <Activity className="h-6 w-6" />
                    </div>
                    <h3 className="text-md font-bold text-slate-100 mt-4 group-hover:text-orange-400 transition-colors">
                      Analisis Grafik ECU
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Lakukan diagnosa gelombang tegangan sensor dengan grafik real-time. Bagus untuk menemukan anomali sensor sesaat.
                    </p>
                    <span className="text-xs font-mono text-orange-500 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Buka Analisis &rarr;
                    </span>
                  </div>

                  {/* Card 3: DTC Codes */}
                  <div 
                    onClick={() => setActiveTab('dtc')}
                    className="bg-[#11141b] border border-[#1c2230] hover:border-orange-500/50 p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group"
                  >
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <AlertOctagon className="h-6 w-6" />
                    </div>
                    <h3 className="text-md font-bold text-slate-100 mt-4 group-hover:text-orange-400 transition-colors">
                      Membaca DTC Engine
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Pindai dan hapus Kode Kerusakan Diagnostik (DTC) yang tersimpan pada memori ECU. Simulasikan malfungsi sensor untuk mendeteksi kabel putus.
                    </p>
                    <span className="text-xs font-mono text-orange-500 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Mulai Pindai &rarr;
                    </span>
                  </div>

                  {/* Card 4: Honda Pinouts */}
                  <div 
                    onClick={() => setActiveTab('wiring')}
                    className="bg-[#11141b] border border-[#1c2230] hover:border-orange-500/50 p-5 rounded-xl cursor-pointer transition-all hover:-translate-y-1 hover:shadow-xl group"
                  >
                    <div className="p-3 bg-orange-500/10 text-orange-500 rounded-lg w-fit group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <Settings className="h-6 w-6" />
                    </div>
                    <h3 className="text-md font-bold text-slate-100 mt-4 group-hover:text-orange-400 transition-colors">
                      Pin Out ECU All Honda
                    </h3>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                      Lihat diagram pinout ECU 33-pin interaktif untuk semua jenis motor injeksi Honda. Memudahkan mekanik mencari jalur kabel kelistrikan utama.
                    </p>
                    <span className="text-xs font-mono text-orange-500 font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Lihat Pin Out &rarr;
                    </span>
                  </div>
                </div>

                {/* Integration Guide Section */}
                <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                      <h4 className="text-md font-bold text-slate-100 font-display flex items-center gap-2">
                        <span className="p-1.5 bg-orange-500/10 text-orange-500 rounded-lg">
                          <Terminal className="h-5 w-5" />
                        </span>
                        SISTEM ANTARMUKA KONEKTOR SCANNER FTDI
                      </h4>
                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        Aplikasi ini mendeteksi chip FTDI FT232RL yang terhubung ke port USB komputer/tablet bengkel Anda. Pastikan kabel K-Line terhubung ke pin DLC motor (kabel merah di bawah jok atau dekat aki).
                      </p>
                    </div>

                    {connection === 'disconnected' ? (
                      <button 
                        onClick={() => handleConnect('simulate')}
                        className="w-full md:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold text-xs rounded-xl shadow-lg shadow-orange-500/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play className="h-4 w-4" />
                        SIMULASIKAN KONEKSI SEKARANG
                      </button>
                    ) : (
                      <div className="flex items-center gap-2.5 bg-orange-500/10 border border-orange-500/20 px-4 py-2.5 rounded-lg text-orange-400 text-xs font-mono font-bold">
                        <CheckCircle className="h-4 w-4" />
                        KONEKSI TERBATAS AKTIF ({connection.toUpperCase()})
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: DIAGNOSA & LIVE DATA (GAUGES & MOD_GRAFIK) */}
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="tab-dashboard"
              >
                <SensorDashboard
                  sensors={sensors}
                  setSensors={setSensors}
                  connection={connection}
                  brand={selectedBrand}
                  onNotify={triggerNotification}
                  appendHexLog={appendHexLog}
                  triggerDynoTest={triggerDynoTest}
                  sweepActive={sweepActive}
                  selectedProfileId={selectedProfileId}
                />
              </motion.div>
            )}

            {/* TAB: DIAGNOSA & LIVE DATA (GAUGES & MOD_GRAFIK) */}
            {activeTab === 'diagnose' && (
              <motion.div
                key="diagnose"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 animate-fade-in"
                id="tab-diagnose"
              >
                {/* Real-time telemetry values strip (Digital Gauges) */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" id="digital-gauges-grid">
                  {/* Battery */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">AKI / BATTERY (V)</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-1">{sensors.battery}V</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Normal: 12.4-14.4V</span>
                  </div>

                  {/* Spark */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">SPARK ADV (°BTDC)</span>
                    <p className="text-xl font-extrabold text-orange-400 mt-1">{sensors.sparkAdvance}°</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Busi Pengapian</span>
                  </div>

                  {/* Injector */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">INJECTOR TIMING</span>
                    <p className="text-xl font-extrabold text-indigo-400 mt-1">{sensors.injectorDuration} ms</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Semburan Bensin</span>
                  </div>

                  {/* IAT Temp */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">IAT (SUHU UDARA)</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-1">{sensors.iat}°C</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Intake Temp</span>
                  </div>

                  {/* O2 sensor */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">SENSOR O2 VOLTS</span>
                    <p className="text-xl font-extrabold text-sky-400 mt-1">{sensors.o2Voltage}V</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Rasio Oksigen</span>
                  </div>

                  {/* Vehicle speed */}
                  <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-4 shadow text-center font-mono">
                    <span className="text-[9px] text-slate-500 block font-bold">SPEEDOMETER (KM/H)</span>
                    <p className="text-xl font-extrabold text-slate-200 mt-1">{sensors.speed} km/h</p>
                    <span className="text-[8px] text-slate-500 block mt-1">Sensor Kecepatan</span>
                  </div>
                </div>

                {/* Main Graph visualization integration */}
                <div className="h-[460px]">
                  <TelemetryGraphs
                    history={history}
                    onClearHistory={() => setHistory([])}
                    isSimulating={connection !== 'disconnected'}
                    onTriggerSweep={triggerDynoTest}
                    sweepActive={sweepActive}
                  />
                </div>
              </motion.div>
            )}

            {/* TAB: BACA & HAPUS KODE KERUSAKAN (DTC ENGINE) */}
            {activeTab === 'dtc' && (
              <motion.div
                key="dtc"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="tab-dtc"
              >
                <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl" id="dtc-core-card">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#1c2230] pb-4 mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
                        <AlertOctagon className="text-red-500 h-5 w-5" />
                        Membaca Kode Kerusakan ECU (DTC Engine)
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">
                        Memantau log kesalahan sensor aktif di memory EEPROM ECU secara real-time
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={handleClearDtcs}
                        disabled={connection === 'disconnected'}
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-lg shadow-md hover:shadow-red-500/10 cursor-pointer disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                        Hapus Kode Kerusakan (Clear DTC)
                      </button>
                    </div>
                  </div>

                  {/* DTC Table viewer */}
                  {activeDtcs.length === 0 ? (
                    <div className="text-center py-12 bg-[#0a0c10] rounded-lg border border-[#1c2230] text-slate-500 font-mono" id="dtc-empty-state">
                      <CheckCircle className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                      <p className="text-sm font-bold text-slate-300">TIDAK TERDETEKSI KODE KERUSAKAN</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Semua sirkuit sensor motor ({selectedBrand}) normal dan memenuhi parameter pembakaran Euro 5 / OBD2.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto border border-[#181d29] rounded-lg" id="dtc-table-box">
                      <table className="w-full text-left font-mono text-xs border-collapse">
                        <thead>
                          <tr className="bg-[#0a0c10] text-slate-400 border-b border-[#1c2230] font-bold">
                            <th className="p-4">Kode DTC</th>
                            <th className="p-4">Sistem Sensor</th>
                            <th className="p-4">Deskripsi Kerusakan</th>
                            <th className="p-4">Lokasi & Gejala Fisik</th>
                            <th className="p-4 text-center">Tingkat Bahaya</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#181d29] bg-[#11141b]/30">
                          {activeDtcs.map((dtc, idx) => (
                            <tr key={idx} className="hover:bg-[#0a0c10]/20">
                              <td className="p-4 font-bold text-red-400">{dtc.code}</td>
                              <td className="p-4 font-semibold text-slate-200">{dtc.system}</td>
                              <td className="p-4 font-sans text-slate-300">
                                <span className="font-bold block text-xs font-mono text-slate-400">{dtc.description}</span>
                                {dtc.descriptionId}
                              </td>
                              <td className="p-4 font-sans text-slate-400 text-[11px] leading-relaxed">
                                {dtc.system === 'TPS' && 'Throttle body bermasalah. Tarikan motor brebet, gas tidak responsif, stasioner pincang.'}
                                {dtc.system === 'ECT/ET' && 'Air pendingin radiator habis atau kipas mati. Risiko silinder mesin melengkung jika overheat.'}
                                {dtc.system === 'Engine Temp' && 'Suhu kerja silinder berlebih. Hentikan motor segera untuk menghindari piston macet.'}
                                {dtc.system === 'O2 Sensor' && 'Asap knalpot berbau bensin tajam, boros bahan bakar karena ECU masuk mode limp-home.'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                  dtc.severity === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                  dtc.severity === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                                  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                }`}>
                                  {dtc.severity.toUpperCase()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            )}



            {/* TAB: HONDA ECU PINOUTS & FTDI WIRING */}
            {activeTab === 'wiring' && (
              <motion.div
                key="wiring"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
                id="tab-wiring"
              >
                {/* Honda 33-Pin interactive database */}
                <HondaPinouts />

                {/* General FTDI wiring helper */}
                <div className="bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl">
                  <h3 className="text-md font-bold text-white flex items-center gap-2 mb-4 font-display">
                    <Settings className="text-orange-500 h-5 w-5" />
                    Panduan Koneksi FTDI ke Soket DLC OBD2 / Euro 5
                  </h3>
                  <WiringDiagram />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
