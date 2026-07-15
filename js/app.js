/* ============================================================
 * APLIKASI    : Sistem Fee BP & PCP
 * MODUL       : Frontend - Login
 * FILE        : app.js
 * VERSION     : 0.0.3
 * DIPERBARUI  : 15 Juli 2026
 * HALAMAN     : Halaman Login & Header Dashboard
 * SPREADSHEET : - (lewat backend action 'login', 'daftarUsername')
 * ------------------------------------------------------------
 * ISI FILE INI:
 * - isiDropdownUsername() : ambil daftar username aktif dari backend
 * - toggleMataPassword()  : tukar tampilan password
 * - pilihLokasi(lokasi)   : tandai tombol BP/PCP yang dipilih
 * - prosesLogin()         : kirim ke backend, simpan sesi
 * - prosesLogout()        : hapus sesi
 * - cekSesiSaatBuka()     : cek sesi tersimpan saat halaman dibuka
 * - mulaiJamBerjalan()    : update jam di pojok kanan atas tiap detik
 *
 * BOLEH DIEDIT BEBAS   : format tampilan jam
 * HATI-HATI DIEDIT     : nama key localStorage ('sesiAktif')
 * ============================================================ */


let lokasiTerpilih = null;
let intervalJam = null; // simpan referensi interval supaya bisa dihentikan saat logout


// ------------------------------------------------------------
// BAGIAN: Isi Dropdown Username
// ------------------------------------------------------------
async function isiDropdownUsername() {
  const select = document.getElementById('username');
  try {
    const daftar = await panggilApi('daftarUsername', {});
    daftar.forEach(function (u) {
      const opsi = document.createElement('option');
      opsi.value = u.username;
      opsi.textContent = u.namaCrew + ' (' + u.username + ')';
      select.appendChild(opsi);
    });
  } catch (err) {
    console.error('Gagal ambil daftar username:', err.message);
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Toggle Lihat/Sembunyikan Password
// ------------------------------------------------------------
function toggleMataPassword() {
  const input = document.getElementById('password');
  const btn = document.getElementById('btnToggleMata');

  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Pilih Lokasi Kerja
// ------------------------------------------------------------
function pilihLokasi(lokasi) {
  lokasiTerpilih = lokasi;
  document.querySelectorAll('.btn-lokasi').forEach(function (btn) {
    btn.classList.toggle('aktif', btn.dataset.lokasi === lokasi);
  });
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Proses Login
// ------------------------------------------------------------
async function prosesLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const pesan = document.getElementById('pesanLogin');
  const btn = document.getElementById('btnLogin');

  pesan.textContent = '';

  if (!username) {
    pesan.textContent = 'Pilih username dulu.';
    return;
  }
  if (!password) {
    pesan.textContent = 'Password wajib diisi.';
    return;
  }
  if (!lokasiTerpilih) {
    pesan.textContent = 'Pilih lokasi kerja BP atau PCP dulu.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Masuk...';

  try {
    const data = await panggilApi('login', {
      username: username,
      password: password,
      lokasiKerja: lokasiTerpilih
    });

    localStorage.setItem('sesiAktif', JSON.stringify(data));
    tampilkanDashboard(data);
  } catch (err) {
    pesan.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Masuk';
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Tampilkan Dashboard
// Setelah tampilkan info user, langsung nyalakan jam berjalan.
// ------------------------------------------------------------
function tampilkanDashboard(data) {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboardBox').style.display = 'block';
  document.getElementById('namaUserTampil').textContent = data.namaCrew;
  document.getElementById('lokasiTampil').textContent = data.lokasiKerja;
  mulaiJamBerjalan();
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Jam Berjalan
// Menampilkan tanggal + jam + menit + detik saat ini di pojok
// kanan atas, update tiap detik. Pakai zona waktu Asia/Jakarta
// supaya konsisten dengan data yang disimpan di backend, meskipun
// device admin di-set zona waktu lain.
// ------------------------------------------------------------
function mulaiJamBerjalan() {
  const elemen = document.getElementById('jamBerjalan');

  function update() {
    const sekarang = new Date();
    const teks = sekarang.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    elemen.textContent = teks;
  }

  update(); // langsung tampil, tidak nunggu 1 detik pertama
  if (intervalJam) clearInterval(intervalJam); // cegah dobel interval kalau dipanggil ulang
  intervalJam = setInterval(update, 1000);
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Logout
// Hentikan interval jam supaya tidak jalan terus di background
// setelah kembali ke halaman login.
// ------------------------------------------------------------
async function prosesLogout() {
  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');
  try {
    await panggilApi('logout', { token: sesi.token });
  } catch (err) {
    // Tidak masalah kalau gagal — tetap lanjut hapus sesi lokal.
  }

  if (intervalJam) {
    clearInterval(intervalJam);
    intervalJam = null;
  }

  localStorage.removeItem('sesiAktif');
  document.getElementById('dashboardBox').style.display = 'none';
  document.getElementById('loginBox').style.display = 'block';
  document.getElementById('password').value = '';
  lokasiTerpilih = null;
  document.querySelectorAll('.btn-lokasi').forEach(function (btn) {
    btn.classList.remove('aktif');
  });
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Cek Sesi Saat Halaman Dibuka
// ------------------------------------------------------------
async function cekSesiSaatBuka() {
  const raw = localStorage.getItem('sesiAktif');
  if (!raw) return;

  const sesi = JSON.parse(raw);
  try {
    await panggilApi('validateSession', { token: sesi.token });
    tampilkanDashboard(sesi);
  } catch (err) {
    localStorage.removeItem('sesiAktif');
  }
}


// ------------------------------------------------------------
// BAGIAN: Inisialisasi Saat Halaman Dimuat
// ------------------------------------------------------------
isiDropdownUsername();
cekSesiSaatBuka();
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ==================== END FILE CODE ====================

/* ============================================================
 * DEBUG MODE / RIWAYAT PERUBAHAN
 * ------------------------------------------------------------
 * VER 0.0.1  MASTER
 *            Versi awal. Login dengan pilihan lokasi BP/PCP, simpan
 *            sesi di localStorage, cek sesi otomatis, logout.
 *
 * VER 0.0.2  TAMBAH FITUR
 *            Username jadi dropdown, tambah toggleMataPassword().
 *
 * VER 0.0.3  TAMBAH FITUR
 *            Tambah mulaiJamBerjalan() — jam+tanggal real-time di
 *            pojok kanan atas dashboard, update tiap detik, pakai
 *            zona waktu Asia/Jakarta. Interval dihentikan otomatis
 *            saat logout supaya tidak jalan terus di background.
 * ============================================================ */
