# Lembar Uji Mandiri: Karsa Tiket (Tiketing Event)

**Tugas Mandiri Sesi 3 · Pengujian Firestore Security Rules & Validasi Formulir**

## **Identitas**

| Keterangan | Isian |
| :--- | :--- |
| Nama Aplikasi | Karsa Tiket (Tiketing Event) |
| Basis Data | Cloud Firestore (`asia-southeast2` - Jakarta) |
| Project ID Firebase | `karsa-tiket-app` |
| Repository GitHub | [https://github.com/alfinaanm/karsa-tiket-app](https://github.com/alfinaanm/karsa-tiket-app) |
| Dokumen Rujukan | PRD-Karsa-Tiket.md & Skema-Firestore-Karsa-Tiket.md |

---

## **A. Pemeriksaan Tiga Invariant Data**

| No | Invariant | Aturan & Dampak Jika Dilanggar | Ditegakkan Pada | Hasil Uji |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `harga_tiket >= 0` dan `tiket_terjual <= kuota` | Mencegah uang masuk negatif dan penjualan melebihi kapasitas ruangan *(overselling)* | UI Form Event & Security Rules `isValidEvent()` | **LULUS** (Input minus atau kuota < terjual ditolak) |
| 2 | `jumlah_tiket` 1 s.d. 5 dan `<= sisa_kuota` | Mencegah pesanan tiket fiktif (0 tiket) atau pemborongan tiket berlebihan | UI Form Tiket & Security Rules `isValidTiket()` | **LULUS** (Jumlah di luar 1–5 atau > sisa kuota ditolak) |
| 3 | `total == harga_tiket * jumlah_tiket` | Mencegah selisih pencatatan uang masuk dan rekapitulasi keuangan kas | Otomatisasi UI & Security Rules `isValidTiket()` | **LULUS** (Total dihitung otomatis & diverifikasi rules) |

---

## **B. Uji Tembus Enam Masukan Tidak Sah (Security Rules & UI)**

Pengujian dilakukan untuk membuktikan bahwa data tidak sah berhasil dicegat pada dua lapisan: **lapisan UI (Form Validation)** dan **lapisan basis data (Cloud Firestore Security Rules)** jika terjadi bypass script console browser.

| No | Kategori Masukan Tidak Sah | Contoh Masukan yang Diuji | Respon Validasi Formulir UI | Respon Cloud Firestore Security Rules | Status Uji |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Field Kosong** | `nama: ""` pada event, atau `lokasi: ""` | Ditolak oleh form: *"Nama acara wajib diisi (1-60 karakter)"* | Ditolak rules: `data.nama.trim().size() >= 1` (`PERMISSION_DENIED`) | **LULUS** |
| **2** | **Tipe Salah** | `harga_tiket: "gratis"` (string bukan number) | Ditolak oleh form: *"Harga tiket minimal 0 dan harus berupa angka bulat"* | Ditolak rules: `data.harga_tiket is int` (`PERMISSION_DENIED`) | **LULUS** |
| **3** | **Teks Terlalu Panjang** | `nama` event > 60 karakter, atau `email` > 80 karakter | Dicegah oleh `maxLength="60"` dan pesan peringatan batas karakter | Ditolak rules: `data.nama.size() <= 60` & `data.email.size() <= 80` (`PERMISSION_DENIED`) | **LULUS** |
| **4** | **Nilai Negatif** | `harga_tiket: -50000`, atau `kuota: -10` | Ditolak oleh form: *"Harga tiket tidak boleh negatif"* | Ditolak rules: `data.harga_tiket >= 0 && data.kuota >= 1` (`PERMISSION_DENIED`) | **LULUS** |
| **5** | **Nilai di Luar Batas** | `jumlah_tiket: 0` atau `jumlah_tiket: 7` (batas 1–5), `kuota: 600` (batas 1–500) | Ditolak oleh form: *"Jumlah tiket harus 1 sampai 5"* dan *"Kuota antara 1 sampai 500"* | Ditolak rules: `data.jumlah_tiket in [1..5]` & `data.kuota in [1..500]` (`PERMISSION_DENIED`) | **LULUS** |
| **6** | **Perubahan Status Tidak Sah** | Mengubah tiket langsung dari `menunggu_bayar` melompat ke `hadir`, atau dari `dibatalkan` ke `lunas` | UI hanya menampilkan tombol transisi yang sah (*Konfirmasi Lunas* / *Batalkan*) | Ditolak rules: `isValidStatusTransition()` melarang loncatan status (`PERMISSION_DENIED`) | **LULUS** |

---

## **C. Kesimpulan Hasil Pengujian**
1. Seluruh acceptance criteria pada PRD Bagian 5 telah diimplementasikan dengan validasi formulir yang komprehensif.
2. Aturan keamanan pada [firestore.rules](file:///D:/bootcamp/karsa-tiket-app/firestore.rules) telah mengadopsi pola helper function Dapur Nia dan berhasil menjaga integritas ketiga koleksi (`event`, `pembeli`, `tiket`).
3. Konsistensi kuota terjaga: saat pesanan dibuat tiket terjual bertambah, dan saat pesanan dibatalkan tiket terjual berkurang serta kuota dikembalikan ke event.
