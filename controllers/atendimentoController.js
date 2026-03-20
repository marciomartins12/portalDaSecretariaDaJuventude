const { pool } = require("../config/db");
const { getIo } = require("../socket");

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePhone(value) {
  const digits = digitsOnly(value);
  if (!digits) return "";
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

function getInatividadeMinutos() {
  const raw = Number(process.env.ATENDIMENTO_INATIVIDADE_MIN || 20);
  if (!Number.isFinite(raw) || raw <= 0) return 20;
  return Math.floor(raw);
}

async function liberarAtendimentosInativos() {
  const min = getInatividadeMinutos();
  try {
    await pool.execute(
      "UPDATE atendimentos SET status = 'aberto', atendente_id = NULL WHERE status = 'em_atendimento' AND last_activity_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)",
      [min]
    );
  } catch (err) {
    process.stderr.write(`Falha ao liberar atendimentos inativos: ${err?.message || String(err)}\n`);
  }
}

function atendimentosPage(req, res) {
  res.render("admin/atendimentos", {
    layout: "admin",
    title: "Admin • Atendimento",
    active: "atendimentos"
  });
}

async function apiListAtendimentos(req, res) {
  await liberarAtendimentosInativos();

  const statusRaw = String(req.query?.status || "").trim().toLowerCase();
  const status = ["aberto", "em_atendimento", "finalizado"].includes(statusRaw) ? statusRaw : null;
  const q = normalizePhone(req.query?.q || "");

  const where = [];
  const params = [];
  if (status) {
    where.push("a.status = ?");
    params.push(status);
  }
  if (q) {
    where.push("a.telefone LIKE ?");
    params.push(`%${q}%`);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [rows] = await pool.execute(
    `SELECT
      a.id,
      a.telefone,
      a.status,
      a.atendente_id AS atendenteId,
      a.data_inicio AS dataInicio,
      a.data_fim AS dataFim,
      a.last_activity_at AS lastActivityAt,
      a.unread_count AS unreadCount,
      ad.name AS atendenteNome,
      lm.conteudo AS ultimaMensagem,
      lm.timestamp AS ultimaMensagemEm
    FROM atendimentos a
    LEFT JOIN admins ad ON ad.id = a.atendente_id
    LEFT JOIN mensagens lm ON lm.id = (
      SELECT m2.id
      FROM mensagens m2
      WHERE m2.atendimento_id = a.id
      ORDER BY m2.timestamp DESC, m2.id DESC
      LIMIT 1
    )
    ${whereSql}
    ORDER BY a.last_activity_at DESC, a.id DESC
    LIMIT 250`,
    params
  );

  res.json({
    me: { id: Number(req.admin?.id), name: req.admin?.name || "" },
    items: rows.map((r) => ({
      id: Number(r.id),
      telefone: r.telefone,
      status: r.status,
      atendenteId: r.atendenteId ? Number(r.atendenteId) : null,
      atendenteNome: r.atendenteNome || "",
      dataInicio: r.dataInicio,
      dataFim: r.dataFim,
      lastActivityAt: r.lastActivityAt,
      unreadCount: Number(r.unreadCount || 0),
      ultimaMensagem: r.ultimaMensagem || "",
      ultimaMensagemEm: r.ultimaMensagemEm
    }))
  });
}

async function apiAssumirAtendimento(req, res) {
  const atendimentoId = Number(req.params?.id);
  if (!atendimentoId) return res.status(400).json({ error: "Atendimento inválido." });

  const adminId = Number(req.admin?.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, status, atendente_id AS atendenteId FROM atendimentos WHERE id = ? FOR UPDATE",
      [atendimentoId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Atendimento não encontrado." });
    }

    const current = rows[0];
    if (String(current.status) === "finalizado") {
      await connection.rollback();
      return res.status(409).json({ error: "Atendimento já finalizado." });
    }

    const currentAtendente = current.atendenteId ? Number(current.atendenteId) : null;
    if (String(current.status) === "em_atendimento" && currentAtendente && currentAtendente !== adminId) {
      await connection.rollback();
      return res.status(409).json({ error: "Atendimento já está com outro atendente." });
    }

    await connection.execute(
      "UPDATE atendimentos SET status = 'em_atendimento', atendente_id = ?, last_activity_at = NOW() WHERE id = ?",
      [adminId, atendimentoId]
    );
    await connection.commit();

    const io = getIo();
    if (io) io.emit("atendimento:update", { id: atendimentoId });

    return res.json({ ok: true });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha ao assumir atendimento: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Não foi possível assumir o atendimento." });
  } finally {
    connection.release();
  }
}

async function apiLiberarAtendimento(req, res) {
  const atendimentoId = Number(req.params?.id);
  if (!atendimentoId) return res.status(400).json({ error: "Atendimento inválido." });

  const adminId = Number(req.admin?.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, status, atendente_id AS atendenteId FROM atendimentos WHERE id = ? FOR UPDATE",
      [atendimentoId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Atendimento não encontrado." });
    }
    const current = rows[0];
    if (String(current.status) === "finalizado") {
      await connection.rollback();
      return res.status(409).json({ error: "Atendimento já finalizado." });
    }

    const currentAtendente = current.atendenteId ? Number(current.atendenteId) : null;
    if (currentAtendente && currentAtendente !== adminId) {
      await connection.rollback();
      return res.status(403).json({ error: "Você não pode liberar um atendimento de outro atendente." });
    }

    await connection.execute(
      "UPDATE atendimentos SET status = 'aberto', atendente_id = NULL, last_activity_at = NOW() WHERE id = ?",
      [atendimentoId]
    );
    await connection.commit();

    const io = getIo();
    if (io) io.emit("atendimento:update", { id: atendimentoId });

    return res.json({ ok: true });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha ao liberar atendimento: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Não foi possível liberar o atendimento." });
  } finally {
    connection.release();
  }
}

async function apiFinalizarAtendimento(req, res) {
  const atendimentoId = Number(req.params?.id);
  if (!atendimentoId) return res.status(400).json({ error: "Atendimento inválido." });

  const adminId = Number(req.admin?.id);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT id, status, atendente_id AS atendenteId FROM atendimentos WHERE id = ? FOR UPDATE",
      [atendimentoId]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Atendimento não encontrado." });
    }
    const current = rows[0];
    if (String(current.status) === "finalizado") {
      await connection.rollback();
      return res.status(409).json({ error: "Atendimento já finalizado." });
    }

    const currentAtendente = current.atendenteId ? Number(current.atendenteId) : null;
    if (currentAtendente && currentAtendente !== adminId) {
      await connection.rollback();
      return res.status(403).json({ error: "Você não pode finalizar um atendimento de outro atendente." });
    }

    await connection.execute(
      "UPDATE atendimentos SET status = 'finalizado', data_fim = NOW(), last_activity_at = NOW() WHERE id = ?",
      [atendimentoId]
    );
    await connection.commit();

    const io = getIo();
    if (io) io.emit("atendimento:update", { id: atendimentoId });

    return res.json({ ok: true });
  } catch (err) {
    try {
      await connection.rollback();
    } catch {}
    process.stderr.write(`Falha ao finalizar atendimento: ${err?.message || String(err)}\n`);
    return res.status(500).json({ error: "Não foi possível finalizar o atendimento." });
  } finally {
    connection.release();
  }
}

module.exports = {
  atendimentosPage,
  apiListAtendimentos,
  apiAssumirAtendimento,
  apiLiberarAtendimento,
  apiFinalizarAtendimento
};
