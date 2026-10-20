/* Pick – Landing Page: Animationen mit GSAP (ScrollTrigger, SplitText) und weiches Scrollen mit Lenis */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGsap = typeof window.gsap !== 'undefined';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  // Scroll-Story funktioniert auch ohne Animationen
  const steps = $$('.step'), screens = $$('.story-phone .scr'), dots = $$('.story-dots i');
  function setScreen(i) {
    steps.forEach((s, k) => s.classList.toggle('active', k === i));
    screens.forEach((s, k) => s.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k === i));
  }
  setScreen(0);

  if (!hasGsap || reduce) {
    // Ohne GSAP oder bei „Bewegung reduzieren“: alles sichtbar, Story per IntersectionObserver
    const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting && setScreen(+e.target.dataset.screen)), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(s => io.observe(s));
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ---------- Weiches Scrollen (Lenis), an GSAP gekoppelt ----------
  if (window.Lenis) {
    const lenis = new Lenis({ anchors: true, lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ---------- Hero: Überschrift Buchstabe für Buchstabe ----------
  document.fonts?.ready.then(() => {
    const split = SplitText.create('.hero-title .line', { type: 'words,chars', wordsClass: 'word', charsClass: 'char' });   // Wörter bleiben zusammen
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from(split.chars, { yPercent: 110, rotate: 8, duration: 1, stagger: 0.025 })
      .from('.eyebrow', { y: 12, autoAlpha: 0, duration: .6 }, 0.1)
      .from('.hero-sub', { y: 20, autoAlpha: 0, duration: .8 }, 0.45)
      .from('.hero-cta .btn', { y: 20, autoAlpha: 0, duration: .7, stagger: .08 }, 0.55)
      .from('.hero-phone', { y: 120, rotate: 12, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0.2)
      .from('.float', { scale: 0, autoAlpha: 0, duration: 1, stagger: .1, ease: 'back.out(1.8)' }, 0.6);
  });
  // Schwebende Karten
  $$('.float').forEach((el, i) => gsap.to(el, { y: i % 2 ? 14 : -14, duration: 2.6 + i * .4, ease: 'sine.inOut', yoyo: true, repeat: -1 }));
  // Maus-Parallaxe im Hero
  const hero = $('.hero-visual');
  if (hero && window.matchMedia('(pointer: fine)').matches) {
    const layers = [['.hero-phone', 14], ['.f1', -26], ['.f2', 30], ['.f3', -40]].map(([s, d]) => ({ el: $(s, hero), d,
      x: gsap.quickTo($(s, hero), 'x', { duration: .8, ease: 'power3' }), y: gsap.quickTo($(s, hero), 'y', { duration: .8, ease: 'power3' }) }));
    window.addEventListener('pointermove', (e) => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      layers.forEach(l => { l.x(nx * l.d); });
    });
  }
  // Hero beim Runterscrollen leicht wegdrehen
  gsap.to('.hero-phone', { yPercent: -12, rotate: -2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // ---------- Magnetische Buttons ----------
  if (window.matchMedia('(pointer: fine)').matches) {
    $$('.magnet').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: .5, ease: 'elastic.out(1, .4)' });
      const y = gsap.quickTo(btn, 'y', { duration: .5, ease: 'elastic.out(1, .4)' });
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .35); y((e.clientY - r.top - r.height / 2) * .45);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  // ---------- Problem-Text: Wörter leuchten beim Scrollen auf ----------
  document.fonts?.ready.then(() => {
    const words = SplitText.create('#problem-text', { type: 'words' }).words;
    gsap.fromTo(words, { opacity: .14 }, { opacity: 1, stagger: .05, ease: 'none',
      scrollTrigger: { trigger: '.problem', start: 'top 75%', end: 'bottom 55%', scrub: true } });
  });

  // ---------- Allgemeines Einblenden ----------
  $$('.rv').forEach(el => gsap.from(el.children, { y: 40, autoAlpha: 0, duration: .9, stagger: .08, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 82%' } }));

  // ---------- Scroll-Story: Handy wechselt den Bildschirm ----------
  steps.forEach((s, i) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 45%',
    onEnter: () => setScreen(i), onEnterBack: () => setScreen(i) }));
  gsap.from('.story-phone', { y: 60, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.story', start: 'top 70%' } });

  // ---------- Wisch-Demo: Nö, Nö, Ja – in Dauerschleife ----------
  const cards = $$('.dcard'), nopeN = $('#nope-n');
  function deck() {
    // Ausgangslage: Stapel
    cards.forEach((c, i) => gsap.set(c, { x: 0, y: (cards.length - 1 - i) * -14, scale: 1 - (cards.length - 1 - i) * .05, rotate: 0, autoAlpha: 1, zIndex: i }));
    gsap.set('.dcard .st', { autoAlpha: 0 });
    nopeN.textContent = '2';
    const tl = gsap.timeline({ delay: .8, onComplete: deck });
    const top = (k) => cards[cards.length - 1 - k];
    const lift = (k) => { const n = cards[cards.length - 2 - k]; return n ? { targets: n, y: 0, scale: 1 } : null; };
    for (let k = 0; k < cards.length; k++) {
      const c = top(k), yes = k === cards.length - 1;
      tl.to(c, { x: yes ? 40 : -40, rotate: yes ? 5 : -5, duration: .5, ease: 'power2.inOut' })
        .to($(yes ? '.st.yes' : '.st.no', c), { autoAlpha: 1, duration: .2 }, '<.25');
      if (!yes) {
        tl.to(c, { x: -520, rotate: -24, autoAlpha: 0, duration: .55, ease: 'power2.in' }, '+=.25')
          .call(() => { nopeN.textContent = String(1 - k); });
        const l = lift(k); if (l) tl.to(l.targets, { y: 0, scale: 1, duration: .45, ease: 'power3.out' }, '<');
        tl.to({}, { duration: .35 });
      } else {
        tl.to(c, { scale: 1.04, duration: .35, ease: 'back.out(2)' }, '+=.1')
          .to(c, { scale: 1, duration: .3 })
          .to({}, { duration: 1.6 })
          .to(cards, { autoAlpha: 0, duration: .4 });
      }
    }
  }
  ScrollTrigger.create({ trigger: '.swipe', start: 'top 70%', once: true, onEnter: deck });
  cards.forEach((c, i) => gsap.set(c, { y: (cards.length - 1 - i) * -14, scale: 1 - (cards.length - 1 - i) * .05, zIndex: i }));

  // ---------- Bald-Karten ----------
  gsap.from('.soon-card', { y: 70, rotate: (i) => [-4, 2, 5][i], autoAlpha: 0, duration: 1, stagger: .12, ease: 'power3.out',
    scrollTrigger: { trigger: '.soon-grid', start: 'top 80%' } });

  // ---------- Abschluss ----------
  gsap.from('.cta > *', { y: 40, autoAlpha: 0, duration: .9, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '.cta', start: 'top 75%' } });
  gsap.from('.cta-logo', { rotate: -20, scale: .6, duration: 1.2, ease: 'elastic.out(1, .5)', scrollTrigger: { trigger: '.cta', start: 'top 75%' } });
})();
