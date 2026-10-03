// booking.js - logika form reservasi multi-step

// daftar semua tipe kamar beserta datanya
// maxGuests = kapasitas maksimal tamu, stock = jumlah kamar tersedia
const ROOMS = [
  { type:'A', name:'Standard Room',     maxGuests:2, stock:40, area:22, bed:'Twin Bed',    basePrice:950000,  img:'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600', desc:'Kamar nyaman dengan fasilitas esensial, cocok untuk perjalanan singkat.' },
  { type:'B', name:'Superior Room',     maxGuests:2, stock:35, area:28, bed:'Queen Bed',   basePrice:1100000, img:'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600', desc:'Dilengkapi ruang kerja dan view kota yang menenangkan.' },
  { type:'C', name:'Deluxe Room',       maxGuests:3, stock:30, area:32, bed:'King Bed',    basePrice:1200000, img:'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=600', desc:'Kamar luas dengan dekorasi premium dan pemandangan menakjubkan.' },
  { type:'D', name:'Deluxe Twin',       maxGuests:3, stock:20, area:34, bed:'Twin Bed',    basePrice:1350000, img:'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600', desc:'Ideal untuk dua tamu dengan dua tempat tidur terpisah.' },
  { type:'E', name:'Executive Room',    maxGuests:3, stock:25, area:40, bed:'King Bed',    basePrice:1500000, img:'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600', desc:'Fasilitas eksekutif lengkap dengan lounge akses dan sarapan premium.' },
  { type:'F', name:'Junior Suite',      maxGuests:4, stock:15, area:55, bed:'King Bed',    basePrice:1800000, img:'https://images.unsplash.com/photo-1631049552240-59c37f38802b?w=600', desc:'Ruang tamu terpisah dengan balkon pribadi menghadap taman.' },
  { type:'G', name:'Family Suite',      maxGuests:5, stock:10, area:65, bed:'King + Sofa', basePrice:2200000, img:'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600', desc:'Dirancang khusus untuk keluarga dengan area bermain anak tersendiri.' },
  { type:'H', name:'Grand Suite',       maxGuests:4, stock:8,  area:80, bed:'Super King',  basePrice:2800000, img:'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600', desc:'Kemewahan sepenuhnya dengan jacuzzi dan ruang makan privat.' },
  { type:'I', name:'Royal Suite',       maxGuests:5, stock:4,  area:100, bed:'Super King', basePrice:3500000, img:'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600', desc:'Penginapan kelas dunia dengan butler pribadi 24 jam.' },
  { type:'L', name:'Presidential Suite',maxGuests:6, stock:2,  area:120, bed:'Super King', basePrice:5000000, img:'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600', desc:'Puncak kemewahan: panorama 180°, spa privat, dan ruang konferensi.' },
];

// surcharge = biaya tambahan per paket makan (bisa negatif untuk diskon)
const MEAL_SURCHARGE = { BB:0, HB:150000, FB:280000, SC:-80000 };
const MEAL_LABELS    = { BB:'Bed & Breakfast', HB:'Half Board', FB:'Full Board', SC:'Self Catering' };

let selectedRoom = null; // kamar yang sedang dipilih user

// render semua kartu pilihan kamar ke dalam grid
function renderRoomPicker(preselect) {
  const grid = document.getElementById('room-picker-grid');
  if (!grid) return;

  grid.innerHTML = ROOMS.map(r => {
    const soldOut = r.stock === 0;
    const sel     = selectedRoom?.type === r.type;
    return `
    <div class="room-pick-card ${sel ? 'selected' : ''} ${soldOut ? 'sold-out' : ''}"
         data-type="${r.type}" role="button" tabindex="${soldOut ? -1 : 0}"
         aria-pressed="${sel}"
         onclick="${soldOut ? '' : `selectRoom('${r.type}')`}"
         onkeydown="if(event.key==='Enter')selectRoom('${r.type}')">
      <div class="rpc-img" style="background-image:url('${r.img}')">
        ${soldOut ? '<div class="rpc-soldout-badge">Penuh</div>' : ''}
        ${r.stock <= 5 && !soldOut ? `<div class="rpc-limited-badge">Sisa ${r.stock} kamar</div>` : ''}
      </div>
      <div class="rpc-body">
        <div class="rpc-header">
          <span class="rpc-type-badge">Tipe ${r.type}</span>
          <span class="rpc-price">Rp ${r.basePrice.toLocaleString('id-ID')}<span>/malam</span></span>
        </div>
        <h3 class="rpc-name">${r.name}</h3>
        <p class="rpc-desc">${r.desc}</p>
        <div class="rpc-features">
          <span>👥 Maks. ${r.maxGuests} tamu</span>
          <span>📐 ${r.area} m²</span>
          <span>🛏 ${r.bed}</span>
        </div>
        <div class="rpc-select-indicator">
          ${sel ? '✅ Dipilih' : (soldOut ? '❌ Penuh' : 'Pilih Kamar')}
        </div>
      </div>
    </div>`;
  }).join('');

  // kalau ada preselect dari URL query (?room=C), langsung pilih
  if (preselect) selectRoom(preselect, false);
}

// pilih kamar berdasarkan tipe, update tampilan semua kartu
function selectRoom(type, scroll = true) {
  selectedRoom = ROOMS.find(r => r.type === type) || null;
  if (!selectedRoom) return;

  document.querySelectorAll('.room-pick-card').forEach(card => {
    const isSelected = card.dataset.type === type;
    card.classList.toggle('selected', isSelected);
    card.setAttribute('aria-pressed', isSelected);
    card.querySelector('.rpc-select-indicator').textContent = isSelected ? '✅ Dipilih' : 'Pilih Kamar';
  });

  document.getElementById('room-pick-error')?.classList.add('hidden');
  updateSelectedRoomBanners();
  updateAdrDisplay();

  // scroll ke kartu yang dipilih
  if (scroll) {
    const card = document.querySelector(`.room-pick-card[data-type="${type}"]`);
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// update banner ringkasan kamar di step 1 dan step 2
function updateSelectedRoomBanners() {
  const html = selectedRoom
    ? `<div class="srb-inner">
        <span class="srb-icon">🛏</span>
        <div>
          <strong>Tipe ${selectedRoom.type} — ${selectedRoom.name}</strong>
          <span>Maks. ${selectedRoom.maxGuests} tamu · ${selectedRoom.area} m² · ${selectedRoom.bed}</span>
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
    if (['adults','children','babies'].includes(btn.dataset.target)) checkCapacity();
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
      `⚠️ Tipe ${selectedRoom.type} (${selectedRoom.name}) hanya menampung maksimal ${selectedRoom.maxGuests} tamu. Kurangi jumlah tamu atau pilih kamar yang lebih besar.`;
    return false;
  }
  warnEl?.classList.add('hidden');
  return true;
}

// validasi step 1 (nama & email tamu)
function validateStep1() {
  const name = document.getElementById('guest_name').value.trim();
  if (!name) { showFieldError('guest_name', 'Nama lengkap wajib diisi'); return false; }
  clearFieldError('guest_name');

  const email      = document.getElementById('guest_email').value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email)                    { showFieldError('guest_email', 'Email wajib diisi'); return false; }
  if (!emailRegex.test(email))   { showFieldError('guest_email', 'Format email tidak valid'); return false; }
  clearFieldError('guest_email');

  if (!checkCapacity()) return false;
  return true;
}

// validasi step 2 (tanggal & durasi menginap)
function validateStep2() {
  // 1. tanggal harus valid
  if (!dateState.valid) {
    showDateError(dateState.errorMsg);
    return false;
  }

  // 2. kalau kedatangan hari ini, wajib isi jam check-in
  if (dateState.isToday) {
    const timeInput = document.getElementById('checkin_hour');
    const timeVal   = timeInput?.value;
    if (!timeVal) {
      showDateError('⚠️ Masukkan jam check-in untuk kedatangan hari ini.');
      timeInput?.focus();
      return false;
    }
    // jam check-in harus setelah jam sekarang
    const [hh, mm] = timeVal.split(':').map(Number);
    const now       = new Date();
    const checkinMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm).getTime();
    const nowMs     = now.getTime();
    if (checkinMs <= nowMs) {
      const nowHH = String(now.getHours()).padStart(2,'0');
      const nowMM = String(now.getMinutes()).padStart(2,'0');
      showDateError(`⚠️ Jam check-in sudah terlewat. Masukkan jam setelah ${nowHH}:${nowMM} (jam saat ini).`);
      timeInput?.focus();
      return false;
    }
    clearDateError();
  }

  // 3. minimal 1 malam menginap
  const wk = parseInt(document.getElementById('stays_in_week_nights').value) || 0;
  const we = parseInt(document.getElementById('stays_in_weekend_nights').value) || 0;
  if (wk + we < 1) {
    showNumberInputError('stays_in_week_nights', 'Total malam minimal 1');
    return false;
  }
  clearNumberInputError('stays_in_week_nights');
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

// isi default tanggal kedatangan = hari ini
function setDefaultArrivalDate() {
  const now       = new Date();
  const monthSel  = document.getElementById('arrival_date_month');
  const dayInput  = document.getElementById('arrival_date_day_of_month');
  const yearInput = document.getElementById('arrival_date_year');
  if (monthSel)  monthSel.value  = MONTHS_LIST[now.getMonth()];
  if (dayInput)  dayInput.value  = now.getDate();
  if (yearInput) {
    yearInput.value = now.getFullYear();
    yearInput.min   = now.getFullYear(); // tahun tidak boleh kurang dari sekarang
  }
}

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
    dateState = { valid: false, isToday: false, errorMsg: '⚠️ Tanggal sudah lewat. Pilih tanggal hari ini atau yang akan datang.' };
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

// pasang event listener ke semua field tanggal
['arrival_date_day_of_month', 'arrival_date_month', 'arrival_date_year'].forEach(id => {
  document.getElementById(id)?.addEventListener('change', updateLeadTime);
  document.getElementById(id)?.addEventListener('input',  updateLeadTime);
});

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
    const data = collectFormData();
    const res  = await fetch('/api/booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Server error');
    showResult(await res.json(), data);
  } catch {
    alert('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    btn.disabled = false; txt.textContent = 'Konfirmasi Reservasi'; spin.classList.add('hidden');
  }
});

// tampilkan overlay hasil reservasi beserta info risiko dari AI
function showResult(result, data) {
  const riskIcons  = { high:'⚠️', medium:'🔔', low:'✅' };
  const riskTitles = { high:'Reservasi Diterima dengan Catatan', medium:'Reservasi Berhasil!', low:'Reservasi Berhasil!' };
  const riskDescs  = {
    high:   `Selamat datang, ${data.guest_name}! Reservasi Anda diterima. Tim kami akan menghubungi Anda terkait ketentuan deposit.`,
    medium: `Terima kasih, ${data.guest_name}! Reservasi Anda berhasil. Perhatikan kebijakan pembatalan yang berlaku.`,
    low:    `Terima kasih, ${data.guest_name}! Reservasi Anda berhasil dikonfirmasi. Kami nantikan kedatangan Anda.`,
  };

  document.getElementById('result-icon').textContent       = riskIcons[result.risk_level];
  document.getElementById('result-title').textContent      = riskTitles[result.risk_level];
  document.getElementById('result-desc').textContent       = riskDescs[result.risk_level];
  document.getElementById('result-booking-id').textContent = '📌 ' + result.booking_id;

  // info kebijakan dan probabilitas AI hanya untuk staff dashboard, tidak ditampilkan ke tamu
  const pb = document.getElementById('result-policy-box');
  if (pb) pb.style.display = 'none';

  document.getElementById('result-overlay').classList.remove('hidden');
}

// inisialisasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  const params    = new URLSearchParams(window.location.search);
  const preselect = params.get('room')?.toUpperCase(); // ambil preselect dari URL jika ada
  renderRoomPicker(preselect);
  updateAdrDisplay();
  setDefaultArrivalDate();
  updateLeadTime();
});
