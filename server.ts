import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());

// Lazy-initialize Gemini AI to avoid crashing on start if API key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing. Please add it to your secrets in Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. AI Analysis Endpoint (Translates live data & DTCs into expert mechanical diagnostics)
app.post("/api/diagnose/ai-analyse", async (req, res) => {
  try {
    const { brand, protocol, sensors, dtcs } = req.body;
    
    const client = getGeminiClient();

    const prompt = `
Anda adalah sistem Asisten Diagnosis Mekanik ECU Motor Digital (Khusus Honda & Yamaha).
Berikut adalah data telemetri real-time yang didapat dari FTDI OBD2/Euro5:

Merek Motor: ${brand}
Protokol ECU: ${protocol}

Daftar Kode Kerusakan (DTC) Aktif:
${dtcs && dtcs.length > 0 
  ? dtcs.map((d: any) => `- [${d.code}] ${d.system}: ${d.descriptionId} (${d.description})`).join("\n") 
  : "Tidak ada kode kerusakan aktif (Sistem Normal)"}

Data Telemetri Sensor:
- RPM (Putaran Mesin): ${sensors.rpm} RPM
- Bukaan Throttle (TPS): ${sensors.tps}% (${sensors.tpsVoltage} Volt)
- Suhu Mesin (ECT): ${sensors.ect}°C
- Suhu Udara Masuk (IAT): ${sensors.iat}°C
- Tekanan Intake (MAP): ${sensors.map} kPa
- Air-Fuel Ratio (AFR): ${sensors.afr}:1
- Tegangan Aki (Battery): ${sensors.battery}V
- Waktu Pengapian (Spark Advance): ${sensors.sparkAdvance}°BTDC
- Sensor O2: ${sensors.o2Voltage}V
- Durasi Injeksi: ${sensors.injectorDuration} ms
- Short Term Fuel Trim: ${sensors.shortTrim}%
- Long Term Fuel Trim: ${sensors.longTrim}%
- Kecepatan: ${sensors.speed} km/h
- Status Lampu MIL (Check Engine): ${sensors.milStatus ? "MENYALA" : "MATI"}
- Euro 5 EGT (Exhaust Gas Temp): ${sensors.egt}°C
- Euro 5 Purge Valve Duty: ${sensors.purgeValve}%

Berdasarkan parameter di atas, berikan analisis mendalam dan solusi mekanik dalam format terstruktur (gunakan bahasa Indonesia yang profesional namun mudah dipahami mekanik/pemilik motor):
1. **Status Kesehatan ECU & Emisi**: Evaluasi kondisi pembakaran (apakah terlalu kering/basah berdasarkan AFR & Fuel Trim) dan kepatuhan emisi Euro 5 / OBD2.
2. **Analisis Masalah**: Jelaskan penyebab utama dari DTC yang muncul atau anomali sensor (jika ada).
3. **Langkah Solusi & Perbaikan**: Berikan petunjuk perbaikan step-by-step yang realistis untuk mekanik di bengkel (misal pengecekan kabel, pembersihan throttle body, atau penggantian sensor).
`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Anda adalah mekanik ahli dan tuner spesialis motor Honda/Yamaha bersertifikasi OBD2 dan Euro 5. Berikan panduan teknis yang sangat presisi, informatif, dan praktis tanpa jargon yang membingungkan. Gunakan markdown yang bersih.",
      }
    });

    res.json({
      success: true,
      analysis: response.text,
    });
  } catch (error: any) {
    console.error("Gemini AI diagnosis error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal melakukan analisis AI. Pastikan GEMINI_API_KEY sudah dikonfigurasi.",
    });
  }
});

// Serve assets / Vite middleware
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted.");
  } else {
    // Production mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`Serving static files from: ${distPath}`);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ECU Scanner Server] berjalan di http://localhost:${PORT}`);
  });
}

setupServer().catch((err) => {
  console.error("Gagal memulai server:", err);
});
