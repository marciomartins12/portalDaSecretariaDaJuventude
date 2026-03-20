const { Server } = require("socket.io");
const { verifyAdminToken } = require("./services/adminAuthService");
const { Admin } = require("./models/indexSequelize");

let io = null;
const presenceCounts = new Map();

function parseCookies(header) {
  const raw = String(header || "");
  if (!raw) return {};
  const out = {};
  raw.split(";").forEach((part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (!k) return;
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  });
  return out;
}

async function setPresence(adminId, status) {
  try {
    await Admin.update({ presenceStatus: status }, { where: { id: adminId } });
  } catch (err) {
    process.stderr.write(`Falha ao atualizar presença do admin ${adminId}: ${err?.message || String(err)}\n`);
  }
}

function initSocket(server) {
  io = new Server(server, {
    cors: { origin: false },
    serveClient: true
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.request.headers?.cookie);
      const token = cookies.admin_token;
      if (!token) return next(new Error("unauthorized"));
      const payload = verifyAdminToken(token);
      const adminId = Number(payload?.sub);
      if (!adminId) return next(new Error("unauthorized"));
      const admin = await Admin.findByPk(adminId);
      if (!admin) return next(new Error("unauthorized"));
      socket.data.admin = { id: admin.id, name: admin.name || "", email: admin.email, role: admin.role };
      return next();
    } catch {
      return next(new Error("unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const adminId = Number(socket.data?.admin?.id);
    if (adminId) {
      const current = presenceCounts.get(adminId) || 0;
      presenceCounts.set(adminId, current + 1);
      if (current === 0) await setPresence(adminId, "online");
      socket.join(`admin:${adminId}`);
    }

    socket.on("join_atendimento", (atendimentoId) => {
      const id = Number(atendimentoId);
      if (!id) return;
      socket.join(`atendimento:${id}`);
    });

    socket.on("leave_atendimento", (atendimentoId) => {
      const id = Number(atendimentoId);
      if (!id) return;
      socket.leave(`atendimento:${id}`);
    });

    socket.on("disconnect", async () => {
      if (!adminId) return;
      const current = presenceCounts.get(adminId) || 0;
      const nextCount = Math.max(0, current - 1);
      if (nextCount === 0) {
        presenceCounts.delete(adminId);
        await setPresence(adminId, "offline");
      } else {
        presenceCounts.set(adminId, nextCount);
      }
    });
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = { initSocket, getIo };
