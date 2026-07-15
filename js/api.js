/* ============================================================
 * APLIKASI    : Sistem Fee BP & PCP
 * MODUL       : Frontend - Komunikasi API
 * FILE        : api.js
 * VERSION     : 0.0.1
 * DIPERBARUI  : 15 Juli 2026
 * HALAMAN     : - (dipakai semua halaman frontend)
 * SPREADSHEET : - (tidak langsung, lewat backend)
 * ------------------------------------------------------------
 * ISI FILE INI:
 * - URL_BACKEND      : link .../exec Apps Script kamu — GANTI DI SINI
 * - panggilApi(action, payload) : fungsi utama, kirim request ke
 *   backend dan kembalikan hasil (Promise)
 *
 * BOLEH DIEDIT BEBAS   : URL_BACKEND kalau deploy ulang dapat link baru
 * HATI-HATI DIEDIT     : Content-Type HARUS 'text/plain', jangan
 *                        diubah jadi 'application/json' — akan
 *                        kena masalah CORS preflight dan gagal total
 * ============================================================ */


// ------------------------------------------------------------
// BAGIAN: Konfigurasi URL Backend
// GANTI link ini kalau kamu deploy ulang Apps Script dan
// mendapat link .../exec yang baru.
// ------------------------------------------------------------
const URL_BACKEND = 'https://script.google.com/macros/s/AKfycbww4MRFPLhm63J4QQgXcw7Yzyy_wHLUmmW6w-rwq-T31WW2XPt5Kd6nsiBCjol6XyEs/exec';
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Fungsi Utama Panggil API
// Kode ini menangani semua komunikasi ke backend. Pakai
// Content-Type text/plain supaya tidak kena CORS preflight
// (lihat penjelasan di header file).
// ------------------------------------------------------------
async function panggilApi(action, payload) {
  try {
    const response = await fetch(URL_BACKEND, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, payload: payload || {} })
    });

    const hasil = await response.json();

    if (!hasil.success) {
      throw new Error(hasil.error || 'Terjadi kesalahan tidak diketahui.');
    }

    return hasil.data;
  } catch (err) {
    // Kalau gagal total (misal offline), lempar error supaya
    // pemanggil (app.js) bisa tangani, misal simpan ke antrean offline.
    throw err;
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ==================== END FILE CODE ====================

/* ============================================================
 * DEBUG MODE / RIWAYAT PERUBAHAN
 * ------------------------------------------------------------
 * VER 0.0.1  MASTER
 *            Versi awal. Fungsi panggilApi() dengan trik text/plain
 *            untuk menghindari CORS preflight ke Apps Script.
 * ============================================================ */