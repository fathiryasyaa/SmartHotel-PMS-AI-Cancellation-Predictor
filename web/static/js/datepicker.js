/**
 * datepicker.js  — Hotel-style date range picker
 * Mengisi hidden inputs: arrival_date_month, arrival_date_day_of_month,
 *   arrival_date_year, stays_in_week_nights, stays_in_weekend_nights
 */
(function () {
  'use strict';

  const MONTHS_ID = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const DAYS_SHORT = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'];

  // ── State ───────────────────────────────────────────────
  let viewYear, viewMonth;
  let checkinDate  = null;
  let checkoutDate = null;
  let hoverDate    = null;
  let pickingPhase = 'checkin';
  let roomBasePrice = 0;

  // ── Helpers ─────────────────────────────────────────────
  function today() {
    const d = new Date(); d.setHours(0,0,0,0); return d;
  }
  function sameDay(a, b) {
    return a && b && a.toDateString() === b.toDateString();
  }
  function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
  }
  function fmtLong(d) {
    if (!d) return '';
    return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
  }
  function fmtShort(d) {
    if (!d) return '';
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  }
  function fmtPrice(p) {
    if (!p) return '';
    if (p >= 1000000) return (p/1000000).toFixed(1).replace('.0','') + 'm';
    return Math.round(p/1000) + 'k';
  }
  function priceForDate(d, base) {
    if (!base) return 0;
    const dow = d.getDay();
    return (dow === 0 || dow === 6) ? Math.round(base * 1.5) : base;
  }
  function countNights(start, end) {
    let week = 0, weekend = 0;
    const cur = new Date(start);
    while (cur < end) {
      const dow = cur.getDay();
      if (dow === 0 || dow === 6) weekend++; else week++;
      cur.setDate(cur.getDate() + 1);
    }
    return { week, weekend };
  }

  // ── Populate hidden backend fields ──────────────────────
  function populateHiddenFields() {
    if (!checkinDate || !checkoutDate) return;
    const { week, weekend } = countNights(checkinDate, checkoutDate);
    document.getElementById('arrival_date_month').value        = MONTHS_ID[checkinDate.getMonth()];
    document.getElementById('arrival_date_day_of_month').value = checkinDate.getDate();
    document.getElementById('arrival_date_year').value         = checkinDate.getFullYear();
    document.getElementById('stays_in_week_nights').value      = week;
    document.getElementById('stays_in_weekend_nights').value   = weekend;
    document.dispatchEvent(new Event('drp:changed', { bubbles: true }));
  }

  // ── Render calendar ─────────────────────────────────────
  function renderCalendar() {
    const body     = document.getElementById('drp-cal-body');
    const monthsEl = document.getElementById('drp-months');
    if (!body || !monthsEl) return;

    const d0 = new Date(viewYear, viewMonth, 1);
    const d1 = new Date(viewYear, viewMonth + 1, 1);

    monthsEl.innerHTML =
      `<span>${MONTHS_ID[d0.getMonth()]} ${d0.getFullYear()}</span>` +
      `<span>${MONTHS_ID[d1.getMonth()]} ${d1.getFullYear()}</span>`;

    body.innerHTML = renderMonth(d0) + renderMonth(d1);

    body.querySelectorAll('.drp-day:not(.disabled):not(.other-month)').forEach(el => {
      el.addEventListener('click', onDayClick);
      el.addEventListener('mouseenter', onDayHover);
    });
    body.addEventListener('mouseleave', () => { hoverDate = null; applyRangeClasses(); });
  }

  function renderMonth(firstDay) {
    const year  = firstDay.getFullYear();
    const month = firstDay.getMonth();
    const todayD = today();

    let startDow = firstDay.getDay();
    startDow = (startDow === 0) ? 6 : startDow - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '<div class="drp-month-grid">';

    DAYS_SHORT.forEach((d, i) => {
      html += `<div class="drp-dow${i >= 5 ? ' weekend' : ''}">${d}</div>`;
    });

    for (let i = 0; i < startDow; i++) {
      html += '<div class="drp-day other-month"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d    = new Date(year, month, day);
      const past = d < todayD;
      const price = roomBasePrice ? fmtPrice(priceForDate(d, roomBasePrice)) : '';

      html += `<div class="drp-day${past ? ' disabled' : ''}" data-ts="${d.getTime()}">
        <span class="drp-day-num">${day}</span>
        ${price ? `<span class="drp-day-price">${price}</span>` : ''}
      </div>`;
    }

    html += '</div>';
    return html;
  }

  function applyRangeClasses() {
    const cells = document.querySelectorAll('#drp-cal-body .drp-day:not(.other-month)');
    const effectiveEnd = checkoutDate || hoverDate;

    cells.forEach(el => {
      const ts = parseInt(el.dataset.ts);
      const d  = new Date(ts);
      el.classList.remove('start','end','in-range','range-start-edge','range-end-edge','today');
      el.removeAttribute('data-nights');

      if (sameDay(d, today())) el.classList.add('today');

      if (checkinDate && sameDay(d, checkinDate)) {
        el.classList.add('start');
        if (effectiveEnd && effectiveEnd > checkinDate) el.classList.add('range-start-edge');
      }
      if (effectiveEnd && sameDay(d, effectiveEnd) && effectiveEnd > (checkinDate || 0)) {
        el.classList.add('end');
        if (checkinDate) {
          const n = daysBetween(checkinDate, effectiveEnd);
          if (n > 0) el.setAttribute('data-nights', `${n} malam`);
        }
        if (checkinDate && checkinDate < effectiveEnd) el.classList.add('range-end-edge');
      }
      if (checkinDate && effectiveEnd && d > checkinDate && d < effectiveEnd) {
        el.classList.add('in-range');
      }
    });
  }

  // ── Event handlers ──────────────────────────────────────
  function onDayClick(e) {
    const ts = parseInt(e.currentTarget.dataset.ts);
    const d  = new Date(ts);

    if (pickingPhase === 'checkin' || (checkinDate && d <= checkinDate)) {
      checkinDate  = d;
      checkoutDate = null;
      pickingPhase = 'checkout';
      setActiveField('out');
    } else {
      checkoutDate = d;
      pickingPhase = 'checkin';
      closeCalendar();
      populateHiddenFields();
      updateSummary();
    }
    updateDisplayValues();
    applyRangeClasses();
  }

  function onDayHover(e) {
    if (pickingPhase !== 'checkout') return;
    const ts = parseInt(e.currentTarget.dataset.ts);
    hoverDate = new Date(ts);
    applyRangeClasses();
  }

  // ── UI helpers ──────────────────────────────────────────
  function updateDisplayValues() {
    const inEl  = document.getElementById('drp-display-in');
    const outEl = document.getElementById('drp-display-out');
    if (!inEl || !outEl) return;

    if (checkinDate) {
      inEl.textContent = fmtShort(checkinDate);
      inEl.classList.remove('placeholder');
    } else {
      inEl.textContent = 'Pilih tanggal';
      inEl.classList.add('placeholder');
    }
    if (checkoutDate) {
      outEl.textContent = fmtShort(checkoutDate);
      outEl.classList.remove('placeholder');
    } else {
      outEl.textContent = 'Pilih tanggal';
      outEl.classList.add('placeholder');
    }
  }

  function updateSummary() {
    const el = document.getElementById('drp-summary');
    if (!el) return;
    if (checkinDate && checkoutDate) {
      const nights = daysBetween(checkinDate, checkoutDate);
      el.innerHTML =
        `Check In <strong>${fmtLong(checkinDate)}</strong> &mdash; ` +
        `Check Out <strong>${fmtLong(checkoutDate)}</strong> ` +
        `<span class="drp-nights">(${nights} malam)</span>`;
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  function setActiveField(which) {
    document.getElementById('drp-field-in')?.classList.toggle('active', which === 'in');
    document.getElementById('drp-field-out')?.classList.toggle('active', which === 'out');
  }

  function openCalendar(phase) {
    pickingPhase = phase || 'checkin';
    setActiveField(phase === 'checkout' ? 'out' : 'in');
    document.getElementById('drp-calendar')?.classList.remove('hidden');
    document.getElementById('drp-inputs')?.classList.add('open');
    renderCalendar();
    applyRangeClasses();
  }

  function closeCalendar() {
    document.getElementById('drp-calendar')?.classList.add('hidden');
    document.getElementById('drp-inputs')?.classList.remove('open');
    document.getElementById('drp-field-in')?.classList.remove('active');
    document.getElementById('drp-field-out')?.classList.remove('active');
  }

  // ── Navigation ──────────────────────────────────────────
  function initNav() {
    document.getElementById('drp-prev')?.addEventListener('click', e => {
      e.stopPropagation();
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar(); applyRangeClasses();
    });
    document.getElementById('drp-next')?.addEventListener('click', e => {
      e.stopPropagation();
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar(); applyRangeClasses();
    });
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    const t = today();
    viewYear  = t.getFullYear();
    viewMonth = t.getMonth();

    document.getElementById('drp-display-in')?.classList.add('placeholder');
    document.getElementById('drp-display-out')?.classList.add('placeholder');

    document.getElementById('drp-inputs')?.addEventListener('click', e => {
      const fieldOut = document.getElementById('drp-field-out');
      const phase = fieldOut?.contains(e.target) ? 'checkout' : 'checkin';
      const cal = document.getElementById('drp-calendar');
      if (cal?.classList.contains('hidden')) {
        openCalendar(phase);
      } else {
        closeCalendar();
      }
    });

    document.addEventListener('click', e => {
      const wrapper = document.querySelector('.drp-wrapper');
      if (wrapper && !wrapper.contains(e.target)) closeCalendar();
    });

    document.getElementById('drp-calendar')?.addEventListener('click', e => e.stopPropagation());

    // Terima harga dasar dari booking.js saat kamar dipilih
    document.addEventListener('roomSelected', e => {
      roomBasePrice = e.detail?.basePrice || 0;
      const cal = document.getElementById('drp-calendar');
      if (!cal?.classList.contains('hidden')) {
        renderCalendar(); applyRangeClasses();
      }
    });

    initNav();
  }

  // ── Public API ──────────────────────────────────────────
  window.DRP = {
    init,
    setBasePrice(p) { roomBasePrice = p; },
    getCheckin()    { return checkinDate; },
    getCheckout()   { return checkoutDate; },
    isComplete()    { return !!(checkinDate && checkoutDate); },
    reset() {
      checkinDate = null; checkoutDate = null;
      hoverDate = null; pickingPhase = 'checkin';
      updateDisplayValues(); updateSummary(); closeCalendar();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
