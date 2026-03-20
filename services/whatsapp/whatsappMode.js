function getWhatsappMode() {
  const mode = String(process.env.WHATSAPP_MODE || "local").trim().toLowerCase();
  return mode === "remote" ? "remote" : "local";
}

function getWhatsappRemoteConfig() {
  return {
    mode: getWhatsappMode(),
    baseUrl: String(process.env.WHATSAPP_REMOTE_URL || "").trim().replace(/\/+$/, ""),
    token: String(process.env.WHATSAPP_REMOTE_TOKEN || "").trim()
  };
}

module.exports = { getWhatsappMode, getWhatsappRemoteConfig };

