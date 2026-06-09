// ============================================================
// server.js — Servidor principal RINO USAS Backend
// ============================================================
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");

let productosRouter;
let imagenesRouter;
let contactoRouter;
let adminRouter;
let verifyAdminToken;

try {
  productosRouter = require("./routes/productos");
  console.log("[server] productos router loaded");
} catch (err) {
  console.error("[server] failed loading productos router:", err);
  throw err;
}

try {
  imagenesRouter = require("./routes/imagenes");
  console.log("[server] imagenes router loaded");
} catch (err) {
  console.error("[server] failed loading imagenes router:", err);
  throw err;
}

try {
  contactoRouter = require("./routes/contacto");
  console.log("[server] contacto router loaded");
} catch (err) {
  console.error("[server] failed loading contacto router:", err);
  throw err;
}

try {
  adminRouter = require("./routes/admin");
  console.log("[server] admin router loaded");
} catch (err) {
  console.error("[server] failed loading admin router:", err);
  throw err;
}

try {
  verifyAdminToken = require("./middleware/verifyAdminToken");
  console.log("[server] verifyAdminToken middleware loaded");
} catch (err) {
  console.error("[server] failed loading verifyAdminToken middleware:", err);
  throw err;
}

const app = express();
const PORT = process.env.PORT || 3001;

console.log("[server] starting backend server");
console.log("[server] config", {
  PORT,
  FRONTEND_URL: process.env.FRONTEND_URL,
  NODE_ENV: process.env.NODE_ENV,
});

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

app.use("/api", (req, res, next) => {
  console.log(`[server] API request ${req.method} ${req.originalUrl}`);
  next();
});

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
app.use("/api", limiter);
app.use("/api/productos", productosRouter);
app.use("/api/imagenes", imagenesRouter);
app.use("/api/contacto", emailLimiter, contactoRouter);

console.log(
  "[server] Mounted API routes: /api/productos, /api/imagenes, /api/contacto, /api/admin",
);
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
