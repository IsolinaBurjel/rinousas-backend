// ============================================================
// routes/productos.js — Lectura dinámica del Excel de productos
// ============================================================
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

// Ruta al archivo Excel de productos
// Primero intenta leer desde backend/data (si admin subió uno)
// Si no existe, fallback a public/productos
const EXCEL_DATA_PATH = path.join(__dirname, "../data/productos.xlsx");
const EXCEL_PUBLIC_PATH = path.join(
  __dirname,
  "../../public/productos/productos.xlsx",
);

function getExcelPath() {
  if (fs.existsSync(EXCEL_DATA_PATH)) {
    return EXCEL_DATA_PATH;
  }
  return EXCEL_PUBLIC_PATH;
}

/**
 * Columnas esperadas en el Excel (deben coincidir con los headers de la hoja)
 * Si el dueño renombra columnas, solo hay que ajustar este mapa.
 */
const COLUMNAS_MAP = {
  "Nombre del Alambre": "nombre",
  Descripcion: "descripcion",
  "Diametro mm": "diametro",
  "Carga de Rotura Kg": "cargaRotura",
  "Recubrimiento Galvanizado": "recubrimiento",
  "Peso por Rollo Aprox. Kg": "peso",
  "Largo Aprox. m": "largo",
};

/**
 * Lee el archivo Excel y retorna los productos como array de objetos.
 * Se ejecuta en cada request → los cambios en el Excel se reflejan
 * inmediatamente sin recompilar el frontend.
 */
function leerProductos() {
  const excelPath = getExcelPath();

  if (!fs.existsSync(excelPath)) {
    throw new Error(`Archivo no encontrado: ${excelPath}`);
  }

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0]; // Toma la primera hoja
  const sheet = workbook.Sheets[sheetName];

  // Convierte a JSON usando la primera fila como headers
  const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  // Mapea los nombres de columnas a claves internas
  const productos = rawData
    .map((row, index) => {
      const producto = { id: index + 1 };
      Object.entries(COLUMNAS_MAP).forEach(([excelCol, key]) => {
        producto[key] =
          row[excelCol] !== undefined ? String(row[excelCol]).trim() : "";
      });
      return producto;
    })
    .filter((p) => p.nombre !== ""); // Filtra filas vacías

  return productos;
}

// GET /api/productos — Retorna todos los productos del Excel
router.get("/", (req, res) => {
  try {
    const productos = leerProductos();
    res.json({
      success: true,
      total: productos.length,
      data: productos,
    });
  } catch (error) {
    console.error("[productos] Error leyendo Excel:", error.message);
    res.status(500).json({
      success: false,
      error: "No se pudo leer el catálogo de productos.",
      detalle:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

module.exports = router;
