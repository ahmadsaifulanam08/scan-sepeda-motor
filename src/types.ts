export type MotorBrand = 'Honda' | 'Yamaha';
export type ProtocolMode = 'OBD2_ISO14230' | 'EURO5_CAN';
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'simulated';

export interface SensorData {
  rpm: number;
  tps: number; // Throttle Position Sensor %
  ect: number; // Engine Coolant Temp °C
  iat: number; // Intake Air Temp °C
  map: number; // Manifold Absolute Pressure kPa
  afr: number; // Air-Fuel Ratio
  battery: number; // Volts
  sparkAdvance: number; // Ignition Advance °BTDC
  o2Voltage: number; // O2 Sensor Voltage V
  injectorDuration: number; // Injector Pulse Width ms
  shortTrim: number; // Short Term Fuel Trim %
  longTrim: number; // Long Term Fuel Trim %
  speed: number; // Vehicle Speed km/h
  tpsVoltage: number; // TPS Sensor Volts
  milStatus: boolean; // Malfunction Indicator Lamp
  egt: number; // Exhaust Gas Temp °C (Euro 5)
  purgeValve: number; // Purge Valve duty % (Euro 5)
}

export interface DiagnosticTroubleCode {
  code: string;
  system: string;
  description: string;
  descriptionId: string;
  severity: 'low' | 'medium' | 'high';
}

export interface TuningTable {
  id: string;
  name: string;
  description: string;
  rows: number[]; // RPM axis
  cols: number[]; // Throttle Position (%) or MAP (kPa) axis
  data: number[][]; // Grid values
  unit: string;
  type: 'fuel' | 'ignition';
}

export interface ECUFile {
  name: string;
  size: number;
  type: 'bin' | 'xdf' | 'adx';
  uploadTime: string;
  contentSummary: string;
  status: 'active' | 'parsed' | 'error';
}

// Default standard DTC database for Honda and Yamaha
export const HONDA_DTC_DATABASE: DiagnosticTroubleCode[] = [
  { code: 'P0122', system: 'TPS', description: 'Throttle Position Sensor Circuit Low Voltage', descriptionId: 'Tegangan Sirkuit Sensor Posisi Throttle Rendah (Macet/Hubung Singkat ke Ground)', severity: 'high' },
  { code: 'P0123', system: 'TPS', description: 'Throttle Position Sensor Circuit High Voltage', descriptionId: 'Tegangan Sirkuit Sensor Posisi Throttle Tinggi', severity: 'high' },
  { code: 'P0113', system: 'IAT', description: 'Intake Air Temperature Sensor Circuit High Voltage', descriptionId: 'Tegangan Sirkuit Sensor Suhu Udara Masuk Tinggi', severity: 'medium' },
  { code: 'P0118', system: 'ECT', description: 'Engine Coolant Temperature Sensor Circuit High Voltage', descriptionId: 'Tegangan Sirkuit Sensor Suhu Air Pendingin Mesin (ECT) Tinggi', severity: 'high' },
  { code: 'P0107', system: 'MAP', description: 'Manifold Absolute Pressure Circuit Low Input', descriptionId: 'Input Sirkuit Tekanan Absolut Manifold (MAP) Rendah', severity: 'high' },
  { code: 'P0108', system: 'MAP', description: 'Manifold Absolute Pressure Circuit High Input', descriptionId: 'Input Sirkuit Tekanan Absolut Manifold (MAP) Tinggi', severity: 'high' },
  { code: 'P0131', system: 'O2 Sensor', description: 'O2 Sensor Circuit Low Voltage (Lean)', descriptionId: 'Tegangan Sirkuit Sensor O2 Rendah (Campuran Terlalu Kurus)', severity: 'medium' },
  { code: 'P0132', system: 'O2 Sensor', description: 'O2 Sensor Circuit High Voltage (Rich)', descriptionId: 'Tegangan Sirkuit Sensor O2 Tinggi (Campuran Terlalu Kaya)', severity: 'medium' },
  { code: 'P0217', system: 'Engine Temp', description: 'Engine Coolant Over-Temperature Condition', descriptionId: 'Kondisi Suhu Mesin Berlebih (Overheat)', severity: 'high' },
  { code: 'P0335', system: 'CKP', description: 'Crankshaft Position Sensor Circuit Malfunction', descriptionId: 'Gangguan Sirkuit Sensor Posisi Poros Engkol (CKP/Pulser)', severity: 'high' },
  { code: 'P0505', system: 'IACV', description: 'Idle Air Control Valve Malfunction', descriptionId: 'Gangguan Katup Kontrol Udara Idle (IACV/Stasioner)', severity: 'medium' },
  { code: 'P1215', system: 'EGT', description: 'Exhaust Gas Temperature Sensor Range/Performance', descriptionId: 'Rentang/Kinerja Sensor Suhu Gas Buang Terdeteksi Anomali (Euro 5)', severity: 'medium' }
];

export const YAMAHA_DTC_DATABASE: DiagnosticTroubleCode[] = [
  { code: 'P0122', system: 'TPS', description: 'Throttle Position Sensor Circuit Low Input', descriptionId: 'Tegangan Input Sensor Posisi Throttle Terlalu Rendah (Kode Kedipan 15)', severity: 'high' },
  { code: 'P0112', system: 'IAT', description: 'Intake Air Temperature Sensor Circuit Low Input', descriptionId: 'Input Sirkuit Sensor Suhu Udara Masuk Rendah (Kode Kedipan 22)', severity: 'medium' },
  { code: 'P0117', system: 'ECT/ET', description: 'Engine Temperature Sensor Circuit Low Input', descriptionId: 'Input Sirkuit Sensor Suhu Mesin/ECT Rendah (Kode Kedipan 21)', severity: 'high' },
  { code: 'P0107', system: 'MAP', description: 'Manifold Absolute Pressure Circuit Low Input', descriptionId: 'Sirkuit Sensor Tekanan Udara (MAP) Hubung Singkat ke Ground (Kode Kedipan 14)', severity: 'high' },
  { code: 'P0335', system: 'CKP', description: 'Crankshaft Position Sensor No Signal', descriptionId: 'Sinyal Crankshaft Position Sensor (Pulser) Hilang (Kode Kedipan 12)', severity: 'high' },
  { code: 'P0351', system: 'Ignition Coil', description: 'Primary/Secondary Ignition Coil Malfunction', descriptionId: 'Kerusakan Sirkuit Koil Pengapian Utama/Sekunder (Kode Kedipan 30)', severity: 'high' },
  { code: 'P0201', system: 'Injector', description: 'Injector Circuit Cylinder 1 Open/Short', descriptionId: 'Sirkuit Injector Terbuka atau Hubung Singkat (Kode Kedipan 39)', severity: 'high' },
  { code: 'P0500', system: 'Speed Sensor', description: 'Vehicle Speed Sensor Malfunction', descriptionId: 'Kerusakan Sinyal Sensor Kecepatan Kendaraan (Kode Kedipan 42)', severity: 'low' },
  { code: 'P0562', system: 'System Voltage', description: 'System Voltage Low Battery', descriptionId: 'Tegangan Sistem Pengisian/Aki Terlalu Rendah (Kode Kedipan 46)', severity: 'medium' },
  { code: 'P0130', system: 'O2 Sensor', description: 'O2 Sensor Circuit Malfunction', descriptionId: 'Kerusakan Sirkuit Sensor O2 (Kode Kedipan 24)', severity: 'medium' },
  { code: 'P1412', system: 'Purge Valve', description: 'Canister Purge Valve Circuit Malfunction', descriptionId: 'Gangguan Sirkuit Katup Purge Evaporatif (Euro 5)', severity: 'low' }
];

// Seed data for fuel maps and ignition tables
export const DEFAULT_FUEL_TABLE: TuningTable = {
  id: 'fuel_base',
  name: 'Base Fuel Map (VE Table)',
  description: 'Mengatur kuantitas semprotan bensin berdasarkan RPM dan Throttle Position (%). Nilai dalam Persentase Volumetric Efficiency (%).',
  rows: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
  cols: [0, 5, 10, 20, 30, 45, 60, 80, 100],
  unit: '% VE',
  type: 'fuel',
  data: [
    [30, 35, 42, 50, 55, 62, 68, 72, 75], // 1000 RPM
    [32, 38, 45, 52, 58, 65, 70, 75, 78], // 2000 RPM
    [35, 42, 50, 58, 65, 72, 78, 82, 85], // 3000 RPM
    [38, 45, 55, 62, 70, 78, 84, 88, 90], // 4000 RPM
    [40, 48, 58, 68, 75, 82, 88, 92, 95], // 5000 RPM
    [42, 50, 62, 72, 80, 86, 92, 96, 98], // 6000 RPM
    [45, 52, 65, 75, 84, 90, 95, 98, 101], // 7000 RPM
    [46, 54, 68, 78, 86, 92, 97, 100, 103], // 8000 RPM
    [44, 52, 66, 76, 84, 90, 95, 98, 100], // 9000 RPM
    [40, 48, 60, 70, 78, 84, 89, 92, 94]  // 10000 RPM
  ]
};

export const DEFAULT_IGNITION_TABLE: TuningTable = {
  id: 'ign_base',
  name: 'Base Ignition Timing Map',
  description: 'Mengatur derajat waktu pengapian sebelum Titik Mati Atas (°BTDC) berdasarkan putaran mesin (RPM) dan bukaan TPS (%).',
  rows: [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000],
  cols: [0, 5, 10, 20, 30, 45, 60, 80, 100],
  unit: '°BTDC',
  type: 'ignition',
  data: [
    [10, 12, 14, 15, 15, 15, 15, 15, 15], // 1000 RPM (Idle)
    [12, 15, 18, 20, 21, 21, 20, 20, 20], // 2000 RPM
    [15, 18, 22, 24, 25, 25, 24, 24, 24], // 3000 RPM
    [18, 21, 25, 28, 29, 29, 28, 27, 27], // 4000 RPM
    [20, 24, 28, 31, 32, 32, 31, 30, 30], // 5000 RPM
    [22, 26, 30, 33, 34, 34, 33, 32, 32], // 6000 RPM
    [24, 28, 32, 35, 36, 36, 35, 34, 34], // 7000 RPM
    [25, 29, 33, 36, 37, 37, 36, 35, 35], // 8000 RPM
    [25, 29, 33, 36, 37, 37, 36, 35, 35], // 9000 RPM
    [24, 28, 32, 34, 35, 35, 34, 33, 33]  // 10000 RPM
  ]
};

export interface MotorcycleProfile {
  id: string;
  brand: MotorBrand;
  model: string;
  year: string;
  ecuCode: string;
  pins: number;
}

export const MOTORCYCLE_PROFILES: MotorcycleProfile[] = [
  // Honda
  { id: 'beat_k25', brand: 'Honda', model: 'Honda BeAT FI (K25)', year: '2012 - 2014', ecuCode: '38770-K25-901', pins: 33 },
  { id: 'beat_k81', brand: 'Honda', model: 'Honda BeAT eSP (K81)', year: '2016 - 2019', ecuCode: '38770-K81-N31', pins: 33 },
  { id: 'beat_k0j', brand: 'Honda', model: 'Honda BeAT LED eSP (K0J)', year: '2020 - 2024', ecuCode: '38770-K0J-N01', pins: 33 },
  { id: 'vario_k60', brand: 'Honda', model: 'Honda Vario 125 eSP (K60)', year: '2015 - 2018', ecuCode: '38770-K59-A11', pins: 33 },
  { id: 'vario_k59j', brand: 'Honda', model: 'Honda Vario 150 Keyless (K59J)', year: '2018 - 2021', ecuCode: '38770-K59-T11', pins: 33 },
  { id: 'vario_k2s', brand: 'Honda', model: 'Honda Vario 160 (K2S)', year: '2022 - 2025', ecuCode: '38770-K2S-N01', pins: 33 },
  { id: 'scoopy_k93', brand: 'Honda', model: 'Honda Scoopy eSP (K93)', year: '2017 - 2020', ecuCode: '38770-K93-N01', pins: 33 },
  { id: 'pcx_k97', brand: 'Honda', model: 'Honda PCX 150 (K97)', year: '2018 - 2020', ecuCode: '38770-K97-N01', pins: 33 },
  { id: 'pcx_k1z', brand: 'Honda', model: 'Honda PCX 160 (K1Z)', year: '2021 - 2024', ecuCode: '38770-K1Z-N21', pins: 33 },
  { id: 'crf_k84', brand: 'Honda', model: 'Honda CRF 150L (K84)', year: '2017 - 2024', ecuCode: '38770-K84-901', pins: 33 },
  { id: 'cb150_k15g', brand: 'Honda', model: 'Honda CB150R Streetfire (K15G)', year: '2015 - 2018', ecuCode: '38770-K15-902', pins: 33 },
  // Yamaha
  { id: 'nmax_2dp', brand: 'Yamaha', model: 'Yamaha NMAX 155 Old (2DP)', year: '2015 - 2019', ecuCode: '2DP-H591A-00', pins: 18 },
  { id: 'nmax_b6y', brand: 'Yamaha', model: 'Yamaha NMAX 155 Connected (B6Y)', year: '2020 - 2024', ecuCode: 'B6Y-H591A-10', pins: 18 },
  { id: 'aerox_bf6', brand: 'Yamaha', model: 'Yamaha Aerox 155 Old (BF6)', year: '2017 - 2020', ecuCode: 'BF6-H591A-00', pins: 18 },
  { id: 'aerox_bbp', brand: 'Yamaha', model: 'Yamaha Aerox 155 Connected (BBP)', year: '2021 - 2024', ecuCode: 'BBP-H591A-10', pins: 18 },
  { id: 'mioj_54p', brand: 'Yamaha', model: 'Yamaha Mio J / Soul GT (54P)', year: '2012 - 2014', ecuCode: '54P-H591A-00', pins: 18 },
  { id: 'miom3_2ph', brand: 'Yamaha', model: 'Yamaha Mio M3 125 (2PH)', year: '2015 - 2021', ecuCode: '2PH-H591A-10', pins: 18 },
  { id: 'wr_b3m', brand: 'Yamaha', model: 'Yamaha WR 155R (B3M)', year: '2020 - 2024', ecuCode: 'B3M-H591A-00', pins: 18 },
  { id: 'r15_bk6', brand: 'Yamaha', model: 'Yamaha R15 V3 (BK6)', year: '2017 - 2021', ecuCode: 'BK6-H591A-00', pins: 18 }
];
