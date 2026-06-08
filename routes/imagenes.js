// ============================================================
// routes/imagenes.js — Listado de imágenes (Cloudinary + JSON)
// ============================================================
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Extensiones de imagen permitidas (para compatibilidad con logo local)
const EXTENSIONES_VALIDAS = [".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif"];

// Rutas a las carpetas de imágenes
const CARPETAS = {
  logo: path.join(__dirname, "../../public/LogoRINO"),
};

// Ruta del archivo JSON que guarda metadata del carrusel
const CAROUSEL_DATA_PATH = path.join(__dirname, "../data/carousel.json");

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
 * Lista los archivos de imagen en una carpeta dada.
 * Solo retorna archivos con extensiones válidas.
 * Ignora subcarpetas.
 */
function listarImagenes(carpeta, urlBase) {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true }); // Crea la carpeta si no existe
    return [];
  }

  return fs
    .readdirSync(carpeta)
    .filter((archivo) => {
      const ext = path.extname(archivo).toLowerCase();
      return (
        EXTENSIONES_VALIDAS.includes(ext) &&
        fs.statSync(path.join(carpeta, archivo)).isFile()
      );
    })
    .sort() // Orden alfabético estable
    .map((archivo) => ({
      nombre: archivo,
      url: `${urlBase}/${archivo}`,
    }));
}

// GET /api/imagenes/carusel — Imágenes del carrusel (desde JSON/Cloudinary)
router.get("/carusel", (req, res) => {
  const carouselData = readCarouselData();

  res.json({
    success: true,
    total: carouselData.images.length,
    data: carouselData.images,
  });
});

// GET /api/imagenes/logo — Logo de la empresa (desde carpeta local)
router.get("/logo", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}/imagenes/logo`;
  const imagenes = listarImagenes(CARPETAS.logo, baseUrl);

  // Retorna la primera imagen encontrada como logo principal
  res.json({
    success: true,
    logo: imagenes.length > 0 ? imagenes[0] : null,
    data: imagenes,
  });
});

module.exports = router;
