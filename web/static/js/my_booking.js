// my_booking.js - logika halaman cek & batalkan reservasi untuk tamu

let allBookings    = [];   // semua reservasi hasil lookup
let currentBooking = null; // reservasi yang sedang dilihat detailnya
let lookupEmail    = '';   // simpan email untuk keperluan pembatalan

// mapping status PMS ke label yang ditampilkan ke tamu
const STATUS_LABELS = {
  reserved:       { text: 'Aktif',           cls: 'reserved' },
  checked_in:     { text: 'Sedang Check-In',  cls: 'checked_in' },
  checked_out:    { text: 'Sudah Check-Out',  cls: 'checked_out' },
  canceled_guest: { text: 'Dibatalkan',       cls: 'canceled_guest' },
  canceled_staff: { text: 'Dibatalkan Staff', cls: 'canceled_staff' },
  no_show:        { text: 'No Show',          cls: 'no_show' },
};

const MEAL_LABELS = {
  BB: 'Bed & Breakfast', HB: 'Half Board',
  FB: 'Full Board',      SC: 'Self Catering',
};

// sembunyikan semua panel (lookup, list, detail, success)
function hideAll() {
  ['lookup-card','booking-list','booking-detail','cancel-success']
    .forEach(id => document.getElementById(id)?.classList.add('hidden'));
}

// handle submit form pencarian reservasi
document.getElementById('lookup-form')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('lookup-email').value.trim();
  const name  = document.getElementById('guest-name-input').value.trim();
  const errEl = document.getElementById('lookup-error');
  const btn   = document.getElementById('lookup-btn');
  const txt   = document.getElementById('lookup-text');
  const spin  = document.getElementById('lookup-spinner');

  if (!email || !name) {
    errEl.textContent = 'Email dan nama tamu wajib diisi.';
    errEl.classList.remove('hidden');
    return;
  }
  errEl.classList.add('hidden');
  btn.disabled    = true;
  txt.textContent = 'Mencari...';
  spin.classList.remove('hidden');

  try {
    const res  = await fetch('/api/my-booking', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, guest_name: name }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Reservasi tidak ditemukan.';
      errEl.classList.remove('hidden');
      return;
    }

    lookupEmail = email;
    allBookings = data;

    // kalau hanya 1 reservasi, langsung ke detail; kalau lebih tampilkan list dulu
    if (allBookings.length === 1) {
      showDetail(allBookings[0]);
    } else {
      showBookingList(allBookings);
    }

  } catch {
    errEl.textContent = 'Terjadi kesalahan. Silakan coba lagi.';
    errEl.classList.remove('hidden');
  } finally {
    btn.disabled    = false;
    txt.textContent = 'Cari Reservasi';
    spin.classList.add('hidden');
  }
});

// tampilkan daftar reservasi jika tamu punya lebih dari 1
function showBookingList(bookings) {
  hideAll();
  const listEl  = document.getElementById('booking-list');
  const titleEl = document.getElementById('booking-list-title');
  const cardsEl = document.getElementById('booking-list-cards');

  titleEl.textContent = `${bookings.length} Reservasi Ditemukan`;

  cardsEl.innerHTML = bookings.map((b, i) => {
    const st     = STATUS_LABELS[b.pms_status] || { text: b.pms_status, cls: 'reserved' };
    const nights = (parseInt(b.stays_in_week_nights)||0) + (parseInt(b.stays_in_weekend_nights)||0);
    return `
    <div class="bl-card" onclick="showDetail(allBookings[${i}])">
      <div class="bl-card-left">
        <div class="bl-id">${b.id}</div>
        <div class="bl-name">${escHtml(b.guest_name)}</div>
        <div class="bl-sub">${b.hotel} · Tipe ${b.reserved_room_type} · ${nights} malam</div>
        <div class="bl-date">${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}</div>
      </div>
      <div class="bl-card-right">
        <span class="pms-status-guest ${st.cls}">${st.text}</span>
        <span class="bl-arrow">→</span>
      </div>
    </div>`;
  }).join('');

  listEl.classList.remove('hidden');
}

// tampilkan detail satu reservasi
function showDetail(b) {
  hideAll();
  currentBooking = b;

  const detail = document.getElementById('booking-detail');
  detail.classList.remove('hidden');

  // tombol kembali disesuaikan (ke list atau ke lookup)
  const backBtn = document.getElementById('btn-back-lookup');
  if (allBookings.length > 1) {
    backBtn.textContent = '← Daftar Reservasi';
    backBtn.onclick = () => showBookingList(allBookings);
  } else {
    backBtn.textContent = '← Cari Lain';
    backBtn.onclick = backToLookup;
  }

  // isi header detail
  document.getElementById('detail-id').textContent   = b.id;
  document.getElementById('detail-name').textContent = b.guest_name;

  const st = STATUS_LABELS[b.pms_status] || { text: b.pms_status, cls: 'reserved' };
  document.getElementById('detail-status-badge').innerHTML =
    `<span class="pms-status-guest ${st.cls}">${st.text}</span>`;

  // grid info detail reservasi
  const nights   = (parseInt(b.stays_in_week_nights)||0) + (parseInt(b.stays_in_weekend_nights)||0);
  const totalEst = nights * parseFloat(b.adr || 0);
  const items = [
    { label: 'Hotel',       value: b.hotel },
    { label: 'Email',       value: b.guest_email || '—' },
    { label: 'Kedatangan',  value: `${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}` },
    { label: 'Durasi',      value: `${nights} malam` },
    { label: 'Tamu',        value: `${b.adults} dewasa${parseInt(b.children) ? ', '+b.children+' anak' : ''}` },
    { label: 'Kamar',       value: 'Tipe ' + b.reserved_room_type },
    { label: 'Paket Makan', value: MEAL_LABELS[b.meal] || b.meal },
    { label: 'Deposit',     value: b.deposit_type },
    { label: 'Lead Time',   value: b.lead_time + ' hari' },
    { label: 'Est. Total',  value: 'Rp ' + totalEst.toLocaleString('id-ID') },
  ];

  document.getElementById('detail-grid').innerHTML = items.map(i => `
    <div class="detail-item">
      <div class="d-label">${i.label}</div>
      <div class="d-value">${escHtml(String(i.value))}</div>
    </div>`).join('');

  // kotak prediksi risiko AI - hanya untuk staff, disembunyikan dari tampilan tamu
  const riskBox = document.getElementById('detail-risk-box');
  if (riskBox) riskBox.style.display = 'none';

  // tampilkan/sembunyikan bagian pembatalan sesuai status
  const cancelSection  = document.getElementById('cancel-section');
  const finalStatusBox = document.getElementById('final-status-box');
  cancelSection.classList.add('hidden');
  finalStatusBox.classList.add('hidden');

  if (b.pms_status === 'reserved') {
    // hanya reservasi aktif yang bisa dibatalkan
    cancelSection.classList.remove('hidden');
    const note = document.getElementById('cancel-policy-note');
    if (b.deposit_type === 'Non Refund') {
      note.textContent = 'Perhatian: reservasi ini menggunakan deposit Non-Refundable. Biaya mungkin tidak dapat dikembalikan.';
    } else if (b.risk_level === 'medium') {
      note.textContent = 'Jika dibatalkan kurang dari 7 hari sebelum kedatangan, biaya pembatalan 50% akan dikenakan.';
    } else {
      note.textContent = 'Anda bisa membatalkan reservasi ini secara gratis.';
    }
  } else {
    // tampilkan pesan status akhir kalau sudah tidak bisa dibatalkan
    finalStatusBox.classList.remove('hidden');
    const msgs = {
      checked_in:     { cls: 'st-checkin',  text: 'Tamu sudah melakukan Check-In. Tidak bisa dibatalkan.' },
      checked_out:    { cls: 'st-checkout', text: 'Tamu sudah Check-Out. Reservasi selesai.' },
      canceled_guest: { cls: 'st-canceled', text: 'Reservasi ini sudah dibatalkan sebelumnya.' },
      canceled_staff: { cls: 'st-canceled', text: 'Reservasi ini dibatalkan oleh staff hotel. Hubungi kami untuk informasi lebih lanjut.' },
      no_show:        { cls: 'st-noshow',   text: 'Tamu dinyatakan No Show.' },
    };
    const m = msgs[b.pms_status] || { cls: '', text: b.pms_status };
    finalStatusBox.className  = `final-status-box ${m.cls}`;
    finalStatusBox.textContent = m.text;
  }
}

// handle klik tombol batalkan reservasi
document.getElementById('btn-cancel-booking')?.addEventListener('click', async () => {
  if (!currentBooking) return;
  if (!confirm('Yakin ingin membatalkan reservasi ini?')) return;

  const reason = document.getElementById('cancel-reason-input').value.trim();
  const btn    = document.getElementById('btn-cancel-booking');
  const txt    = document.getElementById('cancel-text');
  const spin   = document.getElementById('cancel-spinner');

  btn.disabled    = true;
  txt.textContent = 'Memproses...';
  spin.classList.remove('hidden');

  try {
    const res  = await fetch('/api/my-booking/cancel', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        booking_id: currentBooking.id,
        email:      lookupEmail,
        reason,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Gagal membatalkan. Coba lagi.');
      return;
    }

    showCancelSuccess(data);
  } catch {
    alert('Terjadi kesalahan. Silakan coba lagi.');
  } finally {
    btn.disabled    = false;
    txt.textContent = 'Batalkan Reservasi Ini';
    spin.classList.add('hidden');
  }
});

// tampilkan halaman sukses setelah pembatalan berhasil
function showCancelSuccess(data) {
  hideAll();
  const success = document.getElementById('cancel-success');
  success.classList.remove('hidden');
  document.getElementById('success-id').textContent = 'No. Reservasi: ' + data.booking_id;

  // info deposit berbeda tergantung tipe
  const note = document.getElementById('success-deposit-note');
  note.textContent = data.deposit_type === 'Non Refund'
    ? 'Reservasi Anda telah berhasil dibatalkan. Karena tipe deposit Non-Refundable, silakan hubungi hotel untuk informasi kebijakan pengembalian dana.'
    : 'Reservasi Anda telah berhasil dibatalkan. Tim kami akan menginformasikan proses selanjutnya.';
}

// kembali ke form pencarian (reset semua state)
function backToLookup() {
  hideAll();
  document.getElementById('lookup-card').classList.remove('hidden');
  currentBooking = null;
  allBookings    = [];
  lookupEmail    = '';
}

document.getElementById('btn-back-list')?.addEventListener('click', backToLookup);

// helper: escape HTML untuk mencegah XSS
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
