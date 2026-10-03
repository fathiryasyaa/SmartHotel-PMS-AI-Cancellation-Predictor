// dashboard.js - logika halaman staff dashboard

// variabel global
let allBookings   = [];      // semua data reservasi
let barChart      = null;    // instance chart bar
let donutChart    = null;    // instance chart donut
let pendingDelete = null;    // reservasi yang mau dihapus { id, guest_name }

// inisialisasi saat halaman selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  loadData();
  setInterval(loadData, 30000); // auto-refresh setiap 30 detik

  initSidebar();
  initFilters();
  initDeleteModal();
});

// tampilkan tanggal hari ini di topbar
function updateDate() {
  const el = document.getElementById('topbar-date');
  if (el) {
    el.textContent = new Date().toLocaleDateString('id-ID', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
  }
}

// setup navigasi sidebar
function initSidebar() {
  // klik link sidebar untuk pindah section
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  // link "lihat semua" di tabel recent juga bisa pindah section
  document.querySelectorAll('.view-all[data-section]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      switchSection(link.dataset.section);
    });
  });

  // toggle sidebar di mobile
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // klik di luar sidebar = tutup sidebar (di mobile)
  document.addEventListener('click', e => {
    const sidebar = document.getElementById('sidebar');
    const toggle  = document.getElementById('sidebar-toggle');
    if (sidebar && !sidebar.contains(e.target) && !toggle?.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // tombol refresh data
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    loadData();
    const btn = document.getElementById('refresh-btn');
    btn.style.transform = 'rotate(360deg)';
    setTimeout(() => { btn.style.transform = ''; }, 400);
  });
}

// pindah ke section tertentu (overview / bookings / high-risk / analytics / deleted)
function switchSection(id) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));

  const section = document.getElementById(`section-${id}`);
  if (section) section.classList.add('active');

  const link = document.querySelector(`.sidebar-link[data-section="${id}"]`);
  if (link) link.classList.add('active');

  // data deleted baru dimuat saat sectionnya dibuka (lazy load)
  if (id === 'deleted') loadDeletedData();
}

// ambil data reservasi dan statistik dari backend
async function loadData() {
  try {
    const [bookingsRes, statsRes] = await Promise.all([
      fetch('/api/bookings'),
      fetch('/api/stats'),
    ]);
    allBookings   = await bookingsRes.json();
    const stats   = await statsRes.json();

    updateKPIs(stats);
    updateCharts(stats);
    renderRecentTable(allBookings.slice(0, 5)); // hanya 5 terbaru di overview
    renderAllTable(allBookings);
    renderHighRiskCards(allBookings.filter(b => b.risk_level === 'high'));
  } catch (err) {
    console.error('Failed to load data:', err);
  }
}

// ambil data reservasi yang sudah dihapus
async function loadDeletedData() {
  try {
    const res  = await fetch('/api/bookings/deleted');
    const data = await res.json();
    renderDeletedTable(data);
  } catch (err) {
    console.error('Failed to load deleted bookings:', err);
  }
}

// update angka KPI cards dengan animasi counter
function updateKPIs(stats) {
  animateCount('kpi-total',  stats.total);
  animateCount('kpi-high',   stats.high);
  animateCount('kpi-medium', stats.medium);
  animateCount('kpi-low',    stats.low);

  const avgEl = document.getElementById('kpi-avg');
  if (avgEl) avgEl.textContent = stats.avg_probability + '%';
}

// animasi angka naik dari nilai lama ke nilai baru
function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const steps = 600 / 16;
  const inc   = (target - start) / steps;
  let cur = start, count = 0;
  const timer = setInterval(() => {
    cur += inc; count++;
    el.textContent = Math.round(cur);
    if (count >= steps) { el.textContent = target; clearInterval(timer); }
  }, 16);
}

// update kedua chart sekaligus
function updateCharts(stats) {
  updateBarChart(stats);
  updateDonutChart(stats);
}

// chart bar - distribusi risiko
function updateBarChart(stats) {
  const ctx = document.getElementById('riskBarChart')?.getContext('2d');
  if (!ctx) return;

  const data = {
    labels: ['Risiko Tinggi', 'Risiko Sedang', 'Risiko Rendah'],
    datasets: [{
      label: 'Jumlah Reservasi',
      data: [stats.high, stats.medium, stats.low],
      backgroundColor: ['rgba(192,57,43,0.15)', 'rgba(212,160,23,0.15)', 'rgba(39,100,58,0.15)'],
      borderColor:     ['#C0392B', '#D4A017', '#27643A'],
      borderWidth: 2, borderRadius: 6,
    }],
  };
  const options = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw} reservasi` } } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
      x: { ticks: { font: { size: 11 } }, grid: { display: false } },
    },
  };

  // kalau chart sudah ada, update data-nya saja (tidak buat ulang)
  if (barChart) { barChart.data = data; barChart.update(); }
  else barChart = new Chart(ctx, { type: 'bar', data, options });
}

// chart donut - komposisi risiko
function updateDonutChart(stats) {
  const ctx   = document.getElementById('riskDonutChart')?.getContext('2d');
  if (!ctx) return;
  const total = stats.total || 1;
  const data  = {
    labels: ['Risiko Tinggi', 'Risiko Sedang', 'Risiko Rendah'],
    datasets: [{
      data: [stats.high, stats.medium, stats.low],
      backgroundColor: ['#C0392B', '#D4A017', '#27643A'],
      borderWidth: 0, hoverOffset: 6,
    }],
  };
  const options = {
    responsive: true, cutout: '68%',
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => ` ${c.raw} (${Math.round(c.raw/total*100)}%)` } } },
  };

  if (donutChart) { donutChart.data = data; donutChart.update(); }
  else donutChart = new Chart(ctx, { type: 'doughnut', data, options });

  // render legend manual di bawah donut
  const legend = document.getElementById('donut-legend');
  if (legend) {
    const colors = ['#C0392B', '#D4A017', '#27643A'];
    legend.innerHTML = ['Risiko Tinggi','Risiko Sedang','Risiko Rendah'].map((l,i) => `
      <div class="legend-item">
        <div class="legend-dot" style="background:${colors[i]}"></div>
        <span>${l}: <strong>${[stats.high,stats.medium,stats.low][i]}</strong></span>
      </div>`).join('');
  }
}

// render tabel 5 reservasi terbaru di section overview
function renderRecentTable(bookings) {
  const tbody = document.getElementById('recent-tbody');
  if (!tbody) return;
  if (!bookings.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">Belum ada data reservasi</td></tr>';
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${escHtml(b.guest_name)}</td>
      <td>${escHtml(b.hotel)}</td>
      <td>${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}</td>
      <td>${nights(b)} malam</td>
      <td class="prob-cell ${b.risk_level}">${b.probability}%</td>
      <td><span class="risk-badge ${b.risk_level}">${b.risk_label}</span></td>
      <td style="max-width:180px;white-space:normal;font-size:0.78rem">${escHtml(b.policy)}</td>
    </tr>`).join('');
}

// render tabel semua reservasi di section "Semua Reservasi"
function renderAllTable(bookings) {
  const tbody = document.getElementById('all-tbody');
  if (!tbody) return;
  if (!bookings.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="12">Belum ada data reservasi</td></tr>';
    return;
  }

  // label status PMS dengan warna berbeda per status
  const PMS_LABELS = {
    reserved:       '<span class="risk-badge" style="background:#EEF3FF;color:#2A4A9A">🗓 Aktif</span>',
    checked_in:     '<span class="risk-badge" style="background:var(--success-bg);color:var(--success)">✅ Check-In</span>',
    checked_out:    '<span class="risk-badge" style="background:#E8F0FE;color:#1A4AD4">🔵 Check-Out</span>',
    canceled_guest: '<span class="risk-badge" style="background:var(--danger-bg);color:var(--danger)">❌ Batal (Tamu)</span>',
    canceled_staff: '<span class="risk-badge" style="background:var(--danger-bg);color:var(--danger)">❌ Batal (Staff)</span>',
    no_show:        '<span class="risk-badge" style="background:#F5F5F5;color:#666">⚫ No Show</span>',
  };

  tbody.innerHTML = bookings.map(b => `
    <tr data-id="${b.id}">
      <td><strong>${b.id}</strong></td>
      <td>${escHtml(b.guest_name)}</td>
      <td>${escHtml(b.hotel)}</td>
      <td>${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}</td>
      <td>${nights(b)} malam</td>
      <td>Tipe ${b.reserved_room_type ?? b.room_type ?? '-'}</td>
      <td>${escHtml(b.deposit_type)}</td>
      <td>${b.lead_time} hari</td>
      <td class="prob-cell ${b.risk_level}">${b.probability}%</td>
      <td><span class="risk-badge ${b.risk_level}">${b.risk_label}</span></td>
      <td>${PMS_LABELS[b.pms_status] || b.pms_status || '-'}</td>
      <td>
        <button class="btn-delete-row"
                onclick="openDeleteModal('${b.id}','${escHtml(b.guest_name)}')"
                title="Hapus reservasi">
          🗑 Hapus
        </button>
      </td>
    </tr>`).join('');
}

// render kartu-kartu reservasi risiko tinggi
function renderHighRiskCards(bookings) {
  const grid  = document.getElementById('high-risk-cards');
  const count = document.getElementById('high-risk-count');
  if (!grid) return;
  if (count) count.textContent = `${bookings.length} reservasi`;
  if (!bookings.length) {
    grid.innerHTML = '<div class="risk-card-empty">Tidak ada reservasi risiko tinggi saat ini ✅</div>';
    return;
  }
  grid.innerHTML = bookings.map(b => `
    <div class="risk-card">
      <div class="risk-card-header">
        <div>
          <h4>${escHtml(b.guest_name)}</h4>
          <div class="risk-card-id">${b.id} · ${b.created_at}</div>
        </div>
        <div style="text-align:right">
          <div class="risk-prob-big">${b.probability}%</div>
          <div class="risk-prob-label">Probabilitas Batal</div>
        </div>
      </div>
      <div class="risk-card-body">
        <div class="risk-detail"><strong>${escHtml(b.hotel)}</strong>Hotel</div>
        <div class="risk-detail"><strong>${b.arrival_date_day_of_month} ${b.arrival_date_month} ${b.arrival_date_year}</strong>Tiba</div>
        <div class="risk-detail"><strong>${nights(b)} malam</strong>Durasi</div>
        <div class="risk-detail"><strong>${escHtml(b.deposit_type)}</strong>Deposit</div>
        <div class="risk-detail"><strong>${b.lead_time} hari</strong>Lead Time</div>
        <div class="risk-detail"><strong>${b.adults} orang</strong>Tamu</div>
      </div>
      <div class="risk-card-footer">
        <div class="risk-card-policy">⚠️ ${escHtml(b.policy)}</div>
        <button class="btn-delete-card"
                onclick="openDeleteModal('${b.id}','${escHtml(b.guest_name)}')">
          🗑 Hapus
        </button>
      </div>
    </div>`).join('');
}

// render tabel log reservasi yang sudah dihapus
function renderDeletedTable(bookings) {
  const tbody = document.getElementById('deleted-tbody');
  if (!tbody) return;
  if (!bookings.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">Belum ada data yang dihapus</td></tr>';
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td><strong>${b.id}</strong></td>
      <td>${escHtml(b.guest_name)}</td>
      <td>${escHtml(b.hotel)}</td>
      <td>${b.arrival_date_month} ${b.arrival_date_year}</td>
      <td class="prob-cell ${b.risk_level}">${b.probability}%</td>
      <td><span class="risk-badge ${b.risk_level}">${b.risk_label}</span></td>
      <td>
        <div class="deleted-meta">
          <span class="deleted-by">oleh ${escHtml(b.deleted_by || '-')}</span>
          <span class="deleted-at">${b.deleted_at}</span>
          <span class="deleted-reason">"${escHtml(b.delete_reason || '-')}"</span>
        </div>
      </td>
    </tr>`).join('');
}

// buka modal konfirmasi hapus reservasi
function openDeleteModal(id, name) {
  pendingDelete = { id, name };
  document.getElementById('delete-modal-id').textContent   = id;
  document.getElementById('delete-modal-name').textContent = name;
  document.getElementById('delete-reason').value = '';
  document.getElementById('delete-by').value     = '';
  document.getElementById('delete-error').classList.add('hidden');
  document.getElementById('delete-modal').classList.remove('hidden');
}

function closeDeleteModal() {
  pendingDelete = null;
  document.getElementById('delete-modal').classList.add('hidden');
}

// setup event listener untuk modal hapus
function initDeleteModal() {
  document.getElementById('delete-cancel')?.addEventListener('click', closeDeleteModal);

  // klik di luar modal card = tutup modal
  document.getElementById('delete-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('delete-modal')) closeDeleteModal();
  });

  // tombol konfirmasi hapus
  document.getElementById('delete-confirm')?.addEventListener('click', async () => {
    const reason    = document.getElementById('delete-reason').value.trim();
    const deletedBy = document.getElementById('delete-by').value.trim() || 'Staff';
    const errEl     = document.getElementById('delete-error');

    // alasan wajib diisi
    if (!reason) {
      errEl.classList.remove('hidden');
      document.getElementById('delete-reason').focus();
      return;
    }
    errEl.classList.add('hidden');

    const confirmBtn     = document.getElementById('delete-confirm');
    const confirmText    = document.getElementById('delete-confirm-text');
    const confirmSpinner = document.getElementById('delete-confirm-spinner');

    confirmBtn.disabled      = true;
    confirmText.textContent  = 'Menghapus...';
    confirmSpinner.classList.remove('hidden');

    try {
      const res = await fetch(`/api/booking/${pendingDelete.id}`, {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ reason, deleted_by: deletedBy }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Gagal menghapus reservasi.');
        return;
      }

      closeDeleteModal();
      await loadData(); // refresh tabel dan KPI setelah hapus

      showToast(`Reservasi ${pendingDelete?.id ?? ''} berhasil dihapus.`);
    } catch (err) {
      alert('Terjadi kesalahan. Silakan coba lagi.');
      console.error(err);
    } finally {
      confirmBtn.disabled      = false;
      confirmText.textContent  = 'Ya, Hapus';
      confirmSpinner.classList.add('hidden');
    }
  });
}

// tampilkan notifikasi toast di pojok bawah
function showToast(msg) {
  let toast = document.getElementById('dash-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'dash-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// setup filter pencarian & dropdown risiko di section "Semua Reservasi"
function initFilters() {
  const searchInput  = document.getElementById('search-input');
  const filterSelect = document.getElementById('filter-risk');

  function applyFilter() {
    const q    = (searchInput?.value || '').toLowerCase();
    const risk = filterSelect?.value || '';
    const filtered = allBookings.filter(b => {
      const matchQ    = !q || b.guest_name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q);
      const matchRisk = !risk || b.risk_level === risk;
      return matchQ && matchRisk;
    });
    renderAllTable(filtered);
  }

  searchInput?.addEventListener('input', applyFilter);
  filterSelect?.addEventListener('change', applyFilter);
}

// helper: hitung total malam dari data booking
function nights(b) {
  return (parseInt(b.stays_in_week_nights) || 0) + (parseInt(b.stays_in_weekend_nights) || 0);
}

// helper: escape karakter HTML untuk mencegah XSS
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
