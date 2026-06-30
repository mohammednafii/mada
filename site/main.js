/* MADA — site interactions
 * Sticky nav state, mobile menu, scroll-spy, portfolio filter,
 * testimonial carousel dots, reveal-on-scroll. Vanilla, ~no deps. */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = ['accueil', 'apropos', 'services', 'temoignages', 'realisations', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  /* ---------- Unified scroll handler (nav state + reveal + scroll-spy) ----------
     Uses geometry rather than IntersectionObserver for maximum compatibility. */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight;

    // Sticky nav blur
    nav.classList.toggle('is-scrolled', y > 12);

    // Reveal: trigger once element enters the lower ~90% of the viewport.
    // After the entrance duration we drop the transition so the element is
    // guaranteed to be at its final visible state even if the environment
    // throttles animation frames (the end state never depends on a running frame).
    for (var i = reveals.length - 1; i >= 0; i--) {
      var el = reveals[i];
      if (el.getBoundingClientRect().top < vh * 0.9) {
        el.classList.add('in');
        (function (node) { setTimeout(function () { node.style.transition = 'none'; }, 900); })(el);
        reveals.splice(i, 1);
      }
    }

    // Scroll-spy: section whose midpoint band crosses ~40% of viewport
    var activeId = sections.length ? sections[0].id : null;
    for (var s = 0; s < sections.length; s++) {
      if (sections[s].getBoundingClientRect().top <= vh * 0.4) activeId = sections[s].id;
    }
    navLinks.forEach(function (l) {
      l.classList.toggle('active', l.getAttribute('href') === '#' + activeId);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  onScroll();

  /* Safety net: in any environment where scrolling/animation frames don't
     advance (some embedded previews), reveal everything still hidden after 2s
     so content is never permanently invisible. Normal browsers reveal on
     scroll well before this fires. */
  setTimeout(function () {
    while (reveals.length) {
      var el = reveals.pop();
      el.style.transition = 'none';
      el.classList.add('in');
    }
  }, 2000);

  /* ---------- Mobile menu ---------- */
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');
  function closeMenu() {
    burger.classList.remove('open');
    menu.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  }
  burger.addEventListener('click', function () {
    var open = burger.classList.toggle('open');
    menu.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });

  /* ---------- Portfolio filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll('.filter-btn'));
  var grid = document.getElementById('workGrid');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.work-card'));
  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
      var f = btn.getAttribute('data-filter');
      cards.forEach(function (card) {
        var match = f === 'all' || card.getAttribute('data-cat') === f;
        if (match) {
          card.classList.remove('hide');
          card.classList.add('filtering');
          requestAnimationFrame(function () { requestAnimationFrame(function () { card.classList.remove('filtering'); }); });
        } else {
          card.classList.add('hide');
        }
      });
    });
  });

  /* ---------- Testimonial slider (auto-play + nav + dots + swipe) ---------- */
  (function () {
    var sliderTrack = document.getElementById('tSliderTrack');
    var dotsWrap = document.getElementById('tDots');
    var prevBtn = document.getElementById('tPrev');
    var nextBtn = document.getElementById('tNext');
    if (!sliderTrack || !dotsWrap || !prevBtn || !nextBtn) return;

    var slides = Array.prototype.slice.call(sliderTrack.querySelectorAll('.tslider-slide'));
    var total = slides.length;
    var current = 0;
    var autoTimer;

    slides.forEach(function (_, i) {
      var d = document.createElement('button');
      d.setAttribute('aria-label', 'Témoignage ' + (i + 1));
      if (i === 0) d.classList.add('active');
      d.addEventListener('click', function () { goTo(i); resetTimer(); });
      dotsWrap.appendChild(d);
    });
    var dots = Array.prototype.slice.call(dotsWrap.children);

    function goTo(index) {
      current = (index + total) % total;
      sliderTrack.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    }

    function resetTimer() {
      clearInterval(autoTimer);
      autoTimer = setInterval(function () { goTo(current + 1); }, 5000);
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1); resetTimer(); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); resetTimer(); });

    /* Swipe support */
    var touchStartX = 0;
    sliderTrack.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    sliderTrack.addEventListener('touchend', function (e) {
      var diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) { diff > 0 ? goTo(current + 1) : goTo(current - 1); resetTimer(); }
    }, { passive: true });

    /* Pause on hover */
    var wrap = document.querySelector('.tslider-wrap');
    if (wrap) {
      wrap.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
      wrap.addEventListener('mouseleave', function () { resetTimer(); });
    }

    resetTimer();
  })();
})();
