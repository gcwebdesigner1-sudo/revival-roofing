/* Revival Roofing and Exteriors */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TO = 'revivalroofingandexteriors@gmail.com';

  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- smooth scroll ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
  }
  const goTo = hash => {
    const el = $(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(el, { offset: -70 });
    else el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  };
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    let hash = null;
    if (href.startsWith('#') && href.length > 1) hash = href;
    else if (href.startsWith('index.html#') && $('#services')) hash = href.slice(10);
    if (hash && $(hash)) { e.preventDefault(); closeMenu(); goTo(hash); history.replaceState(null, '', hash); }
  });
  if (location.hash && $(location.hash)) setTimeout(() => goTo(location.hash), 300);

  /* ---------- scroll-linked bits ---------- */
  const nav = $('#nav');
  const callbar = $('#callbar');
  const heroMedia = $('#heroMedia');
  const heroContent = $('#heroContent');
  const storyImg = $('#storyImg');
  let lastY = -1;
  const frame = time => {
    if (lenis) lenis.raf(time);
    const y = window.scrollY;
    if (y !== lastY) {
      lastY = y;
      if (nav) nav.classList.toggle('is-solid', y > 40);
      if (callbar) callbar.classList.toggle('is-on', y > window.innerHeight * 0.6);
      if (!reduce) {
        const h = window.innerHeight;
        if (heroMedia && y < h * 1.2) heroMedia.style.translate = `0 ${y * 0.3}px`;
        if (heroContent && y < h * 1.2) {
          heroContent.style.transform = `translate3d(0,${y * 0.14}px,0)`;
          heroContent.style.opacity = Math.max(0, 1 - y / (h * 0.85));
        }
        if (storyImg) {
          const r = storyImg.parentElement.getBoundingClientRect();
          if (r.bottom > 0 && r.top < h) {
            const p = (r.top + r.height / 2 - h / 2) / h;
            storyImg.style.transform = `scale(1.08) translate3d(0,${p * 30}px,0)`;
          }
        }
      }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  /* ---------- mobile menu ---------- */
  const burger = $('#burger');
  const menu = $('#mobileMenu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    lenis && lenis.start();
    setTimeout(() => { menu.hidden = true; }, 350);
  }
  if (burger && menu) {
    burger.addEventListener('click', () => {
      if (menu.hidden) {
        menu.hidden = false;
        requestAnimationFrame(() => menu.classList.add('is-open'));
        burger.setAttribute('aria-expanded', 'true');
        lenis && lenis.stop();
      } else closeMenu();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
  }

  /* ---------- reveals (reverse when scrolled back above) ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('is-in');
      else if (en.boundingClientRect.top > 0) en.target.classList.remove('is-in');
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- counters ---------- */
  const cio = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      cio.unobserve(el);
      if (reduce) return;
      const end = parseFloat(el.dataset.count);
      const dec = +(el.dataset.dec || 0);
      const dur = 1800, t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / dur);
        el.textContent = (end * (1 - Math.pow(1 - k, 4))).toFixed(dec);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- before / after ---------- */
  const ba = $('#baFrame');
  if (ba) {
    const range = $('#baRange');
    let cur = 50, target = 50, raf = null, touched = false;
    const set = v => ba.style.setProperty('--pos', v + '%');
    const loop = () => {
      cur += (target - cur) * 0.16;
      if (Math.abs(target - cur) < 0.05) { cur = target; raf = null; set(cur); return; }
      set(cur);
      raf = requestAnimationFrame(loop);
    };
    const go = v => { target = Math.max(0, Math.min(100, v)); if (!raf) raf = requestAnimationFrame(loop); };
    // drag-only slider: the divider moves while the pointer is held down, like base44
    let dragging = false;
    const at = e => { const r = ba.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; };
    range.style.pointerEvents = 'none';
    ba.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true;
      ba.setPointerCapture(e.pointerId);
      ba.classList.add('is-drag');
      go(at(e));
    });
    ba.addEventListener('pointermove', e => { if (dragging) go(at(e)); });
    const stop = () => { dragging = false; ba.classList.remove('is-drag'); };
    ba.addEventListener('pointerup', stop);
    ba.addEventListener('pointercancel', stop);
    range.addEventListener('input', () => go(+range.value)); // keyboard users
  }

  /* ---------- process: highlight on hover; on touch, light the step in view ---------- */
  const stepEls = $$('.step');
  if (stepEls.length && matchMedia('(hover: none)').matches) {
    const lit = () => {
      const mid = window.innerHeight / 2;
      let best = null, bestD = Infinity;
      stepEls.forEach(s => {
        const r = s.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (r.bottom > 0 && r.top < window.innerHeight && d < bestD) { bestD = d; best = s; }
      });
      stepEls.forEach(s => s.classList.toggle('is-lit', s === best && bestD < window.innerHeight * 0.35));
    };
    window.addEventListener('scroll', lit, { passive: true });
    lit();
  }

  /* ---------- FAQ: one open at a time ---------- */
  const faqs = $$('.faq details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
    lenis && lenis.resize();
  }));

  /* ---------- reviews (real Google reviews, trimmed) ---------- */
  const mA = $('#marqueeA'), mB = $('#marqueeB');
  if (mA && mB) {
    const reviews = [
      ['Allison Cross', 'Upon getting quotes, Nate was the only roofer that checked our attic. Thorough inspection, quality work at a competitive price. We highly recommend Revival!'],
      ['Kody Duncan', 'He took his time to understand our situation, make honest recommendations, and was never pushy at all. Genuinely great guy, and great company.'],
      ['Lynn Rice', "Nate's bid was by far the most thorough with pictures showing potential issues, and his pricing was very fair. The crew replaced a cracked truss with pictures documenting the repair."],
      ['Les Willey', "Best experience I've ever had with a roofing job! Clean up was not only perfect when finished but also cleaned between day one and day two!"],
      ['Christina', 'We chose Nate and Revival Roofing to re-roof our home and to do all new Hardie siding. These guys are pros! Our home turned out better than we even had in mind!'],
      ['Brandon Bozarth', "Another company's roof leaked for two years. Nate diagnosed the issue in about 10 minutes and fixed it for a very fair price. Everything is perfect now."],
      ['Gage Nielsen', 'The crew came, replaced the roof, cleaned up every day, and we had zero complaints. Bad decking was replaced, the shingles and flashing look great.'],
      ['Jeff Kuhlmann', 'Nate gave a thorough and very fair quote. Lowest of any of the 5 quotes I received. Isaac and the crew did an excellent install and were very fast.'],
      ['Kaelyn Holten', "I am extremely skeptical of all contractors. Nate's proposal was one of the most detailed and meticulous. 10 out of 10 would hire him again!"],
      ['Stephen Anderson', "New roof, new gutters, and all the fascia replaced. His communication throughout the process was stellar. I couldn't be happier with the results."],
      ['Catherine Harrison', 'Two companies said my roof was too steep and never gave a quote. Nate did, and his crew got it done in about 4 days. It looks so nice now.'],
      ['D Guszregan', 'Nate is very knowledgeable, sincere, and communicated well what and why my roof needed replacement. A definite 10 out of 10!'],
      ['Isaac Vigil', 'Our insurance company was going to drop us because of our old roof. Nate and crew got us a new roof just in time. Very careful with the landscaping.'],
      ['Dennis Moore', 'The price and workmanship was excellent and they did not use any high pressure sales tactics, which was a big plus!'],
      ['Susan McInnis', 'The crew showed up on time. They did an outstanding job. Very respectful of my property. Nate was very easy to work with.'],
      ['Ned Hughes', 'I was in a pinch due to selling my house and he accommodated my timeline and got it done right. Would recommend to everyone!']
    ];
    const card = ([name, text]) => `
      <article class="rv">
        <div class="rv__stars" aria-label="5 stars">★★★★★</div>
        <p>“${text}”</p>
        <footer><span class="rv__av" aria-hidden="true">${name[0]}</span><span>${name}<small>Google review</small></span></footer>
      </article>`;
    const half = Math.ceil(reviews.length / 2);
    const fill = (el, list) => { const h = list.map(card).join(''); el.innerHTML = reduce ? h : h + h; };
    fill(mA, reviews.slice(0, half));
    fill(mB, reviews.slice(half));
    if (!reduce) [mA, mB].forEach(m => $$('.rv', m).slice(m.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true')));
  }

  /* ---------- project filters ---------- */
  const filters = $('#filters');
  if (filters) {
    filters.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      $$('button', filters).forEach(x => x.classList.toggle('is-on', x === b));
      const f = b.dataset.f;
      $$('#projGrid .feature').forEach(c => { c.hidden = f !== 'all' && c.dataset.cat !== f; });
      lenis && lenis.resize();
    });
  }

  /* ---------- forms ---------- */
  async function send(form, extra, onOk) {
    const note = $('.form__note', form);
    const btn = $('button[type=submit]', form);
    let bad = false;
    $$('[required]', form).forEach(i => {
      const ok = i.value.trim() && (i.type !== 'email' || /.+@.+\..+/.test(i.value));
      i.classList.toggle('is-bad', !ok);
      if (!ok) bad = true;
    });
    note.className = 'form__note';
    if (bad) { note.classList.add('err'); note.textContent = 'Please fill in the highlighted fields.'; return; }
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return;
    delete data._honey;
    Object.assign(data, extra || {});
    const label = btn.innerHTML;
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + TO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, _subject: `${form.dataset.subject}: ${data.name}`, _template: 'table', _captcha: 'false' })
      });
      if (!res.ok) throw new Error(res.status);
      form.reset();
      if (onOk) onOk();
      else { note.classList.add('ok'); note.textContent = "Thanks! We'll get back to you soon."; }
    } catch (err) {
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
      window.location.href = `mailto:${TO}?subject=${encodeURIComponent(form.dataset.subject + ': ' + data.name)}&body=${encodeURIComponent(body)}`;
      note.classList.add('err');
      note.textContent = "If your email app didn't open, please call or text (206) 715-6359.";
    } finally {
      btn.disabled = false; btn.innerHTML = label;
    }
  }
  const contactForm = $('#contactForm');
  if (contactForm) contactForm.addEventListener('submit', e => { e.preventDefault(); send(contactForm); });

  /* ---------- estimate wizard ---------- */
  const est = $('#est');
  if (est) {
    const steps = $$('.est__step', est);
    const count = $('#estCount'), bar = $('#estBar'), back = $('#estBack');
    const answers = {};
    let step = 1;
    const show = n => {
      step = n;
      steps.forEach(s => { s.hidden = +s.dataset.step !== n; });
      const done = n > 4;
      count.textContent = done ? 'Complete' : `Step ${n} of 4`;
      bar.style.width = (done ? 100 : ((n - 1) / 4) * 100) + '%';
      back.hidden = n === 1 || done;
      window.scrollTo(0, 0);
      lenis && lenis.resize();
    };
    steps.forEach(s => {
      const key = s.dataset.key;
      $$('.est__opt', s).forEach(o => o.addEventListener('click', () => {
        $$('.est__opt', s).forEach(x => x.classList.toggle('is-on', x === o));
        answers[key] = o.textContent.trim();
        setTimeout(() => show(step + 1), 220);
      }));
      const skip = $('.est__skip', s);
      if (skip) skip.addEventListener('click', () => { delete answers[key]; show(step + 1); });
    });
    back.addEventListener('click', () => show(Math.max(1, step - 1)));
    const form = $('#estForm');
    form.addEventListener('submit', e => { e.preventDefault(); send(form, answers, () => show(5)); });
    show(1);
  }
})();
