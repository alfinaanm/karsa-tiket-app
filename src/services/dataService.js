import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  increment,
  serverTimestamp
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { initialEvents, initialPembeli, initialTiket } from "./initialData";

const STORAGE_KEYS = {
  EVENTS: "karsa_events",
  PEMBELI: "karsa_pembeli",
  TIKET: "karsa_tiket"
};

// Helper: Normalize Firestore document timestamps to standard ISO string
function normalizeDoc(d) {
  const data = d.data();
  let dibuat = data.dibuat_pada;
  if (dibuat && typeof dibuat.toDate === "function") {
    dibuat = dibuat.toDate().toISOString();
  }
  return {
    id: d.id,
    ...data,
    dibuat_pada: dibuat
  };
}

// Local storage fallback helpers (used only when Firebase is unconfigured)
function getLocal(key, defaultData) {
  const saved = localStorage.getItem(key);
  if (!saved) {
    localStorage.setItem(key, JSON.stringify(defaultData));
    return defaultData;
  }
  try {
    return JSON.parse(saved);
  } catch {
    return defaultData;
  }
}

function setLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// =============================================================
// 1. MODUL EVENT (DATA MASTER)
// =============================================================

export async function getEvents() {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "event"), orderBy("tanggal"), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(normalizeDoc);
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  return [...events].sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""));
}

export async function addEvent(data) {
  const { nama, tanggal, lokasi, harga_tiket, kuota } = data;

  // Validasi PRD & Skema
  if (!nama || nama.trim().length < 1 || nama.length > 60) {
    throw new Error("Nama acara harus 1 sampai 60 karakter.");
  }
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    throw new Error("Tanggal acara harus berformat YYYY-MM-DD.");
  }
  if (!lokasi || lokasi.trim().length < 1 || lokasi.length > 100) {
    throw new Error("Lokasi acara harus 1 sampai 100 karakter.");
  }
  const hargaNum = Number(harga_tiket);
  if (isNaN(hargaNum) || hargaNum < 0 || !Number.isInteger(hargaNum)) {
    throw new Error("Harga tiket minimal 0 dan berupa angka bulat.");
  }
  const kuotaNum = Number(kuota);
  if (isNaN(kuotaNum) || kuotaNum < 1 || kuotaNum > 500 || !Number.isInteger(kuotaNum)) {
    throw new Error("Kuota kursi harus berupa angka bulat antara 1 sampai 500.");
  }

  const payload = {
    nama: nama.trim(),
    tanggal,
    lokasi: lokasi.trim(),
    harga_tiket: hargaNum,
    kuota: kuotaNum,
    tiket_terjual: 0
  };

  if (isFirebaseConfigured && db) {
    const docRef = await addDoc(collection(db, "event"), {
      ...payload,
      dibuat_pada: serverTimestamp()
    });
    return { id: docRef.id, ...payload, dibuat_pada: new Date().toISOString() };
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const newEvent = {
    id: "Ev" + Math.random().toString(36).substring(2, 7),
    ...payload,
    dibuat_pada: new Date().toISOString()
  };
  events.push(newEvent);
  setLocal(STORAGE_KEYS.EVENTS, events);
  return newEvent;
}

export async function updateEvent(id, data) {
  const { nama, tanggal, lokasi, harga_tiket, kuota } = data;
  const hargaNum = Number(harga_tiket);
  const kuotaNum = Number(kuota);

  if (!nama || nama.trim().length < 1 || nama.length > 60) {
    throw new Error("Nama acara harus 1 sampai 60 karakter.");
  }
  if (!tanggal || !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) {
    throw new Error("Tanggal acara harus berformat YYYY-MM-DD.");
  }
  if (!lokasi || lokasi.trim().length < 1 || lokasi.length > 100) {
    throw new Error("Lokasi acara harus 1 sampai 100 karakter.");
  }
  if (isNaN(hargaNum) || hargaNum < 0 || !Number.isInteger(hargaNum)) {
    throw new Error("Harga tiket tidak boleh negatif.");
  }
  if (isNaN(kuotaNum) || kuotaNum < 1 || kuotaNum > 500) {
    throw new Error("Kuota harus antara 1 sampai 500.");
  }

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, "event", id);
    const currentDoc = await getDoc(docRef);
    if (!currentDoc.exists()) {
      throw new Error("Event tidak ditemukan di Firestore.");
    }
    const currentData = currentDoc.data();
    if (kuotaNum < (currentData.tiket_terjual || 0)) {
      throw new Error("Kuota tidak boleh lebih kecil dari tiket yang sudah terjual.");
    }

    await updateDoc(docRef, {
      nama: nama.trim(),
      tanggal,
      lokasi: lokasi.trim(),
      harga_tiket: hargaNum,
      kuota: kuotaNum
    });
    return { id, nama: nama.trim(), tanggal, lokasi: lokasi.trim(), harga_tiket: hargaNum, kuota: kuotaNum };
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const idx = events.findIndex(e => e.id === id);
  if (idx === -1) throw new Error("Event tidak ditemukan.");

  if (kuotaNum < (events[idx].tiket_terjual || 0)) {
    throw new Error("Kuota tidak boleh lebih kecil dari tiket yang sudah terjual.");
  }

  events[idx] = {
    ...events[idx],
    nama: nama.trim(),
    tanggal,
    lokasi: lokasi.trim(),
    harga_tiket: hargaNum,
    kuota: kuotaNum
  };
  setLocal(STORAGE_KEYS.EVENTS, events);
  return events[idx];
}

export async function deleteEvent(id) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "event", id));
    return true;
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const filtered = events.filter(e => e.id !== id);
  setLocal(STORAGE_KEYS.EVENTS, filtered);
  return true;
}

// =============================================================
// 2. MODUL PEMBELI (DATA ORANG)
// =============================================================

export async function getPembeli(searchQuery = "") {
  let list = [];
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "pembeli"), orderBy("nama"), limit(50));
    const snap = await getDocs(q);
    list = snap.docs.map(normalizeDoc);
  } else {
    list = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  }

  if (searchQuery.trim()) {
    const qStr = searchQuery.toLowerCase().trim();
    list = list.filter(
      p =>
        (p.nama && p.nama.toLowerCase().includes(qStr)) ||
        (p.no_whatsapp && p.no_whatsapp.includes(qStr))
    );
  }
  return list;
}

export async function addPembeli(data) {
  const { nama, no_whatsapp, email } = data;

  if (!nama || nama.trim().length < 1 || nama.length > 60) {
    throw new Error("Nama pembeli harus 1 sampai 60 karakter.");
  }
  const cleanPhone = (no_whatsapp || "").trim();
  if (!cleanPhone.startsWith("08") || cleanPhone.length < 10 || cleanPhone.length > 13 || !/^\d+$/.test(cleanPhone)) {
    throw new Error("Nomor WhatsApp harus diawali 08 dan memiliki panjang 10 sampai 13 angka.");
  }
  if (!email || !email.includes("@") || email.length > 80) {
    throw new Error("Email tidak sah (harus mengandung tanda @ dan maksimal 80 karakter).");
  }

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, "pembeli", cleanPhone);
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      throw new Error("Nomor WhatsApp sudah terdaftar.");
    }
    const payload = {
      nama: nama.trim(),
      no_whatsapp: cleanPhone,
      email: email.trim(),
      dibuat_pada: serverTimestamp()
    };
    await setDoc(docRef, payload);
    return { id: cleanPhone, ...payload, dibuat_pada: new Date().toISOString() };
  }

  const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  if (buyers.some(b => b.no_whatsapp === cleanPhone || b.id === cleanPhone)) {
    throw new Error("Nomor WhatsApp sudah terdaftar.");
  }

  const newBuyer = {
    id: cleanPhone,
    nama: nama.trim(),
    no_whatsapp: cleanPhone,
    email: email.trim(),
    dibuat_pada: new Date().toISOString()
  };
  buyers.push(newBuyer);
  setLocal(STORAGE_KEYS.PEMBELI, buyers);
  return newBuyer;
}

export async function updatePembeli(id, data) {
  const { nama, email } = data;
  if (!nama || nama.trim().length < 1 || nama.length > 60) {
    throw new Error("Nama pembeli harus 1 sampai 60 karakter.");
  }
  if (!email || !email.includes("@") || email.length > 80) {
    throw new Error("Email tidak sah (harus mengandung @ dan maksimal 80 karakter).");
  }

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, "pembeli", id);
    await updateDoc(docRef, {
      nama: nama.trim(),
      email: email.trim()
    });
    return { id, nama: nama.trim(), email: email.trim() };
  }

  const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  const idx = buyers.findIndex(b => b.id === id);
  if (idx === -1) throw new Error("Pembeli tidak ditemukan.");

  buyers[idx] = {
    ...buyers[idx],
    nama: nama.trim(),
    email: email.trim()
  };
  setLocal(STORAGE_KEYS.PEMBELI, buyers);
  return buyers[idx];
}

export async function deletePembeli(id) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "pembeli", id));
    return true;
  }

  const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  const filtered = buyers.filter(b => b.id !== id);
  setLocal(STORAGE_KEYS.PEMBELI, filtered);
  return true;
}

// =============================================================
// 3. MODUL TIKET (DATA TRANSAKSI)
// =============================================================

export async function getTiket(statusFilter = "Semua") {
  let list = [];
  if (isFirebaseConfigured && db) {
    let q;
    if (statusFilter && statusFilter !== "Semua") {
      q = query(collection(db, "tiket"), where("status", "==", statusFilter), limit(50));
    } else {
      q = query(collection(db, "tiket"), limit(50));
    }
    const snap = await getDocs(q);
    list = snap.docs.map(normalizeDoc);
    // Urutkan tanggal pembuatan terbaru secara in-memory
    return list.sort((a, b) => new Date(b.dibuat_pada || 0) - new Date(a.dibuat_pada || 0));
  }

  list = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  if (statusFilter && statusFilter !== "Semua") {
    list = list.filter(t => t.status === statusFilter);
  }
  return [...list].sort((a, b) => new Date(b.dibuat_pada || 0) - new Date(a.dibuat_pada || 0));
}

export async function addTiket({ event_id, pembeli_id, jumlah_tiket }) {
  const qty = Number(jumlah_tiket);
  if (isNaN(qty) || qty < 1 || qty > 5 || !Number.isInteger(qty)) {
    throw new Error("Jumlah tiket harus angka bulat antara 1 sampai 5.");
  }

  if (isFirebaseConfigured && db) {
    // 1. Ambil dokumen event
    const evDoc = await getDoc(doc(db, "event", event_id));
    if (!evDoc.exists()) throw new Error("Event tidak ditemukan di database.");
    const selectedEvent = { id: evDoc.id, ...evDoc.data() };

    // 2. Ambil dokumen pembeli
    const pbDoc = await getDoc(doc(db, "pembeli", pembeli_id));
    if (!pbDoc.exists()) throw new Error("Pembeli tidak ditemukan di database.");
    const selectedPembeli = { id: pbDoc.id, ...pbDoc.data() };

    // 3. Validasi sisa kuota
    const sisaKuota = selectedEvent.kuota - (selectedEvent.tiket_terjual || 0);
    if (qty > sisaKuota) {
      throw new Error(`Jumlah tiket melebihi sisa kuota yang tersedia (${sisaKuota} kursi).`);
    }

    // 4. HITUNG OTOMATIS: total = harga_tiket * jumlah_tiket
    const total = selectedEvent.harga_tiket * qty;

    // 5. SALINAN DATA DENORMALISASI (nama event, tanggal, nama pembeli, harga tiket)
    const payload = {
      event_id: selectedEvent.id,
      nama_event: selectedEvent.nama,
      tanggal_event: selectedEvent.tanggal,
      pembeli_id: selectedPembeli.no_whatsapp || selectedPembeli.id,
      nama_pembeli: selectedPembeli.nama,
      harga_tiket: selectedEvent.harga_tiket,
      jumlah_tiket: qty,
      total: total,
      status: "menunggu_bayar"
    };

    // 6. Simpan transaksi tiket baru ke Firestore
    const docRef = await addDoc(collection(db, "tiket"), {
      ...payload,
      dibuat_pada: serverTimestamp()
    });

    // 7. Mutasi otomatis kuota event (tiket_terjual bertambah)
    await updateDoc(doc(db, "event", selectedEvent.id), {
      tiket_terjual: increment(qty)
    });

    return { id: docRef.id, ...payload, dibuat_pada: new Date().toISOString() };
  }

  // Fallback lokal jika Firebase belum diatur
  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const selectedEvent = events.find(e => e.id === event_id);
  if (!selectedEvent) throw new Error("Event tidak ditemukan.");

  const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  const selectedPembeli = buyers.find(b => b.id === pembeli_id || b.no_whatsapp === pembeli_id);
  if (!selectedPembeli) throw new Error("Pembeli tidak ditemukan.");

  const sisaKuota = selectedEvent.kuota - (selectedEvent.tiket_terjual || 0);
  if (qty > sisaKuota) {
    throw new Error(`Jumlah tiket melebihi sisa kuota yang tersedia (${sisaKuota} kursi).`);
  }

  const total = selectedEvent.harga_tiket * qty;
  const payload = {
    event_id: selectedEvent.id,
    nama_event: selectedEvent.nama,
    tanggal_event: selectedEvent.tanggal,
    pembeli_id: selectedPembeli.no_whatsapp || selectedPembeli.id,
    nama_pembeli: selectedPembeli.nama,
    harga_tiket: selectedEvent.harga_tiket,
    jumlah_tiket: qty,
    total: total,
    status: "menunggu_bayar"
  };

  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const newTicket = {
    id: "Tk" + Math.random().toString(36).substring(2, 7),
    ...payload,
    dibuat_pada: new Date().toISOString()
  };
  tickets.unshift(newTicket);
  setLocal(STORAGE_KEYS.TIKET, tickets);

  const evIdx = events.findIndex(e => e.id === selectedEvent.id);
  if (evIdx !== -1) {
    events[evIdx].tiket_terjual = (events[evIdx].tiket_terjual || 0) + qty;
    setLocal(STORAGE_KEYS.EVENTS, events);
  }

  return newTicket;
}

export async function updateTiketStatus(tiketId, newStatus) {
  if (isFirebaseConfigured && db) {
    const tSnap = await getDoc(doc(db, "tiket", tiketId));
    if (!tSnap.exists()) throw new Error("Tiket tidak ditemukan di Firestore.");
    const currentTiket = { id: tSnap.id, ...tSnap.data() };

    const allowedTransitions = {
      menunggu_bayar: ["lunas", "dibatalkan"],
      lunas: ["hadir"],
      hadir: [],
      dibatalkan: []
    };

    const validNext = allowedTransitions[currentTiket.status] || [];
    if (!validNext.includes(newStatus)) {
      throw new Error(
        `Status tidak sah. Status "${currentTiket.status}" hanya boleh diubah ke: ${
          validNext.length > 0 ? validNext.join(" atau ") : "tidak ada (status akhir)"
        }.`
      );
    }

    const isCancelling = newStatus === "dibatalkan" && currentTiket.status !== "dibatalkan";

    // 1. Update status tiket
    await updateDoc(doc(db, "tiket", tiketId), { status: newStatus });

    // 2. Jika pembatalan, kembalikan kuota acara (tiket_terjual berkurang)
    if (isCancelling) {
      await updateDoc(doc(db, "event", currentTiket.event_id), {
        tiket_terjual: increment(-currentTiket.jumlah_tiket)
      });
    }

    return { ...currentTiket, status: newStatus };
  }

  // Fallback lokal
  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const tIdx = tickets.findIndex(t => t.id === tiketId);
  if (tIdx === -1) throw new Error("Tiket tidak ditemukan.");

  const currentTiket = tickets[tIdx];
  const allowedTransitions = {
    menunggu_bayar: ["lunas", "dibatalkan"],
    lunas: ["hadir"],
    hadir: [],
    dibatalkan: []
  };
  const validNext = allowedTransitions[currentTiket.status] || [];
  if (!validNext.includes(newStatus)) {
    throw new Error(
      `Status tidak sah. Status "${currentTiket.status}" hanya boleh diubah ke: ${
        validNext.length > 0 ? validNext.join(" atau ") : "tidak ada"
      }.`
    );
  }

  const isCancelling = newStatus === "dibatalkan" && currentTiket.status !== "dibatalkan";
  tickets[tIdx].status = newStatus;
  setLocal(STORAGE_KEYS.TIKET, tickets);

  if (isCancelling) {
    const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
    const evIdx = events.findIndex(e => e.id === currentTiket.event_id);
    if (evIdx !== -1) {
      events[evIdx].tiket_terjual = Math.max(0, (events[evIdx].tiket_terjual || 0) - currentTiket.jumlah_tiket);
      setLocal(STORAGE_KEYS.EVENTS, events);
    }
  }

  return { ...currentTiket, status: newStatus };
}

export async function deleteTiket(id) {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "tiket", id));
    return true;
  }

  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const filtered = tickets.filter(t => t.id !== id);
  setLocal(STORAGE_KEYS.TIKET, filtered);
  return true;
}

// =============================================================
// 4. MODUL REKAPITULASI
// =============================================================

export async function getRekapData(eventId) {
  if (isFirebaseConfigured && db) {
    const evSnap = await getDoc(doc(db, "event", eventId));
    if (!evSnap.exists()) throw new Error("Event tidak ditemukan di database.");
    const event = { id: evSnap.id, ...evSnap.data() };

    const q = query(collection(db, "tiket"), where("event_id", "==", eventId));
    const tSnap = await getDocs(q);
    const eventTickets = tSnap.docs.map(normalizeDoc);

    const kuota = event.kuota || 0;
    const tiket_terjual = event.tiket_terjual || 0;
    const sisa_kuota = Math.max(0, kuota - tiket_terjual);

    // Pendapatan dihitung HANYA dari tiket berstatus "lunas" dan "hadir"
    // Sesuai PRD Bagian 5.4 AC 2
    const pendapatan = eventTickets
      .filter(t => t.status === "lunas" || t.status === "hadir")
      .reduce((sum, t) => sum + (t.total || 0), 0);

    // Jumlah peserta yang hadir (check-in)
    const jumlah_hadir = eventTickets
      .filter(t => t.status === "hadir")
      .reduce((sum, t) => sum + (t.jumlah_tiket || 0), 0);

    return {
      event,
      tiketList: eventTickets,
      kuota,
      tiket_terjual,
      sisa_kuota,
      pendapatan,
      jumlah_hadir
    };
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const event = events.find(e => e.id === eventId);
  if (!event) throw new Error("Event tidak ditemukan.");

  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const eventTickets = tickets.filter(t => t.event_id === eventId);

  const kuota = event.kuota || 0;
  const tiket_terjual = event.tiket_terjual || 0;
  const sisa_kuota = Math.max(0, kuota - tiket_terjual);

  const pendapatan = eventTickets
    .filter(t => t.status === "lunas" || t.status === "hadir")
    .reduce((sum, t) => sum + (t.total || 0), 0);

  const jumlah_hadir = eventTickets
    .filter(t => t.status === "hadir")
    .reduce((sum, t) => sum + (t.jumlah_tiket || 0), 0);

  return {
    event,
    tiketList: eventTickets,
    kuota,
    tiket_terjual,
    sisa_kuota,
    pendapatan,
    jumlah_hadir
  };
}
