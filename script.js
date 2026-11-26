/* =========================================================
   script.js — dipakai oleh semua halaman
   Isi: tema gelap/terang, bahasa ID/EN, menu hamburger,
        typing animation, skill bar, lightbox sertifikat (zoom)
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const I18N = window.I18N || { id: {}, en: {} };

  /* localStorage bisa gagal (mode privat / file://), jadi dibungkus aman */
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* abaikan */ } }
  };

  let lang = store.get("lang") === "en" ? "en" : "id";
  let theme = store.get("theme") === "light" ? "light" : "dark";

  /* ---------- Bahasa (ID / EN) ---------- */
  const langBtn = document.getElementById("lang-toggle");
  let typingToken = 0;

  const t = (key) => (I18N[lang] || {})[key];

  function applyLang() {
    const dict = I18N[lang] || {};
    root.lang = lang;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = dict[el.dataset.i18n];
      if (typeof v === "string") el.textContent = v;
    });

    // data-i18n-attr="alt=kunci;aria-label=kunci2"
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.dataset.i18nAttr.split(";").forEach((pair) => {
        const [attr, key] = pair.split("=").map((x) => x.trim());
        if (attr && typeof dict[key] === "string") el.setAttribute(attr, dict[key]);
      });
    });

    if (langBtn) {
      langBtn.dataset.lang = lang;
      const label = dict["lang.label"] || "";
      langBtn.setAttribute("aria-label", label);
      langBtn.title = label;
    }

    applyTheme(); // label tombol tema ikut bahasa
    startTyping();
  }

  if (langBtn) {
    langBtn.addEventListener("click", () => {
      lang = lang === "id" ? "en" : "id";
      store.set("lang", lang);
      applyLang();
    });
  }

  /* ---------- Tema (gelap / terang) ---------- */
  const themeBtn = document.getElementById("theme-toggle");

  function applyTheme() {
    root.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#FFFFFF" : "#0A0A0A");
    if (themeBtn) {
      const label = t(theme === "light" ? "theme.toDark" : "theme.toLight") || "";
      themeBtn.setAttribute("aria-label", label);
      themeBtn.title = label;
    }
  }

  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      theme = theme === "light" ? "dark" : "light";
      store.set("theme", theme);
      applyTheme();
    });
  }

  /* ---------- Hamburger menu ---------- */
  const burger = document.querySelector(".hamburger");
  const menu = document.querySelector(".nav-links");

  if (burger && menu) {
    const toggleMenu = (open) => {
      burger.classList.toggle("open", open);
      menu.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
    };

    burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("open")));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 820) toggleMenu(false); });
  }

  /* ---------- Tahun di footer ---------- */
  document.querySelectorAll(".year").forEach((el) => { el.textContent = new Date().getFullYear(); });

  /* ---------- Typing animation (index.html) ---------- */
  function startTyping() {
    const typingEl = document.getElementById("typing");
    if (!typingEl) return;

    // Teks animasi diatur di i18n.js (kunci "typing") per bahasa
    const words = t("typing") || [];
    if (!words.length) return;

    const token = ++typingToken; // membatalkan animasi lama saat bahasa diganti

    if (reduceMotion) {
      typingEl.textContent = words[0];
      return;
    }

    let w = 0, c = 0, deleting = false;

    const tick = () => {
      if (token !== typingToken) return;
      const word = words[w];
      typingEl.textContent = word.slice(0, c);
      let delay = deleting ? 45 : 90;

      if (!deleting && c === word.length) {
        deleting = true;
        delay = 1600;
      } else if (deleting && c === 0) {
        deleting = false;
        w = (w + 1) % words.length;
        delay = 400;
      }

      c += deleting ? -1 : 1;
      setTimeout(tick, delay);
    };
    tick();
  }

  /* ---------- Skill bar (index.html) ---------- */
  document.querySelectorAll(".bar span").forEach((bar) => {
    const level = bar.dataset.level || "0";
    requestAnimationFrame(() => { bar.style.width = level + "%"; });
  });

  /* ---------- Lightbox sertifikat (certificates.html) ---------- */
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const stage = lightbox.querySelector(".lb-stage");
    const lbImg = stage.querySelector("img");
    const lbCap = lightbox.querySelector(".lightbox-caption");
    const lbClose = lightbox.querySelector(".lightbox-close");
    const btnIn = lightbox.querySelector('[data-zoom="in"]');
    const btnOut = lightbox.querySelector('[data-zoom="out"]');
    const btnReset = lightbox.querySelector('[data-zoom="reset"]');

    const MIN = 1, MAX = 5, STEP = 1.4, DOUBLE_TAP_ZOOM = 2.5;
    let s = 1, x = 0, y = 0;          // skala & geseran
    let lastTrigger = null;
    const pointers = new Map();       // pointer aktif (untuk pinch)
    let pinch = null, drag = null;
    let lastTap = { t: 0, x: 0, y: 0 };

    const stageRect = () => stage.getBoundingClientRect();

    // Ukuran gambar sebenarnya di layar (object-fit: contain)
    function shownSize() {
      const r = stageRect();
      const nw = lbImg.naturalWidth || r.width;
      const nh = lbImg.naturalHeight || r.height;
      const f = Math.min(r.width / nw, r.height / nh);
      return { w: nw * f, h: nh * f, sw: r.width, sh: r.height };
    }

    function render() {
      // batasi geseran supaya gambar tidak keluar dari layar
      const d = shownSize();
      const mx = Math.max(0, (d.w * s - d.sw) / 2);
      const my = Math.max(0, (d.h * s - d.sh) / 2);
      x = Math.min(mx, Math.max(-mx, x));
      y = Math.min(my, Math.max(-my, y));

      lbImg.style.transform = "translate(" + x + "px," + y + "px) scale(" + s + ")";
      btnReset.textContent = Math.round(s * 100) + "%";
      btnIn.disabled = s >= MAX - 0.001;
      btnOut.disabled = s <= MIN + 0.001;
      lightbox.classList.toggle("zoomed", s > 1.001);
    }

    // cx, cy = titik fokus relatif terhadap tengah stage
    function zoomTo(next, cx, cy) {
      next = Math.min(MAX, Math.max(MIN, next));
      const k = next / s;
      x = cx - (cx - x) * k;
      y = cy - (cy - y) * k;
      s = next;
      if (s <= MIN + 0.001) { s = MIN; x = 0; y = 0; }
      render();
    }

    const rel = (clientX, clientY) => {
      const r = stageRect();
      return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
    };

    const animate = (on) => lbImg.classList.toggle("animate", on);

    const openLightbox = (btn) => {
      const img = btn.querySelector("img");
      lastTrigger = btn;
      s = 1; x = 0; y = 0;
      lbImg.src = img.dataset.full || img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      render();
      lbClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("open", "zoomed", "dragging");
      document.body.style.overflow = "";
      pointers.clear(); pinch = null; drag = null;
      if (lastTrigger) lastTrigger.focus();
    };

    document.querySelectorAll(".cert-thumb").forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(btn));
    });

    lbImg.addEventListener("load", render);
    lbClose.addEventListener("click", closeLightbox);

    /* Tombol + / − / reset */
    btnIn.addEventListener("click", () => { animate(true); zoomTo(s * STEP, 0, 0); });
    btnOut.addEventListener("click", () => { animate(true); zoomTo(s / STEP, 0, 0); });
    btnReset.addEventListener("click", () => { animate(true); zoomTo(1, 0, 0); });

    /* Scroll mouse / trackpad */
    stage.addEventListener("wheel", (e) => {
      e.preventDefault();
      animate(false);
      const p = rel(e.clientX, e.clientY);
      zoomTo(s * Math.exp(-e.deltaY * 0.0015), p.x, p.y);
    }, { passive: false });

    /* Sentuh & mouse: geser, cubit (pinch), klik/ketuk 2x */
    stage.addEventListener("pointerdown", (e) => {
      animate(false);
      try { stage.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) || 1, s, mx: m.x, my: m.y };
        drag = null;
      } else if (pointers.size === 1) {
        drag = { x: e.clientX, y: e.clientY, ox: x, oy: y, moved: false, t: Date.now() };
      }
    });

    stage.addEventListener("pointermove", (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      p.x = e.clientX; p.y = e.clientY;

      if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const m = rel((a.x + b.x) / 2, (a.y + b.y) / 2);
        zoomTo(pinch.s * d / pinch.d, m.x, m.y);
        x += m.x - pinch.mx;           // ikut menggeser saat dua jari bergerak
        y += m.y - pinch.my;
        pinch.mx = m.x; pinch.my = m.y;
        render();
      } else if (drag && pointers.size === 1) {
        const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (Math.hypot(dx, dy) > 6) drag.moved = true;
        if (s > 1.001 && drag.moved) {
          lightbox.classList.add("dragging");
          x = drag.ox + dx;
          y = drag.oy + dy;
          render();
        }
      }
    });

    const endPointer = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.delete(e.pointerId);
      lightbox.classList.remove("dragging");

      const wasTap = drag && !drag.moved && e.type === "pointerup" && Date.now() - drag.t < 350;
      if (pointers.size < 2) pinch = null;

      if (wasTap) {
        const now = Date.now();
        if (now - lastTap.t < 300 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
          const p = rel(e.clientX, e.clientY);
          animate(true);
          zoomTo(s > 1.001 ? 1 : DOUBLE_TAP_ZOOM, p.x, p.y);
          lastTap.t = 0;
        } else {
          lastTap = { t: now, x: e.clientX, y: e.clientY };
        }
      }

      drag = null;
      if (pointers.size === 1) {         // satu jari tersisa setelah pinch -> lanjut geser
        const [r] = [...pointers.values()];
        drag = { x: r.x, y: r.y, ox: x, oy: y, moved: true, t: 0 };
      }
    };

    stage.addEventListener("pointerup", endPointer);
    stage.addEventListener("pointercancel", endPointer);

    /* Keyboard */
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "+" || e.key === "=") { animate(true); zoomTo(s * STEP, 0, 0); }
      else if (e.key === "-" || e.key === "_") { animate(true); zoomTo(s / STEP, 0, 0); }
      else if (e.key === "0") { animate(true); zoomTo(1, 0, 0); }
    });

    window.addEventListener("resize", () => { if (lightbox.classList.contains("open")) render(); });
  }

  /* ---------- Form pesan (contact.html, bila ada) ---------- */
  const form = document.getElementById("contact-form");

  if (form) {
    const note = document.getElementById("form-note");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = form.elements["name"].value.trim();
      const email = form.elements["email"].value.trim();
      const message = form.elements["message"].value.trim();

      if (!name || !email || !message) {
        note.textContent = "Lengkapi nama, email, dan pesan terlebih dahulu.";
        return;
      }

      // GANTI EMAIL TUJUAN DI SINI
      const to = "emailkamu@gmail.com";
      const subject = encodeURIComponent("Pesan dari " + name);
      const body = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");

      note.textContent = "Membuka aplikasi email Anda...";
      window.location.href = "mailto:" + to + "?subject=" + subject + "&body=" + body;
      form.reset();
    });
  }

  /* ---------- Terapkan tema & bahasa saat halaman dibuka ---------- */
  applyTheme();
  applyLang();
});
