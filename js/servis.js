(function() {
  "use strict";
  var CONFIG = window.DAMAS_CONFIG || {};
  var WA_NUMBER = CONFIG.WHATSAPP_NUMBER || "6285640179995";
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function bersihkanUrl(raw) {
    if (!raw) return "";
    var teks = String(raw).trim();
    if (!teks) return "";
    var cocokIframe = teks.match(/src\s*=\s*["']([^"']+)["']/i);
    if (cocokIframe) teks = cocokIframe[1];
    if (!/^https:\/\/docs\.google\.com\/forms\//i.test(teks)) return "";
    if (teks.indexOf("embedded=true") === -1) {
      teks += (teks.indexOf("?") === -1 ? "?" : "&") + "embedded=true";
    }
    return teks;
  }
  function tautanWA(pesan) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(pesan);
  }
  function panelWhatsApp(judul, pesan) {
    return '<div class="placeholder-panel">' + '<img class="placeholder-panel__icon" src="assets/icon-servis-cepat.png" alt="" width="56" height="56">' + "<h2>" + escapeHtml(judul) + "</h2>" + "<p>" + escapeHtml(pesan) + "</p>" + '<a class="btn btn--accent" href="' + tautanWA("Halo Admin Damas Cell, HP saya bermasalah dan ingin konsultasi servis") + '" target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="servis-fallback">' + "Konsultasi via WA" + "</a>" + "</div>";
  }
  function init() {
    var wadah = document.getElementById("servisForm");
    if (!wadah) return;
    var url = bersihkanUrl(CONFIG.SERVIS_FORM_URL);
    if (!url) {
      wadah.innerHTML = panelWhatsApp("Formulir online sedang disiapkan", "Sementara formulir belum aktif, ceritakan saja keluhan HP kamu langsung ke admin lewat WhatsApp — biasanya dibalas lebih cepat.");
      return;
    }
    wadah.innerHTML = '<div class="form-embed">' + '<iframe src="' + escapeHtml(url) + '" ' + 'title="Formulir Cek Kerusakan Damas Cell" ' + 'loading="lazy" ' + 'width="100%" height="900" frameborder="0" marginheight="0" marginwidth="0">' + "Memuat formulir…" + "</iframe>" + "</div>" + '<p class="form-embed__bantuan">' + "Formulir tidak muncul atau lebih suka chat langsung? " + '<a href="' + tautanWA("Halo Admin Damas Cell, HP saya bermasalah dan ingin konsultasi servis") + '" target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="servis-bantuan">' + "Hubungi admin lewat WhatsApp" + "</a>." + "</p>";
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
