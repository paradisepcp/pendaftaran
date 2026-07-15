/* ============================================================
 * APLIKASI    : Sistem Fee BP & PCP
 * MODUL       : Frontend - Pendaftaran
 * FILE        : registration.js
 * VERSION     : 0.0.1
 * DIPERBARUI  : 15 Juli 2026
 * HALAMAN     : Halaman Pendaftaran / Dashboard Admin
 * SPREADSHEET : - (lewat backend action cekStiker, simpanPendaftaran,
 *                daftarPendaftaranHariIni, detailPendaftaran)
 * ------------------------------------------------------------
 * ISI FILE INI:
 * - cekNomorStiker()          : dipanggil saat field nomor stiker
 *   kehilangan fokus, cek apakah nomor sudah dipakai rombongan aktif
 * - tutupModalStiker(lanjut)  : tombol pada modal peringatan stiker
 * - prosesSimpanPendaftaran() : kumpulkan data form, kirim ke backend
 * - muatListboxAtas()         : ambil & tampilkan daftar hari ini
 * - lihatDetail(transactionId): buka modal detail satu transaksi
 * - tutupModalDetail()        : tutup modal detail
 * - kosongkanForm()           : reset semua field form
 *
 * BOLEH DIEDIT BEBAS   : teks pesan, urutan field di form
 * HATI-HATI DIEDIT     : nama field yang dikirim ke backend (nomorStiker,
 *                        nama, dst) harus sama persis dengan yang dibaca
 *                        simpanPendaftaran() di Transactions.gs
 *
 * CATATAN:
 * Klik baris listbox atas SAAT INI hanya menampilkan detail (read-only).
 * Fitur lanjutkan transaksi untuk isi BP/PCP & cetak menyusul di
 * langkah berikutnya (belum ada di file ini).
 * ============================================================ */


// ------------------------------------------------------------
// BAGIAN: Cek Nomor Stiker Duplikat
// Dipanggil saat admin selesai mengetik nomor stiker (blur).
// Kalau ada rombongan TERDAFTAR dengan nomor sama, tampilkan
// modal peringatan sebelum admin lanjut isi field lain.
// ------------------------------------------------------------
async function cekNomorStiker() {
  const nomor = document.getElementById('fNomorStiker').value;
  if (!nomor) return;

  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');

  try {
    const kandidat = await panggilApi('cekStiker', { token: sesi.token, nomorStiker: nomor });

    if (kandidat.length > 0) {
      const daftarAsal = kandidat.map(function (k) { return k.asal_rombongan; }).join(', ');
      document.getElementById('teksModalStiker').textContent =
        'Stiker ' + nomor + ' sedang dipakai rombongan dari: ' + daftarAsal +
        '. Tetap lanjutkan buat pendaftaran baru dengan nomor yang sama?';
      document.getElementById('modalStiker').style.display = 'flex';
    }
  } catch (err) {
    console.error('Gagal cek stiker:', err.message);
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Tutup Modal Peringatan Stiker
// Kalau admin pilih "Batal", kosongkan field nomor stiker supaya
// diisi ulang dengan nomor lain.
// ------------------------------------------------------------
function tutupModalStiker(lanjut) {
  document.getElementById('modalStiker').style.display = 'none';
  if (!lanjut) {
    document.getElementById('fNomorStiker').value = '';
    document.getElementById('fNomorStiker').focus();
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Proses Simpan Pendaftaran
// Kumpulkan semua nilai field, kirim ke backend action
// 'simpanPendaftaran'. Kalau berhasil, kosongkan form dan
// muat ulang listbox atas.
// ------------------------------------------------------------
async function prosesSimpanPendaftaran() {
  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');
  const pesan = document.getElementById('pesanPendaftaran');
  const btn = document.getElementById('btnSimpanPendaftaran');

  const data = {
    nomorStiker: document.getElementById('fNomorStiker').value,
    nomorMemberCsv: document.getElementById('fNomorMember').value,
    nama: document.getElementById('fNama').value,
    noHandphone: document.getElementById('fNoHandphone').value,
    biroPoAsosiasi: document.getElementById('fBiroPo').value,
    jenisArmada: document.getElementById('fJenisArmada').value,
    jumlahArmada: document.getElementById('fJumlahArmada').value,
    jumlahOrang: document.getElementById('fJumlahOrang').value,
    asalRombongan: document.getElementById('fAsalRombongan').value,
    freelance: document.getElementById('fFreelance').value
  };

  pesan.className = '';
  pesan.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const hasil = await panggilApi('simpanPendaftaran', { token: sesi.token, data: data });
    pesan.className = 'sukses';
    pesan.textContent = 'Tersimpan: ' + hasil.transactionId;
    kosongkanForm();
    muatListboxAtas();
  } catch (err) {
    pesan.className = 'error';
    pesan.textContent = err.message;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Simpan';
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Kosongkan Form
// ------------------------------------------------------------
function kosongkanForm() {
  ['fNomorStiker', 'fNomorMember', 'fNama', 'fNoHandphone', 'fBiroPo',
   'fJenisArmada', 'fJumlahOrang', 'fAsalRombongan', 'fFreelance'
  ].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('fJumlahArmada').value = 1;
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Muat Listbox Atas
// Ambil daftar rombongan TERDAFTAR hari ini dari backend,
// render jadi baris tabel. Tiap baris bisa diklik untuk lihat detail.
// ------------------------------------------------------------
async function muatListboxAtas() {
  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');
  const tbody = document.getElementById('isiTabelAtas');

  try {
    const daftar = await panggilApi('daftarPendaftaranHariIni', { token: sesi.token });

    if (daftar.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="kosong">Belum ada pendaftaran hari ini.</td></tr>';
      return;
    }

    tbody.innerHTML = daftar.map(function (row) {
      return '<tr onclick="lihatDetail(\'' + row.transactionId + '\')">' +
        '<td>' + row.transactionId.split('-')[1] + '</td>' +
        '<td>' + row.waktuDaftar + '</td>' +
        '<td>' + (row.nama || '') + '</td>' +
        '<td>' + (row.noMember || '') + '</td>' +
        '<td>' + (row.hp || '') + '</td>' +
        '<td>' + (row.armada || '') + '</td>' +
        '<td>' + (row.asal || '') + '</td>' +
        '<td>' + (row.lokasiDaftar || '') + '</td>' +
      '</tr>';
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="8" class="kosong">Gagal memuat: ' + err.message + '</td></tr>';
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Lihat Detail Transaksi
// Dipanggil saat baris listbox atas diklik. Menampilkan semua
// field dalam modal, read-only. Fitur "lanjutkan proses fee"
// belum ada di sini — menyusul.
// ------------------------------------------------------------
async function lihatDetail(transactionId) {
  const sesi = JSON.parse(localStorage.getItem('sesiAktif') || '{}');
  const isi = document.getElementById('isiModalDetail');
  isi.innerHTML = 'Memuat...';
  document.getElementById('modalDetail').style.display = 'flex';

  try {
    const d = await panggilApi('detailPendaftaran', { token: sesi.token, transactionId: transactionId });
    isi.innerHTML =
      '<p><b>ID:</b> ' + d.transaction_id + '</p>' +
      '<p><b>Nama:</b> ' + d.nama_agent + '</p>' +
      '<p><b>No Member:</b> ' + d.nomor_member_csv + '</p>' +
      '<p><b>HP:</b> ' + d.no_handphone + '</p>' +
      '<p><b>Biro/PO:</b> ' + d.biro_po_asosiasi + '</p>' +
      '<p><b>Armada:</b> ' + d.jenis_armada + ' (' + d.jumlah_armada + ')</p>' +
      '<p><b>Asal:</b> ' + d.asal_rombongan + '</p>' +
      '<p><b>Freelance:</b> ' + (d.freelance || '-') + '</p>' +
      '<p><b>Lokasi Daftar:</b> ' + d.lokasi_daftar + '</p>' +
      '<p class="catatan-kecil">Isi BP/PCP & proses selesai menyusul di langkah berikutnya.</p>';
  } catch (err) {
    isi.innerHTML = 'Gagal memuat detail: ' + err.message;
  }
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ------------------------------------------------------------
// BAGIAN: Tutup Modal Detail
// ------------------------------------------------------------
function tutupModalDetail() {
  document.getElementById('modalDetail').style.display = 'none';
}
// ------------------------------------------------------------
// BAGIAN INI SELESAI
// ------------------------------------------------------------


// ==================== END FILE CODE ====================

/* ============================================================
 * DEBUG MODE / RIWAYAT PERUBAHAN
 * ------------------------------------------------------------
 * VER 0.0.1  MASTER
 *            Versi awal. Form pendaftaran, cek stiker duplikat
 *            (modal peringatan), simpan, listbox atas, modal detail
 *            read-only saat baris diklik.
 * ============================================================ */
