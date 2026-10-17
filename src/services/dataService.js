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

// Local storage helper
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

// -------------------------------------------------------------
// EVENT OPERATIONS
// -------------------------------------------------------------
export async function getEvents() {
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "event"), orderBy("tanggal"), limit(20));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(normalizeDoc);
      }
    } catch (err) {
      console.warn("Firestore getEvents error, falling back to local:", err);
    }
  }
  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  return [...events].sort((a, b) => (a.tanggal || "").localeCompare(b.tanggal || ""));
}

export async function addEvent(data) {
  const { nama, tanggal, lokasi, harga_tiket, kuota } = data;

  // Validations per PRD & Schema
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
    try {
      const docRef = await addDoc(collection(db, "event"), {
        ...payload,
        dibuat_pada: serverTimestamp()
      });
      return { id: docRef.id, ...payload, dibuat_pada: new Date().toISOString() };
    } catch (err) {
      console.warn("Firestore addEvent error, fallback to local:", err);
    }
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
    try {
      const docRef = doc(db, "event", id);
      const currentDoc = await getDoc(docRef);
      if (currentDoc.exists()) {
        const currentData = currentDoc.data();
        if (kuotaNum < (currentData.tiket_terjual || 0)) {
          throw new Error("Kuota tidak boleh lebih kecil dari tiket yang sudah terjual.");
        }
      }
      await updateDoc(docRef, {
        nama: nama.trim(),
        tanggal,
        lokasi: lokasi.trim(),
        harga_tiket: hargaNum,
        kuota: kuotaNum
      });
      return { id, nama: nama.trim(), tanggal, lokasi: lokasi.trim(), harga_tiket: hargaNum, kuota: kuotaNum };
    } catch (err) {
      if (err.message.includes("Kuota tidak boleh")) throw err;
      console.warn("Firestore updateEvent error, fallback to local:", err);
    }
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
    try {
      await deleteDoc(doc(db, "event", id));
      return true;
    } catch (err) {
      console.warn("Firestore deleteEvent error, fallback to local:", err);
    }
  }

  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const filtered = events.filter(e => e.id !== id);
  setLocal(STORAGE_KEYS.EVENTS, filtered);
  return true;
}

// -------------------------------------------------------------
// PEMBELI OPERATIONS
// -------------------------------------------------------------
export async function getPembeli(searchQuery = "") {
  let list = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "pembeli"), orderBy("nama"), limit(30));
      const snap = await getDocs(q);
      list = snap.docs.map(normalizeDoc);
    } catch (err) {
      console.warn("Firestore getPembeli error, fallback to local:", err);
      list = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
    }
  } else {
    list = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    list = list.filter(
      p =>
        (p.nama && p.nama.toLowerCase().includes(q)) ||
        (p.no_whatsapp && p.no_whatsapp.includes(q))
    );
  }
  return [...list].sort((a, b) => (a.nama || "").localeCompare(b.nama || ""));
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
    try {
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
    } catch (err) {
      if (err.message.includes("sudah terdaftar")) throw err;
      console.warn("Firestore addPembeli error, fallback to local:", err);
    }
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
    try {
      const docRef = doc(db, "pembeli", id);
      await updateDoc(docRef, {
        nama: nama.trim(),
        email: email.trim()
      });
      return { id, nama: nama.trim(), email: email.trim() };
    } catch (err) {
      console.warn("Firestore updatePembeli error, fallback to local:", err);
    }
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
    try {
      await deleteDoc(doc(db, "pembeli", id));
      return true;
    } catch (err) {
      console.warn("Firestore deletePembeli error, fallback to local:", err);
    }
  }

  const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
  const filtered = buyers.filter(b => b.id !== id);
  setLocal(STORAGE_KEYS.PEMBELI, filtered);
  return true;
}

// -------------------------------------------------------------
// TIKET (TRANSAKSI) OPERATIONS
// -------------------------------------------------------------
export async function getTiket(statusFilter = "Semua") {
  let list = [];
  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, "tiket"), orderBy("dibuat_pada", "desc"), limit(30));
      const snap = await getDocs(q);
      list = snap.docs.map(normalizeDoc);
    } catch (err) {
      console.warn("Firestore getTiket error, fallback to local:", err);
      list = getLocal(STORAGE_KEYS.TIKET, initialTiket);
    }
  } else {
    list = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  }

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

  // Retrieve event to verify quota and snapshot data
  let selectedEvent = null;
  let selectedPembeli = null;

  if (isFirebaseConfigured && db) {
    try {
      const evDoc = await getDoc(doc(db, "event", event_id));
      if (!evDoc.exists()) throw new Error("Event tidak ditemukan.");
      selectedEvent = { id: evDoc.id, ...evDoc.data() };

      const pbDoc = await getDoc(doc(db, "pembeli", pembeli_id));
      if (!pbDoc.exists()) throw new Error("Pembeli tidak ditemukan.");
      selectedPembeli = { id: pbDoc.id, ...pbDoc.data() };
    } catch (err) {
      if (err.message.includes("tidak ditemukan")) throw err;
      console.warn("Firestore fetch error in addTiket:", err);
    }
  }

  if (!selectedEvent) {
    const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
    selectedEvent = events.find(e => e.id === event_id);
    if (!selectedEvent) throw new Error("Event tidak ditemukan.");
  }

  if (!selectedPembeli) {
    const buyers = getLocal(STORAGE_KEYS.PEMBELI, initialPembeli);
    selectedPembeli = buyers.find(b => b.id === pembeli_id || b.no_whatsapp === pembeli_id);
    if (!selectedPembeli) throw new Error("Pembeli tidak ditemukan.");
  }

  const sisaKuota = selectedEvent.kuota - (selectedEvent.tiket_terjual || 0);
  if (qty > sisaKuota) {
    throw new Error(`Jumlah tiket melebihi sisa kuota yang tersedia (${sisaKuota} kursi).`);
  }

  const total = selectedEvent.harga_tiket * qty;
  const initialStatus = "menunggu_bayar";

  const payload = {
    event_id: selectedEvent.id,
    nama_event: selectedEvent.nama,
    tanggal_event: selectedEvent.tanggal,
    pembeli_id: selectedPembeli.no_whatsapp || selectedPembeli.id,
    nama_pembeli: selectedPembeli.nama,
    harga_tiket: selectedEvent.harga_tiket,
    jumlah_tiket: qty,
    total: total,
    status: initialStatus
  };

  if (isFirebaseConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, "tiket"), {
        ...payload,
        dibuat_pada: serverTimestamp()
      });
      // Atomically increment tiket_terjual on event
      await updateDoc(doc(db, "event", selectedEvent.id), {
        tiket_terjual: increment(qty)
      });

      return { id: docRef.id, ...payload, dibuat_pada: new Date().toISOString() };
    } catch (err) {
      console.warn("Firestore addTiket error, fallback to local:", err);
    }
  }

  // Local storage transaction
  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const newTicket = {
    id: "Tk" + Math.random().toString(36).substring(2, 7),
    ...payload,
    dibuat_pada: new Date().toISOString()
  };
  tickets.unshift(newTicket);
  setLocal(STORAGE_KEYS.TIKET, tickets);

  // Update local event tiket_terjual
  const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
  const evIdx = events.findIndex(e => e.id === selectedEvent.id);
  if (evIdx !== -1) {
    events[evIdx].tiket_terjual = (events[evIdx].tiket_terjual || 0) + qty;
    setLocal(STORAGE_KEYS.EVENTS, events);
  }

  return newTicket;
}

export async function updateTiketStatus(tiketId, newStatus) {
  // Read current ticket to validate state machine
  let currentTiket = null;
  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);

  if (isFirebaseConfigured && db) {
    try {
      const tSnap = await getDoc(doc(db, "tiket", tiketId));
      if (tSnap.exists()) {
        currentTiket = { id: tSnap.id, ...tSnap.data() };
      }
    } catch (err) {
      console.warn("Firestore fetch tiket error:", err);
    }
  }

  if (!currentTiket) {
    currentTiket = tickets.find(t => t.id === tiketId);
  }

  if (!currentTiket) {
    throw new Error("Tiket tidak ditemukan.");
  }

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

  // If status is changed to dibatalkan, return quota by decrementing tiket_terjual on event
  const isCancelling = newStatus === "dibatalkan" && currentTiket.status !== "dibatalkan";

  if (isFirebaseConfigured && db) {
    try {
      await updateDoc(doc(db, "tiket", tiketId), { status: newStatus });
      if (isCancelling) {
        await updateDoc(doc(db, "event", currentTiket.event_id), {
          tiket_terjual: increment(-currentTiket.jumlah_tiket)
        });
      }
      return { ...currentTiket, status: newStatus };
    } catch (err) {
      console.warn("Firestore update status error, fallback to local:", err);
    }
  }

  // Local storage update
  const tIdx = tickets.findIndex(t => t.id === tiketId);
  if (tIdx !== -1) {
    tickets[tIdx].status = newStatus;
    setLocal(STORAGE_KEYS.TIKET, tickets);
  }

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
    try {
      await deleteDoc(doc(db, "tiket", id));
      return true;
    } catch (err) {
      console.warn("Firestore deleteTiket error, fallback to local:", err);
    }
  }

  const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
  const filtered = tickets.filter(t => t.id !== id);
  setLocal(STORAGE_KEYS.TIKET, filtered);
  return true;
}

// -------------------------------------------------------------
// REKAP OPERATIONS
// -------------------------------------------------------------
export async function getRekapData(eventId) {
  let event = null;
  let eventTickets = [];

  if (isFirebaseConfigured && db) {
    try {
      const evSnap = await getDoc(doc(db, "event", eventId));
      if (evSnap.exists()) {
        event = { id: evSnap.id, ...evSnap.data() };
      }
      const q = query(collection(db, "tiket"), where("event_id", "==", eventId));
      const tSnap = await getDocs(q);
      eventTickets = tSnap.docs.map(normalizeDoc);
    } catch (err) {
      console.warn("Firestore getRekapData error, fallback to local:", err);
    }
  }

  if (!event) {
    const events = getLocal(STORAGE_KEYS.EVENTS, initialEvents);
    event = events.find(e => e.id === eventId);
  }

  if (!event) throw new Error("Event tidak ditemukan.");

  if (eventTickets.length === 0) {
    const tickets = getLocal(STORAGE_KEYS.TIKET, initialTiket);
    eventTickets = tickets.filter(t => t.event_id === eventId);
  }

  const kuota = event.kuota || 0;
  const tiket_terjual = event.tiket_terjual || 0;
  const sisa_kuota = Math.max(0, kuota - tiket_terjual);

  // Pendapatan HANYA dihitung dari tiket status "lunas" dan "hadir"
  // (menunggu_bayar dan dibatalkan TIDAK dihitung per PRD Bagian 5.4)
  const pendapatan = eventTickets
    .filter(t => t.status === "lunas" || t.status === "hadir")
    .reduce((sum, t) => sum + (t.total || 0), 0);

  // Jumlah hadir: total tiket dari tiket berstatus "hadir"
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
