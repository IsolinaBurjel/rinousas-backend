// ============================================================
// routes/contacto.js — Formulario de contacto con Nodemailer
// ============================================================
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const validator = require("validator");

console.log("[router contacto] loaded");

/**
 * Sanitiza una cadena de texto para evitar inyecciones HTML básicas.
 */
function sanitizar(str) {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .slice(0, 2000); // Limita la longitud máxima
}

/**
 * Crea el transporter de Nodemailer con las credenciales del .env
 */
function crearTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// POST /api/contacto — Procesa y envía el formulario
router.post("/", async (req, res) => {
  const { nombre, contacto, mensaje } = req.body;

  // ─── Validaciones ────────────────────────────────────────
  const errores = [];

  if (!nombre || sanitizar(nombre).length < 2) {
    errores.push("El nombre debe tener al menos 2 caracteres.");
  }

  if (!contacto || sanitizar(contacto).length < 5) {
    errores.push("Debes ingresar un correo o teléfono válido.");
  } else {
    // Acepta email o número de teléfono (mínimo 7 dígitos)
    const esEmail = validator.isEmail(contacto.trim());
    const esTelefono = /^\+?[\d\s\-().]{7,20}$/.test(contacto.trim());
    if (!esEmail && !esTelefono) {
      errores.push(
        "El contacto debe ser un correo electrónico o teléfono válido.",
      );
    }
  }

  if (!mensaje || sanitizar(mensaje).length < 10) {
    errores.push("El mensaje debe tener al menos 10 caracteres.");
  }

  if (errores.length > 0) {
    return res.status(400).json({ success: false, errores });
  }

  // ─── Sanitización ────────────────────────────────────────
  const nombreLimpio = sanitizar(nombre);
  const contactoLimpio = sanitizar(contacto);
  const mensajeLimpio = sanitizar(mensaje);

  // ─── Envío de correo ─────────────────────────────────────
  try {
    const transporter = crearTransporter();

    // Correo al dueño de RINO USAS
    await transporter.sendMail({
      from: `"Web RINO USAS" <${process.env.SMTP_USER}>`,
      to: process.env.EMAIL_RECEPTOR || "rinousas@gmail.com",
      subject: `📩 Nueva solicitud de cotización - ${nombreLimpio}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background: #1a2940; padding: 24px; color: white;">
            <h2 style="margin: 0;">Nueva Solicitud de Cotización</h2>
            <p style="margin: 4px 0 0; opacity: 0.8;">RINO USAS — Sistema Web</p>
          </div>
          <div style="padding: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; width: 140px;">Nombre:</td>
                <td style="padding: 8px 0;">${nombreLimpio}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555;">Contacto:</td>
                <td style="padding: 8px 0;">${contactoLimpio}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #555; vertical-align: top;">Mensaje:</td>
                <td style="padding: 8px 0; white-space: pre-wrap;">${mensajeLimpio}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
            <p style="color: #999; font-size: 12px;">Enviado desde el formulario web de RINO USAS</p>
          </div>
        </div>
      `,
    });

    // Correo de confirmación al cliente (solo si proporcionó email)
    const esEmail = validator.isEmail(contactoLimpio);
    if (esEmail) {
      await transporter.sendMail({
        from: `"RINO USAS" <${process.env.SMTP_USER}>`,
        to: contactoLimpio,
        subject: "Recibimos tu solicitud — RINO USAS",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #1a2940; padding: 24px; color: white; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0;">¡Gracias, ${nombreLimpio}!</h2>
            </div>
            <div style="padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
              <p>Recibimos tu solicitud de cotización. Nos pondremos en contacto contigo a la brevedad.</p>
              <p style="color: #555;">Tu mensaje:</p>
              <blockquote style="border-left: 4px solid #e87722; padding-left: 16px; color: #444; white-space: pre-wrap;">${mensajeLimpio}</blockquote>
              <p style="margin-top: 24px;">— Equipo RINO USAS</p>
            </div>
          </div>
        `,
      });
    }

    res.json({ success: true, mensaje: "Solicitud enviada correctamente." });
  } catch (error) {
    console.error("[contacto] Error enviando correo:", error.message);
    res.status(500).json({
      success: false,
      error:
        "No se pudo enviar el correo. Intenta más tarde o contáctanos por WhatsApp.",
    });
  }
});

module.exports = router;
