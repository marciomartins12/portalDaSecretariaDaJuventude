(() => {
  const root = document.getElementById("atendimentoApp");
  if (!root) return;

  const adminId = Number(root.getAttribute("data-admin-id") || 0);
  const adminName = String(root.getAttribute("data-admin-name") || "");

  const statusFilter = document.getElementById("statusFilter");
  const searchInput = document.getElementById("searchInput");
  const chatList = document.getElementById("chatList");
  const chatTitle = document.getElementById("chatTitle");
  const chatMeta = document.getElementById("chatMeta");
  const chatMessages = document.getElementById("chatMessages");
  const chatComposer = document.getElementById("chatComposer");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const assumeBtn = document.getElementById("assumeBtn");
  const releaseBtn = document.getElementById("releaseBtn");
  const finalizeBtn = document.getElementById("finalizeBtn");

  const waConnectBtn = document.getElementById("waConnectBtn");
  const waQrBtn = document.getElementById("waQrBtn");
  const waStatus = document.getElementById("waStatus");
  const qrModal = document.getElementById("qrModal");
  const qrModalBackdrop = document.getElementById("qrModalBackdrop");
  const qrModalClose = document.getElementById("qrModalClose");
  const qrImage = document.getElementById("qrImage");
  const qrRaw = document.getElementById("qrRaw");

  let selectedAtendimentoId = null;
  let selectedAtendimento = null;
  let itemsById = new Map();
  let socket = null;
  let joinRoomId = null;

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function apiFetch(url, options) {
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      ...options
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    if (!res.ok) {
      const msg = json?.error || `Erro HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json;
  }

  function formatPhone(phone) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "";
    if (digits.startsWith("55")) return `+${digits}`;
    return `+55${digits}`;
  }

  function formatTime(value) {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return "";
    return d.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }

  function playBeep() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.035;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 130);
    } catch {}
  }

  function setWaStatus(state) {
    if (!waStatus) return;
    const connected = state?.connected;
    if (connected === true) {
      waStatus.textContent = "WhatsApp: conectado";
      return;
    }
    if (connected === false) {
      waStatus.textContent = "WhatsApp: desconectado";
      return;
    }
    waStatus.textContent = "WhatsApp: status desconhecido";
  }

  function openQrModal() {
    qrModal.hidden = false;
  }

  function closeQrModal() {
    qrModal.hidden = true;
  }

  function renderList(items) {
    chatList.innerHTML = "";
    const frag = document.createDocumentFragment();
    items.forEach((it) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className = `chatItem${selectedAtendimentoId === it.id ? " chatItem--active" : ""}`;
      el.setAttribute("data-id", String(it.id));

      const top = document.createElement("div");
      top.className = "chatItem__top";

      const phone = document.createElement("div");
      phone.className = "chatItem__phone";
      phone.textContent = formatPhone(it.telefone);

      const time = document.createElement("div");
      time.className = "chatItem__time";
      time.textContent = formatTime(it.ultimaMensagemEm || it.lastActivityAt);

      top.appendChild(phone);
      top.appendChild(time);

      const bottom = document.createElement("div");
      bottom.className = "chatItem__bottom";

      const preview = document.createElement("div");
      preview.className = "chatItem__preview";
      preview.textContent = it.ultimaMensagem || "";

      const meta = document.createElement("div");
      meta.className = "chatItem__meta";

      const status = document.createElement("span");
      status.className = `chatBadge chatBadge--${it.status}`;
      status.textContent =
        it.status === "aberto" ? "Aberto" : it.status === "em_atendimento" ? "Em atendimento" : "Finalizado";
      meta.appendChild(status);

      if (it.atendenteNome) {
        const who = document.createElement("span");
        who.className = "chatItem__who";
        who.textContent = it.atendenteNome;
        meta.appendChild(who);
      }

      if (Number(it.unreadCount || 0) > 0) {
        const unread = document.createElement("span");
        unread.className = "chatUnread";
        unread.textContent = String(it.unreadCount);
        meta.appendChild(unread);
      }

      bottom.appendChild(preview);
      bottom.appendChild(meta);

      el.appendChild(top);
      el.appendChild(bottom);
      frag.appendChild(el);
    });
    chatList.appendChild(frag);
  }

  function renderMessages(messages) {
    chatMessages.innerHTML = "";
    const frag = document.createDocumentFragment();
    messages.forEach((m) => {
      const row = document.createElement("div");
      row.className = `msgRow ${m.remetente === "atendente" ? "msgRow--out" : "msgRow--in"}`;

      const bubble = document.createElement("div");
      bubble.className = `msgBubble ${m.status === "erro" ? "msgBubble--error" : ""}`;
      bubble.textContent = m.conteudo;

      const meta = document.createElement("div");
      meta.className = "msgMeta";
      const t = document.createElement("span");
      t.textContent = formatTime(m.timestamp);
      meta.appendChild(t);
      if (m.remetente === "atendente" && m.status === "erro") {
        const s = document.createElement("span");
        s.textContent = "Erro";
        meta.appendChild(s);
      }

      bubble.appendChild(meta);
      row.appendChild(bubble);
      frag.appendChild(row);
    });
    chatMessages.appendChild(frag);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function updateHeader() {
    if (!selectedAtendimento) {
      chatTitle.textContent = "Selecione um atendimento";
      chatMeta.textContent = "";
      sendBtn.disabled = true;
      assumeBtn.disabled = true;
      finalizeBtn.disabled = true;
      releaseBtn.disabled = true;
      return;
    }

    chatTitle.textContent = formatPhone(selectedAtendimento.telefone);
    const parts = [];
    parts.push(
      selectedAtendimento.status === "aberto"
        ? "Aberto"
        : selectedAtendimento.status === "em_atendimento"
          ? "Em atendimento"
          : "Finalizado"
    );
    if (selectedAtendimento.atendenteNome) parts.push(`• ${selectedAtendimento.atendenteNome}`);
    chatMeta.textContent = parts.join(" ");

    const canAssume =
      selectedAtendimento.status !== "finalizado" &&
      (!selectedAtendimento.atendenteId || selectedAtendimento.atendenteId === adminId) &&
      selectedAtendimento.status !== "em_atendimento";
    assumeBtn.disabled = !canAssume;

    const canRelease =
      selectedAtendimento.status !== "finalizado" &&
      selectedAtendimento.atendenteId &&
      selectedAtendimento.atendenteId === adminId;
    releaseBtn.disabled = !canRelease;

    const canFinalize = canRelease || (selectedAtendimento.status !== "finalizado" && !selectedAtendimento.atendenteId);
    finalizeBtn.disabled = selectedAtendimento.status === "finalizado";

    sendBtn.disabled = !(selectedAtendimento.atendenteId && selectedAtendimento.atendenteId === adminId);
    messageInput.disabled = sendBtn.disabled;
  }

  async function refreshList() {
    const status = String(statusFilter?.value || "").trim();
    const q = String(searchInput?.value || "").trim();
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);

    const data = await apiFetch(`/admin/api/atendimentos?${params.toString()}`);
    itemsById = new Map(data.items.map((i) => [i.id, i]));
    const items = data.items;
    renderList(items);
    if (selectedAtendimentoId && itemsById.has(selectedAtendimentoId)) {
      selectedAtendimento = itemsById.get(selectedAtendimentoId);
    }
    updateHeader();
  }

  async function selectAtendimento(id) {
    selectedAtendimentoId = id;
    selectedAtendimento = itemsById.get(id) || null;
    updateHeader();
    renderList([...itemsById.values()]);

    if (socket) {
      if (joinRoomId) socket.emit("leave_atendimento", joinRoomId);
      joinRoomId = id;
      socket.emit("join_atendimento", id);
    }

    const data = await apiFetch(`/admin/api/atendimentos/${id}/messages`);
    renderMessages(data.items || []);
    await refreshList();
  }

  async function assumeSelected() {
    if (!selectedAtendimentoId) return;
    await apiFetch(`/admin/api/atendimentos/${selectedAtendimentoId}/assume`, { method: "POST" });
    await refreshList();
    selectedAtendimento = itemsById.get(selectedAtendimentoId) || null;
    updateHeader();
  }

  async function releaseSelected() {
    if (!selectedAtendimentoId) return;
    await apiFetch(`/admin/api/atendimentos/${selectedAtendimentoId}/release`, { method: "POST" });
    await refreshList();
    selectedAtendimento = itemsById.get(selectedAtendimentoId) || null;
    updateHeader();
  }

  async function finalizeSelected() {
    if (!selectedAtendimentoId) return;
    await apiFetch(`/admin/api/atendimentos/${selectedAtendimentoId}/finalize`, { method: "POST" });
    await refreshList();
    selectedAtendimento = itemsById.get(selectedAtendimentoId) || null;
    updateHeader();
  }

  async function sendMessage(text) {
    if (!selectedAtendimentoId) return;
    await apiFetch(`/admin/api/atendimentos/${selectedAtendimentoId}/send`, {
      method: "POST",
      body: JSON.stringify({ message: text })
    });
    messageInput.value = "";
    await selectAtendimento(selectedAtendimentoId);
  }

  async function loadQr() {
    const data = await apiFetch("/admin/api/whatsapp/qr");
    const payload = data.data || {};
    const base64 = payload?.base64 || payload?.qrcode?.base64 || payload?.qr?.base64 || payload?.qrCode || null;
    const qrText = payload?.qr || payload?.qrcode || payload?.qrcodeText || payload?.code || null;

    if (base64 && String(base64).includes("base64,")) {
      qrImage.src = String(base64);
      qrImage.hidden = false;
      qrRaw.hidden = true;
      return;
    }
    if (base64) {
      qrImage.src = `data:image/png;base64,${String(base64)}`;
      qrImage.hidden = false;
      qrRaw.hidden = true;
      return;
    }
    if (qrText) {
      qrImage.hidden = true;
      qrRaw.hidden = false;
      qrRaw.textContent = String(qrText);
      return;
    }
    qrImage.hidden = true;
    qrRaw.hidden = false;
    qrRaw.textContent = JSON.stringify(payload, null, 2);
  }

  function showQrError(err) {
    const msg = String(err?.message || err || "Não foi possível carregar o QR Code.");
    qrImage.src = "";
    qrImage.hidden = true;
    qrRaw.hidden = false;
    qrRaw.textContent = msg;
  }

  async function connectWhatsapp() {
    await apiFetch("/admin/api/whatsapp/connect", { method: "POST" });
    await sleep(800);
    await loadQr();
    openQrModal();
  }

  async function refreshWaStatus() {
    try {
      const data = await apiFetch("/admin/api/whatsapp/status");
      setWaStatus(data);
    } catch {
      setWaStatus({ connected: false });
    }
  }

  function mountEvents() {
    chatList.addEventListener("click", (e) => {
      const btn = e.target.closest(".chatItem");
      if (!btn) return;
      const id = Number(btn.getAttribute("data-id") || 0);
      if (!id) return;
      selectAtendimento(id).catch(() => {});
    });

    statusFilter.addEventListener("change", () => refreshList().catch(() => {}));

    let searchTimer = null;
    searchInput.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => refreshList().catch(() => {}), 250);
    });

    assumeBtn.addEventListener("click", () => assumeSelected().catch(() => {}));
    releaseBtn.addEventListener("click", () => releaseSelected().catch(() => {}));
    finalizeBtn.addEventListener("click", () => finalizeSelected().catch(() => {}));

    chatComposer.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = String(messageInput.value || "").trim();
      if (!text) return;
      sendMessage(text).catch(() => {});
    });

    waQrBtn.addEventListener("click", () => {
      loadQr()
        .then(() => openQrModal())
        .catch((err) => {
          showQrError(err);
          openQrModal();
        });
    });

    waConnectBtn.addEventListener("click", () => {
      connectWhatsapp().catch((err) => {
        showQrError(err);
        openQrModal();
      });
    });

    qrModalClose.addEventListener("click", closeQrModal);
    qrModalBackdrop.addEventListener("click", closeQrModal);
  }

  function mountSocket() {
    if (!window.io) return;
    socket = window.io({ transports: ["websocket", "polling"] });
    socket.on("connect_error", () => {});

    socket.on("atendimento:update", () => {
      refreshList().catch(() => {});
    });

    socket.on("whatsapp:status", (state) => {
      setWaStatus(state);
    });

    socket.on("mensagem:new", (evt) => {
      const atId = Number(evt?.atendimentoId || 0);
      if (!atId) return;
      if (selectedAtendimentoId && atId === selectedAtendimentoId) {
        selectAtendimento(atId).catch(() => {});
        return;
      }
      playBeep();
      refreshList().catch(() => {});
    });
  }

  mountEvents();
  mountSocket();
  refreshList().catch(() => {});
  refreshWaStatus().catch(() => {});
})();
