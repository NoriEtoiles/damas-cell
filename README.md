# Damas Cell — Website

Website katalog &amp; servis untuk **Damas Cell**, konter HP di Karanganom, Klaten.
Dibangun dengan HTML/CSS/JavaScript statis, mengikuti arsitektur Hybrid pada
`PRD_Damas_Cell_Website_v2.0.docx` (Bagian 7).

## Status

✅ Fase 1 — Struktur folder proyek
✅ Fase 2 — Layout statis Home (Nav, Hero, Layanan Unggulan, Footer)
⬜ Fase 3 — Integrasi katalog dinamis dari Google Sheet
⬜ Fase 4 — Embed Google Forms (Servis) & penyempurnaan Google Maps
⬜ Fase 5 — Isi konten produk riil
⬜ Fase 6 — QA & go-live

Halaman `katalog.html` dan `servis.html` saat ini masih berupa **placeholder**
(berisi CTA WhatsApp) sampai Fase 3 &amp; 4 selesai. Halaman `lokasi.html` sudah
diisi konten asli (alamat + peta) karena datanya sudah tersedia.

## Struktur Folder

```
damas-cell/
├── index.html        # Halaman Home
├── katalog.html       # Placeholder — akan diisi grid produk dari Google Sheet
├── servis.html         # Placeholder — akan diisi embed Google Form
├── lokasi.html          # Halaman lokasi (sudah lengkap: alamat + peta)
├── css/
│   └── style.css        # Semua styling — token warna/tipografi di bagian atas file
├── js/
│   └── main.js            # Toggle menu mobile + stub tracking klik WA
├── assets/
│   ├── logo-damas-cell.png
│   ├── icon-jual-beli-hp.png
│   ├── icon-aksesori-premium.png
│   ├── icon-servis-cepat.png
│   ├── icon-lokasi.png
│   ├── placeholder-foto-produk.png
│   ├── og-image.jpg          # Gambar preview saat link dibagikan (WA/sosmed)
│   ├── favicon.ico / favicon-32.png / apple-touch-icon.png / icon-512.png
└── README.md
```

## Menjalankan di Lokal

Situs ini murni statis (tanpa build step), jadi cukup buka `index.html`
langsung di browser, atau jalankan server lokal sederhana supaya path
relatif (`css/`, `js/`, `assets/`) selalu konsisten:

```bash
cd damas-cell
python3 -m http.server 8000
# lalu buka http://localhost:8000
```

## Deploy: GitHub → Vercel

1. Buat repository baru di GitHub (mis. `damas-cell-website`).
2. Push folder ini:
   ```bash
   cd damas-cell
   git init
   git add .
   git commit -m "Fase 1 & 2: struktur proyek + layout statis Home"
   git branch -M main
   git remote add origin <URL_REPO_GITHUB_ANDA>
   git push -u origin main
   ```
3. Buka [vercel.com](https://vercel.com), pilih **Add New Project**, import
   repository GitHub tadi. Karena proyek ini situs statis murni, Vercel akan
   otomatis mendeteksinya — tidak perlu build command khusus (kosongkan
   *Build Command*, set *Output Directory* ke `.`/root).
4. Setiap kali kamu `git push` ke branch `main`, Vercel otomatis re-deploy.

## Style Guide (token di `css/style.css`, bagian `:root`)

| Elemen | Nilai |
|---|---|
| Warna Primary | Biru Teknologi `#1B5E9E` |
| Warna Aksen/CTA | Hijau WhatsApp `#25D366` |
| Latar Belakang | Putih `#FFFFFF` / Abu-abu muda `#F8F9FA` |
| Teks Utama | `#212529` |
| Font Judul | Montserrat (600/700) |
| Font Paragraf | Open Sans (400/600) |

> Palet warna di atas sudah final (dikonfirmasi pemilik usaha) — tidak perlu
> dicocokkan lagi ke warna spanduk fisik toko.

## Data Toko (sudah dikonfirmasi pemilik usaha)

- **Alamat**: Jl. Desa Karanganom, Ngadirejo, Karanganom, Kec. Klaten Utara,
  Kabupaten Klaten, Jawa Tengah — dipakai konsisten di footer semua halaman,
  halaman Lokasi, embed Google Maps, dan data terstruktur `ElectronicsStore`
  di `index.html`.
- **Jam operasional**: Senin–Sabtu, 08.30–20.30.
- **Instagram**: <https://www.instagram.com/kios_podjok1298/>
- **Facebook**: <https://www.facebook.com/dick.dick.71066?locale=id_ID>
- **Warna brand**: tetap pakai `#1B5E9E` — pemilik usaha sudah setuju warna
  ini "yang penting terlihat bagus", jadi tidak perlu dicocokkan lagi ke
  spanduk fisik.

## Masih Perlu Ditindaklanjuti

- **Foto hero** — belum ada foto toko yang representatif (foto yang ada
  menonjolkan branding reseller OPPO, bukan Damas Cell). Untuk sementara,
  Hero pakai dua bidang warna biru brand dengan garis diagonal (bukan
  foto), mengambil gaya "spanduk toko". Setelah ada foto storefront asli
  Damas Cell, tinggal tambahkan satu baris `background-image` di kelas
  `.hero` pada `css/style.css` (sudah ada komentar penunjuknya).
- Logo IG/WA resmi sengaja tidak direplikasi di kode (hak cipta pihak
  ketiga) — tautan Instagram/Facebook di footer berupa teks biasa.

## Kontak Cepat

- WhatsApp: `wa.me/6285640179995`
- Alamat: Jl. Desa Karanganom, Ngadirejo, Karanganom, Kec. Klaten Utara,
  Kabupaten Klaten, Jawa Tengah
