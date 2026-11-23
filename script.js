/* =========================================================
   script.js — dipakai oleh semua halaman
   ========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  const typingEl = document.getElementById("typing");

  if (typingEl) {
    // GANTI TEKS ANIMASI DI SINI
    const words = ["Software Engineering Student", "Beginner Web Developer", "Junior Programmer"];

    if (reduceMotion) {
      typingEl.textContent = words[0];
    } else {
      let w = 0, c = 0, deleting = false;

      const tick = () => {
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
  }

  /* ---------- Skill bar (index.html) ---------- */
  document.querySelectorAll(".bar span").forEach((bar) => {
    const level = bar.dataset.level || "0";
    requestAnimationFrame(() => { bar.style.width = level + "%"; });
  });

  /* ---------- Lightbox sertifikat (certificates.html) ---------- */
  const lightbox = document.getElementById("lightbox");

  if (lightbox) {
    const lbImg = lightbox.querySelector("img");
    const lbCap = lightbox.querySelector(".lightbox-caption");
    const lbClose = lightbox.querySelector(".lightbox-close");
    let lastTrigger = null;

    const openLightbox = (btn) => {
      const img = btn.querySelector("img");
      lastTrigger = btn;
      lbImg.src = img.dataset.full || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = img.alt;
      lightbox.classList.add("open");
      document.body.style.overflow = "hidden";
      lbClose.focus();
    };

    const closeLightbox = () => {
      lightbox.classList.remove("open");
      document.body.style.overflow = "";
      if (lastTrigger) lastTrigger.focus();
    };

    document.querySelectorAll(".cert-thumb").forEach((btn) => {
      btn.addEventListener("click", () => openLightbox(btn));
    });

    lbClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open")) closeLightbox();
    });
  }

  /* ---------- Form pesan (contact.html) ---------- */
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
});
