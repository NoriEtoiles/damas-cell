/* =========================================================================
   DAMAS CELL — KATALOG.JS
   Mengambil data produk dari Google Sheet (format CSV publikasi web),
   lalu merender kartu produk otomatis.

   Dipakai di dua tempat:
   - katalog.html  -> menampilkan semua produk + filter kategori
   - index.html    -> menampilkan beberapa produk saja ("Sneak Peek")

   Alur kerja staf toko: cukup edit Google Sheet, situs otomatis ikut
   berubah saat halaman dimuat ulang. Tidak perlu menyentuh kode.

   Daftar isi:
   1. Util: ambil config, format harga, escape HTML
   2. Parser CSV (menangani koma & baris baru di dalam tanda kutip)
   3. Normalisasi baris Sheet -> objek produk
   4. Konversi tautan foto (Google Drive -> tautan gambar langsung)
   5. Render: kartu, status kosong, status error, skeleton loading
   6. Filter kategori
   7. Inisialisasi
   ========================================================================= */

(function () {
  "use strict";

  /* -----------------------------------------------------------------------
     1. UTIL
     ----------------------------------------------------------------------- */
  var CONFIG = window.DAMAS_CONFIG || {};
  var WA_NUMBER = CONFIG.WHATSAPP_NUMBER || "6285640179995";
  var PLACEHOLDER_IMG = "assets/placeholder-foto-produk.png";

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Format harga jadi "Rp1.500.000".
   * Kalau isinya sudah berupa teks (mis. "Nego" atau "Rp 1.5jt"),
   * tampilkan apa adanya supaya staf tetap bebas menulis manual.
   */
  function formatHarga(raw) {
    if (raw == null) return "";
    var teks = String(raw).trim();
    if (!teks) return "";

    // Ambil hanya digit; kalau setelah dibersihkan masih ada huruf, berarti
    // staf menulis teks bebas -> jangan diutak-atik.
    var hanyaAngka = teks.replace(/[^0-9]/g, "");
    var adaHuruf = /[a-zA-Z]/.test(teks);

    if (!hanyaAngka || adaHuruf) return teks;

    return "Rp" + Number(hanyaAngka).toLocaleString("id-ID");
  }

  /* -----------------------------------------------------------------------
     2. PARSER CSV
     Ditulis manual (bukan pakai split koma biasa) supaya nama produk yang
     mengandung koma — mis. "Samsung A14, RAM 6GB" — tidak terpotong.
     ----------------------------------------------------------------------- */
  function parseCSV(teks) {
    var baris = [];
    var barisSaatIni = [];
    var nilai = "";
    var dalamKutip = false;

    // Samakan line ending Windows/Mac ke \n
    teks = teks.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

    for (var i = 0; i < teks.length; i++) {
      var c = teks[i];

      if (dalamKutip) {
        if (c === '"') {
          if (teks[i + 1] === '"') {
            nilai += '"'; // tanda kutip yang di-escape
            i++;
          } else {
            dalamKutip = false;
          }
        } else {
          nilai += c;
        }
      } else {
        if (c === '"') {
          dalamKutip = true;
        } else if (c === ",") {
          barisSaatIni.push(nilai);
          nilai = "";
        } else if (c === "\n") {
          barisSaatIni.push(nilai);
          baris.push(barisSaatIni);
          barisSaatIni = [];
          nilai = "";
        } else {
          nilai += c;
        }
      }
    }

    // Sisa nilai terakhir (file tanpa newline di akhir)
    if (nilai !== "" || barisSaatIni.length) {
      barisSaatIni.push(nilai);
      baris.push(barisSaatIni);
    }

    // Buang baris yang seluruhnya kosong
    return baris.filter(function (r) {
      return r.some(function (sel) {
        return String(sel).trim() !== "";
      });
    });
  }

  /* -----------------------------------------------------------------------
     3. NORMALISASI BARIS -> OBJEK PRODUK
     Nama kolom di Sheet dibaca secara longgar: huruf besar/kecil, spasi,
     dan beberapa variasi penulisan diterima. Jadi staf tidak perlu takut
     salah ketik header.
     ----------------------------------------------------------------------- */
  var PETA_KOLOM = {
    nama: ["nama", "nama produk", "produk", "judul"],
    harga: ["harga", "price", "harga jual"],
    kategori: ["kategori", "category", "jenis"],
    status: ["status stok", "status", "stok", "ketersediaan"],
    foto: ["tautan foto", "foto", "gambar", "link foto", "url foto", "image"],
    catatan: ["catatan", "deskripsi", "keterangan", "spesifikasi", "spek"]
  };

  function cocokkanHeader(headerAsli) {
    var hasil = {};
    headerAsli.forEach(function (namaKolom, index) {
      var bersih = String(namaKolom).trim().toLowerCase();
      Object.keys(PETA_KOLOM).forEach(function (kunci) {
        if (hasil[kunci] === undefined && PETA_KOLOM[kunci].indexOf(bersih) !== -1) {
          hasil[kunci] = index;
        }
      });
    });
    return hasil;
  }

  function baseToProduk(baris, petaKolom) {
    function ambil(kunci) {
      var idx = petaKolom[kunci];
      if (idx === undefined || baris[idx] === undefined) return "";
      return String(baris[idx]).trim();
    }

    return {
      nama: ambil("nama"),
      harga: ambil("harga"),
      kategori: ambil("kategori"),
      status: ambil("status"),
      foto: ambil("foto"),
      catatan: ambil("catatan")
    };
  }

  /* -----------------------------------------------------------------------
     4. KONVERSI TAUTAN FOTO
     Staf kemungkinan besar menyimpan foto di Google Drive lalu menyalin
     tautan "bagikan". Tautan itu tidak bisa dipakai langsung sebagai
     <img src>, jadi di sini diubah ke bentuk tautan gambar langsung.
     ----------------------------------------------------------------------- */
  function normalisasiTautanFoto(url) {
    if (!url) return "";
    var teks = String(url).trim();
    if (!teks) return "";

    // Tolak apa pun yang bukan http(s) — mencegah tautan aneh masuk ke src.
    if (!/^https?:\/\//i.test(teks)) return "";

    // Bentuk umum tautan Google Drive:
    //   https://drive.google.com/file/d/<ID>/view?usp=sharing
    //   https://drive.google.com/open?id=<ID>
    var cocok = teks.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (!cocok) {
      cocok = teks.match(/drive\.google\.com\/open\?id=([^&]+)/);
    }
    if (cocok && cocok[1]) {
      return "https://drive.google.com/thumbnail?id=" + cocok[1] + "&sz=w600";
    }

    return teks;
  }

  /* -----------------------------------------------------------------------
     5. RENDER
     ----------------------------------------------------------------------- */
  function kelasStatus(status) {
    var s = String(status).trim().toLowerCase();
    if (!s) return "";
    if (s.indexOf("habis") !== -1 || s.indexOf("kosong") !== -1) return "is-habis";
    if (s.indexOf("pre") !== -1 || s.indexOf("pesan") !== -1) return "is-preorder";
    return "is-tersedia";
  }

  function tautanWA(produk) {
    var pesan =
      "Halo Admin Damas Cell, saya mau tanya soal " +
      (produk.nama || "produk di katalog");
    if (produk.harga) {
      pesan += " (" + formatHarga(produk.harga) + ")";
    }
    return (
      "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(pesan)
    );
  }

  function renderKartu(produk) {
    var foto = normalisasiTautanFoto(produk.foto) || PLACEHOLDER_IMG;
    var statusKelas = kelasStatus(produk.status);
    var habis = statusKelas === "is-habis";

    var badge = produk.status
      ? '<span class="produk__badge ' + statusKelas + '">' +
        escapeHtml(produk.status) +
        "</span>"
      : "";

    var catatan = produk.catatan
      ? '<p class="produk__catatan">' + escapeHtml(produk.catatan) + "</p>"
      : "";

    var harga = formatHarga(produk.harga);
    var hargaHtml = harga
      ? '<p class="produk__harga">' + escapeHtml(harga) + "</p>"
      : "";

    return (
      '<article class="produk' + (habis ? " produk--habis" : "") + '">' +
        '<div class="produk__media">' +
          '<img src="' + escapeHtml(foto) + '" alt="' + escapeHtml(produk.nama) + '" ' +
            'loading="lazy" width="300" height="300" ' +
            "onerror=\"this.onerror=null;this.src='" + PLACEHOLDER_IMG + "';\">" +
          badge +
        "</div>" +
        '<div class="produk__isi">' +
          '<h3 class="produk__nama">' + escapeHtml(produk.nama) + "</h3>" +
          hargaHtml +
          catatan +
          '<a class="btn btn--accent btn--sm produk__cta" href="' + tautanWA(produk) + '" ' +
            'target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="kartu-produk">' +
            "Chat WA</a>" +
        "</div>" +
      "</article>"
    );
  }

  function renderSkeleton(jumlah) {
    var html = "";
    for (var i = 0; i < jumlah; i++) {
      html +=
        '<div class="produk produk--skeleton" aria-hidden="true">' +
          '<div class="produk__media"></div>' +
          '<div class="produk__isi">' +
            '<span class="skeleton-baris"></span>' +
            '<span class="skeleton-baris skeleton-baris--pendek"></span>' +
          "</div>" +
        "</div>";
    }
    return html;
  }

  function panelPesan(judul, pesan, ctaTeks) {
    var tautan =
      "https://wa.me/" + WA_NUMBER + "?text=" +
      encodeURIComponent("Halo Admin Damas Cell, saya mau tanya stok yang tersedia");

    return (
      '<div class="placeholder-panel">' +
        '<img class="placeholder-panel__icon" src="' + PLACEHOLDER_IMG + '" alt="" width="56" height="56">' +
        "<h2>" + escapeHtml(judul) + "</h2>" +
        "<p>" + escapeHtml(pesan) + "</p>" +
        '<a class="btn btn--accent" href="' + tautan + '" target="_blank" rel="noopener" ' +
          'data-cta="whatsapp" data-cta-location="katalog-fallback">' +
          escapeHtml(ctaTeks) +
        "</a>" +
      "</div>"
    );
  }

  /* -----------------------------------------------------------------------
     6. FILTER KATEGORI
     ----------------------------------------------------------------------- */
  function pasangFilter(wadahFilter, wadahGrid, semuaProduk) {
    if (!wadahFilter) return;

    var kategoriUnik = [];
    semuaProduk.forEach(function (p) {
      if (p.kategori && kategoriUnik.indexOf(p.kategori) === -1) {
        kategoriUnik.push(p.kategori);
      }
    });

    // Kalau semua produk tanpa kategori, tidak perlu tampilkan filter sama sekali.
    if (!kategoriUnik.length) {
      wadahFilter.hidden = true;
      return;
    }

    var html =
      '<button class="filter-chip is-active" data-kategori="">Semua</button>';
    kategoriUnik.forEach(function (k) {
      html +=
        '<button class="filter-chip" data-kategori="' + escapeHtml(k) + '">' +
        escapeHtml(k) +
        "</button>";
    });
    wadahFilter.innerHTML = html;
    wadahFilter.hidden = false;

    wadahFilter.addEventListener("click", function (e) {
      var tombol = e.target.closest(".filter-chip");
      if (!tombol) return;

      wadahFilter.querySelectorAll(".filter-chip").forEach(function (b) {
        b.classList.toggle("is-active", b === tombol);
      });

      var pilihan = tombol.getAttribute("data-kategori");
      var terpilih = pilihan
        ? semuaProduk.filter(function (p) { return p.kategori === pilihan; })
        : semuaProduk;

      wadahGrid.innerHTML = terpilih.map(renderKartu).join("");
    });
  }

  /* -----------------------------------------------------------------------
     7. INISIALISASI
     ----------------------------------------------------------------------- */
  function ambilProduk(url) {
    return fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.text();
      })
      .then(function (csv) {
        var baris = parseCSV(csv);
        if (baris.length < 2) return [];

        var petaKolom = cocokkanHeader(baris[0]);
        if (petaKolom.nama === undefined) {
          throw new Error("Kolom 'nama' tidak ditemukan di Sheet");
        }

        return baris
          .slice(1)
          .map(function (r) { return baseToProduk(r, petaKolom); })
          .filter(function (p) { return p.nama; });
      });
  }

  function init() {
    var wadahGrid = document.getElementById("katalogGrid");
    if (!wadahGrid) return; // halaman ini tidak punya katalog

    var wadahFilter = document.getElementById("katalogFilter");
    var modeSneakPeek = wadahGrid.getAttribute("data-mode") === "sneak-peek";
    var batas = modeSneakPeek ? (CONFIG.SNEAK_PEEK_LIMIT || 6) : 0;
    var url = CONFIG.SHEET_CSV_URL;

    // Belum dikonfigurasi -> tampilkan pesan ramah, bukan error teknis.
    if (!url) {
      if (modeSneakPeek) {
        var sectionInduk = wadahGrid.closest("section");
        if (sectionInduk) sectionInduk.hidden = true;
      } else {
        wadahGrid.classList.remove("katalog-grid");
        wadahGrid.innerHTML = panelPesan(
          "Katalog online sedang disiapkan",
          "Daftar produk akan tampil otomatis di sini setelah Google Sheet katalog tersambung. Sementara itu, tanya stok & harga terbaru langsung ke admin.",
          "Tanya Stok via WA"
        );
      }
      if (wadahFilter) wadahFilter.hidden = true;
      return;
    }

    wadahGrid.innerHTML = renderSkeleton(modeSneakPeek ? 3 : 6);

    ambilProduk(url)
      .then(function (produk) {
        if (!produk.length) {
          wadahGrid.classList.remove("katalog-grid");
          wadahGrid.innerHTML = panelPesan(
            "Belum ada produk terdaftar",
            "Sheet katalog sudah tersambung, tapi belum ada baris produk yang terisi. Tambahkan produk di Google Sheet, lalu muat ulang halaman ini.",
            "Tanya Stok via WA"
          );
          if (wadahFilter) wadahFilter.hidden = true;
          return;
        }

        var tampil = batas ? produk.slice(0, batas) : produk;
        wadahGrid.innerHTML = tampil.map(renderKartu).join("");

        if (!modeSneakPeek) {
          pasangFilter(wadahFilter, wadahGrid, produk);
        }
      })
      .catch(function (err) {
        console.error("[Damas Cell] Gagal memuat katalog:", err);

        if (modeSneakPeek) {
          // Di Home, jangan tampilkan error — cukup sembunyikan sectionnya
          // supaya halaman utama tetap rapi.
          var sectionInduk = wadahGrid.closest("section");
          if (sectionInduk) sectionInduk.hidden = true;
          return;
        }

        wadahGrid.classList.remove("katalog-grid");
        wadahGrid.innerHTML = panelPesan(
          "Katalog belum bisa dimuat",
          "Sedang ada kendala saat mengambil data produk. Silakan coba muat ulang halaman, atau tanya stok langsung ke admin lewat WhatsApp.",
          "Tanya Stok via WA"
        );
        if (wadahFilter) wadahFilter.hidden = true;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
