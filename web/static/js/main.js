// main.js - script global yang dipakai di semua halaman

// navbar berubah warna saat di-scroll
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });
}

// tombol hamburger untuk membuka/menutup menu di mobile
const hamburger = document.getElementById('hamburger');
if (hamburger) {
  hamburger.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
  });
}

// smooth scroll saat klik link yang mengarah ke anchor (#)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// isi default tanggal check-in dan check-out di availability bar
const checkinInput  = document.getElementById('checkin');
const checkoutInput = document.getElementById('checkout');
if (checkinInput && checkoutInput) {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter  = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 3);

  checkinInput.value  = today.toISOString().split('T')[0];
  checkoutInput.value = dayAfter.toISOString().split('T')[0];

  // pastikan checkout selalu setelah checkin
  checkinInput.addEventListener('change', () => {
    if (checkoutInput.value <= checkinInput.value) {
      const next = new Date(checkinInput.value);
      next.setDate(next.getDate() + 1);
      checkoutInput.value = next.toISOString().split('T')[0];
    }
  });
}

// animasi fade-in saat elemen masuk ke layar (scroll reveal)
const animTargets = document.querySelectorAll(
  '.room-card, .amenity-item, .testimonial-card, .stat-item'
);

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity    = '1';
      entry.target.style.transform  = 'translateY(0)';
      observer.unobserve(entry.target); // stop observing setelah muncul
    }
  });
}, { threshold: 0.1 });

// set state awal elemen (tersembunyi, sedikit ke bawah)
animTargets.forEach(el => {
  el.style.opacity    = '0';
  el.style.transform  = 'translateY(20px)';
  el.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  observer.observe(el);
});
