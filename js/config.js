/* =========================================================================
   DAMAS CELL — CONFIG.JS
   Satu-satunya file yang perlu kamu ubah untuk menyambungkan katalog
   ke Google Sheet. Tidak perlu menyentuh file lain.
   ========================================================================= */

window.DAMAS_CONFIG = {
  /* -----------------------------------------------------------------------
     URL Google Sheet katalog produk.

     CARA MENDAPATKAN URL INI (lihat juga README bagian "Setup Google Sheet"):
     1. Buka Google Sheet katalog kamu.
     2. Menu: File > Bagikan > Publikasikan ke web
     3. Di dropdown pertama, pilih sheet "Produk" (JANGAN "Seluruh Dokumen").
     4. Di dropdown kedua, pilih "Nilai yang dipisahkan koma (.csv)".
     5. Klik "Publikasikan", lalu salin URL yang muncul.
     6. Tempel URL itu di bawah ini, di antara tanda kutip.

     Selama masih kosong (''), halaman Katalog akan menampilkan pesan
     "katalog sedang disiapkan" + tombol WhatsApp, bukan error.
     ----------------------------------------------------------------------- */
  SHEET_CSV_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRCNzo7SQeplcpBEsU53gI_JYubzwBCMM9tv7u5qU65JBtG57rlwnySUyLpRdJO0IwpAqCgyeZahjHf/pub?gid=79967824&single=true&output=csv',

  /* Nomor WhatsApp tujuan semua tombol chat (tanpa tanda + dan tanpa spasi) */
  WHATSAPP_NUMBER: '6285640179995',

  /* Berapa produk yang tampil di bagian "Sneak Peek" halaman Home */
  SNEAK_PEEK_LIMIT: 6
};
