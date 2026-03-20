const whatsappService = require("./whatsappService");
const { getIo } = require("../../socket");

function shouldAutoReconnect() {
  return String(process.env.WHATSAPP_AUTO_RECONNECT || "").trim() === "1";
}

function getMonitorIntervalMs() {
  const raw = Number(process.env.WHATSAPP_MONITOR_INTERVAL_MS || 30000);
  if (!Number.isFinite(raw) || raw < 5000) return 30000;
  return Math.floor(raw);
}

function extractConnected(state) {
  const s = state?.state || state?.status || state?.instance?.state || state?.instance?.status || state?.connection || "";
  const normalized = String(s || "").trim().toLowerCase();
  if (!normalized) return null;
  if (["open", "connected", "online", "ready"].includes(normalized)) return true;
  if (["close", "closed", "disconnected", "offline", "connecting", "qrcode"].includes(normalized)) return false;
  return null;
}

function startWhatsappMonitor() {
  if (!shouldAutoReconnect()) return;

  let lastConnected = null;
  const intervalMs = getMonitorIntervalMs();

  setInterval(async () => {
    try {
      const state = await whatsappService.getConnectionState();
      const connected = extractConnected(state);

      if (connected !== null && connected !== lastConnected) {
        lastConnected = connected;
        const io = getIo();
        if (io) io.emit("whatsapp:status", { connected, state });
      }

      if (connected === false) {
        try {
          await whatsappService.connectWhatsapp();
        } catch (err) {
          process.stderr.write(`Falha ao tentar reconectar WhatsApp: ${err?.message || String(err)}\n`);
        }
      }
    } catch (err) {
      if (lastConnected !== false) {
        lastConnected = false;
        const io = getIo();
        if (io) io.emit("whatsapp:status", { connected: false, state: null });
      }
    }
  }, intervalMs);
}

module.exports = { startWhatsappMonitor };
