/* Pick – Variante „Stapel“: GSAP (ScrollTrigger, SplitText) + Lenis. Effekte nach React Bits (Stack, Scramble, Click-Spark, Magnet), selbst mit GSAP gebaut. */
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = window.matchMedia('(pointer: fine)').matches;
  if (typeof window.gsap === 'undefined') return;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // ---------- Funken bei Klick ----------
  function burst(x, y, n = 9, colors = ['#FF7C6C', '#16C5E7', '#041C45', '#7AF0D7'], dist = 46) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i'), a = (i / n) * Math.PI * 2 + Math.random() * .3;
      s.className = 'spark'; s.style.left = x - 1.5 + 'px'; s.style.top = y - 7 + 'px'; s.style.background = colors[i % colors.length];
      document.body.appendChild(s);
      gsap.fromTo(s, { x: 0, y: 0, rotation: a * 180 / Math.PI + 90, scaleY: 1, autoAlpha: 1 },
        { x: Math.cos(a) * dist, y: Math.sin(a) * dist, scaleY: .1, autoAlpha: 0, duration: reduce ? .01 : .6, ease: 'power3.out', onComplete: () => s.remove() });
    }
  }
  document.addEventListener('click', (e) => { if (e.detail && e.target.closest('.btn, .round')) burst(e.clientX, e.clientY); });

  // ---------- Text-Scramble ----------
  const glyphs = 'ABCDEFGHJKLMNOPQRSTUVWXYZ#%&*+=?!/<>';
  function scramble(el) {
    const final = el.dataset.text || (el.dataset.text = el.textContent);
    const o = { p: 0 };
    gsap.to(o, { p: 1, duration: reduce ? .01 : .8, ease: 'none', onUpdate: () => {
      el.textContent = [...final].map((ch, i) => i < Math.floor(o.p * final.length + .001) ? ch : glyphs[Math.random() * glyphs.length | 0]).join('');
    }, onComplete: () => { el.textContent = final; } });
  }

  // ---------- Wisch-Demo zum Selbermachen ----------
  (() => {
    const deck = $('.deck'), cards = $$('.dcard', deck), result = $('.deck-result', deck);
    const nopeEl = $('#nope-n'), hint = $('#deck-hint'), nameEl = $('#pick-name');
    const gNo = $('.g-no'), gYes = $('.g-yes');
    gsap.set([gNo, gYes], { y: 0, yPercent: -50 });
    let nopes = 2, live = [...cards], busy = false, drag = null;
    const top = () => live[live.length - 1];
    const stamps = (c, dx, dur = 0) => {
      const yes = clamp(dx / 110, 0, 1), no = clamp(-dx / 110, 0, 1);
      gsap.to($('.st.yes', c), { autoAlpha: yes, duration: dur });
      gsap.to($('.st.no', c), { autoAlpha: no, duration: dur });
      gsap.to(gYes, { opacity: .07 + yes * .6, scale: 1 + yes * .06, duration: dur || .15 });
      gsap.to(gNo, { opacity: .07 + no * .6, scale: 1 + no * .06, duration: dur || .15 });
    };
    function stack(animate = true) {
      live.forEach((c, i) => {
        const d = live.length - 1 - i;
        gsap.set(c, { zIndex: i + 1 });
        const v = { x: 0, y: d * 20, scale: 1 - d * .06, rotation: d ? (d % 2 ? -5 : 4) : 0, autoAlpha: 1 };
        animate ? gsap.to(c, { ...v, duration: .7, ease: 'power3.out', overwrite: 'auto' }) : gsap.set(c, v);
      });
      nopeEl.textContent = nopes;
    }
    function fly(c, dir) {
      busy = true; live.pop();
      gsap.to(c, { x: dir * (innerWidth * .6 + 300), y: '+=80', rotation: dir * 32, autoAlpha: 0, duration: .65, ease: 'power2.in', overwrite: 'auto',
        onComplete: () => { busy = false; stamps(c, 0, .4); } });
    }
    function blocked(c) {
      hint.textContent = 'Keine Nö mehr – diese Karte gilt!';
      stamps(c, 0, .2);
      gsap.fromTo(c, { x: -22, rotation: -3 }, { x: 0, y: 0, rotation: 0, duration: .9, ease: 'elastic.out(1, .3)', overwrite: 'auto' });
      gsap.fromTo(nopeEl, { scale: 1.5 }, { scale: 1, duration: .6, ease: 'elastic.out(1, .4)' });
    }
    function nope(c) {
      if (!nopes) return blocked(c);
      nopes--; stamps(c, -200); fly(c, -1); stack();
      gsap.fromTo(nopeEl, { scale: 1.6, rotation: -20 }, { scale: 1, rotation: 0, duration: .7, ease: 'elastic.out(1, .4)' });
      hint.textContent = nopes ? 'Noch ein Nö übrig.' : 'Keine Nö mehr – die nächste Karte gilt!';
    }
    function yes(c) {
      busy = true; stamps(c, 200);
      nameEl.textContent = c.dataset.name;
      hint.textContent = 'Entschieden. Guten Appetit!';
      live.filter(o => o !== c).forEach(o => gsap.to(o, { autoAlpha: 0, scale: .8, duration: .4 }));
      live = [];
      gsap.timeline()
        .to(c, { x: 0, y: 0, rotation: 0, scale: 1.05, duration: .45, ease: 'back.out(2.2)', overwrite: 'auto' })
        .add(() => {
          const r = deck.getBoundingClientRect();
          burst(r.left + r.width / 2, r.top + r.height / 2, 18, undefined, 160);
          stamps(c, 0, .5);
          result.hidden = false;
        })
        .fromTo(result, { autoAlpha: 0, clipPath: 'circle(0% at 50% 50%)' }, { autoAlpha: 1, clipPath: 'circle(75% at 50% 50%)', duration: .7, ease: 'power3.out' }, '+=.2')
        .from('.party', { scale: 0, rotation: -30, duration: .8, ease: 'elastic.out(1, .4)' }, '<.15')
        .add(() => { busy = false; $('#deck-reset').focus({ preventScroll: true }); });
    }
    function reset() {
      nopes = 2; live = [...cards]; result.hidden = true; busy = false;
      cards.forEach(c => { stamps(c, 0); gsap.set(c, { x: 0, y: 60, autoAlpha: 0, rotation: 0 }); });
      stack(); hint.textContent = 'Zieh die Karte ← →';
      deck.focus({ preventScroll: true });
    }
    const act = (dir) => {
      const c = top(); if (!c || busy) return;
      if (dir < 0 && !nopes) return blocked(c);
      gsap.to(c, { x: dir * 70, rotation: dir * 7, duration: .22, ease: 'power2.out', onUpdate: () => stamps(c, gsap.getProperty(c, 'x')),
        onComplete: () => dir > 0 ? yes(c) : nope(c) });
    };

    deck.addEventListener('pointerdown', (e) => {
      const c = top(); if (!c || busy || !c.contains(e.target)) return;
      drag = { c, x0: e.clientX, y0: e.clientY, dx: 0 };
      c.setPointerCapture(e.pointerId); gsap.killTweensOf(c);
    });
    deck.addEventListener('pointermove', (e) => {
      if (!drag) return;
      drag.dx = e.clientX - drag.x0;
      const dx = drag.dx < 0 && !nopes ? drag.dx * .25 : drag.dx;
      gsap.set(drag.c, { x: dx, y: (e.clientY - drag.y0) * .3, rotation: dx * .06 });
      stamps(drag.c, dx);
    });
    const end = () => {
      if (!drag) return;
      const { c, dx } = drag; drag = null;
      if (dx > 110) yes(c);
      else if (dx < -110) nope(c);
      else { stamps(c, 0, .25); gsap.to(c, { x: 0, y: 0, rotation: 0, duration: .8, ease: 'elastic.out(1, .5)' }); }
    };
    deck.addEventListener('pointerup', end);
    deck.addEventListener('pointercancel', end);
    deck.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); act(-1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); act(1); }
    });
    $('#btn-no').addEventListener('click', () => act(-1));
    $('#btn-yes').addEventListener('click', () => act(1));
    $('#deck-reset').addEventListener('click', reset);
    stack(false);

    if (!reduce) ScrollTrigger.create({ trigger: deck, start: 'top 70%', once: true, onEnter: () => {
      const c = top(); if (c) gsap.timeline({ delay: .5 })
        .to(c, { x: -40, rotation: -5, duration: .35, ease: 'power2.out', onUpdate: () => stamps(c, gsap.getProperty(c, 'x') * .6) })
        .to(c, { x: 40, rotation: 5, duration: .5, ease: 'power2.inOut', onUpdate: () => stamps(c, gsap.getProperty(c, 'x') * .6) })
        .to(c, { x: 0, rotation: 0, duration: .8, ease: 'elastic.out(1, .4)', onUpdate: () => stamps(c, gsap.getProperty(c, 'x') * .6) });
    } });
  })();

  // ---------- Bald: Scramble beim Reinkommen und beim Drüberfahren ----------
  $$('.r-tag').forEach(t => ScrollTrigger.create({ trigger: t, start: 'top 90%', once: true, onEnter: () => scramble(t) }));
  $$('.row').forEach(r => r.addEventListener('pointerenter', () => scramble($('.r-tag', r))));

  if (reduce) return;   // Ab hier nur Bewegung

  // ---------- Weiches Scrollen (Lenis), an GSAP gekoppelt ----------
  if (window.Lenis) {
    const lenis = new Lenis({ anchors: true, lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  gsap.to('.progress i', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .3 } });

  // ---------- Hero: Einstieg ----------
  const hero = $('.hero'), cardsEl = $('.cards'), mint = $('.pc-mint');
  // Ruhelage der drei Karten (wie im Logo aufgefächert) – Einstieg und Scroll starten beide hier
  const fan = { coral: { x: -80, y: 30, rotation: -16 }, white: { x: -28, y: 6, rotation: -6 }, mint: { x: 30, y: -10, rotation: 4 } };
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero-title .ln > span', { yPercent: 115, rotation: 5, duration: 1.3, stagger: .1 }, .1)
    .from('.hero .kicker', { y: 16, autoAlpha: 0, duration: 1 }, 0)
    .from('.hero-sub', { y: 24, autoAlpha: 0, duration: 1.1 }, .45)
    .from('.hero-cta > *', { y: 24, autoAlpha: 0, duration: 1, stagger: .08 }, .55);
  ['coral', 'white', 'mint'].forEach((k, i) => intro.fromTo('.pc-' + k, { x: 0, y: 420, rotation: 0, autoAlpha: 0 },
    { ...fan[k], autoAlpha: 1, duration: 1.4, ease: 'back.out(1.2)' }, .25 + i * .12));

  // ---------- Hero: Mint-Karte füllt den Bildschirm, dann die Fragen ----------
  const toCenter = () => ({
    x: innerWidth / 2 - (cardsEl.offsetLeft + cardsEl.offsetWidth / 2),
    y: innerHeight / 2 - (cardsEl.offsetTop + cardsEl.offsetHeight / 2),
  });
  const coverScale = () => {
    const halfV = Math.max(innerHeight / 2, hero.offsetHeight - innerHeight / 2);
    return Math.max(innerWidth / mint.offsetWidth, (2 * halfV) / mint.offsetHeight) * 1.2;
  };
  const heroTl = gsap.timeline({ scrollTrigger: { trigger: hero, start: 'top top', end: '+=320%', pin: true, scrub: 1, invalidateOnRefresh: true } });
  heroTl
    .to('.hero-copy', { y: -140, autoAlpha: 0, duration: .5, ease: 'power1.in' }, 0)
    .fromTo('.pc-coral', fan.coral, { x: () => -innerWidth * .8, y: () => innerHeight * .5, rotation: -60, duration: .7, ease: 'power2.in', immediateRender: false }, 0)
    .fromTo('.pc-white', fan.white, { x: () => innerWidth * .8, y: () => -innerHeight * .7, rotation: 50, duration: .7, ease: 'power2.in', immediateRender: false }, .05)
    .fromTo(mint, fan.mint, { x: () => toCenter().x, y: () => toCenter().y, rotation: 0, duration: .45, ease: 'power2.inOut', immediateRender: false }, 0)
    .to('.pc-mint .check, .pc-mint b, .pc-mint small', { autoAlpha: 0, scale: .7, duration: .25 }, .3)
    .to(mint, { scale: coverScale, borderRadius: 0, duration: .65, ease: 'power3.in' }, .4)
    .to('.pc-mint .flat', { opacity: 1, duration: .3 }, .75)
    .from('.bubble', { scale: 0, rotation: (i) => [-14, 12, -8, 10][i], autoAlpha: 0, duration: .3, stagger: .18, ease: 'back.out(2)' }, 1.15)
    .to('.bubble span', { backgroundSize: '100% 5px', duration: .22, stagger: .08, ease: 'power2.inOut' }, 2.0)
    .to('.bubble', { y: (i) => (i % 2 ? -1 : 1) * innerHeight * .6, rotation: (i) => [-30, 25, -20, 35][i], autoAlpha: 0, duration: .45, stagger: .05, ease: 'power2.in' }, 2.35)
    .from('.cover-title', { yPercent: 40, autoAlpha: 0, scale: .92, duration: .4, ease: 'power3.out' }, 2.55)
    .from('.cover-title span', { scale: .4, rotation: -6, duration: .4, ease: 'back.out(2)' }, 2.7)
    .to({}, { duration: .5 });

  // Karten kippen leicht mit der Maus (nur solange der Hero noch nicht scrollt)
  if (fine) {
    gsap.set(cardsEl, { transformPerspective: 1100 });
    const rx = gsap.quickTo(cardsEl, 'rotationX', { duration: .8, ease: 'power3' }), ry = gsap.quickTo(cardsEl, 'rotationY', { duration: .8, ease: 'power3' });
    addEventListener('pointermove', (e) => {
      if (heroTl.scrollTrigger.progress > .01) { rx(0); ry(0); return; }
      rx((.5 - e.clientY / innerHeight) * 14); ry((e.clientX / innerWidth - .5) * 22);
    }, { passive: true });
  }

  // ---------- Magnetische Buttons ----------
  if (fine) $$('.magnet').forEach(btn => {
    const x = gsap.quickTo(btn, 'x', { duration: .6, ease: 'elastic.out(1, .4)' }), y = gsap.quickTo(btn, 'y', { duration: .6, ease: 'elastic.out(1, .4)' });
    btn.addEventListener('pointermove', (e) => { const r = btn.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * .35); y((e.clientY - r.top - r.height / 2) * .45); });
    btn.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  // ---------- Helfer: Karten werden angepinnt und stapeln sich ----------
  const pins = $$('.spin'), last = pins[pins.length - 1];
  const topOf = (i) => (innerWidth <= 860 ? 84 + i * 12 : 100 + i * 18);
  pins.forEach((p, i) => {
    const c = $('.scard', p);
    if (p !== last) ScrollTrigger.create({ trigger: p, start: () => `top ${topOf(i)}px`, endTrigger: last, end: () => `top ${topOf(pins.length - 1)}px`,
      pin: true, pinSpacing: false, invalidateOnRefresh: true });
    const next = pins[i + 1];
    if (next) gsap.fromTo(c, { scale: 1, rotation: 0, filter: 'brightness(1)' }, { scale: .9 - (pins.length - 2 - i) * .02, rotation: i % 2 ? 1.5 : -1.5, filter: 'brightness(.85)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: () => `top ${topOf(i + 1)}px`, scrub: true, invalidateOnRefresh: true } });
    gsap.from($('.phone', c), { yPercent: 40, rotation: 8, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 75%' } });
    gsap.from($$('.scard-copy > *', c), { y: 50, autoAlpha: 0, duration: 1, stagger: .07, ease: 'expo.out', scrollTrigger: { trigger: c, start: 'top 70%' } });
  });
  gsap.from('.helpers-head > *', { y: 60, autoAlpha: 0, duration: 1.1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.helpers-head', start: 'top 85%' } });

  // ---------- Wischen ----------
  document.fonts.ready.then(() => {
    const words = SplitText.create('.swipe .h2', { type: 'words', mask: 'words' }).words;
    gsap.from(words, { yPercent: 110, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.swipe', start: 'top 65%' } });
  });
  gsap.from('.deck, .deck-controls', { y: 100, autoAlpha: 0, duration: 1.2, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.deck', start: 'top 90%' } });
  gsap.fromTo('.g-no', { xPercent: -30 }, { xPercent: 10, ease: 'none', scrollTrigger: { trigger: '.swipe', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.fromTo('.g-yes', { xPercent: 30 }, { xPercent: -10, ease: 'none', scrollTrigger: { trigger: '.swipe', start: 'top bottom', end: 'bottom top', scrub: true } });

  // ---------- Bald: Zeilen + Sticker ----------
  gsap.from('.row', { x: -80, autoAlpha: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.rows', start: 'top 80%' } });
  if (fine) {
    const st = $('.sticker'), sx = gsap.quickTo(st, 'x', { duration: .5, ease: 'power3' }), sy = gsap.quickTo(st, 'y', { duration: .5, ease: 'power3' });
    const sr = gsap.quickTo(st, 'rotation', { duration: .6, ease: 'power3' });
    let lastX = 0;
    $('.rows').addEventListener('pointermove', (e) => { sx(e.clientX - 48); sy(e.clientY - 48); sr(clamp((e.clientX - lastX) * 1.5, -30, 30)); lastX = e.clientX; });
    $$('.row').forEach(r => r.addEventListener('pointerenter', (e) => {
      st.textContent = r.dataset.e;
      gsap.set(st, { x: e.clientX - 48, y: e.clientY - 48 });
      gsap.to(st, { scale: 1, duration: .5, ease: 'back.out(2.5)', overwrite: 'auto' });
    }));
    $('.rows').addEventListener('pointerleave', () => gsap.to(st, { scale: 0, duration: .3, overwrite: 'auto' }));
  }

  // ---------- Finale: riesiges „Pick“ ----------
  document.fonts.ready.then(() => {
    const chars = SplitText.create('.wordmark', { type: 'chars', charsClass: 'ch' }).chars;
    gsap.from(chars, { yPercent: 100, rotation: (i) => [-14, 10, -8, 12][i % 4], ease: 'back.out(1.6)', stagger: .08,
      scrollTrigger: { trigger: '.finale', start: 'top 70%', end: 'bottom bottom', scrub: 1 } });
    chars.forEach(ch => ch.addEventListener('pointerenter', () => gsap.fromTo(ch, { y: 0 }, { y: -40, duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' })));
    const words = SplitText.create('.finale-title', { type: 'words', mask: 'words' }).words;
    gsap.from(words, { yPercent: 110, duration: 1, stagger: .06, ease: 'expo.out', scrollTrigger: { trigger: '.finale', start: 'top 70%' } });
    ScrollTrigger.refresh();
  });
  gsap.from('.finale .btn, .finale .note', { y: 30, autoAlpha: 0, duration: 1, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: '.finale', start: 'top 60%' } });
})();
