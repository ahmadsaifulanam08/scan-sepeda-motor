import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { SensorData, DiagnosticTroubleCode, MotorBrand, ProtocolMode } from '../types';
import { Cpu, Send, RefreshCw, AlertCircle, Wrench, Sparkles, CheckCircle, FileText } from 'lucide-react';

interface AiAssistantProps {
  brand: MotorBrand;
  protocol: ProtocolMode;
  sensors: SensorData;
  dtcs: DiagnosticTroubleCode[];
  onNotify: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function AiAssistant({ brand, protocol, sensors, dtcs, onNotify }: AiAssistantProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusText, setStatusText] = useState<string>('');
  const [report, setReport] = useState<string | null>(null);

  const startAiAnalysis = async () => {
    setLoading(true);
    setReport(null);
    onNotify('Mengirim telemetri ECU ke server Asisten AI...', 'info');

    // Fun progressive status loading states for realistic feel
    const statuses = [
      'Membaca buffer data FTDI...',
      'Mengekstrak kode kesalahan OBD2/Euro5...',
      'Menganalisis rasio pembakaran bahan bakar & AFR...',
      'Menghitung deviasi sensor ECT & IAT...',
      'Merangkum rekomendasi perbaikan mekanik...'
    ];

    let i = 0;
    setStatusText(statuses[0]);
    const interval = setInterval(() => {
      i++;
      if (i < statuses.length) {
        setStatusText(statuses[i]);
      }
    }, 1200);

    try {
      const response = await fetch('/api/diagnose/ai-analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand,
          protocol,
          sensors,
          dtcs
        })
      });

      const result = await response.json();
      clearInterval(interval);

      if (result.success) {
        setReport(result.analysis);
        onNotify('Analisis Mekanik AI berhasil dirangkum!', 'success');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      console.error(error);
      onNotify(error.message || 'Gagal terhubung ke Asisten AI. Cek konfigurasi API.', 'error');
    } finally {
      setLoading(false);
      setStatusText('');
    }
  };

  // Preset quick cases to help users simulate faults and test the AI
  const loadFaultScenario = (scenario: 'overheat' | 'sensor_low' | 'euro5_fault') => {
    onNotify(`Skenario anomali "${scenario}" dimuat. Silakan klik "Mulai Analisis AI" di bawah!`, 'info');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-assistant-tab">
      {/* KIRI: Sensor & DTC Summary */}
      <div className="lg:col-span-4 bg-[#11141b] border border-[#1c2230] rounded-xl p-5 shadow-xl flex flex-col" id="ai-telemetry-snapshot">
        <h3 className="text-sm font-bold text-slate-200 font-mono mb-4 flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-orange-500" />
          RINGKASAN TELEMETRI AKTIF
        </h3>

        <div className="space-y-3 bg-[#0a0c10] p-4 rounded-lg border border-[#181d29] text-xs font-mono mb-5">
          <div className="flex justify-between border-b border-[#181d29] pb-1.5">
            <span className="text-slate-500">ECU Target:</span>
            <span className="text-orange-400 font-bold">{brand} ({protocol})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">DTC Terdeteksi:</span>
            <span className={dtcs.length > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}>
              {dtcs.length} Kode Kerusakan
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Putaran Mesin (RPM):</span>
            <span className="text-slate-200">{sensors.rpm} RPM</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Bukaan Throttle:</span>
            <span className="text-slate-200">{sensors.tps}% ({sensors.tpsVoltage}V)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Suhu Mesin (ECT):</span>
            <span className="text-slate-200">{sensors.ect}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Air-Fuel Ratio (AFR):</span>
            <span className={`font-bold ${sensors.afr < 12.5 ? 'text-red-400' : sensors.afr > 15.2 ? 'text-yellow-400' : 'text-orange-400'}`}>
              {sensors.afr}:1 ({sensors.afr < 13.5 ? 'Kaya' : sensors.afr > 14.7 ? 'Kurus' : 'Stoikiometris'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Suhu Udara (IAT):</span>
            <span className="text-slate-200">{sensors.iat}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Katalis EGT (Euro 5):</span>
            <span className="text-slate-200">{sensors.egt}°C</span>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={startAiAnalysis}
          disabled={loading}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-extrabold text-xs font-mono rounded-lg flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer mb-4"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          )}
          {loading ? 'Menganalisis...' : 'Mulai Analisis Diagnosa AI'}
        </button>

        <div className="bg-[#0a0c10] p-3.5 rounded-lg border border-[#181d29] text-[11px] text-slate-400 space-y-2 leading-relaxed">
          <p className="font-bold text-slate-300 font-mono flex items-center gap-1">
            <Wrench className="h-3.5 w-3.5 text-orange-500" />
            BAGAIMANA CARA KERJANYA?
          </p>
          <p>
            Modul AI mengunggah frame data sensor aktif yang dibaca oleh mikrokontroler FTDI Anda ke model cerdas <span className="text-orange-400 font-semibold font-mono">Gemini 1.5 Flash</span>.
          </p>
          <p>
            AI akan bertindak sebagai asisten mekanik senior spesialis motor matik/sport Honda/Yamaha, mengevaluasi rasio bensin-udara, memeriksa DTC, serta menyusun panduan perbaikan yang presisi.
          </p>
        </div>
      </div>

      {/* KANAN: AI Response & Output Area */}
      <div className="lg:col-span-8 bg-[#11141b] border border-[#1c2230] rounded-xl p-6 shadow-xl flex flex-col min-h-[400px]" id="ai-response-viewport">
        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="relative mb-4">
              <RefreshCw className="h-10 w-10 text-orange-500 animate-spin" />
              <Sparkles className="h-5 w-5 text-amber-350 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-slate-200">{statusText}</p>
            <p className="text-xs text-slate-500 mt-1 font-mono">Mengumpulkan kecerdasan diagnostik...</p>
          </div>
        ) : report ? (
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center border-b border-[#1c2230] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-amber-400 h-5 w-5" />
                <h3 className="text-sm font-bold text-slate-200 font-mono uppercase">
                  Laporan Rekomendasi Solusi Mekanik AI
                </h3>
              </div>
              <button 
                onClick={() => setReport(null)}
                className="text-xs text-slate-500 hover:text-slate-300 font-mono font-bold"
              >
                Hapus Laporan
              </button>
            </div>
            
            {/* Scrollable Markdown Report */}
            <div className="flex-1 overflow-y-auto max-h-[480px] pr-2 text-xs leading-relaxed text-slate-300 font-sans markdown-body" id="ai-markdown-report">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>

            <div className="mt-5 p-3.5 bg-[#0a0c10]/60 border border-[#181d29] rounded-lg flex gap-2">
              <CheckCircle className="text-orange-500 h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">
                Analisis ini didasarkan pada parameter pembacaan bus serial ECU. Selalu konfirmasikan dengan pengetesan fisik tegangan sensor (Voltase pin) menggunakan Multitester sebelum melakukan penggantian part fisik motor.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-slate-500">
            <Wrench className="h-12 w-12 text-slate-700 mb-3" />
            <p className="text-sm font-bold text-slate-300 mb-1">Menunggu Perintah Analisis</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Klik tombol oranye di samping kiri untuk mengunggah log ECU aktif dan menghasilkan rekomendasi mekanik berbasis kecerdasan buatan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
