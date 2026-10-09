// booking.js - logika form reservasi multi-step

// Katalog kamar disesuaikan spesifik berdasarkan lokasi & tipe hotel:
// - City Hotel: Kamar bergaya modern perkotaan, view cakrawala kota, distrik bisnis (Tipe A, B, D, E, F, G)
// - Resort Hotel: Kamar bernuansa resort pantai & tropis, ocean view, private jacuzzi, taman (Tipe A, C, D, E, F, G, H, L)
const HOTEL_ROOMS = {
  'City Hotel': [
    {
      type: 'A',
      name: 'Standard City Room',
      maxGuests: 2,
      area: 22,
      bed: 'Twin Bed',
      basePrice: 950000,
      img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600',
      desc: 'Kamar modern di pusat kota dengan fasilitas esensial, cocok untuk perjalanan dinas atau liburan singkat.'
    },
    {
      type: 'B',
      name: 'Superior City View',
      maxGuests: 2,
      area: 28,
      bed: 'Queen Bed',
      basePrice: 1100000,
      img: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600',
      desc: 'Kamar elegan dengan meja kerja luas dan jendela panorama cakrawala kota metropolitan.'
    },
    {
      type: 'D',
      name: 'Deluxe Twin City',
      maxGuests: 3,
      area: 34,
      bed: 'Twin Bed',
      basePrice: 1350000,
      img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
      desc: 'Dua ranjang nyaman di pusat distrik bisnis kota, ideal untuk rekan kerja atau sahabat.'
    },
    {
      type: 'E',
      name: 'Executive Business Room',
      maxGuests: 3,
      area: 40,
      bed: 'King Bed',
      basePrice: 1550000,
      img: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600',
      desc: 'Akses eksklusif Executive Lounge, sarapan premium, dan ruang meeting di pusat kota.'
    },
    {
      type: 'F',
      name: 'Junior Suite City',
      maxGuests: 4,
      area: 55,
      bed: 'King Bed',
      basePrice: 1900000,
      img: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600',
      desc: 'Suite luas berfasilitas lengkap dengan ruang duduk terpisah dan pemandangan gemerlap lampu kota malam.'
    },
    {
      type: 'G',
      name: 'Family Suite City',
      maxGuests: 5,
      area: 65,
      bed: 'King + Sofa Bed',
      basePrice: 2300000,
      img: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600',
      desc: 'Pilihan sempurna untuk keluarga yang ingin menjelajahi pusat perbelanjaan dan kuliner kota.'
    }
  ],
  'Resort Hotel': [
    {
      type: 'A',
      name: 'Standard Garden Room',
      maxGuests: 2,
      area: 26,
      bed: 'Twin Bed',
      basePrice: 1050000,
      img: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600',
      desc: 'Kamar nyaman bernuansa tropis dengan teras asri menghadap taman resort yang hijau.'
    },
    {
      type: 'C',
      name: 'Deluxe Ocean View',
      maxGuests: 3,
      area: 36,
      bed: 'King Bed',
      basePrice: 1400000,
      img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=600',
      desc: 'Balkon privat dengan panorama laut lepas, semilir angin pantai, dan deburan ombak menenangkan.'
    },
    {
      type: 'D',
      name: 'Deluxe Twin Resort',
      maxGuests: 3,
      area: 38,
      bed: 'Twin Bed',
      basePrice: 1450000,
      img: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=600',
      desc: 'Dua tempat tidur terpisah dengan arsitektur resort tropis santai dan akses mudah ke pantai.'
    },
    {
      type: 'E',
      name: 'Executive Ocean Suite',
      maxGuests: 3,
      area: 48,
      bed: 'King Bed',
      basePrice: 1750000,
      img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
      desc: 'Suite elegan dengan pemandangan langsung matahari terbenam (sunset) di atas garis pantai.'
    },
    {
      type: 'F',
      name: 'Junior Suite Pool & Garden',
      maxGuests: 4,
      area: 60,
      bed: 'King Bed',
      basePrice: 2100000,
      img: 'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=600',
      desc: 'Akses dekat laguna kolam renang dengan sundeck dan beranda santai di tengah rimbunnya alam resort.'
    },
    {
      type: 'G',
      name: 'Family Beach Suite',
      maxGuests: 5,
      area: 72,
      bed: 'King + Sofa Bed',
      basePrice: 2600000,
      img: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600',
      desc: 'Suite luas ramah keluarga dilengkapi area bermain anak dan akses langsung ke pasir pantai.'
    },
    {
      type: 'H',
      name: 'Grand Ocean Suite & Jacuzzi',
      maxGuests: 4,
      area: 85,
      bed: 'Super King',
      basePrice: 3200000,
      img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600',
      desc: 'Kemewahan tropis premium dengan private outdoor jacuzzi, ruang makan privat, dan butler resort.'
    },
    {
      type: 'L',
      name: 'Presidential Beachfront Villa',
      maxGuests: 6,
      area: 130,
      bed: 'Super King',
      basePrice: 5500000,
      img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600',
      desc: 'Puncak kemewahan resort: panorama laut 180°, private plunge pool, paviliun spa & gazebo eksklusif.'
    }
  ]
};

// Ambil tipe hotel yang sedang dipilih ('City Hotel' atau 'Resort Hotel')
function getSelectedHotel() {
  const radio = document.querySelector('input[name="hotel"]:checked');
  return radio ? radio.value : 'City Hotel';
}

// Ambil daftar kamar yang tersedia untuk hotel yang sedang aktif
function getActiveRooms() {
  const hotel = getSelectedHotel();
  return HOTEL_ROOMS[hotel] || HOTEL_ROOMS['City Hotel'];
}

// surcharge = biaya tambahan per paket makan (bisa negatif untuk diskon)
const MEAL_SURCHARGE = { BB:0, HB:150000, FB:280000, SC:-80000 };
const MEAL_LABELS    = { BB:'Bed & Breakfast', HB:'Half Board', FB:'Full Board', SC:'Self Catering' };

// ── Ketersediaan kamar real-time dari server ─────────────────────────────────
// Struktur: { 'A': { total: 40, available: 38 }, 'B': { ... }, ... }
let roomAvailability = {};
let availabilityLoaded = false;

/**
 * Ambil ketersediaan kamar dari server, lalu re-render kartu.
 * Dipanggil saat load & setiap 30 detik (polling).
 */
async function fetchRoomAvailability() {
  try {
    const res  = await fetch('/api/room-availability');
    if (!res.ok) throw new Error('Gagal memuat data ketersediaan');
    const data = await res.json();
    const changed = JSON.stringify(data) !== JSON.stringify(roomAvailability);
    roomAvailability  = data;
    availabilityLoaded = true;

    // Re-render hanya jika ada perubahan stok
    if (changed) renderRoomPicker();

    // Update badge ketersediaan di kartu yang sudah di-render
    updateAvailabilityBadges();

    // Jika kamar yang dipilih ternyata sudah penuh → tampilkan peringatan
    if (selectedRoom) {
      const avail = roomAvailability[selectedRoom.type];
      if (avail && avail.available === 0) {
        showRoomSoldOutWarning(selectedRoom.type);
      }
    }
  } catch (err) {
    console.warn('Gagal fetch ketersediaan kamar:', err);
  }
}

/** Update hanya badge stok di kartu tanpa re-render penuh */
function updateAvailabilityBadges() {
  getActiveRooms().forEach(r => {
    const card  = document.querySelector(`.room-pick-card[data-type="${r.type}"]`);
    if (!card) return;
    const avail = roomAvailability[r.type];
    if (!avail) return;
    const { available, total } = avail;
    const soldOut = available === 0;

    // Perbarui badge di img-overlay
    const imgDiv = card.querySelector('.rpc-img');
    if (imgDiv) {
      // Hapus badge lama
      imgDiv.querySelectorAll('.rpc-soldout-badge, .rpc-limited-badge, .rpc-avail-badge').forEach(b => b.remove());
      if (soldOut) {
        imgDiv.insertAdjacentHTML('beforeend', '<div class="rpc-soldout-badge">Penuh</div>');
      } else if (available <= 5) {
        imgDiv.insertAdjacentHTML('beforeend', `<div class="rpc-limited-badge">Sisa ${available} kamar</div>`);
      } else {
        imgDiv.insertAdjacentHTML('beforeend', `<div class="rpc-avail-badge">Tersedia ${available}/${total}</div>`);
      }
    }

    // Perbarui status card (sold-out class & click)
    card.classList.toggle('sold-out', soldOut);
    card.setAttribute('tabindex', soldOut ? '-1' : '0');
    if (soldOut) {
      card.setAttribute('onclick', '');
      card.setAttribute('onkeydown', '');
    } else {
      card.setAttribute('onclick', `selectRoom('${r.type}')`);
      card.setAttribute('onkeydown', `if(event.key==='Enter')selectRoom('${r.type}')`);
    }

    // Update indikator bawah kartu
    const indicator = card.querySelector('.rpc-select-indicator');
    if (indicator && !card.classList.contains('selected')) {
      indicator.textContent = soldOut ? 'Penuh' : 'Pilih Kamar';
    }
  });
}

/** Tampilkan peringatan bahwa kamar yang dipilih kini sudah penuh */
function showRoomSoldOutWarning(type) {
  const errEl = document.getElementById('room-pick-error');
  if (errEl) {
    errEl.textContent = `Kamar Tipe ${type} baru saja penuh! Silakan pilih tipe lain.`;
    errEl.classList.remove('hidden');
  }
}

let selectedRoom = null; // kamar yang sedang dipilih user

// render semua kartu pilihan kamar ke dalam grid sesuai hotel aktif
function renderRoomPicker(preselect) {
  const grid = document.getElementById('room-picker-grid');
  if (!grid) return;

  const currentHotel = getSelectedHotel();
  const rooms = getActiveRooms();

  // Update teks petunjuk kontekstual filter hotel
  const hintDesc = document.getElementById('room-pick-hint');
  if (hintDesc) {
    hintDesc.innerHTML = currentHotel === 'City Hotel'
      ? `Menampilkan pilihan kamar di <strong>City Hotel</strong> (Pusat Kota & Bisnis). Klik kamar yang Anda inginkan.`
      : `Menampilkan pilihan kamar di <strong>Resort Hotel</strong> (Tepi Pantai & Tropis). Klik kamar yang Anda inginkan.`;
  }

  grid.innerHTML = rooms.map(r => {
    // Ambil stok dari server jika sudah tersedia, fallback ke unknown
    const inv       = roomAvailability[r.type];
    const available = inv ? inv.available : null;
    const total     = inv ? inv.total     : null;
    const soldOut   = inv ? available === 0 : false;
    const sel       = selectedRoom?.type === r.type;

    // Badge ketersediaan
    let badgeHtml = '';
    if (!inv) {
      badgeHtml = '<div class="rpc-loading-badge">Memuat...</div>';
    } else if (soldOut) {
      badgeHtml = '<div class="rpc-soldout-badge">Penuh</div>';
    } else if (available <= 5) {
      badgeHtml = `<div class="rpc-limited-badge">Sisa ${available} kamar</div>`;
    } else {
      badgeHtml = `<div class="rpc-avail-badge">Tersedia ${available}/${total}</div>`;
    }

    return `
    <div class="room-pick-card ${sel ? 'selected' : ''} ${soldOut ? 'sold-out' : ''}"
         data-type="${r.type}" role="button" tabindex="${soldOut ? -1 : 0}"
         aria-pressed="${sel}"
         onclick="${soldOut ? '' : `selectRoom('${r.type}')`}"
         onkeydown="if(event.key==='Enter')selectRoom('${r.type}')">
      <div class="rpc-img" style="background-image:url('${r.img}')">
        ${badgeHtml}
      </div>
      <div class="rpc-body">
        <div class="rpc-header">
          <span class="rpc-type-badge">Tipe ${r.type}</span>
          <span class="rpc-price">Rp ${r.basePrice.toLocaleString('id-ID')}<span>/malam</span></span>
        </div>
        <h3 class="rpc-name">${r.name}</h3>
        <p class="rpc-desc">${r.desc}</p>
        <div class="rpc-features">
          <span>Maks. ${r.maxGuests} tamu</span>
          <span>${r.area} m²</span>
          <span>${r.bed}</span>
        </div>
        <div class="rpc-select-indicator">
          ${sel ? 'Dipilih' : (soldOut ? 'Penuh' : 'Pilih Kamar')}
        </div>
      </div>
    </div>`;
  }).join('');

  // kalau ada preselect dari URL query (?room=C), langsung pilih
  if (preselect) selectRoom(preselect, false);
}

// pilih kamar berdasarkan tipe, update tampilan semua kartu
function selectRoom(type, scroll = true) {
  const rooms = getActiveRooms();
  selectedRoom = rooms.find(r => r.type === type) || null;
  if (!selectedRoom) return;

  document.querySelectorAll('.room-pick-card').forEach(card => {
    const isSelected = card.dataset.type === type;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected);
    card.querySelector('.rpc-select-indicator').textContent = isSelected ? 'Dipilih' : 'Pilih Kamar';
  });

  document.getElementById('room-pick-error')?.classList.add('hidden');
  updateSelectedRoomBanners();
  updateAdrDisplay();

  // Kirim event agar datepicker.js bisa memperbarui harga di kalender
  document.dispatchEvent(new CustomEvent('roomSelected', {
    detail: { basePrice: selectedRoom.basePrice }
  }));
  // Update harga via DRP API jika tersedia
  if (window.DRP) DRP.setBasePrice(selectedRoom.basePrice);

  if (scroll) {
    const card = document.querySelector(`.room-pick-card[data-type="${type}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// Handler saat pilihan hotel diganti oleh user
function onHotelChange() {
  const rooms = getActiveRooms();

  // Sinkronkan styling radio card hotel (.active)
  document.querySelectorAll('.hotel-pick-card').forEach(card => {
    const inp = card.querySelector('input[name="hotel"]');
    card.classList.toggle('active', inp?.checked);
  });

  // Jika sudah ada kamar terpilih sebelumnya:
  if (selectedRoom) {
    const match = rooms.find(r => r.type === selectedRoom.type);
    if (match) {
      // Tipe kamar sama tersedia di hotel baru (misal Tipe A, D, E, F, G)
      // Perbarui objek ke data versi hotel yang baru
      selectedRoom = match;
    } else {
      // Tipe kamar tidak tersedia di hotel baru (misal Tipe B di Resort, atau C/H/L di City)
      // Otomatis pilih kamar pertama di hotel yang baru (Tipe A)
      selectedRoom = rooms[0] || null;
    }
  } else {
    // Belum ada kamar terpilih, pilih kamar pertama sebagai default
    selectedRoom = rooms[0] || null;
  }

  // Re-render pilihan kamar untuk hotel terpilih
  renderRoomPicker();
  updateAvailabilityBadges();
  updateSelectedRoomBanners();
  updateAdrDisplay();

  if (selectedRoom) {
    document.dispatchEvent(new CustomEvent('roomSelected', {
      detail: { basePrice: selectedRoom.basePrice }
    }));
    if (window.DRP) DRP.setBasePrice(selectedRoom.basePrice);
  }
}

// update banner ringkasan kamar di step 1 dan step 2
function updateSelectedRoomBanners() {
  const hotel = getSelectedHotel();
  const html = selectedRoom
    ? `<div class="srb-inner">
        <div>
          <strong>${hotel} &middot; Tipe ${selectedRoom.type} — ${selectedRoom.name}</strong>
          <span>Maks. ${selectedRoom.maxGuests} tamu &middot; ${selectedRoom.area} m² &middot; ${selectedRoom.bed}</span>
        </div>
        <button type="button" class="srb-change" onclick="goToStep(0)">Ganti Kamar</button>
       </div>`
    : '';
  ['selected-room-banner', 'selected-room-banner-2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

// navigasi antar step form
let currentStep = 0;

function goToStep(n) {
  // tampilkan hanya step yang aktif
  document.querySelectorAll('.form-step').forEach((el, i) => {
    el.classList.toggle('active', i === n);
  });
  // update indikator step di atas form
  document.querySelectorAll('.step').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === n) el.classList.add('active');
    if (i < n)   el.classList.add('done');
  });
  currentStep = n;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// tombol next & back antar step
document.getElementById('next-0')?.addEventListener('click', () => {
  if (!selectedRoom) {
    document.getElementById('room-pick-error')?.classList.remove('hidden');
    return;
  }
  document.getElementById('reserved_room_type').value = selectedRoom.type;
  goToStep(1);
});

document.getElementById('next-1')?.addEventListener('click', () => {
  if (validateStep1()) goToStep(2);
});

document.getElementById('next-2')?.addEventListener('click', () => {
  if (validateStep2()) { buildSummary(); goToStep(3); }
});

document.getElementById('back-1')?.addEventListener('click', () => goToStep(0));
document.getElementById('back-2')?.addEventListener('click', () => goToStep(1));
document.getElementById('back-3')?.addEventListener('click', () => goToStep(2));

// auto-derive customer_type dari jumlah tamu
function autoCustomerType() {
  const adults   = parseInt(document.getElementById('adults')?.value)   || 0;
  const children = parseInt(document.getElementById('children')?.value) || 0;
  const babies   = parseInt(document.getElementById('babies')?.value)   || 0;
  const hidden   = document.getElementById('customer_type');
  if (!hidden) return;

  let type = 'Transient';
  if (adults >= 4)           type = 'Group';
  else if (children + babies > 0) type = 'Transient-Party';

  hidden.value = type;
}

// tombol +/- untuk input angka (jumlah tamu, malam, dll)
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const min = parseInt(input.min ?? '0');
    const max = parseInt(input.max ?? '9999');
    let val   = parseInt(input.value) || 0;
    if (btn.classList.contains('plus'))  val = Math.min(val + 1, max);
    if (btn.classList.contains('minus')) val = Math.max(val - 1, min);
    input.value = val;
    if (['stays_in_week_nights','stays_in_weekend_nights'].includes(btn.dataset.target)) updateTotal();
    if (['adults','children','babies'].includes(btn.dataset.target)) {
      checkCapacity();
      autoCustomerType();
    }
  });
});

// cek apakah jumlah tamu melebihi kapasitas kamar yang dipilih
function checkCapacity() {
  if (!selectedRoom) return true;
  const adults   = parseInt(document.getElementById('adults')?.value) || 0;
  const children = parseInt(document.getElementById('children')?.value) || 0;
  const total    = adults + children;
  const warnEl   = document.getElementById('capacity-warn');
  if (total > selectedRoom.maxGuests) {
    warnEl?.classList.remove('hidden');
    if (warnEl) warnEl.textContent =
      `Tipe ${selectedRoom.type} (${selectedRoom.name}) hanya menampung maksimal ${selectedRoom.maxGuests} tamu. Kurangi jumlah tamu atau pilih kamar yang lebih besar.`;
    return false;
  }
  warnEl?.classList.add('hidden');
  return true;
}

// validasi step 1 (nama, email & nomor telepon tamu)
function validateStep1() {
  const name = document.getElementById('guest_name').value.trim();
  if (!name) { showFieldError('guest_name', 'Nama lengkap wajib diisi'); return false; }
  clearFieldError('guest_name');

  const email      = document.getElementById('guest_email').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email)                    { showFieldError('guest_email', 'Email wajib diisi'); return false; }
  if (!emailRegex.test(email))   { showFieldError('guest_email', 'Format email tidak valid'); return false; }
  clearFieldError('guest_email');

  const phone = document.getElementById('guest_phone')?.value.trim() || '';
  if (!phone) { showFieldError('guest_phone', 'Nomor telepon/WhatsApp wajib diisi'); return false; }
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 8) { showFieldError('guest_phone', 'Nomor telepon minimal 8 digit angka'); return false; }
  if (phoneDigits.length > 15) { showFieldError('guest_phone', 'Nomor telepon maksimal 15 digit angka'); return false; }
  clearFieldError('guest_phone');

  if (!checkCapacity()) return false;
  return true;
}

// validasi step 2 (tanggal menginap via date range picker)
function validateStep2() {
  // 1. pastikan tanggal sudah dipilih via DRP
  if (!window.DRP || !DRP.isComplete()) {
    const inp = document.getElementById('drp-inputs');
    if (inp) {
      inp.style.borderColor = 'var(--danger)';
      let err = inp.parentElement?.querySelector('.drp-error');
      if (!err) {
        err = document.createElement('span');
        err.className = 'drp-error field-error';
        err.style.cssText = 'color:var(--danger);font-size:.75rem;margin-top:.4rem;display:block;';
        inp.parentElement.appendChild(err);
      }
      err.textContent = 'Pilih tanggal check-in dan check-out terlebih dahulu.';
    }
    return false;
  }
  // reset error
  const inp = document.getElementById('drp-inputs');
  if (inp) inp.style.borderColor = '';
  document.querySelector('.drp-error')?.remove();

  // 2. kalau kedatangan hari ini, wajib isi jam check-in
  if (dateState.isToday) {
    const timeInput = document.getElementById('checkin_hour');
    const timeVal   = timeInput?.value;
    if (!timeVal) {
      showDateError('Masukkan jam check-in untuk kedatangan hari ini.');
      timeInput?.focus();
      return false;
    }
    const [hh, mm] = timeVal.split(':').map(Number);
    const now       = new Date();
    const checkinMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm).getTime();
    if (checkinMs <= now.getTime()) {
      const nowHH = String(now.getHours()).padStart(2,'0');
      const nowMM = String(now.getMinutes()).padStart(2,'0');
      showDateError(`Jam check-in sudah terlewat. Masukkan jam setelah ${nowHH}:${nowMM} (jam saat ini).`);
      timeInput?.focus();
      return false;
    }
    clearDateError();
  }

  // 3. minimal 1 malam menginap
  const wk = parseInt(document.getElementById('stays_in_week_nights').value) || 0;
  const we = parseInt(document.getElementById('stays_in_weekend_nights').value) || 0;
  if (wk + we < 1) {
    showDateError('Pilih minimal 1 malam menginap.');
    return false;
  }
  return true;
}

// tampilkan error di area lead time
function showDateError(msg) {
  const noteEl   = document.getElementById('lead-time-note');
  const amountEl = document.getElementById('lead-time-amount');
  if (noteEl)   { noteEl.textContent = msg; noteEl.style.color = 'var(--danger)'; }
  if (amountEl) amountEl.style.color = 'var(--danger)';
}

function clearDateError() {
  const noteEl = document.getElementById('lead-time-note');
  if (noteEl) noteEl.style.color = '';
}

// tampilkan error di bawah field input
function showFieldError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--danger)';
  let err = el.parentElement.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    err.style.cssText = 'color:var(--danger);font-size:.75rem;margin-top:.25rem;display:block;';
    el.parentElement.appendChild(err);
  }
  err.textContent = msg;
}

function clearFieldError(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = '';
  el.parentElement.querySelector('.field-error')?.remove();
}

// tampilkan error di bawah number input
function showNumberInputError(id, msg) {
  const wrap = document.getElementById(id)?.closest('.form-group');
  if (!wrap) return;
  wrap.querySelector('.number-input').style.borderColor = 'var(--danger)';
  let err = wrap.querySelector('.field-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'field-error';
    err.style.cssText = 'color:var(--danger);font-size:.75rem;margin-top:.25rem;display:block;';
    wrap.appendChild(err);
  }
  err.textContent = msg;
}

function clearNumberInputError(id) {
  const wrap = document.getElementById(id)?.closest('.form-group');
  if (!wrap) return;
  wrap.querySelector('.number-input').style.borderColor = '';
  wrap.querySelector('.field-error')?.remove();
}

// hitung harga per malam (base price + surcharge paket makan)
function calcAdr() {
  const base      = selectedRoom?.basePrice ?? 0;
  const meal      = document.getElementById('meal')?.value || 'BB';
  const surcharge = MEAL_SURCHARGE[meal] ?? 0;
  return Math.max(base + surcharge, 0);
}

// update tampilan harga yang muncul di form step 2
function updateAdrDisplay() {
  const price   = calcAdr();
  const meal    = document.getElementById('meal')?.value || 'BB';
  const roomLbl = selectedRoom ? `Tipe ${selectedRoom.type} · ${selectedRoom.name}` : '—';
  const mealLbl = MEAL_LABELS[meal] || meal;

  const amEl = document.getElementById('adr-amount');
  const ntEl = document.getElementById('adr-note');
  const hdEl = document.getElementById('adr');

  if (amEl) amEl.textContent = selectedRoom ? 'Rp ' + price.toLocaleString('id-ID') : 'Rp —';
  if (ntEl) ntEl.textContent = `${roomLbl} · ${mealLbl}`;
  if (hdEl) hdEl.value       = price;

  updateTotal();
}

document.getElementById('meal')?.addEventListener('change', updateAdrDisplay);

// mapping nama bulan ke index (untuk hitung lead time)
const MONTH_INDEX = {
  January:0, February:1, March:2, April:3, May:4, June:5,
  July:6, August:7, September:8, October:9, November:10, December:11
};
const MONTHS_LIST = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];

// state validasi tanggal, digunakan oleh validateStep2()
let dateState = { valid: true, isToday: false, errorMsg: '' };


// hitung lead time dari tanggal check-in yang dipilih DRP
// hitung lead time (selisih hari dari hari ini ke tanggal kedatangan)
function updateLeadTime() {
  const day      = parseInt(document.getElementById('arrival_date_day_of_month')?.value) || 1;
  const month    = document.getElementById('arrival_date_month')?.value || 'January';
  const year     = parseInt(document.getElementById('arrival_date_year')?.value) || new Date().getFullYear();
  const monthIdx = MONTH_INDEX[month] ?? 0;
  const arrival  = new Date(year, monthIdx, day);
  const now      = new Date();
  const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs   = arrival - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  const amountEl = document.getElementById('lead-time-amount');
  const noteEl   = document.getElementById('lead-time-note');
  const hiddenEl = document.getElementById('lead_time');
  const timeRow  = document.getElementById('checkin-time-row');

  // reset state dulu
  dateState = { valid: true, isToday: false, errorMsg: '' };

  if (diffDays < 0) {
    // tanggal sudah lewat
    dateState = { valid: false, isToday: false, errorMsg: 'Tanggal sudah lewat. Pilih tanggal hari ini atau yang akan datang.' };
    if (amountEl) { amountEl.textContent = '—'; amountEl.style.color = 'var(--danger)'; }
    if (noteEl)   { noteEl.textContent = dateState.errorMsg; noteEl.style.color = 'var(--danger)'; }
    if (hiddenEl) hiddenEl.value = 0;
    timeRow?.classList.add('hidden');

  } else if (diffDays === 0) {
    // kedatangan hari ini, tampilkan field jam check-in
    dateState = { valid: true, isToday: true, errorMsg: '' };
    if (amountEl) { amountEl.textContent = '0 hari (Hari Ini)'; amountEl.style.color = 'var(--warning)'; }
    if (noteEl)   { noteEl.textContent = 'Masukkan jam check-in di bawah'; noteEl.style.color = 'var(--warning)'; }
    if (hiddenEl) hiddenEl.value = 0;
    timeRow?.classList.remove('hidden');

    // default jam = 1 jam dari sekarang
    const defaultHour = new Date(now.getTime() + 1 * 60 * 60 * 1000);
    const hh          = String(defaultHour.getHours()).padStart(2, '0');
    const mm          = String(defaultHour.getMinutes()).padStart(2, '0');
    const timeInput   = document.getElementById('checkin_hour');
    if (timeInput && !timeInput.value) timeInput.value = `${hh}:${mm}`;

  } else {
    // tanggal masa depan - semua lead time diperbolehkan
    if (amountEl) { amountEl.textContent = `${diffDays} hari`; amountEl.style.color = ''; }
    if (hiddenEl) hiddenEl.value = diffDays;
    timeRow?.classList.add('hidden');
    const opts = { day:'numeric', month:'long', year:'numeric' };
    if (noteEl) { noteEl.textContent = `${arrival.toLocaleDateString('id-ID', opts)} (${diffDays} hari dari sekarang)`; noteEl.style.color = ''; }
  }
}

// pasang event listener: ketika DRP selesai (check-in + check-out dipilih), update lead time
document.addEventListener('drp:changed', updateLeadTime);


// hitung total biaya (harga per malam * jumlah malam)
function updateTotal() {
  const wk = parseInt(document.getElementById('stays_in_week_nights')?.value) || 0;
  const we = parseInt(document.getElementById('stays_in_weekend_nights')?.value) || 0;
  const el = document.getElementById('total-price');
  if (el) el.textContent = 'Rp ' + ((wk + we) * calcAdr()).toLocaleString('id-ID');
}

// bangun ringkasan reservasi di step 3
function buildSummary() {
  const data   = collectFormData();
  const grid   = document.getElementById('summary-grid');
  const nights = (parseInt(data.stays_in_week_nights)||0) + (parseInt(data.stays_in_weekend_nights)||0);
  const total  = nights * calcAdr();

  const items = [
    { label:'Nama Tamu',   value: data.guest_name },
    { label:'Email',       value: data.guest_email || '—' },
    { label:'Telepon/WA',  value: data.guest_phone || '—' },
    { label:'Hotel',       value: data.hotel },
    { label:'Kamar',       value: selectedRoom ? `Tipe ${selectedRoom.type} — ${selectedRoom.name}` : '—' },
    { label:'Kapasitas',   value: selectedRoom ? `Maks. ${selectedRoom.maxGuests} tamu` : '—' },
    { label:'Tamu',        value: `${data.adults} dewasa${+data.children ? ', '+data.children+' anak' : ''}` },
    { label:'Kedatangan',  value: `${data.arrival_date_day_of_month} ${data.arrival_date_month} ${data.arrival_date_year}` },
    { label:'Durasi',      value: `${nights} malam` },
    { label:'Paket Makan', value: MEAL_LABELS[data.meal] || data.meal },
    { label:'Deposit',     value: data.deposit_type },
    { label:'Harga/Malam', value: 'Rp ' + calcAdr().toLocaleString('id-ID') },
    { label:'Lead Time',   value: (document.getElementById('lead_time')?.value || 0) + ' hari' },
  ];

  grid.innerHTML = items.map(i => `
    <div class="summary-item">
      <div class="s-label">${i.label}</div>
      <div class="s-value">${i.value}</div>
    </div>`).join('');

  document.getElementById('total-price').textContent = 'Rp ' + total.toLocaleString('id-ID');
}

// kumpulkan semua data dari form ke dalam satu object
function collectFormData() {
  const form = document.getElementById('booking-form');
  const data = {};
  new FormData(form).forEach((v, k) => { data[k] = v; });
  const hotelRadio = form.querySelector('input[name="hotel"]:checked');
  data.hotel = hotelRadio ? hotelRadio.value : 'City Hotel';
  return data;
}

// submit form - kirim data ke backend via fetch (AJAX)
document.getElementById('booking-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn  = document.getElementById('submit-btn');
  const txt  = document.getElementById('submit-text');
  const spin = document.getElementById('submit-spinner');
  btn.disabled = true; txt.textContent = 'Memproses...'; spin.classList.remove('hidden');

  try {
    // Cek ketersediaan terkini sebelum submit
    await fetchRoomAvailability();
    if (selectedRoom) {
      const inv = roomAvailability[selectedRoom.type];
      if (inv && inv.available === 0) {
        showRoomSoldOutWarning(selectedRoom.type);
        goToStep(0); // kembalikan ke pemilihan kamar
        btn.disabled = false;
        txt.textContent = 'Konfirmasi Reservasi';
        spin.classList.add('hidden');
        return;
      }
    }

    const data = collectFormData();
    const res  = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    const resJson = await res.json();
    if (!res.ok) {
      // Tangani error dari server (misalnya kamar penuh)
      alert(resJson.error || 'Terjadi kesalahan. Silakan coba lagi.');
      if (res.status === 409) {
        // Kamar habis → refresh ketersediaan & kembali ke step 0
        await fetchRoomAvailability();
        goToStep(0);
      }
      return;
    }
    // Update stok lokal setelah booking sukses
    if (roomAvailability[selectedRoom?.type]) {
      roomAvailability[selectedRoom.type].available = Math.max(
        0, roomAvailability[selectedRoom.type].available - 1
      );
      updateAvailabilityBadges();
    }
    showResult(resJson, data);
  } catch (err) {
    console.error(err);
    alert('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    btn.disabled = false; txt.textContent = 'Konfirmasi Reservasi'; spin.classList.add('hidden');
  }
});

// tampilkan overlay hasil reservasi beserta info risiko dari AI
function showResult(result, data) {
  const riskIcons  = { high:'!', medium:'', low:'' };
  const riskTitles = { high:'Reservasi Diterima dengan Catatan', medium:'Reservasi Berhasil', low:'Reservasi Berhasil' };
  const riskDescs  = {
    high:   `Selamat datang, ${data.guest_name}! Reservasi Anda diterima. Tim kami akan menghubungi Anda terkait ketentuan deposit.`,
    medium: `Terima kasih, ${data.guest_name}! Reservasi Anda berhasil. Perhatikan kebijakan pembatalan yang berlaku.`,
    low:    `Terima kasih, ${data.guest_name}! Reservasi Anda berhasil dikonfirmasi. Kami nantikan kedatangan Anda.`,
  };

  document.getElementById('result-icon').textContent       = riskIcons[result.risk_level];
  document.getElementById('result-title').textContent      = riskTitles[result.risk_level];
  document.getElementById('result-desc').textContent       = riskDescs[result.risk_level];
  document.getElementById('result-booking-id').textContent = 'No. Reservasi: ' + result.booking_id;

  // info kebijakan dan probabilitas AI hanya untuk staff dashboard, tidak ditampilkan ke tamu
  const pb = document.getElementById('result-policy-box');
  if (pb) pb.style.display = 'none';

  document.getElementById('result-overlay').classList.remove('hidden');
}

// inisialisasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', async () => {
  const params    = new URLSearchParams(window.location.search);
  const preHotel  = params.get('hotel');
  const preselect = params.get('room')?.toUpperCase();

  // Pasang event listener untuk pilihan hotel
  document.querySelectorAll('input[name="hotel"]').forEach(radio => {
    radio.addEventListener('change', onHotelChange);
  });

  // Tentukan hotel aktif dari URL jika ada
  if (preHotel) {
    const r = document.querySelector(`input[name="hotel"][value="${preHotel}"]`);
    if (r) r.checked = true;
  } else if (preselect) {
    // Jika kamar yang di-preselect adalah kamar khusus Resort (C, H, L), aktifkan Resort Hotel
    if (['C', 'H', 'L'].includes(preselect)) {
      const r = document.querySelector('input[name="hotel"][value="Resort Hotel"]');
      if (r) r.checked = true;
    } else if (preselect === 'B') {
      const r = document.querySelector('input[name="hotel"][value="City Hotel"]');
      if (r) r.checked = true;
    }
  }

  // Sinkronkan styling visual card hotel
  document.querySelectorAll('.hotel-pick-card').forEach(card => {
    const inp = card.querySelector('input[name="hotel"]');
    card.classList.toggle('active', inp?.checked);
  });

  // Render dulu daftar kamar sesuai hotel yang aktif
  renderRoomPicker(preselect);
  updateAdrDisplay();

  // Fetch ketersediaan kamar real-time
  await fetchRoomAvailability();

  // Polling setiap 30 detik agar selalu up-to-date
  setInterval(fetchRoomAvailability, 30_000);

  // Format & batasi input nomor telepon secara real-time
  const phoneInp = document.getElementById('guest_phone');
  if (phoneInp) {
    phoneInp.addEventListener('input', (e) => {
      let val = e.target.value;
      const startsWithPlus = val.startsWith('+');
      // Hanya perbolehkan angka (pertahankan + jika di awal)
      let digits = val.replace(/\D/g, '');
      // Batasi maksimal 15 digit angka (standar internasional E.164)
      if (digits.length > 15) {
        digits = digits.slice(0, 15);
      }
      e.target.value = (startsWithPlus ? '+' : '') + digits;

      // Hapus pesan error jika panjang sudah valid
      if (digits.length >= 8 && digits.length <= 15) {
        clearFieldError('guest_phone');
      }
    });

    phoneInp.addEventListener('blur', () => {
      const val = phoneInp.value.trim();
      if (!val) return;
      const digits = val.replace(/\D/g, '');
      if (digits.length < 8) {
        showFieldError('guest_phone', 'Nomor telepon minimal 8 digit angka');
      } else if (digits.length > 15) {
        showFieldError('guest_phone', 'Nomor telepon maksimal 15 digit angka');
      } else {
        clearFieldError('guest_phone');
      }
    });
  }
});
