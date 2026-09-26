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
  var produkTertampil = [];
  function renderGrid(wadahGrid, daftar) {
    produkTertampil = daftar;
    wadahGrid.innerHTML = daftar.map(function(p, i) {
      return renderKartu(p, i);
    }).join("");
  }
  function renderKartu(produk, index) {
    var daftarFoto = daftarFotoProduk(produk.foto);
    var jumlahFoto = daftarFoto.length;
    var isPlaceholder = jumlahFoto === 0;
    var fotoUtama = daftarFoto[0] || PLACEHOLDER_IMG;
    var statusKelas = kelasStatus(produk.status);
    var habis = statusKelas === "is-habis";
    var badgeStatus = produk.status ? '<span class="produk__badge ' + statusKelas + '">' + escapeHtml(produk.status) + "</span>" : "";
    var catatan = produk.catatan ? '<p class="produk__catatan">' + escapeHtml(produk.catatan) + "</p>" : "";
    var harga = formatHarga(produk.harga);
    var hargaHtml = harga ? '<p class="produk__harga">' + escapeHtml(harga) + "</p>" : "";
    var kelasFoto = "produk__foto" + (isPlaceholder ? " produk__foto--placeholder" : "");
    var imgTag = '<img class="' + kelasFoto + '" src="' + escapeHtml(fotoUtama) + '" alt="' + escapeHtml(produk.nama) + '" ' + 'loading="lazy" ' + "onerror=\"this.onerror=null;this.src='" + PLACEHOLDER_IMG + "';this.classList.add('produk__foto--placeholder');\">";
    var kontrolCarousel = "";
    if (jumlahFoto > 1) {
      kontrolCarousel = '<button type="button" class="produk__panah produk__panah--kiri" data-carousel-prev aria-label="Foto sebelumnya">&lsaquo;</button>' + '<button type="button" class="produk__panah produk__panah--kanan" data-carousel-next aria-label="Foto berikutnya">&rsaquo;</button>' + '<div class="produk__dots" aria-hidden="true">' + daftarFoto.map(function(_, i) {
        return '<span class="produk__dot' + (i === 0 ? " is-aktif" : "") + '"></span>';
      }).join("") + "</div>";
    }
    var media = '<div class="produk__media" data-fotos="' + escapeHtml(JSON.stringify(daftarFoto)) + '" data-pos="0">' + imgTag + badgeStatus + kontrolCarousel + "</div>";
    return '<article class="produk' + (habis ? " produk--habis" : "") + '" ' + 'data-produk-index="' + index + '" tabindex="0" role="button" ' + 'aria-label="Lihat detail ' + escapeHtml(produk.nama) + '">' + media + '<div class="produk__isi">' + '<h3 class="produk__nama">' + escapeHtml(produk.nama) + "</h3>" + hargaHtml + catatan + '<a class="btn btn--accent btn--sm produk__cta" href="' + tautanWA(produk) + '" ' + 'target="_blank" rel="noopener" data-cta="whatsapp" data-cta-location="kartu-produk">' + "Chat WA</a>" + "</div>" + "</article>";
  }
  function gantiFotoKartu(mediaEl, arah) {
    var fotos;
    try {
      fotos = JSON.parse(mediaEl.getAttribute("data-fotos") || "[]");
    } catch (err) {
      return;
    }
    if (!fotos.length) return;
    var pos = Number(mediaEl.getAttribute("data-pos") || 0);
    pos = (pos + arah + fotos.length) % fotos.length;
    mediaEl.setAttribute("data-pos", pos);
    var img = mediaEl.querySelector(".produk__foto");
    if (img) img.src = fotos[pos];
    var dots = mediaEl.querySelectorAll(".produk__dot");
    dots.forEach(function(dot, i) {
      dot.classList.toggle("is-aktif", i === pos);
    });
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
  var detailState = {
    fotos: [],
    indexAktif: 0,
    elemenPemicu: null
  };
  function buatModalDetailJikaBelumAda() {
    var modalAda = document.getElementById("modalDetail");
    if (modalAda) return modalAda;
    var wadah = document.createElement("div");
    wadah.id = "modalDetail";
    wadah.className = "modal-detail";
    wadah.hidden = true;
    wadah.setAttribute("aria-hidden", "true");
    wadah.innerHTML = '<div class="modal-detail__overlay" data-detail-tutup></div>' + '<button type="button" class="modal-detail__tutup" data-detail-tutup aria-label="Tutup detail produk">&times;</button>' + '<div class="modal-detail__dialog" role="dialog" aria-modal="true" aria-label="Detail produk">' + '<div class="modal-detail__foto-wrap">' + '<img class="modal-detail__gambar" id="modalDetailGambar" src="" alt="">' + '<button type="button" class="modal-detail__panah modal-detail__panah--kiri" data-detail-prev aria-label="Foto sebelumnya">&lsaquo;</button>' + '<button type="button" class="modal-detail__panah modal-detail__panah--kanan" data-detail-next aria-label="Foto berikutnya">&rsaquo;</button>' + "</div>" + '<div class="modal-detail__thumbs" id="modalDetailThumbs"></div>' + '<div class="modal-detail__info">' + '<span class="produk__badge modal-detail__badge" id="modalDetailBadge"></span>' + '<h2 class="modal-detail__nama" id="modalDetailNama"></h2>' + '<p class="modal-detail__harga" id="modalDetailHarga"></p>' + '<p class="modal-detail__catatan" id="modalDetailCatatan"></p>' + '<a class="btn btn--accent" id="modalDetailCta" href="#" target="_blank" rel="noopener" ' + 'data-cta="whatsapp" data-cta-location="modal-detail">Chat WA</a>' + "</div>" + "</div>";
    document.body.appendChild(wadah);
    wadah.addEventListener("click", function(e) {
      if (e.target.closest("[data-detail-tutup]")) tutupDetail();
      if (e.target.closest("[data-detail-prev]")) gantiFotoDetail(-1);
      if (e.target.closest("[data-detail-next]")) gantiFotoDetail(1);
      var thumb = e.target.closest("[data-detail-thumb]");
      if (thumb) tampilkanFotoDetail(Number(thumb.getAttribute("data-detail-thumb")));
    });
    document.addEventListener("keydown", function(e) {
      if (wadah.hidden) return;
      if (e.key === "Escape") tutupDetail();
      if (e.key === "ArrowLeft") gantiFotoDetail(-1);
      if (e.key === "ArrowRight") gantiFotoDetail(1);
    });
    return wadah;
  }
  function tampilkanFotoDetail(index) {
    var total = detailState.fotos.length;
    if (!total) return;
    detailState.indexAktif = (index + total) % total;
    var gambar = document.getElementById("modalDetailGambar");
    if (gambar) {
      gambar.src = detailState.fotos[detailState.indexAktif];
      gambar.alt = "Foto produk " + (detailState.indexAktif + 1) + " dari " + total;
    }
    var panahKiri = document.querySelector("#modalDetail [data-detail-prev]");
    var panahKanan = document.querySelector("#modalDetail [data-detail-next]");
    var adaBanyakFoto = total > 1;
    if (panahKiri) panahKiri.hidden = !adaBanyakFoto;
    if (panahKanan) panahKanan.hidden = !adaBanyakFoto;
    var wadahThumbs = document.getElementById("modalDetailThumbs");
    if (wadahThumbs) {
      wadahThumbs.hidden = !adaBanyakFoto;
      wadahThumbs.innerHTML = !adaBanyakFoto ? "" : detailState.fotos.map(function(url, i) {
        return '<button type="button" class="modal-detail__thumb' + (i === detailState.indexAktif ? " is-aktif" : "") + '" data-detail-thumb="' + i + '" aria-label="Lihat foto ' + (i + 1) + '">' + '<img src="' + escapeHtml(url) + '" alt="" loading="lazy">' + "</button>";
      }).join("");
    }
  }
  function gantiFotoDetail(arah) {
    tampilkanFotoDetail(detailState.indexAktif + arah);
  }
  function bukaDetail(produk, elemenPemicu) {
    var modal = buatModalDetailJikaBelumAda();
    var daftarFoto = daftarFotoProduk(produk.foto);
    detailState.fotos = daftarFoto.length ? daftarFoto : [ PLACEHOLDER_IMG ];
    detailState.elemenPemicu = elemenPemicu || null;
    var statusKelas = kelasStatus(produk.status);
    var badge = document.getElementById("modalDetailBadge");
    if (badge) {
      badge.textContent = produk.status || "";
      badge.className = "produk__badge modal-detail__badge" + (statusKelas ? " " + statusKelas : "");
      badge.hidden = !produk.status;
    }
    var namaEl = document.getElementById("modalDetailNama");
    if (namaEl) namaEl.textContent = produk.nama;
    var hargaTeks = formatHarga(produk.harga);
    var hargaEl = document.getElementById("modalDetailHarga");
    if (hargaEl) {
      hargaEl.textContent = hargaTeks;
      hargaEl.hidden = !hargaTeks;
    }
    var catatanEl = document.getElementById("modalDetailCatatan");
    if (catatanEl) {
      catatanEl.textContent = produk.catatan || "";
      catatanEl.hidden = !produk.catatan;
    }
    var ctaEl = document.getElementById("modalDetailCta");
    if (ctaEl) ctaEl.href = tautanWA(produk);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("has-modal-detail");
    tampilkanFotoDetail(0);
    var tombolTutup = modal.querySelector(".modal-detail__tutup");
    if (tombolTutup) tombolTutup.focus();
  }
  function tutupDetail() {
    var modal = document.getElementById("modalDetail");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("has-modal-detail");
    if (detailState.elemenPemicu && typeof detailState.elemenPemicu.focus === "function") {
      detailState.elemenPemicu.focus();
    }
    detailState.elemenPemicu = null;
  }
  document.addEventListener("click", function(e) {
    var tombolPrev = e.target.closest("[data-carousel-prev]");
    var tombolNext = e.target.closest("[data-carousel-next]");
    if (tombolPrev || tombolNext) {
      var media = e.target.closest(".produk__media");
      if (media) gantiFotoKartu(media, tombolPrev ? -1 : 1);
      return;
    }
    if (e.target.closest(".produk__cta")) return;
    var kartu = e.target.closest(".produk[data-produk-index]");
    if (!kartu) return;
    var idx = Number(kartu.getAttribute("data-produk-index"));
    var produk = produkTertampil[idx];
    if (produk) bukaDetail(produk, kartu);
  });
  document.addEventListener("keydown", function(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (e.target.closest("[data-carousel-prev],[data-carousel-next],.produk__cta")) return;
    var kartu = e.target.closest(".produk[data-produk-index]");
    if (!kartu) return;
    e.preventDefault();
    var idx = Number(kartu.getAttribute("data-produk-index"));
    var produk = produkTertampil[idx];
    if (produk) bukaDetail(produk, kartu);
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
      renderGrid(wadahGrid, terpilih);
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
      renderGrid(wadahGrid, tampil);
      if (!modeSneakPeek) {
        pasangFilter(wadahFilter, wadahGrid, produk);
      }
    }).catch(function(err) {
      console.error("[Damas Cell] Gagal memuat katalog:", err);
      if (modeSneakPeek) {
        var sectionIndukErr = wadahGrid.closest("section");
        if (sectionIndukErr) sectionIndukErr.hidden = true;
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
