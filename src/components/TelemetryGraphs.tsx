import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { SensorData } from '../types';
import { Play, Pause, Trash2, Zap, ToggleLeft, ToggleRight, Info } from 'lucide-react';

interface TelemetryGraphsProps {
  history: SensorData[];
  onClearHistory: () => void;
  isSimulating: boolean;
  onTriggerSweep: () => void;
  sweepActive: boolean;
}

interface ToggleStates {
  rpm: boolean;
  tps: boolean;
  afr: boolean;
  ect: boolean;
  map: boolean;
  sparkAdvance: boolean;
}

export default function TelemetryGraphs({
  history,
  onClearHistory,
  isSimulating,
  onTriggerSweep,
  sweepActive
}: TelemetryGraphsProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [visibleLines, setVisibleLines] = useState<ToggleStates>({
    rpm: true,
    tps: true,
    afr: true,
    ect: false,
    map: false,
    sparkAdvance: false
  });

  const toggleLine = (key: keyof ToggleStates) => {
    setVisibleLines({ ...visibleLines, [key]: !visibleLines[key] });
  };

  // Convert history array to chart-friendly coordinates
  // Recharts eats objects where each parameter is a key
  const chartData = history.map((h, index) => ({
    time: `${index}s`,
    rpm: h.rpm,
    tps: h.tps,
    afr: h.afr,
    ect: h.ect,
    map: h.map,
    spark: h.sparkAdvance,
    battery: h.battery
  }));

  const latest = history[history.length - 1] || {
    rpm: 0, tps: 0, afr: 14.7, ect: 0, map: 101, sparkAdvance: 15, battery: 12.4
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col h-full" id="graphs-panel">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Zap className="text-amber-400 h-5 w-5" />
            Mode Analisis Grafik Real-Time
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Memonitor parameter dinamis sensor motor secara sinkronous
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Dyno Sweep Test Button */}
          <button
            onClick={onTriggerSweep}
            disabled={sweepActive}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow ${
              sweepActive
                ? 'bg-red-500/10 border border-red-500/40 text-red-400 animate-pulse'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {sweepActive ? 'Menguji Limiter...' : 'Tes Dyno & TPS Sweep'}
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 text-slate-200 rounded-lg text-xs font-semibold font-mono border border-slate-800 flex items-center gap-1.5 transition-all"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5 text-orange-400" />
                Jeda Plotting
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 text-emerald-400" />
                Mulai Plotting
              </>
            )}
          </button>

          <button
            onClick={onClearHistory}
            className="px-3 py-1.5 bg-slate-950 hover:bg-red-950/40 hover:text-red-400 text-slate-400 border border-slate-800 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Reset Grafik
          </button>
        </div>
      </div>

      {/* Sensor Lines Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 bg-slate-950/60 p-3.5 rounded-lg border border-slate-850">
        <button
          onClick={() => toggleLine('rpm')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.rpm ? 'bg-red-500/10 border-red-500 text-red-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>RPM ({latest.rpm})</span>
          {visibleLines.rpm ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => toggleLine('tps')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.tps ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>TPS ({latest.tps}%)</span>
          {visibleLines.tps ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => toggleLine('afr')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.afr ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>AFR ({latest.afr}:1)</span>
          {visibleLines.afr ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => toggleLine('ect')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.ect ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>ECT ({latest.ect}°C)</span>
          {visibleLines.ect ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => toggleLine('map')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.map ? 'bg-sky-500/10 border-sky-500 text-sky-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>MAP ({latest.map} kPa)</span>
          {visibleLines.map ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>

        <button
          onClick={() => toggleLine('sparkAdvance')}
          className={`px-2.5 py-1.5 rounded-md border text-left flex items-center justify-between text-[11px] font-mono transition-all ${
            visibleLines.sparkAdvance ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400 font-bold' : 'bg-slate-900/30 border-slate-850 text-slate-500'
          }`}
        >
          <span>Spark ({latest.sparkAdvance}°)</span>
          {visibleLines.sparkAdvance ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Main Chart Graphic */}
      <div className="flex-1 bg-slate-950 p-4 rounded-xl border border-slate-850 min-h-[350px] relative" id="recharts-stage">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <Info className="h-8 w-8 mb-2 text-slate-600" />
            <p className="text-xs font-mono">Hubungkan FTDI / Aktifkan Simulasi untuk merekam grafik</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={isPlaying ? chartData : chartData.slice(0, chartData.length - 1)}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} fontStyle="monospace" />
              
              {/* Dual Y-Axes to fit both RPM (up to 12000) and percentages/temperatures (up to 150) */}
              <YAxis 
                yAxisId="rpm" 
                domain={[0, 12000]} 
                orientation="left" 
                stroke="#ef4444" 
                fontSize={9} 
                fontStyle="monospace" 
                tickFormatter={(v) => `${v / 1000}k`}
              />
              <YAxis 
                yAxisId="sensors" 
                domain={[0, 160]} 
                orientation="right" 
                stroke="#10b981" 
                fontSize={9} 
                fontStyle="monospace" 
              />
              
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '10px' }}
                itemStyle={{ fontFamily: 'monospace', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', marginTop: '10px' }} />

              {visibleLines.rpm && (
                <Line 
                  yAxisId="rpm"
                  type="monotone" 
                  dataKey="rpm" 
                  stroke="#ef4444" 
                  name="RPM (Putaran Mesin)" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )}

              {visibleLines.tps && (
                <Line 
                  yAxisId="sensors"
                  type="monotone" 
                  dataKey="tps" 
                  stroke="#10b981" 
                  name="TPS (Throttle %)" 
                  strokeWidth={2}
                  dot={false}
                />
              )}

              {visibleLines.afr && (
                <Line 
                  yAxisId="sensors"
                  type="monotone" 
                  dataKey="afr" 
                  stroke="#6366f1" 
                  name="AFR (Air Fuel Ratio)" 
                  strokeWidth={2}
                  dot={false}
                />
              )}

              {visibleLines.ect && (
                <Line 
                  yAxisId="sensors"
                  type="monotone" 
                  dataKey="ect" 
                  stroke="#f97316" 
                  name="ECT (Suhu Pendingin °C)" 
                  strokeWidth={1.5}
                  dot={false}
                />
              )}

              {visibleLines.map && (
                <Line 
                  yAxisId="sensors"
                  type="monotone" 
                  dataKey="map" 
                  stroke="#38bdf8" 
                  name="MAP (Tekanan kPa)" 
                  strokeWidth={1.5}
                  dot={false}
                />
              )}

              {visibleLines.sparkAdvance && (
                <Line 
                  yAxisId="sensors"
                  type="monotone" 
                  dataKey="spark" 
                  stroke="#eab308" 
                  name="Ignition Spark (°BTDC)" 
                  strokeWidth={1.5}
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Graph test information */}
      {sweepActive && (
        <div className="mt-4 bg-red-950/20 border border-red-900/50 p-3 rounded-lg text-xs font-mono text-red-400 flex gap-2 items-center justify-center animate-pulse">
          <span>●</span>
          <span>SEDANG MEREKAM TES DYNOmeter: Bukaan Gas 100%, Sensor TPS, RPM, Limiter Bounce, dan AFR sedang dievaluasi...</span>
        </div>
      )}
    </div>
  );
}
