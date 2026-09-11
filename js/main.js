/* =========================================================================
   DAMAS CELL — MAIN.JS
   Interaksi dasar untuk semua halaman statis.

   Isi:
   1. Toggle menu navigasi mobile (hamburger)
   2. Tutup menu saat klik salah satu tautan / klik di luar menu
   3. Stub tracking klik tombol WA (siap disambungkan ke GA4/Meta Pixel)

   Catatan Fase 3 (PRD Bagian 11):
   Logic fetch data Google Sheet -> render kartu produk katalog akan
   ditambahkan sebagai modul terpisah, mis. js/katalog.js, lalu di-include
   khusus di katalog.html. Jangan digabung ke file ini supaya halaman lain
   tidak ikut memuat kode yang tidak perlu.
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1 & 2. Toggle menu navigasi mobile
     ----------------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var primaryNav = document.getElementById("primaryNav");

  function closeNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  }

  function openNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute("aria-expanded", "true");
    primaryNav.classList.add("is-open");
  }

  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function () {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });

    // Tutup menu setiap kali salah satu tautan menu diklik (mobile).
    primaryNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    // Tutup menu bila pengguna klik di luar area nav/tombol toggle.
    document.addEventListener("click", function (event) {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      var clickedInsideNav = primaryNav.contains(event.target);
      var clickedToggle = navToggle.contains(event.target);
      if (!clickedInsideNav && !clickedToggle) {
        closeNav();
      }
    });

    // Tutup menu otomatis saat layar diperbesar ke ukuran tablet/desktop,
    // supaya tidak "nyangkut" terbuka ketika window di-resize.
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 768) {
        closeNav();
      }
    });
  }

  /* -----------------------------------------------------------------------
     3. Stub tracking klik tombol WhatsApp
     Saat ini hanya mencatat ke console. Ganti isi fungsi ini dengan
     pemanggilan gtag('event', ...) / fbq('track', ...) begitu Google
     Analytics atau Meta Pixel sudah dipasang (lihat PRD Bagian 3.2 — KPI
     "Click-Through Rate tombol WA").
     ----------------------------------------------------------------------- */
  function trackWhatsAppClick(location) {
    console.log("[Damas Cell] Klik tombol WA:", location);
    // Contoh saat GA4 sudah terpasang:
    // if (typeof gtag === "function") {
    //   gtag("event", "click_whatsapp", { cta_location: location });
    // }
  }

  document.querySelectorAll('[data-cta="whatsapp"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      trackWhatsAppClick(btn.getAttribute("data-cta-location") || "unknown");
    });
  });
})();
