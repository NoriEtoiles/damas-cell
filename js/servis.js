/* =========================================================================
   DAMAS CELL — SERVIS.JS
   Menyematkan Google Form "Cek Kerusakan" di halaman Servis.

   Form-nya tidak ditulis langsung di HTML, melainkan disisipkan lewat JS
   berdasarkan js/config.js. Tujuannya sama seperti katalog: pemilik cukup
   mengganti satu baris URL, tanpa menyentuh struktur halaman.

   Kalau URL belum diisi, halaman tetap tampil rapi dengan tawaran
   konsultasi lewat WhatsApp — bukan iframe kosong atau pesan error.
   ========================================================================= */

(function () {
  "use strict";

  var CONFIG = window.DAMAS_CONFIG || {};
  var WA_NUMBER = CONFIG.WHATSAPP_NUMBER || "6285640179995";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Membersihkan URL yang ditempel pemilik.
   * Sering kali orang menempel seluruh kode <iframe ...> hasil salin dari
   * Google Form, bukan alamatnya saja — jadi di sini alamatnya diambilkan
   * otomatis supaya tidak perlu bolak-balik memperbaiki.
   */
  function bersihkanUrl(raw) {
    if (!raw) return "";
    var teks = String(raw).trim();
    if (!teks) return "";

    // Kalau yang ditempel adalah kode <iframe src="...">, ambil isi src-nya.
    var cocokIframe = teks.match(/src\s*=\s*["']([^"']+)["']/i);
    if (cocokIframe) teks = cocokIframe[1];

    // Hanya terima alamat Google Form yang wajar.
    if (!/^https:\/\/docs\.google\.com\/forms\//i.test(teks)) return "";

    // Pastikan parameter embedded=true ada, supaya tampilan form lebih ringkas.
    if (teks.indexOf("embedded=true") === -1) {
      teks += (teks.indexOf("?") === -1 ? "?" : "&") + "embedded=true";
    }

    return teks;
  }

  function tautanWA(pesan) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(pesan);
  }

  function panelWhatsApp(judul, pesan) {
    return (
      '<div class="placeholder-panel">' +
        '<img class="placeholder-panel__icon" src="assets/icon-servis-cepat.png" alt="" width="56" height="56">' +
        "<h2>" + escapeHtml(judul) + "</h2>" +
        "<p>" + escapeHtml(pesan) + "</p>" +
        '<a class="btn btn--accent" href="' +
          tautanWA("Halo Admin Damas Cell, HP saya bermasalah dan ingin konsultasi servis") +
          '" target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="servis-fallback">' +
          "Konsultasi via WA" +
        "</a>" +
      "</div>"
    );
  }

  function init() {
    var wadah = document.getElementById("servisForm");
    if (!wadah) return;

    var url = bersihkanUrl(CONFIG.SERVIS_FORM_URL);

    if (!url) {
      wadah.innerHTML = panelWhatsApp(
        "Formulir online sedang disiapkan",
        "Sementara formulir belum aktif, ceritakan saja keluhan HP kamu langsung ke admin lewat WhatsApp — biasanya dibalas lebih cepat."
      );
      return;
    }

    wadah.innerHTML =
      '<div class="form-embed">' +
        '<iframe src="' + escapeHtml(url) + '" ' +
          'title="Formulir Cek Kerusakan Damas Cell" ' +
          'loading="lazy" ' +
          'width="100%" height="900" frameborder="0" marginheight="0" marginwidth="0">' +
          "Memuat formulir…" +
        "</iframe>" +
      "</div>" +
      '<p class="form-embed__bantuan">' +
        "Formulir tidak muncul atau lebih suka chat langsung? " +
        '<a href="' +
          tautanWA("Halo Admin Damas Cell, HP saya bermasalah dan ingin konsultasi servis") +
          '" target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="servis-bantuan">' +
          "Hubungi admin lewat WhatsApp" +
        "</a>." +
      "</p>";
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
