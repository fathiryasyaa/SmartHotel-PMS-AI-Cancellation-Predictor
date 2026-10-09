// pms.js - logika halaman Property Management System (PMS)

let allPmsBookings = [];  // semua data booking dari API
let activeStatus   = '';  // filter status yang aktif saat ini
let pendingAction  = null; // aksi yang menunggu konfirmasi { bookingId, newStatus }

// label dan class untuk tiap status PMS
const STATUS_META = {
  reserved:       { label: 'Reservasi',      cls: 'reserved' },
  checked_in:     { label: 'Check-In',       cls: 'checked_in' },
  checked_out:    { label: 'Check-Out',      cls: 'checked_out' },
  canceled_guest: { label: 'Batal (Tamu)',   cls: 'canceled_guest' },
  canceled_staff: { label: 'Batal (Staff)',  cls: 'canceled_staff' },
  no_show:        { label: 'No Show',        cls: 'no_show' },
};

// transisi status yang diperbolehkan (misalnya reserved bisa ke checked_in, tapi checked_out tidak bisa ke mana-mana)
const ALLOWED_TRANSITIONS = {
  reserved:       ['checked_in', 'canceled_staff', 'no_show'],
  checked_in:     ['checked_out', 'canceled_staff'],
  checked_out:    [],
  canceled_guest: [],
  canceled_staff: [],
  no_show:        [],
};

// inisialisasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  loadStats();
  loadBookings();
  setInterval(() => { loadStats(); loadBookings(); }, 30000); // auto-refresh 30 detik
  initFilterTabs();
  initSearch();
  initModal();
  initSidebarToggle();
});

// tampilkan tanggal hari ini di topbar
function updateDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = new Date().toLocaleDateString('id-ID', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
  });
}

// ambil dan tampilkan statistik KPI (jumlah per status)
async function loadStats() {
  try {
    const res  = await fetch('/api/pms/stats');
    const data = await res.json();
    document.getElementById('pms-reserved').textContent = data.reserved;
    document.getElementById('pms-checkin').textContent  = data.checked_in;
    document.getElementById('pms-checkout').textContent = data.checked_out;
    document.getElementById('pms-canceled').textContent = data.canceled;
    document.getElementById('pms-noshow').textContent   = data.no_show;
  } catch (e) { console.error(e); }
}

// ambil data booking dari backend (dengan filter status jika ada)
async function loadBookings() {
  try {
    const url = activeStatus ? `/api/pms/bookings?status=${activeStatus}` : '/api/pms/bookings';
    const res  = await fetch(url);
    allPmsBookings = await res.json();
    renderTable(allPmsBookings);
  } catch (e) { console.error(e); }
}

// render tabel booking (bisa difilter berdasarkan pencarian)
function renderTable(bookings) {
  const tbody = document.getElementById('pms-tbody');
  if (!tbody) return;

  // filter lokal berdasarkan pencarian (nama, ID, telepon, email)
  const q = (document.getElementById('pms-search')?.value || '').toLowerCase().trim();
  const filtered = q
    ? bookings.filter(b =>
        (b.id || '').toLowerCase().includes(q) ||
        (b.guest_name || '').toLowerCase().includes(q) ||
        (b.guest_phone || '').toLowerCase().includes(q) ||
        (b.guest_email || '').toLowerCase().includes(q))
    : bookings;

  if (!filtered.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="9">Tidak ada data untuk filter ini</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const st     = STATUS_META[b.pms_status] || { label: b.pms_status, cls: '' };
    const nights = (parseInt(b.stays_in_week_nights) || 0) + (parseInt(b.stays_in_weekend_nights) || 0);
    const canAct = ALLOWED_TRANSITIONS[b.pms_status]?.length > 0; // apakah ada aksi yang bisa dilakukan
    const riskDot = { high: 'Tinggi', medium: 'Sedang', low: 'Rendah' }[b.risk_level] || '';
    const riskCls = b.risk_level || '';

    // Bersihkan format nomor untuk WhatsApp
    const phoneDigits = (b.guest_phone || '').replace(/\D/g, '');
    let waUrl = '';
    if (phoneDigits) {
      const waPrefix = phoneDigits.startsWith('0') ? '62' + phoneDigits.slice(1) : phoneDigits;
      waUrl = `https://wa.me/${waPrefix}?text=${encodeURIComponent(`Halo ${b.guest_name}, kami dari The Grand Azura Hotel terkait reservasi ${b.id}.`)}`;
    }

    return `
      <tr>
        <td><strong>${b.id}</strong></td>
        <td>
          <div class="guest-info-cell">
            <strong class="guest-name-title">${escHtml(b.guest_name)}</strong>
            <div class="guest-contacts-row">
              ${b.guest_phone
                ? `<a href="tel:${escHtml(b.guest_phone)}" class="contact-btn phone" title="Hubungi via Telepon">${escHtml(b.guest_phone)}</a>
                   ${waUrl ? `<a href="${waUrl}" target="_blank" rel="noopener" class="contact-btn wa" title="Hubungi via WhatsApp">WhatsApp</a>` : ''}`
                : `<span class="contact-empty">Telp: —</span>`
              }
            </div>
            ${b.guest_email
              ? `<div class="guest-email-row"><a href="mailto:${escHtml(b.guest_email)}" class="contact-btn email" title="Kirim Email">${escHtml(b.guest_email)}</a></div>`
              : ''
            }
          </div>
        </td>
        <td>${escHtml(b.hotel)}</td>
        <td>${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}</td>
        <td>${nights} malam</td>
        <td>Tipe ${b.reserved_room_type}</td>
        <td><span class="risk-label risk-${riskCls}">${riskDot}</span> <span style="font-size:.78rem">${b.probability}%</span></td>
        <td><span class="pms-status-badge ${st.cls}">${st.label}</span></td>
        <td>
          ${canAct
            ? `<button class="btn-pms-action" onclick="openPmsModal('${b.id}')">Update Status</button>`
            : `<span style="font-size:.75rem;color:var(--light-text)">—</span>`
          }
        </td>
      </tr>`;
  }).join('');
}

// setup tab filter status (Semua, Reservasi, Check-In, dll)
function initFilterTabs() {
  document.getElementById('pms-filter-tabs')?.addEventListener('click', e => {
    const btn = e.target.closest('.pms-tab');
    if (!btn) return;
    document.querySelectorAll('.pms-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    activeStatus = btn.dataset.status;
    loadBookings(); // reload dengan filter baru
  });
}

// setup input pencarian (filter real-time di tabel)
function initSearch() {
  document.getElementById('pms-search')?.addEventListener('input', () => {
    renderTable(allPmsBookings);
  });
}

// buka modal update status untuk booking tertentu
function openPmsModal(bookingId) {
  const booking = allPmsBookings.find(b => b.id === bookingId);
  if (!booking) return;

  const modal = document.getElementById('pms-modal');
  document.getElementById('pms-modal-id').textContent   = booking.id;
  document.getElementById('pms-modal-name').textContent = booking.guest_name;
  document.getElementById('pms-modal-error').classList.add('hidden');
  document.getElementById('pms-note').value = '';

  // Render info kontak tamu di dalam modal
  const contactEl = document.getElementById('pms-modal-contact');
  if (contactEl) {
    const phoneDigits = (booking.guest_phone || '').replace(/\D/g, '');
    const waPrefix = phoneDigits.startsWith('0') ? '62' + phoneDigits.slice(1) : phoneDigits;
    const waUrl = phoneDigits ? `https://wa.me/${waPrefix}?text=${encodeURIComponent(`Halo ${booking.guest_name}, kami dari The Grand Azura Hotel terkait reservasi ${booking.id}.`)}` : '';

    contactEl.innerHTML = `
      <div class="modal-contact-box">
        <div class="mcb-item">
          <span class="mcb-label">Kontak Telepon:</span>
          <span class="mcb-val">
            ${booking.guest_phone
              ? `<strong>${escHtml(booking.guest_phone)}</strong>
                 <div class="mcb-actions">
                   <a href="tel:${escHtml(booking.guest_phone)}" class="contact-btn phone">Telepon</a>
                   ${waUrl ? `<a href="${waUrl}" target="_blank" rel="noopener" class="contact-btn wa">WhatsApp</a>` : ''}
                 </div>`
              : '<span class="contact-empty">Belum ada nomor</span>'
            }
          </span>
        </div>
        <div class="mcb-item">
          <span class="mcb-label">Email:</span>
          <span class="mcb-val">
            ${booking.guest_email
              ? `<a href="mailto:${escHtml(booking.guest_email)}" class="contact-btn email">${escHtml(booking.guest_email)}</a>`
              : '<span class="contact-empty">Belum ada email</span>'
            }
          </span>
        </div>
      </div>
    `;
  }

  // tampilkan status saat ini
  const curSt = STATUS_META[booking.pms_status] || { label: booking.pms_status, cls: '' };
  const curEl = document.getElementById('pms-modal-current');
  curEl.textContent = curSt.label;
  curEl.className   = `pms-status-badge ${curSt.cls}`;

  // render tombol aksi berdasarkan transisi yang diperbolehkan
  const allowed    = ALLOWED_TRANSITIONS[booking.pms_status] || [];
  const actionMeta = {
    checked_in:     { label: 'Check-In',          cls: 'btn-checkin' },
    checked_out:    { label: 'Check-Out',          cls: 'btn-checkout' },
    canceled_staff: { label: 'Batalkan (Staff)',   cls: 'btn-cancel' },
    no_show:        { label: 'Tandai No Show',     cls: 'btn-noshow' },
    reserved:       { label: 'Reset ke Reservasi', cls: 'btn-reset' },
  };

  const grid = document.getElementById('pms-action-grid');
  grid.innerHTML = allowed.map(s => {
    const m = actionMeta[s] || { label: s, cls: '' };
    return `<button class="pms-action-btn ${m.cls}" data-status="${s}">
      ${m.label}
    </button>`;
  }).join('');

  // field catatan hanya tampil kalau ada opsi cancel
  const noteWrap = document.getElementById('pms-note-wrap');
  noteWrap.style.display = allowed.includes('canceled_staff') ? '' : 'none';

  // sembunyikan tombol konfirmasi, pakai klik langsung di action button
  document.getElementById('pms-modal-confirm').style.display = 'none';

  // klik action button langsung eksekusi
  grid.querySelectorAll('.pms-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      executeStatusUpdate(booking.id, btn.dataset.status);
    });
  });

  modal.classList.remove('hidden');
}

// kirim request update status ke backend
async function executeStatusUpdate(bookingId, newStatus) {
  const note  = document.getElementById('pms-note').value.trim();
  const errEl = document.getElementById('pms-modal-error');
  errEl.classList.add('hidden');

  try {
    const res  = await fetch('/api/pms/status', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ booking_id: bookingId, status: newStatus, note }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Gagal update status.';
      errEl.classList.remove('hidden');
      return;
    }

    closePmsModal();
    await loadStats();    // refresh KPI
    await loadBookings(); // refresh tabel
    showPmsToast(`Status ${bookingId} diperbarui → ${STATUS_META[newStatus]?.label || newStatus}`);
  } catch (e) {
    errEl.textContent = 'Terjadi kesalahan server.';
    errEl.classList.remove('hidden');
  }
}

function closePmsModal() {
  document.getElementById('pms-modal').classList.add('hidden');
  pendingAction = null;
}

// setup event listener modal (tombol tutup & klik di luar)
function initModal() {
  document.getElementById('pms-modal-cancel')?.addEventListener('click', closePmsModal);
  document.getElementById('pms-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('pms-modal')) closePmsModal();
  });
}

// toggle sidebar di mobile
function initSidebarToggle() {
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.getElementById('sidebar-toggle');
    if (sidebar && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

// tampilkan toast notifikasi di pojok bawah
function showPmsToast(msg) {
  let t = document.getElementById('pms-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'pms-toast';
    t.style.cssText = `
      position:fixed;bottom:2rem;left:50%;transform:translateX(-50%) translateY(20px);
      background:var(--dark);color:var(--white);padding:.85rem 1.8rem;border-radius:40px;
      font-size:.85rem;font-weight:600;box-shadow:var(--shadow-lg);
      opacity:0;pointer-events:none;transition:opacity .3s,transform .3s;z-index:999;white-space:nowrap;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity   = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  setTimeout(() => {
    t.style.opacity   = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3500);
}

// helper: escape HTML untuk mencegah XSS
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
