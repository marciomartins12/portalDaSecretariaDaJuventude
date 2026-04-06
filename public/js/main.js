(() => {
  const iconSvgs = {
    spark:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2l1.2 6.2L20 12l-6.8 3.8L12 22l-1.2-6.2L4 12l6.8-3.8L12 2Z' stroke='currentColor' stroke-width='1.8' opacity='.92'/></svg>",
    users:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Z' stroke='currentColor' stroke-width='1.8'/><path d='M4 21a8 8 0 0 1 16 0' stroke='currentColor' stroke-width='1.8' opacity='.9'/></svg>",
    bolt:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M13 2L4 14h7l-1 8 10-14h-7l0-6Z' stroke='currentColor' stroke-width='1.8' opacity='.92'/></svg>",
    target:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 22a10 10 0 1 0-10-10' stroke='currentColor' stroke-width='1.8' opacity='.9'/><path d='M12 18a6 6 0 1 0-6-6' stroke='currentColor' stroke-width='1.8' opacity='.9'/><circle cx='12' cy='12' r='2.2' fill='currentColor' opacity='.9'/><path d='M21.5 2.5l-6.2 6.2' stroke='currentColor' stroke-width='1.8' stroke-linecap='round'/></svg>",
    shield:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4Z' stroke='currentColor' stroke-width='1.8'/><path d='M9.5 12l1.8 1.8L15 10' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' opacity='.92'/></svg>",
    check:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M20 6 9 17l-5-5' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/></svg>",
    trophy:
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M8 21h8M12 17v4' stroke='currentColor' stroke-width='1.8' stroke-linecap='round'/><path d='M7 3h10v4a5 5 0 0 1-5 5 5 5 0 0 1-5-5V3Z' stroke='currentColor' stroke-width='1.8'/><path d='M17 5h2a2 2 0 0 1 0 4h-2M7 5H5a2 2 0 0 0 0 4h2' stroke='currentColor' stroke-width='1.8' stroke-linecap='round'/></svg>"
  };

  document.querySelectorAll("[data-icon]").forEach((el) => {
    const key = el.getAttribute("data-icon");
    const svg = iconSvgs[key];
    if (svg) el.innerHTML = svg;
  });

  const parseCookies = () => {
    const raw = String(document.cookie || "");
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
  };

  const setCookie = (name, value, maxAgeSeconds) => {
    const encoded = encodeURIComponent(String(value || ""));
    const age = maxAgeSeconds ? `; Max-Age=${Math.max(0, Math.trunc(maxAgeSeconds))}` : "";
    document.cookie = `${name}=${encoded}${age}; Path=/; SameSite=Lax`;
  };

  const storageGet = (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const storageSet = (key, value) => {
    try {
      window.localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  };

  const uuid = () => {
    const c = window.crypto;
    if (c && typeof c.randomUUID === "function") return c.randomUUID();
    const bytes = c && typeof c.getRandomValues === "function" ? c.getRandomValues(new Uint8Array(16)) : null;
    const rnd = bytes || Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
    rnd[6] = (rnd[6] & 0x0f) | 0x40;
    rnd[8] = (rnd[8] & 0x3f) | 0x80;
    const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };

  const deviceKey = "device_id";
  const trackedKey = "device_tracked_v1";
  const oneYear = 60 * 60 * 24 * 365;

  const getDeviceId = () => {
    const fromStorage = storageGet(deviceKey);
    if (fromStorage) return fromStorage;
    const cookies = parseCookies();
    const fromCookie = cookies[deviceKey];
    if (fromCookie) return fromCookie;
    return null;
  };

  const getTracked = () => {
    const fromStorage = storageGet(trackedKey);
    if (fromStorage === "1") return true;
    const cookies = parseCookies();
    return cookies[trackedKey] === "1";
  };

  const setTracked = () => {
    storageSet(trackedKey, "1");
    setCookie(trackedKey, "1", oneYear);
  };

  const ensureDeviceId = () => {
    let id = getDeviceId();
    if (!id) id = uuid();
    storageSet(deviceKey, id);
    setCookie(deviceKey, id, oneYear);
    return id;
  };

  const trackDeviceOnce = () => {
    if (typeof fetch !== "function") return;
    const id = ensureDeviceId();
    if (getTracked()) return;
    (async () => {
      try {
        const res = await fetch("/track-device", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ device_id: id }),
          credentials: "same-origin",
          keepalive: true
        });
        if (res.ok || res.status === 204) setTracked();
      } catch {}
    })();
  };

  trackDeviceOnce();

  const navToggle = document.querySelector(".navToggle");
  const navBackdrop = document.querySelector(".navBackdrop");

  const isMobileNav = () => window.matchMedia("(max-width: 720px)").matches;

  const setNavOpen = (open) => {
    if (!isMobileNav()) open = false;
    document.body.classList.toggle("nav-open", open);
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
    }
  };

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      const open = !document.body.classList.contains("nav-open");
      setNavOpen(open);
    });
  } 
  if (navBackdrop) {
    navBackdrop.addEventListener("click", () => setNavOpen(false));
  }

  document.querySelectorAll("#siteNav a").forEach((a) => {
    a.addEventListener("click", () => setNavOpen(false));
  });

  window.addEventListener("resize", () => {
    if (!isMobileNav() && document.body.classList.contains("nav-open")) setNavOpen(false);
  });

  const logoImg = document.querySelector(".brand__logo");
  const logoLink = document.querySelector(".brand");
  if (logoImg && logoLink) {
    let cache = null;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const refreshCache = () => {
      const nw = logoImg.naturalWidth;
      const nh = logoImg.naturalHeight;
      if (!nw || !nh || !ctx) return false;
      canvas.width = nw;
      canvas.height = nh;
      ctx.clearRect(0, 0, nw, nh);
      try {
        ctx.drawImage(logoImg, 0, 0, nw, nh);
        cache = ctx.getImageData(0, 0, nw, nh);
        return true;
      } catch {
        cache = null;
        return false;
      }
    };

    const ensureCache = () => {
      if (!cache) return refreshCache();
      return true;
    };

    const alphaAtClientPoint = (clientX, clientY) => {
      const rect = logoImg.getBoundingClientRect();
      if (!rect.width || !rect.height) return 255;
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return 0;
      if (!ensureCache() || !cache) return 255;
      const scaleX = logoImg.naturalWidth / rect.width;
      const scaleY = logoImg.naturalHeight / rect.height;
      const ix = Math.floor(x * scaleX);
      const iy = Math.floor(y * scaleY);
      const idx = (iy * logoImg.naturalWidth + ix) * 4 + 3;
      return cache.data[idx] || 0;
    };

    const passThroughIfTransparent = (e) => {
      const a = alphaAtClientPoint(e.clientX, e.clientY);
      if (a <= 8) {
        e.preventDefault();
        e.stopPropagation();
        const prev = logoLink.style.pointerEvents;
        logoLink.style.pointerEvents = "none";
        const below = document.elementFromPoint(e.clientX, e.clientY);
        logoLink.style.pointerEvents = prev || "";
        if (below && below !== logoImg && below !== logoLink) {
          try {
            below.dispatchEvent(
              new MouseEvent("click", {
                bubbles: true,
                cancelable: true,
                view: window,
                clientX: e.clientX,
                clientY: e.clientY
              })
            );
          } catch {}
        }
        return false;
      }
      return true;
    };

    if (logoImg.complete) refreshCache();
    logoImg.addEventListener("load", refreshCache, { passive: true });
    logoLink.addEventListener("click", passThroughIfTransparent, true);
  }

  const closeModal = () => {
    const open = document.querySelector(".modal.is-open");
    if (!open) return;
    open.classList.remove("is-open");
    open.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const openModal = (selector) => {
    const modal = document.querySelector(selector);
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  document.querySelectorAll("[data-modal-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-modal-open");
      if (target) openModal(target);
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  const autoModal = document.querySelector("[data-auto-open-modal]");
  if (autoModal) {
    const target = autoModal.getAttribute("data-auto-open-modal");
    if (target) openModal(target);
  }

  const teamMembersModal = document.querySelector("#teamMembersModal");
  if (teamMembersModal) {
    const modalPanel = teamMembersModal.querySelector(".modal__panel");
    const titleEl = teamMembersModal.querySelector("[data-team-modal-title]");
    const listEl = teamMembersModal.querySelector("[data-team-modal-list]");

    document.querySelectorAll("[data-team-open]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nameFromAttr = btn.getAttribute("data-team-title");
        const nameEl = btn.querySelector(".teamCard__name") || btn.querySelector(".podium__name");
        const teamName = String(nameFromAttr || (nameEl ? nameEl.textContent : "") || "Equipe").trim();
        const membersTpl = btn.querySelector("[data-team-members]");
        if (titleEl) titleEl.textContent = teamName;
        if (listEl) listEl.innerHTML = membersTpl ? membersTpl.innerHTML : "";
        if (modalPanel) {
          const color = getComputedStyle(btn).getPropertyValue("--team-color").trim();
          if (color) modalPanel.style.setProperty("--team-color", color);
        }
        openModal("#teamMembersModal");
      });
    });
  }

  const calcAge = (dateString) => {
      const d = new Date(dateString);
      if (!Number.isFinite(d.getTime())) return null;
      const now = new Date();
      let age = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
      return age;
    };

    const isValidCpf = (cpf) => {
      cpf = String(cpf || "").replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
      const calc = (base, factor) => {
        let sum = 0;
        for (let i = 0; i < base.length; i++) sum += Number(base[i]) * (factor - i);
        const mod = sum % 11;
        return mod < 2 ? 0 : 11 - mod;
      };
      const d1 = calc(cpf.slice(0, 9), 10);
      const d2 = calc(cpf.slice(0, 9) + d1, 11);
      return cpf.endsWith(`${d1}${d2}`);
    };

    const inscricaoGincanaRoot = document.querySelector("[data-inscricao-gincana]");
  if (inscricaoGincanaRoot) {
    const form = inscricaoGincanaRoot.closest("form");
    const membersInput = form?.querySelector("input[name='membersJson']");
    const captainDobInput = form?.querySelector("#captainDob");
    const captainAgeError = form?.querySelector("[data-captain-age-error]");
    const addMemberBtn = form?.querySelector("[data-add-member]");
    const memberNameInput = form?.querySelector("#memberName");
    const memberDobInput = form?.querySelector("#memberDob");
    const memberCpfInput = form?.querySelector("#memberCpf");
    const memberAddressInput = form?.querySelector("#memberAddress");
    const membersList = form?.querySelector("[data-members-list]");
    const memberAddError = form?.querySelector("[data-member-add-error]");
    const submitBtn = form?.querySelector("[data-go-review]");
    const membersCountEl = form?.querySelector("[data-members-count]");
    const teamCountEl = form?.querySelector("[data-team-count]");
    const termsImageInput = form?.querySelector("input[name='termsImageRelease']");
    const termsResponsibilityInput = form?.querySelector("input[name='termsResponsibility']");
    const termsError = form?.querySelector("[data-terms-error]");

    let members = [];
    try {
      const raw = membersInput?.value ? JSON.parse(membersInput.value) : [];
      if (Array.isArray(raw)) members = raw.filter((m) => m && typeof m === "object");
    } catch {}

    const setMemberAddError = (message) => {
      if (!memberAddError) return;
      if (!message) {
        memberAddError.style.display = "none";
        memberAddError.textContent = "";
        return;
      }
      memberAddError.style.display = "block";
      memberAddError.textContent = message;
    };

    const renderMembers = () => {
      if (!membersList) return;
      membersList.innerHTML = "";
      if (members.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 3;
        td.className = "tMuted";
        td.textContent = "Nenhum participante adicionado ainda. Use o formulário acima e clique em “Adicionar à lista”.";
        tr.appendChild(td);
        membersList.appendChild(tr);
      }
      members.forEach((m, idx) => {
        const tr = document.createElement("tr");
        const nameTd = document.createElement("td");
        nameTd.className = "tStrong";
        nameTd.textContent = m.name || "";

        const dobTd = document.createElement("td");
        dobTd.textContent = m.dob || "";

        const cpfTd = document.createElement("td");
        cpfTd.textContent = m.cpf || "";

        const addressTd = document.createElement("td");
        addressTd.textContent = m.address || "";

        const actionTd = document.createElement("td");
        actionTd.className = "tRight";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn--ghost";
        btn.textContent = "Remover";
        btn.addEventListener("click", () => {
          members = members.filter((_, i) => i !== idx);
          if (membersInput) membersInput.value = JSON.stringify(members);
          renderMembers();
        });
        actionTd.appendChild(btn);

        tr.appendChild(nameTd);
        tr.appendChild(dobTd);
        tr.appendChild(cpfTd);
        tr.appendChild(addressTd);
        tr.appendChild(actionTd);
        membersList.appendChild(tr);
      });

      const teamCount = 1 + members.length;
      if (membersCountEl) membersCountEl.textContent = String(members.length);
      if (teamCountEl) teamCountEl.textContent = String(teamCount);
      updateSubmitState();
    };

    const setTermsError = (message) => {
      if (!termsError) return;
      if (!message) {
        termsError.style.display = "none";
        termsError.textContent = "";
        return;
      }
      termsError.style.display = "block";
      termsError.textContent = message;
    };

    const validateCaptainAge = () => {
      const age = captainDobInput?.value ? calcAge(captainDobInput.value) : null;
      const ok = age !== null && age >= 17;
      if (captainAgeError) captainAgeError.style.display = ok ? "none" : "block";
      return ok;
    };

    const validateTerms = () => {
      const ok = Boolean(termsImageInput?.checked) && Boolean(termsResponsibilityInput?.checked);
      return ok;
    };

    const validateTeamSize = () => {
      const teamCount = 1 + members.length;
      return teamCount >= 10 && teamCount <= 15;
    };

    const updateSubmitState = () => {
      const ok = validateCaptainAge() && validateTeamSize() && validateTerms();
      if (submitBtn) submitBtn.disabled = !ok;
      return ok;
    };

    if (captainDobInput) captainDobInput.addEventListener("change", validateCaptainAge);
    if (termsImageInput) termsImageInput.addEventListener("change", () => {
      setTermsError("");
      updateSubmitState();
    });
    if (termsResponsibilityInput) termsResponsibilityInput.addEventListener("change", () => {
      setTermsError("");
      updateSubmitState();
    });
    validateCaptainAge();

    if (addMemberBtn) {
      addMemberBtn.addEventListener("click", () => {
        setMemberAddError("");
        if (members.length >= 14) return setMemberAddError("Limite atingido: máximo de 15 participantes (incluindo o capitão).");
        const name = String(memberNameInput?.value || "").trim();
        const dob = String(memberDobInput?.value || "").trim();
        const cpf = String(memberCpfInput?.value || "").trim().replace(/\D/g, "");
        const address = String(memberAddressInput?.value || "").trim();

        if (!name) return setMemberAddError("Informe o nome do participante.");
        if (!dob) return setMemberAddError("Informe a data de nascimento do participante.");
        if (!isValidCpf(cpf)) return setMemberAddError("Informe um CPF válido para o participante.");
        if (!address) return setMemberAddError("Informe o endereço do participante.");

        const age = calcAge(dob);
        if (age === null) return setMemberAddError("Informe uma data de nascimento válida.");
        if (age < 15) return setMemberAddError("Participante com menos de 15 anos não pode ser adicionado.");

        members.push({ name, dob, cpf, address });
        if (membersInput) membersInput.value = JSON.stringify(members);
        if (memberNameInput) memberNameInput.value = "";
        if (memberDobInput) memberDobInput.value = "";
        if (memberCpfInput) memberCpfInput.value = "";
        if (memberAddressInput) memberAddressInput.value = "";
        setMemberAddError("");
        renderMembers();
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        if (!validateCaptainAge()) {
          e.preventDefault();
          return;
        }
        if (1 + members.length < 10) {
          e.preventDefault();
          setMemberAddError(
            "Adicione pelo menos 9 participantes para completar a equipe (mínimo 10 com o capitão)."
          );
          return;
        }
        if (1 + members.length > 15) {
          e.preventDefault();
          setMemberAddError("Remova participantes: máximo de 15 pessoas na equipe (incluindo o capitão).");
          return;
        }
        if (!validateTerms()) {
          e.preventDefault();
          setTermsError("Você precisa aceitar todos os termos obrigatórios para continuar.");
          return;
        }
        if (membersInput) membersInput.value = JSON.stringify(members);
      });
    }

    if (membersInput) membersInput.value = JSON.stringify(members);
    renderMembers();
    updateSubmitState();
  }

  const corridaForm = document.querySelector("form[action='/inscricoes/corrida']");
  if (corridaForm) {
    const submitBtn = corridaForm.querySelector("button[type='submit']");
    const termsImageInput = corridaForm.querySelector("input[name='termsImageRelease']");
    const termsResponsibilityInput = corridaForm.querySelector("input[name='termsResponsibility']");
    const termsError = corridaForm.querySelector("[data-terms-error]");

    const setTermsError = (message) => {
      if (!termsError) return;
      if (!message) {
        termsError.style.display = "none";
        termsError.textContent = "";
        return;
      }
      termsError.style.display = "block";
      termsError.textContent = message;
    };

    const validateTerms = () => {
      return Boolean(termsImageInput?.checked) && Boolean(termsResponsibilityInput?.checked);
    };

    const updateSubmitState = () => {
      const ok = validateTerms();
      if (submitBtn) submitBtn.disabled = !ok;
      return ok;
    };

    if (termsImageInput) termsImageInput.addEventListener("change", () => {
      setTermsError("");
      updateSubmitState();
    });
    if (termsResponsibilityInput) termsResponsibilityInput.addEventListener("change", () => {
      setTermsError("");
      updateSubmitState();
    });

    corridaForm.addEventListener("submit", (e) => {
      if (!validateTerms()) {
        e.preventDefault();
        setTermsError("Você precisa aceitar todos os termos obrigatórios para enviar.");
      }
    });

    updateSubmitState();
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          observer.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  const countdownEl = document.querySelector("[data-countdown]");
  const dateIso = window.__APP__?.gincanaDateISO || null;
  if (countdownEl && dateIso) {
    const target = new Date(dateIso);
    const daysEl = countdownEl.querySelector("[data-days]");
    const hoursEl = countdownEl.querySelector("[data-hours]");
    const minutesEl = countdownEl.querySelector("[data-minutes]");
    const secondsEl = countdownEl.querySelector("[data-seconds]");

    const tick = () => {
      const now = new Date();
      const diff = Math.max(0, target.getTime() - now.getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    tick();
    window.setInterval(tick, 1000);
  }

  const gincanaSplash = document.querySelector(".gincanaSplash");
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isCoarsePointer =
    window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  if (gincanaSplash && !reduceMotion && !isCoarsePointer) {
    let pan = 0;
    let raf = 0;

    const applyPan = () => {
      raf = 0;
      const y = Math.round(Math.min(1, Math.max(0, pan)) * 100);
      gincanaSplash.style.setProperty("--gincana-bg-y", `${y}%`);
    };

    const scheduleApply = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(applyPan);
    };

    const canIntercept = (deltaY) => {
      if (window.scrollY > 0) return false;
      if (deltaY > 0 && pan < 1) return true;
      if (deltaY < 0 && pan > 0) return true;
      return false;
    };

    const updateFromDelta = (deltaY) => {
      const h = Math.max(1, gincanaSplash.clientHeight || 1);
      pan = Math.min(1, Math.max(0, pan + deltaY / h));
      scheduleApply();
    };

    const onWheel = (e) => {
      const dy = Number(e.deltaY || 0);
      if (!dy) return;
      if (!canIntercept(dy)) return;
      e.preventDefault();
      updateFromDelta(dy);
    };

    applyPan();
    window.addEventListener("wheel", onWheel, { passive: false });
  }

  const lightboxRoot = document.querySelector("[data-lightbox-root]");
  const lightboxImg = document.querySelector("[data-lightbox-img]");

  const closeLightbox = () => {
    if (!lightboxRoot) return;
    lightboxRoot.classList.remove("is-open");
    lightboxRoot.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  const openLightbox = (src) => {
    if (!lightboxRoot || !lightboxImg) return;
    lightboxImg.setAttribute("src", src);
    lightboxRoot.classList.add("is-open");
    lightboxRoot.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  document.querySelectorAll("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const src = btn.getAttribute("data-lightbox");
      if (src) openLightbox(src);
    });
  });

  document.querySelectorAll("[data-lightbox-close]").forEach((btn) => {
    btn.addEventListener("click", closeLightbox);
  });

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("nav-open")) setNavOpen(false);
    closeLightbox();
    closeModal();
  });
})();
