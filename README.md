# Karsa Tiket (Tiketing Event)

Aplikasi manajemen tiket event komunitas kreatif berbasis Cloud Firestore dan React (Vite). Dibangun untuk mengelola master event, data pembeli, transaksi tiket, dan rekapitulasi penjualan serta kehadiran peserta.

## Fitur Utama

- **Event (Master Data):** Kelola nama acara, tanggal, lokasi, harga tiket, kuota kursi, dan pantau status sisa kuota.
- **Pembeli (Data Orang):** Pencatatan dan pencarian live pembeli tiket menggunakan nomor WhatsApp unik.
- **Tiket (Transaksi):** Pencatatan pesanan tiket, filter status (*Menunggu Bayar*, *Lunas*, *Hadir*, *Dibatalkan*), perubahan status pembayaran dan check-in kehadiran, serta pengembalian kuota otomatis jika pesanan dibatalkan.
- **Rekap:** Ringkasan metrik per event mencakup tiket terjual, sisa kuota, pendapatan bersih dari tiket lunas, dan peserta hadir.

## Teknologi

- **Frontend:** React 18, Vite, Vanilla CSS (Design System Responsif)
- **Database:** Google Cloud Firestore (Firebase Modular SDK)
- **Icons:** Lucide React

## Panduan Menjalankan

1. Salin `.env.example` ke `.env` dan isi kredensial Firebase Anda.
2. Pasang dependensi:
   ```bash
   npm install
   ```
3. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
4. Buka di browser pada `http://localhost:5173/`.
