// ============================================================
// utils/cloudinary.js — Manejo de uploads a Cloudinary
// ============================================================
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configurar Cloudinary con credenciales del .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Sube una imagen a Cloudinary desde un buffer
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {String} folder - Carpeta en Cloudinary (ej: "rinousas/carousel")
 * @param {String} filename - Nombre del archivo
 * @returns {Promise} Promesa con resultado de Cloudinary
 */
async function uploadImage(buffer, folder, filename) {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: folder || "rinousas",
        resource_type: "auto",
        public_id: filename.replace(/\.[^.]+$/, ""), // Quita extensión
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    // Convierte buffer a stream
    const stream = Readable.from(buffer);
    stream.pipe(upload);
  });
}

/**
 * Elimina una imagen de Cloudinary
 * @param {String} publicId - Public ID de Cloudinary (ej: "rinousas/image1")
 * @returns {Promise} Promesa con resultado
 */
async function deleteImage(publicId) {
  return cloudinary.uploader.destroy(publicId);
}

/**
 * Lista todas las imágenes en una carpeta de Cloudinary
 * @param {String} folder - Ruta de la carpeta (ej: "rinousas/carousel")
 * @returns {Promise} Promesa con array de recursos
 */
async function listImages(folder) {
  return cloudinary.api.resources({
    type: "upload",
    prefix: folder || "rinousas/",
    max_results: 500,
  });
}

module.exports = {
  uploadImage,
  deleteImage,
  listImages,
};
