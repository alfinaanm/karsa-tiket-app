// Initial sample data directly from Skema-Firestore-Karsa-Tiket.md
export const initialEvents = [
  {
    id: "Ev27dKm",
    nama: "Workshop Sablon Tote Bag",
    tanggal: "2026-10-18",
    lokasi: "Ruang Karsa, Jl. Merdeka No. 21",
    harga_tiket: 75000,
    kuota: 30,
    tiket_terjual: 2,
    dibuat_pada: "2026-10-01T08:00:00.000Z"
  },
  {
    id: "Ev91pQx",
    nama: "Intimate Concert Senja Akustik",
    tanggal: "2026-10-25",
    lokasi: "Karsa Amphitheater, Bandung",
    harga_tiket: 120000,
    kuota: 50,
    tiket_terjual: 15,
    dibuat_pada: "2026-10-02T10:00:00.000Z"
  },
  {
    id: "Ev33xLz",
    nama: "Diskusi Komik Indie & Zine Fest",
    tanggal: "2026-11-05",
    lokasi: "Ruang Kolaborasi Lantai 2",
    harga_tiket: 0,
    kuota: 40,
    tiket_terjual: 40,
    dibuat_pada: "2026-10-03T14:30:00.000Z"
  }
];

export const initialPembeli = [
  {
    id: "081355512345",
    nama: "Nadia Putri",
    no_whatsapp: "081355512345",
    email: "nadia.putri@contoh.id",
    dibuat_pada: "2026-10-01T08:30:00.000Z"
  },
  {
    id: "081299887766",
    nama: "Dimas Anggara",
    no_whatsapp: "081299887766",
    email: "dimas.anggara@email.com",
    dibuat_pada: "2026-10-02T09:15:00.000Z"
  },
  {
    id: "085711223344",
    nama: "Siti Rahmawati",
    no_whatsapp: "085711223344",
    email: "siti.rahma@domain.id",
    dibuat_pada: "2026-10-03T11:00:00.000Z"
  }
];

export const initialTiket = [
  {
    id: "Tk63fHs",
    event_id: "Ev27dKm",
    nama_event: "Workshop Sablon Tote Bag",
    tanggal_event: "2026-10-18",
    pembeli_id: "081355512345",
    nama_pembeli: "Nadia Putri",
    harga_tiket: 75000,
    jumlah_tiket: 2,
    total: 150000,
    status: "menunggu_bayar",
    dibuat_pada: "2026-10-01T09:15:00.000Z"
  },
  {
    id: "Tk88jKl",
    event_id: "Ev91pQx",
    nama_event: "Intimate Concert Senja Akustik",
    tanggal_event: "2026-10-25",
    pembeli_id: "081299887766",
    nama_pembeli: "Dimas Anggara",
    harga_tiket: 120000,
    jumlah_tiket: 1,
    total: 120000,
    status: "lunas",
    dibuat_pada: "2026-10-02T10:30:00.000Z"
  }
];
