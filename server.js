// ============================================================
// server.js — Servidor principal RINO USAS Backend
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

const productosRouter = require("./routes/productos");
const imagenesRouter = require("./routes/imagenes");
const contactoRouter = require("./routes/contacto");
const adminRouter = require("./routes/admin");
const verifyAdminToken = require("./middleware/verifyAdminToken");

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Seguridad HTTP headers ───────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ─── CORS ─────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "x-admin-token"],
  }),
);

// ─── Rate limiting global ─────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100,
  message: { error: "Demasiadas solicitudes, intenta más tarde." },
});

// ─── Rate limiting estricto para correos ─────────────────
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5,
  message: {
    error: "Límite de envío de correos alcanzado. Intenta en 1 hora.",
  },
});

// ─── Body parsing ─────────────────────────────────────────
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// ─── Archivos estáticos (imágenes) ────────────────────────
// Sirve las carpetas de imágenes del backend al frontend
app.use(
  "/imagenes/carusel",
  express.static(path.join(__dirname, "../public/AlambradoCarusel")),
);
app.use(
  "/imagenes/logo",
  express.static(path.join(__dirname, "../public/LogoRINO")),
);

// ─── Rutas admin (no limitadas por el rate limiter global) ───
app.use("/api/admin", verifyAdminToken, adminRouter);

// ─── Rutas API ────────────────────────────────────────────
app.use("/api/", limiter);
app.use("/api/productos", productosRouter);
app.use("/api/imagenes", imagenesRouter);
app.use("/api/contacto", emailLimiter, contactoRouter);
// ─── Health check ─────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── 404 catch-all ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// ─── Error handler global ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: "Error interno del servidor" });
});

{
  /**app.listen(PORT, () => {
  console.log(`✅ RINO USAS Backend corriendo en http://localhost:${PORT}`); */
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ RINO USAS Backend corriendo en puerto ${PORT}`);
});
