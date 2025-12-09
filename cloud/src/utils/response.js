// src/utils/response.js
function success(res, { status = 200, data = null, message = 'OK' } = {}) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, { status = 400, message = 'Bad Request', errors = null } = {}) {
  return res.status(status).json({ success: false, message, errors });
}

module.exports = { success, fail };
