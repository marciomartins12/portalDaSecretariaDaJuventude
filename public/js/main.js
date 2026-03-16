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
      return teamCount >= 2 && teamCount <= 3;
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
        if (members.length >= 2) return setMemberAddError("Limite atingido: máximo de 3 participantes (incluindo o capitão).");
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
        if (1 + members.length < 2) {
          e.preventDefault();
          setMemberAddError(
            "Adicione pelo menos 1 participante para completar a equipe (mínimo 2 com o capitão)."
          );
          return;
        }
        if (1 + members.length > 3) {
          e.preventDefault();
          setMemberAddError("Remova participantes: máximo de 3 pessoas na equipe (incluindo o capitão).");
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
