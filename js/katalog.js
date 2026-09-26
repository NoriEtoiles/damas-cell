(function() {
  "use strict";
  var CONFIG = window.DAMAS_CONFIG || {};
  var WA_NUMBER = CONFIG.WHATSAPP_NUMBER || "6285640179995";
  var PLACEHOLDER_IMG = "assets/placeholder-foto-produk.png";
  function escapeHtml(str) {
    return String(str == null ? "" : str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function formatHarga(raw) {
    if (raw == null) return "";
    var teks = String(raw).trim();
    if (!teks) return "";
    var hanyaAngka = teks.replace(/[^0-9]/g, "");
    var adaHuruf = /[a-zA-Z]/.test(teks);
    if (!hanyaAngka || adaHuruf) return teks;
    return "Rp" + Number(hanyaAngka).toLocaleString("id-ID");
  }
  function parseCSV(teks) {
    var baris = [];
    var barisSaatIni = [];
    var nilai = "";
    var dalamKutip = false;
    teks = teks.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    for (var i = 0; i < teks.length; i++) {
      var c = teks[i];
      if (dalamKutip) {
        if (c === '"') {
          if (teks[i + 1] === '"') {
            nilai += '"';
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
    if (nilai !== "" || barisSaatIni.length) {
      barisSaatIni.push(nilai);
      baris.push(barisSaatIni);
    }
    return baris.filter(function(r) {
      return r.some(function(sel) {
        return String(sel).trim() !== "";
      });
    });
  }
  var PETA_KOLOM = {
    nama: [ "nama", "nama produk", "produk", "judul" ],
    harga: [ "harga", "price", "harga jual" ],
    kategori: [ "kategori", "category", "jenis" ],
    status: [ "status stok", "status", "stok", "ketersediaan" ],
    foto: [ "tautan foto", "foto", "gambar", "link foto", "url foto", "image" ],
    catatan: [ "catatan", "deskripsi", "keterangan", "spesifikasi", "spek" ]
  };
  function cocokkanHeader(headerAsli) {
    var hasil = {};
    headerAsli.forEach(function(namaKolom, index) {
      var bersih = String(namaKolom).trim().toLowerCase();
      Object.keys(PETA_KOLOM).forEach(function(kunci) {
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
  function normalisasiTautanFoto(url) {
    if (!url) return "";
    var teks = String(url).trim();
    if (!teks) return "";
    if (!/^https?:\/\//i.test(teks)) return "";
    var cocok = teks.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    if (!cocok) {
      cocok = teks.match(/drive\.google\.com\/open\?id=([^&]+)/);
    }
    if (cocok && cocok[1]) {
      return "https://drive.google.com/thumbnail?id=" + cocok[1] + "&sz=w600";
    }
    return teks;
  }
  function daftarFotoProduk(fotoRaw) {
    if (!fotoRaw) return [];
    return String(fotoRaw).split(",").map(function(bagian) {
      return normalisasiTautanFoto(bagian.trim());
    }).filter(function(u) {
      return u;
    });
  }
  function kelasStatus(status) {
    var s = String(status).trim().toLowerCase();
    if (!s) return "";
    if (s.indexOf("habis") !== -1 || s.indexOf("kosong") !== -1) return "is-habis";
    if (s.indexOf("pre") !== -1 || s.indexOf("pesan") !== -1) return "is-preorder";
    return "is-tersedia";
  }
  function tautanWA(produk) {
    var pesan = "Halo Admin Damas Cell, saya mau tanya soal " + (produk.nama || "produk di katalog");
    if (produk.harga) {
      pesan += " (" + formatHarga(produk.harga) + ")";
    }
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(pesan);
  }
  function renderKartu(produk) {
    var daftarFoto = daftarFotoProduk(produk.foto);
    var fotoUtama = daftarFoto[0] || PLACEHOLDER_IMG;
    var jumlahFoto = daftarFoto.length;
    var bisaGaleri = jumlahFoto > 1;
    var statusKelas = kelasStatus(produk.status);
    var habis = statusKelas === "is-habis";
    var badgeStatus = produk.status ? '<span class="produk__badge ' + statusKelas + '">' + escapeHtml(produk.status) + "</span>" : "";
    var badgeGaleri = bisaGaleri ? '<span class="produk__galeri-badge" aria-hidden="true">' + '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" stroke-width="1.7"/><circle cx="9" cy="11" r="2" stroke="currentColor" stroke-width="1.7"/><path d="M4 17l5-4 3 2.5 3-3 5 4.5" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' + jumlahFoto + "</span>" : "";
    var catatan = produk.catatan ? '<p class="produk__catatan">' + escapeHtml(produk.catatan) + "</p>" : "";
    var harga = formatHarga(produk.harga);
    var hargaHtml = harga ? '<p class="produk__harga">' + escapeHtml(harga) + "</p>" : "";
    var imgTag = '<img src="' + escapeHtml(fotoUtama) + '" alt="' + escapeHtml(produk.nama) + '" ' + 'loading="lazy" width="300" height="300" ' + "onerror=\"this.onerror=null;this.src='" + PLACEHOLDER_IMG + "';\">";
    var media = bisaGaleri ? '<button type="button" class="produk__media produk__media--galeri" ' + 'data-fotos="' + escapeHtml(JSON.stringify(daftarFoto)) + '" ' + 'aria-label="Lihat ' + jumlahFoto + " foto " + escapeHtml(produk.nama) + '">' + imgTag + badgeStatus + badgeGaleri + "</button>" : '<div class="produk__media">' + imgTag + badgeStatus + "</div>";
    return '<article class="produk' + (habis ? " produk--habis" : "") + '">' + media + '<div class="produk__isi">' + '<h3 class="produk__nama">' + escapeHtml(produk.nama) + "</h3>" + hargaHtml + catatan + '<a class="btn btn--accent btn--sm produk__cta" href="' + tautanWA(produk) + '" ' + 'target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="kartu-produk">' + "Chat WA</a>" + "</div>" + "</article>";
  }
  function renderSkeleton(jumlah) {
    var html = "";
    for (var i = 0; i < jumlah; i++) {
      html += '<div class="produk produk--skeleton" aria-hidden="true">' + '<div class="produk__media"></div>' + '<div class="produk__isi">' + '<span class="skeleton-baris"></span>' + '<span class="skeleton-baris skeleton-baris--pendek"></span>' + "</div>" + "</div>";
    }
    return html;
  }
  function panelPesan(judul, pesan, ctaTeks) {
    var tautan = "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent("Halo Admin Damas Cell, saya mau tanya stok yang tersedia");
    return '<div class="placeholder-panel">' + '<img class="placeholder-panel__icon" src="' + PLACEHOLDER_IMG + '" alt="" width="56" height="56">' + "<h2>" + escapeHtml(judul) + "</h2>" + "<p>" + escapeHtml(pesan) + "</p>" + '<a class="btn btn--accent" href="' + tautan + '" target="_blank" rel="noopener" ' + 'data-cta="whatsapp" data-cta-location="katalog-fallback">' + escapeHtml(ctaTeks) + "</a>" + "</div>";
  }
  var modalState = {
    fotos: [],
    indexAktif: 0,
    elemenPemicu: null
  };
  function buatModalGaleriJikaBelumAda() {
    var modalAda = document.getElementById("modalGaleri");
    if (modalAda) return modalAda;
    var wadah = document.createElement("div");
    wadah.id = "modalGaleri";
    wadah.className = "modal-galeri";
    wadah.hidden = true;
    wadah.setAttribute("aria-hidden", "true");
    wadah.innerHTML = '<div class="modal-galeri__overlay" data-galeri-tutup></div>' + '<div class="modal-galeri__dialog" role="dialog" aria-modal="true" aria-label="Galeri foto produk">' + '<button type="button" class="modal-galeri__tutup" data-galeri-tutup aria-label="Tutup galeri">&times;</button>' + '<button type="button" class="modal-galeri__panah modal-galeri__panah--kiri" data-galeri-prev aria-label="Foto sebelumnya">&lsaquo;</button>' + '<img class="modal-galeri__gambar" id="modalGaleriGambar" src="" alt="">' + '<button type="button" class="modal-galeri__panah modal-galeri__panah--kanan" data-galeri-next aria-label="Foto berikutnya">&rsaquo;</button>' + '<div class="modal-galeri__thumbs" id="modalGaleriThumbs"></div>' + "</div>";
    document.body.appendChild(wadah);
    wadah.addEventListener("click", function(e) {
      if (e.target.closest("[data-galeri-tutup]")) tutupGaleri();
      if (e.target.closest("[data-galeri-prev]")) gantiFotoGaleri(-1);
      if (e.target.closest("[data-galeri-next]")) gantiFotoGaleri(1);
      var thumb = e.target.closest("[data-galeri-thumb]");
      if (thumb) {
        tampilkanFotoGaleri(Number(thumb.getAttribute("data-galeri-thumb")));
      }
    });
    document.addEventListener("keydown", function(e) {
      if (wadah.hidden) return;
      if (e.key === "Escape") tutupGaleri();
      if (e.key === "ArrowLeft") gantiFotoGaleri(-1);
      if (e.key === "ArrowRight") gantiFotoGaleri(1);
    });
    return wadah;
  }
  function tampilkanFotoGaleri(index) {
    var total = modalState.fotos.length;
    if (!total) return;
    modalState.indexAktif = (index + total) % total;
    var gambar = document.getElementById("modalGaleriGambar");
    if (gambar) {
      gambar.src = modalState.fotos[modalState.indexAktif];
      gambar.alt = "Foto produk " + (modalState.indexAktif + 1) + " dari " + total;
    }
    var wadahThumbs = document.getElementById("modalGaleriThumbs");
    if (wadahThumbs) {
      wadahThumbs.innerHTML = modalState.fotos.map(function(url, i) {
        return '<button type="button" class="modal-galeri__thumb' + (i === modalState.indexAktif ? " is-aktif" : "") + '" data-galeri-thumb="' + i + '" aria-label="Lihat foto ' + (i + 1) + '">' + '<img src="' + escapeHtml(url) + '" alt="" loading="lazy">' + "</button>";
      }).join("");
    }
  }
  function gantiFotoGaleri(arah) {
    tampilkanFotoGaleri(modalState.indexAktif + arah);
  }
  function bukaGaleri(fotos, indexAwal, elemenPemicu) {
    if (!fotos || !fotos.length) return;
    var modal = buatModalGaleriJikaBelumAda();
    modalState.fotos = fotos;
    modalState.elemenPemicu = elemenPemicu || null;
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-modal-galeri");
    tampilkanFotoGaleri(indexAwal || 0);
    var tombolTutup = modal.querySelector(".modal-galeri__tutup");
    if (tombolTutup) tombolTutup.focus();
  }
  function tutupGaleri() {
    var modal = document.getElementById("modalGaleri");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-modal-galeri");
    if (modalState.elemenPemicu && typeof modalState.elemenPemicu.focus === "function") {
      modalState.elemenPemicu.focus();
    }
    modalState.elemenPemicu = null;
  }
  document.addEventListener("click", function(e) {
    var pemicu = e.target.closest(".produk__media--galeri");
    if (!pemicu) return;
    var fotosMentah = pemicu.getAttribute("data-fotos");
    if (!fotosMentah) return;
    var fotos;
    try {
      fotos = JSON.parse(fotosMentah);
    } catch (err) {
      return;
    }
    bukaGaleri(fotos, 0, pemicu);
  });
  function pasangFilter(wadahFilter, wadahGrid, semuaProduk) {
    if (!wadahFilter) return;
    var kategoriUnik = [];
    semuaProduk.forEach(function(p) {
      if (p.kategori && kategoriUnik.indexOf(p.kategori) === -1) {
        kategoriUnik.push(p.kategori);
      }
    });
    if (!kategoriUnik.length) {
      wadahFilter.hidden = true;
      return;
    }
    var html = '<button class="filter-chip is-active" data-kategori="">Semua</button>';
    kategoriUnik.forEach(function(k) {
      html += '<button class="filter-chip" data-kategori="' + escapeHtml(k) + '">' + escapeHtml(k) + "</button>";
    });
    wadahFilter.innerHTML = html;
    wadahFilter.hidden = false;
    wadahFilter.addEventListener("click", function(e) {
      var tombol = e.target.closest(".filter-chip");
      if (!tombol) return;
      wadahFilter.querySelectorAll(".filter-chip").forEach(function(b) {
        b.classList.toggle("is-active", b === tombol);
      });
      var pilihan = tombol.getAttribute("data-kategori");
      var terpilih = pilihan ? semuaProduk.filter(function(p) {
        return p.kategori === pilihan;
      }) : semuaProduk;
      wadahGrid.innerHTML = terpilih.map(renderKartu).join("");
    });
  }
  function tambahPemecahCache(url) {
    var pemisah = url.indexOf("?") === -1 ? "?" : "&";
    return url + pemisah + "_=" + Date.now() + Math.random().toString(36).slice(2);
  }
  function ambilProduk(url) {
    return fetch(tambahPemecahCache(url), {
      cache: "no-store"
    }).then(function(res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function(csv) {
      var baris = parseCSV(csv);
      if (baris.length < 2) return [];
      var petaKolom = cocokkanHeader(baris[0]);
      if (petaKolom.nama === undefined) {
        throw new Error("Kolom 'nama' tidak ditemukan di Sheet");
      }
      return baris.slice(1).map(function(r) {
        return baseToProduk(r, petaKolom);
      }).filter(function(p) {
        return p.nama;
      });
    });
  }
  function init() {
    var wadahGrid = document.getElementById("katalogGrid");
    if (!wadahGrid) return;
    var wadahFilter = document.getElementById("katalogFilter");
    var modeSneakPeek = wadahGrid.getAttribute("data-mode") === "sneak-peek";
    var batas = modeSneakPeek ? CONFIG.SNEAK_PEEK_LIMIT || 6 : 0;
    var url = CONFIG.SHEET_CSV_URL;
    if (!url) {
      if (modeSneakPeek) {
        var sectionInduk = wadahGrid.closest("section");
        if (sectionInduk) sectionInduk.hidden = true;
      } else {
        wadahGrid.classList.remove("katalog-grid");
        wadahGrid.innerHTML = panelPesan("Katalog online sedang disiapkan", "Daftar produk akan tampil otomatis di sini setelah Google Sheet katalog tersambung. Sementara itu, tanya stok & harga terbaru langsung ke admin.", "Tanya Stok via WA");
      }
      if (wadahFilter) wadahFilter.hidden = true;
      return;
    }
    wadahGrid.innerHTML = renderSkeleton(modeSneakPeek ? 3 : 6);
    ambilProduk(url).then(function(produk) {
      if (!produk.length) {
        wadahGrid.classList.remove("katalog-grid");
        wadahGrid.innerHTML = panelPesan("Belum ada produk terdaftar", "Sheet katalog sudah tersambung, tapi belum ada baris produk yang terisi. Tambahkan produk di Google Sheet, lalu muat ulang halaman ini.", "Tanya Stok via WA");
        if (wadahFilter) wadahFilter.hidden = true;
        return;
      }
      var tampil = batas ? produk.slice(0, batas) : produk;
      wadahGrid.innerHTML = tampil.map(renderKartu).join("");
      if (!modeSneakPeek) {
        pasangFilter(wadahFilter, wadahGrid, produk);
      }
    }).catch(function(err) {
      console.error("[Damas Cell] Gagal memuat katalog:", err);
      if (modeSneakPeek) {
        var sectionInduk = wadahGrid.closest("section");
        if (sectionInduk) sectionInduk.hidden = true;
        return;
      }
      wadahGrid.classList.remove("katalog-grid");
      wadahGrid.innerHTML = panelPesan("Katalog belum bisa dimuat", "Sedang ada kendala saat mengambil data produk. Silakan coba muat ulang halaman, atau tanya stok langsung ke admin lewat WhatsApp.", "Tanya Stok via WA");
      if (wadahFilter) wadahFilter.hidden = true;
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
