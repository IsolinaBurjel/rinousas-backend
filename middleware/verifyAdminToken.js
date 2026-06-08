// ============================================================
// middleware/verifyAdminToken.js — Verifica token admin secreto
// ============================================================

/**
 * Middleware que verifica el token admin en headers
 * Uso: app.use('/api/admin', verifyAdminToken, adminRouter);
 */
function verifyAdminToken(req, res, next) {
  const token = req.headers["x-admin-token"] || req.body?.token;
  const expectedToken = process.env.ADMIN_SECRET_TOKEN;

  if (!expectedToken) {
    return res.status(500).json({
      success: false,
      error: "Configuración incompleta: ADMIN_SECRET_TOKEN no definido",
    });
  }

  if (!token || token !== expectedToken) {
    return res.status(401).json({
      success: false,
      error: "Token admin inválido o no proporcionado",
    });
  }

  // Token válido, continúa
  next();
}

module.exports = verifyAdminToken;
