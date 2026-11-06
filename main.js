(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- hero name: split into letters for the load reveal ---------- */
  let i = 0;
  $$('[data-split]').forEach(line => {
    const text = line.textContent.trim();
    line.setAttribute('data-text', text);
    line.setAttribute('aria-label', text);
    line.innerHTML = [...text].map(c => `<span class="ch" aria-hidden="true" style="--i:${i++}">${c}</span>`).join('');
  });

  /* ---------- hero slideshow ---------- */
  const slides = $$('.hero__slide');
  if (!reduce && slides.length > 1) {
    let cur = 0;
    setInterval(() => {
      const prev = slides[cur];
      cur = (cur + 1) % slides.length;
      const next = slides[cur];
      next.style.animation = 'none'; next.offsetHeight; next.style.animation = '';
      next.classList.add('is-on');
      setTimeout(() => prev.classList.remove('is-on'), 1800);
    }, 7000);
  }

  /* ---------- scroll-linked: hero parallax, nav, call bar, process rail ---------- */
  const nav = $('#nav'), media = $('#heroMedia'), content = $('#heroContent');
  const callbar = $('#callbar'), hero = $('#hero');
  const steps = $$('.step'), rail = $('#railFill'), stepsEl = $('#steps');
  let ticking = false;

  function onScroll() {
    const y = window.scrollY, vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    callbar.classList.toggle('is-on', y > hero.offsetHeight * 0.85);

    if (!reduce && y < vh * 1.2) {
      const p = Math.min(y / vh, 1);
      media.style.transform = `translate3d(0,${y * 0.35}px,0) scale(${1 + p * 0.08})`;
      content.style.transform = `translate3d(0,${y * 0.22}px,0) scale(${1 - p * 0.06})`;
      content.style.opacity = String(Math.max(0, 1 - p * 1.35));
    }

    // process: fill the rail and light steps as you scroll through them
    const r = stepsEl.getBoundingClientRect();
    const mid = vh * 0.6;
    const prog = Math.min(Math.max((mid - r.top) / r.height, 0), 1);
    rail.style.height = (prog * 100) + '%';
    steps.forEach(s => {
      const sr = s.getBoundingClientRect();
      s.classList.toggle('is-lit', sr.top + 32 < mid);
    });
    ticking = false;
  }
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- active nav link ---------- */
  const links = $$('.nav__links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['services', 'work', 'process', 'reviews', 'about', 'contact'].forEach(id => { const el = document.getElementById(id); el && secObs.observe(el); });

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), menu = $('#mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); }
    else { menu.classList.remove('is-open'); setTimeout(() => { menu.hidden = true; }, 350); }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- reveal on scroll (reverses when scrolled back out) ---------- */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  const observeReveal = el => revObs.observe(el);
  $$('.reveal').forEach(observeReveal);

  /* ---------- counters ---------- */
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      if (reduce) { el.textContent = end.toFixed(dec); return; }
      const t0 = performance.now(), dur = 1600;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1), ease = 1 - Math.pow(1 - k, 3);
        el.textContent = (end * ease).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cObs.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cObs.observe(el));

  /* ---------- before / after ---------- */
  const frame = $('#baFrame'), range = $('#baRange');
  const setPos = v => frame.style.setProperty('--pos', v + '%');
  range.addEventListener('input', () => setPos(range.value));
  if (!reduce) {
    const baObs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      baObs.disconnect();
      const keys = [[0, 50], [900, 12], [2100, 88], [3000, 50]];
      const t0 = performance.now();
      let touched = false;
      range.addEventListener('pointerdown', () => { touched = true; }, { once: true });
      const tick = t => {
        if (touched) return;
        const dt = t - t0;
        let v = 50;
        for (let k = 1; k < keys.length; k++) {
          if (dt <= keys[k][0]) {
            const [ta, va] = keys[k - 1], [tb, vb] = keys[k];
            const p = (dt - ta) / (tb - ta), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            v = va + (vb - va) * e; break;
          }
        }
        setPos(v); range.value = v;
        if (dt < keys[keys.length - 1][0]) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 500);
    }, { threshold: 0.6 });
    baObs.observe(frame);
  }

  /* ---------- gallery ---------- */
  const photos = [
    ['p-08', 'Log home with a new roof under a blue sky'],
    ['p-11', 'Two-story home with a new roof and three-car garage'],
    ['p-12', 'Green craftsman home with a new roof and American flag'],
    ['p-13', 'White cottage re-roof with dump trailer on site'],
    ['p-23', 'Finished charcoal shingle roof on a white home'],
    ['p-06', 'Close-up of new architectural shingles on the ridge'],
    ['p-30', 'Tan ranch home with a new roof'],
    ['p-03', 'Crew loading shingles from a boom truck'],
    ['p-09', 'Standing seam metal roof install'],
    ['p-22', 'Ranch home with a new roof at sunset'],
    ['p-20', 'Two-story home with new roof, fascia and gutters'],
    ['p-14', 'Mid-century home with a new roof among the pines'],
    ['p-29', 'Green ranch home with a new roof'],
    ['p-02', 'Single-story home with a new roof and stone accents'],
    ['p-21', 'Stone chimney with new flashing'],
    ['p-10', 'New construction with a fresh roof'],
    ['p-31', 'Long ranch home with a new roof'],
    ['p-19', 'Shed with a new shingle roof'],
    ['p-34', 'Brick ranch with a new roof'],
    ['p-28', 'Two-story home with a new roof in the hills'],
    ['p-16', 'Garage roof being installed'],
    ['p-17', 'Roofer installing shingles'],
    ['p-04', 'View across a newly shingled roof'],
    ['p-32', 'Ranch home re-roof'],
    ['p-15', 'Garage with a new roof in the trees'],
    ['p-24', 'Crew at work on a roof tear-off'],
    ['p-01', 'Stone chimney cap on a new roof'],
    ['p-18', 'New siding and window trim'],
    ['p-25', 'Shingle roof detail, before and after'],
    ['p-26', 'Chimney flashing, before and after']
  ];
  const INITIAL = 12;
  const gallery = $('#gallery');
  gallery.innerHTML = photos.map(([f, alt], n) =>
    `<figure class="${n >= INITIAL ? 'is-hidden' : ''}" data-i="${n}"><img src="assets/img/${f}.jpg" alt="${alt}" loading="lazy" decoding="async"></figure>`
  ).join('');
  const figs = $$('figure', gallery);
  const gObs = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { threshold: 0.08 });
  figs.forEach(f => gObs.observe(f));

  const moreBtn = $('#moreBtn');
  let shown = INITIAL;
  moreBtn.addEventListener('click', () => {
    shown += 9;
    figs.forEach((f, n) => { if (n < shown) f.classList.remove('is-hidden'); });
    if (shown >= figs.length) moreBtn.parentElement.remove();
  });

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb);
  let lbI = 0;
  const lbShow = n => {
    lbI = (n + photos.length) % photos.length;
    lbImg.src = `assets/img/${photos[lbI][0]}.jpg`;
    lbImg.alt = photos[lbI][1];
  };
  const lbOpen = n => { lbShow(n); lb.hidden = false; requestAnimationFrame(() => lb.classList.add('is-open')); document.body.style.overflow = 'hidden'; $('.lightbox__close').focus(); };
  const lbClose = () => { lb.classList.remove('is-open'); setTimeout(() => { lb.hidden = true; }, 300); document.body.style.overflow = ''; };
  gallery.addEventListener('click', e => { const f = e.target.closest('figure'); if (f) lbOpen(+f.dataset.i); });
  $('.lightbox__close').addEventListener('click', lbClose);
  $('.lightbox__prev').addEventListener('click', () => lbShow(lbI - 1));
  $('.lightbox__next').addEventListener('click', () => lbShow(lbI + 1));
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbShow(lbI - 1);
    if (e.key === 'ArrowRight') lbShow(lbI + 1);
  });

  /* ---------- reviews (real Google reviews, trimmed) ---------- */
  const reviews = [
    ['Allison Cross', 'Upon getting quotes, Nate was the only roofer that checked our attic. Thorough inspection, quality work at a competitive price. We highly recommend Revival!'],
    ['Kody Duncan', 'He took his time to understand our situation, make honest recommendations, and was never pushy at all. Genuinely great guy, and great company.'],
    ['Lynn Rice', "Nate's bid was by far the most thorough with pictures showing potential issues, and his pricing was very fair. The crew replaced a cracked truss with pictures documenting the repair."],
    ['Les Willey', 'Best experience I\'ve ever had with a roofing job! Clean up was not only perfect when finished but also cleaned between day one and day two!'],
    ['Christina', 'We chose Nate and Revival Roofing to re-roof our home and to do all new Hardie siding. These guys are pros! Our home turned out better than we even had in mind!'],
    ['Brandon Bozarth', 'Another company\'s roof leaked for two years. Nate diagnosed the issue in about 10 minutes and fixed it for a very fair price. Everything is perfect now.'],
    ['Gage Nielsen', 'The crew came, replaced the roof, cleaned up every day, and we had zero complaints. Bad decking was replaced, the shingles and flashing look great.'],
    ['Jeff Kuhlmann', 'Nate gave a thorough and very fair quote. Lowest of any of the 5 quotes I received. Isaac and the crew did an excellent install and were very fast.'],
    ['Kaelyn Holten', "I am extremely skeptical of all contractors. Nate's proposal was one of the most detailed and meticulous. 10 out of 10 would hire him again!"],
    ['Stephen Anderson', 'New roof, new gutters, and all the fascia replaced. His communication throughout the process was stellar. I couldn\'t be happier with the results.'],
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
  fill($('#marqueeA'), reviews.slice(0, half));
  fill($('#marqueeB'), reviews.slice(half));
  if (!reduce) $$('.marquee').forEach(m => $$('.rv', m).slice(m.children.length / 2).forEach(c => c.setAttribute('aria-hidden', 'true')));

  /* ---------- quote form ---------- */
  const form = $('#quoteForm'), note = $('#formNote');
  const TO = 'revivalroofingandexteriors@gmail.com';
  form.addEventListener('submit', async e => {
    e.preventDefault();
    note.className = 'form__note'; note.textContent = '';
    const name = form.name.value.trim(), phone = form.phone.value.trim();
    form.name.classList.toggle('is-bad', !name);
    form.phone.classList.toggle('is-bad', phone.replace(/\D/g, '').length < 7);
    if (!name || phone.replace(/\D/g, '').length < 7) {
      note.classList.add('err'); note.textContent = 'Please add your name and a phone number so we can reach you.';
      return;
    }
    if (form._honey.value) return;
    const data = Object.fromEntries(new FormData(form));
    delete data._honey;
    const btn = $('button[type=submit]', form);
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      const res = await fetch('https://formsubmit.co/ajax/' + TO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...data, _subject: `New quote request: ${name}`, _template: 'table', _captcha: 'false' })
      });
      if (!res.ok) throw new Error('bad status');
      form.reset();
      note.classList.add('ok');
      note.textContent = "Got it. We'll call you soon. Need us sooner? Call (206) 715-6359.";
    } catch (err) {
      const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join('\n');
      window.location.href = `mailto:${TO}?subject=${encodeURIComponent('Quote request: ' + name)}&body=${encodeURIComponent(body)}`;
      note.classList.add('err');
      note.textContent = "If your email app didn't open, please call or text (206) 715-6359.";
    } finally {
      btn.disabled = false; btn.textContent = 'Send my request';
    }
  });

  $('#yr').textContent = new Date().getFullYear();
})();
