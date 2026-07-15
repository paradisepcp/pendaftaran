/* ============================================================
 * APLIKASI    : Sistem Fee BP & PCP
 * MODUL       : Frontend - Login
 * FILE        : app.js
 * VERSION     : 0.0.2
 * DIPERBARUI  : 15 Juli 2026
 * HALAMAN     : Halaman Login
 * SPREADSHEET : - (lewat backend action 'login', 'daftarUsername')
 * ------------------------------------------------------------
 * ISI FILE INI:
 * - isiDropdownUsername() : ambil daftar username aktif dari backend,
 *   isi ke elemen <select id="username">
 * - toggleMataPassword()  : tukar tampilan password antara tersembunyi
 *   dan terlihat, ganti ikon mata
 * - pilihLokasi(lokasi)   : tandai tombol BP/PCP yang dipilih
 * - prosesLogin()         : kirim username/password/lokasi ke backend
 * - prosesLogout()        : hapus sesi, kembali ke form login
 * - cekSesiSaatBuka()     : cek sesi tersimpan saat halaman dibuka
 *
 * BOLEH DIEDIT BEBAS   : teks pesan error/sukses, ikon mata
 * HATI-HATI DIEDIT     : nama key localStorage ('sesiAktif')
 * ============================================================ */


let lokasiTerpilih = null;


// ------------------------------------------------------------
// BAGIAN: Isi Dropdown Username
// Dipanggil sekali saat halaman dibuka. Mengambil daftar username
// aktif dari backend (tanpa perlu login dulu) dan mengisi opsi
// dropdown. Ditampilkan nama crew supaya gampang dikenali, tapi
// value yang dikirim tetap username asli.
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
    // Kalau gagal ambil daftar (misal offline), biarkan dropdown
    // cuma ada opsi kosong — admin masih bisa coba lagi nanti.
    console.error('Gagal ambil daftar username:', err.message);
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Toggle Lihat/Sembunyikan Password
// Klik ikon mata untuk beralih antara password tersembunyi (titik)
// dan terlihat (teks biasa), supaya admin bisa cek ketikannya benar.
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
// BAGIAN: Tampilkan Dashboard (Placeholder)
// ------------------------------------------------------------
function tampilkanDashboard(data) {
  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('dashboardBox').style.display = 'block';
  document.getElementById('namaUserTampil').textContent = data.namaCrew;
  document.getElementById('lokasiTampil').textContent = data.lokasiKerja;
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Logout
// ------------------------------------------------------------
async function prosesLogout() {
  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');
  try {
    await panggilApi('logout', { token: sesi.token });
  } catch (err) {
    // Tidak masalah kalau gagal — tetap lanjut hapus sesi lokal.
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
 *            sesi di localStorage, cek sesi otomatis saat halaman
 *            dibuka, dan logout.
 *
 * VER 0.0.2  TAMBAH FITUR
 *            Username diubah dari input teks bebas jadi dropdown
 *            (isiDropdownUsername), ambil daftar dari backend supaya
 *            tidak ada typo username. Tambah toggleMataPassword()
 *            untuk lihat/sembunyikan ketikan password.
 * ============================================================ */