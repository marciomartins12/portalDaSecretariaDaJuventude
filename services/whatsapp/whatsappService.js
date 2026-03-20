const { getWhatsappRemoteConfig } = require("./whatsappMode");

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhoneToE164Brazil(phone) {
  const digits = digitsOnly(phone);
  if (!digits) return null;
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function getEvolutionConfig() {
  const remote = getWhatsappRemoteConfig();
  const instance = String(process.env.WHATSAPP_EVOLUTION_INSTANCE || "default").trim();
  const authHeaderName = String(process.env.WHATSAPP_REMOTE_AUTH_HEADER || "apikey").trim();
  const authHeaderPrefix = String(process.env.WHATSAPP_REMOTE_AUTH_PREFIX || "").trim();

  const qrPath =
    String(process.env.WHATSAPP_EVOLUTION_QR_PATH || `/instance/qr/${encodeURIComponent(instance)}`).trim();
  const connectPath =
    String(process.env.WHATSAPP_EVOLUTION_CONNECT_PATH || `/instance/connect/${encodeURIComponent(instance)}`).trim();
  const sendTextPath =
    String(process.env.WHATSAPP_EVOLUTION_SEND_TEXT_PATH || `/message/sendText/${encodeURIComponent(instance)}`).trim();
  const statusPath =
    String(
      process.env.WHATSAPP_EVOLUTION_STATUS_PATH || `/instance/connectionState/${encodeURIComponent(instance)}`
    ).trim();

  return {
    mode: remote.mode,
    baseUrl: remote.baseUrl,
    token: remote.token,
    instance,
    authHeaderName,
    authHeaderPrefix,
    qrPath,
    connectPath,
    sendTextPath,
    statusPath
  };
}

async function evolutionRequest({ method, path, body }) {
  const cfg = getEvolutionConfig();
  if (cfg.mode !== "remote") {
    const err = new Error("WHATSAPP_MODE precisa estar como remote.");
    err.code = "WHATSAPP_MODE_INVALID";
    throw err;
  }
  if (!cfg.baseUrl) {
    const err = new Error("WHATSAPP_REMOTE_URL não configurado.");
    err.code = "WHATSAPP_REMOTE_URL_MISSING";
    throw err;
  }
  if (!cfg.token) {
    const err = new Error("WHATSAPP_REMOTE_TOKEN não configurado.");
    err.code = "WHATSAPP_REMOTE_TOKEN_MISSING";
    throw err;
  }

  const url = `${cfg.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = { Accept: "application/json" };
  if (cfg.authHeaderName.toLowerCase() === "authorization") {
    headers.Authorization = cfg.authHeaderPrefix ? `${cfg.authHeaderPrefix} ${cfg.token}` : `Bearer ${cfg.token}`;
  } else {
    headers[cfg.authHeaderName] = cfg.authHeaderPrefix ? `${cfg.authHeaderPrefix} ${cfg.token}` : cfg.token;
  }

  const init = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(url, init);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!res.ok) {
    const err = new Error(
      `Falha na Evolution API (${res.status}): ${json?.message || json?.error || text || "Erro desconhecido"}`
    );
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json;
}

async function connectWhatsapp() {
  const cfg = getEvolutionConfig();
  return evolutionRequest({ method: "GET", path: cfg.connectPath });
}

async function getQrCode() {
  const cfg = getEvolutionConfig();
  return evolutionRequest({ method: "GET", path: cfg.qrPath });
}

async function sendText({ phone, message }) {
  const cfg = getEvolutionConfig();
  const to = normalizePhoneToE164Brazil(phone);
  if (!to) {
    const err = new Error("Número inválido para envio.");
    err.code = "PHONE_INVALID";
    throw err;
  }

  const payload = {
    number: to,
    text: String(message || "")
  };

  return evolutionRequest({ method: "POST", path: cfg.sendTextPath, body: payload });
}

async function getConnectionState() {
  const cfg = getEvolutionConfig();
  return evolutionRequest({ method: "GET", path: cfg.statusPath });
}

module.exports = { connectWhatsapp, getQrCode, sendText, getConnectionState, normalizePhoneToE164Brazil };
