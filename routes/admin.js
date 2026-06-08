// ============================================================
// routes/admin.js — Endpoints para panel admin
// ============================================================
const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { uploadImage, deleteImage } = require("../utils/cloudinary");

// Configurar multer para cargas en memoria
const upload = multer({ storage: multer.memoryStorage() });

// Ruta del archivo JSON que guarda metadata del carrusel
const CAROUSEL_DATA_PATH = path.join(__dirname, "../data/carousel.json");

// ─── Helpers ──────────────────────────────────────────────

/**
 * Lee el archivo carousel.json
 */
function readCarouselData() {
  try {
    if (!fs.existsSync(CAROUSEL_DATA_PATH)) {
      return { images: [] };
    }
    const data = fs.readFileSync(CAROUSEL_DATA_PATH, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error leyendo carousel.json:", err);
    return { images: [] };
  }
}

/**
 * Escribe el archivo carousel.json
 */
function writeCarouselData(data) {
  try {
    fs.writeFileSync(
      CAROUSEL_DATA_PATH,
      JSON.stringify(data, null, 2),
      "utf-8",
    );
  } catch (err) {
    console.error("Error escribiendo carousel.json:", err);
    throw err;
  }
}

// ─── Endpoints ────────────────────────────────────────────

/**
 * POST /api/admin/carrusel/upload
 * Sube una imagen a Cloudinary y registra en carousel.json
 */
router.post("/carrusel/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó archivo de imagen",
      });
    }

    // Sube a Cloudinary
    const result = await uploadImage(
      req.file.buffer,
      "rinousas/carousel",
      req.file.originalname,
    );

    // Lee datos actuales del carrusel
    const carouselData = readCarouselData();

    // Agrega la nueva imagen
    const newImage = {
      id: result.public_id,
      cloudinary_id: result.public_id,
      url: result.secure_url,
      nombre: req.file.originalname,
      fecha: new Date().toISOString(),
    };

    carouselData.images.push(newImage);

    // Guarda en JSON
    writeCarouselData(carouselData);

    res.json({
      success: true,
      mensaje: "Imagen subida correctamente",
      imagen: newImage,
    });
  } catch (err) {
    console.error("[admin/carrusel/upload] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al subir la imagen: " + err.message,
    });
  }
});

/**
 * GET /api/admin/carrusel/list
 * Lista todas las imágenes del carrusel
 */
router.get("/carrusel/list", (req, res) => {
  try {
    const carouselData = readCarouselData();
    res.json({
      success: true,
      total: carouselData.images.length,
      data: carouselData.images,
    });
  } catch (err) {
    console.error("[admin/carrusel/list] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al listar imágenes",
    });
  }
});

/**
 * DELETE /api/admin/carrusel/delete
 * Elimina una imagen del carrusel (de Cloudinary y JSON)
 * Recibe imageId como query para IDs con barras
 */
router.delete("/carrusel/delete", async (req, res) => {
  try {
    const imageId = req.query.imageId;

    if (!imageId) {
      return res.status(400).json({
        success: false,
        error: "Falta imageId",
      });
    }

    // Lee datos actuales
    const carouselData = readCarouselData();

    // Busca la imagen
    const imagen = carouselData.images.find((img) => img.id === imageId);
    if (!imagen) {
      return res.status(404).json({
        success: false,
        error: "Imagen no encontrada",
      });
    }

    // Elimina de Cloudinary
    await deleteImage(imagen.cloudinary_id);

    // Elimina del JSON
    carouselData.images = carouselData.images.filter(
      (img) => img.id !== imageId,
    );
    writeCarouselData(carouselData);

    res.json({
      success: true,
      mensaje: "Imagen eliminada correctamente",
    });
  } catch (err) {
    console.error("[admin/carrusel/delete] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al eliminar la imagen: " + err.message,
    });
  }
});

// ─── Excel ────────────────────────────────────────────────

/**
 * POST /api/admin/excel/upload
 * Sube un archivo Excel a backend/data/productos.xlsx
 */
router.post("/excel/upload", upload.single("excel"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No se proporcionó archivo Excel",
      });
    }

    // Validar extensión
    if (!req.file.originalname.match(/\.(xlsx?|xls)$/i)) {
      return res.status(400).json({
        success: false,
        error: "Archivo debe ser .xlsx o .xls",
      });
    }

    // Validar que sea un Excel válido usando XLSX
    const XLSX = require("xlsx");
    try {
      // Intentamos leer el archivo para validar
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        return res.status(400).json({
          success: false,
          error: "El archivo Excel está vacío o no es válido",
        });
      }
    } catch (parseErr) {
      return res.status(400).json({
        success: false,
        error:
          "No se pudo procesar el archivo Excel. Asegúrate de que sea un archivo válido.",
      });
    }

    // Ruta donde se guarda el Excel
    const EXCEL_BACKUP_PATH = path.join(__dirname, "../data/productos.xlsx");

    // Guarda el archivo
    fs.writeFileSync(EXCEL_BACKUP_PATH, req.file.buffer);

    res.json({
      success: true,
      mensaje: "Excel subido correctamente",
      archivo: req.file.originalname,
      fecha: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[admin/excel/upload] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al subir Excel: " + err.message,
    });
  }
});

/**
 * GET /api/admin/excel/diagnostico
 * Devuelve información sobre las columnas y filas del Excel cargado
 */
router.get("/excel/diagnostico", (req, res) => {
  try {
    const XLSX = require("xlsx");
    const EXCEL_BACKUP_PATH = path.join(__dirname, "../data/productos.xlsx");
    const EXCEL_PUBLIC_PATH = path.join(
      __dirname,
      "../../public/productos/productos.xlsx",
    );

    const excelPath = fs.existsSync(EXCEL_BACKUP_PATH)
      ? EXCEL_BACKUP_PATH
      : EXCEL_PUBLIC_PATH;

    if (!fs.existsSync(excelPath)) {
      return res.status(404).json({
        success: false,
        error: `Archivo no encontrado: ${excelPath}`,
      });
    }

    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Obtener headers
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];

    res.json({
      success: true,
      archivo: fs.existsSync(EXCEL_BACKUP_PATH)
        ? "backend/data"
        : "public/productos",
      hoja: sheetName,
      headers: headers,
      filas: rawData.length,
      preview: rawData.slice(0, 3),
    });
  } catch (err) {
    console.error("[admin/excel/diagnostico] Error:", err.message);
    res.status(500).json({
      success: false,
      error: "Error al diagnosticar Excel: " + err.message,
    });
  }
});

module.exports = router;
