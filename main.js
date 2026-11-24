(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);

  /* ---------- smooth scrolling (Lenis), falls back to native ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
  }
  const navH = () => $('#nav').offsetHeight;
  function goTo(hash) {
    const el = hash === '#top' ? document.body : document.querySelector(hash);
    if (!el) return;
    if (lenis) lenis.scrollTo(hash === '#top' ? 0 : el, { offset: hash === '#top' ? 0 : -navH() + 1, duration: 1.6 });
    else window.scrollTo({ top: hash === '#top' ? 0 : el.getBoundingClientRect().top + window.scrollY - navH() + 1, behavior: reduce ? 'auto' : 'smooth' });
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const hash = a.getAttribute('href');
    if (hash.length < 2) return;
    e.preventDefault();
    goTo(hash);
    history.replaceState(null, '', hash === '#top' ? location.pathname : hash);
  });

  /* ---------- hero slideshow: long crossfades over a constant drift ---------- */
  const slides = $$('.hero__slide');
  if (!reduce && slides.length > 1) {
    let cur = 0;
    setInterval(() => {
      slides[cur].classList.remove('is-on');
      cur = (cur + 1) % slides.length;
      slides[cur].classList.add('is-on');
    }, 6500);
  }

  /* ---------- one rAF loop for every scroll-linked effect ---------- */
  const nav = $('#nav'), media = $('#heroMedia'), content = $('#heroContent'), hero = $('#hero');
  const callbar = $('#callbar'), stepsEl = $('#steps'), stepsFill = $('#stepsFill');
  const aboutImg = $('.about__img img'), contactBg = $('.contact__bg');
  const st = { hero: 0, steps: 0, about: 0, contact: 0 };   // eased values
  let lastY = -1;

  const progressIn = (el, start = 1, end = 0) => {      // 0 when el top hits start*vh, 1 when its top hits end*vh
    const r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((start * vh - r.top) / ((start - end) * vh), 0, 1);
  };

  function frame(time) {
    if (lenis) lenis.raf(time);
    const y = window.scrollY, vh = window.innerHeight;

    if (y !== lastY) {
      nav.classList.toggle('is-solid', y > 30);
      callbar.classList.toggle('is-on', y > hero.offsetHeight * 0.8);
      lastY = y;
    }

    if (!reduce) {
      const ease = 0.12;
      const tHero = clamp(y / vh, 0, 1);
      st.hero += (tHero - st.hero) * ease;
      if (st.hero < 1.01) {
        media.style.transform = `translate3d(0,${(st.hero * vh * 0.3).toFixed(2)}px,0) scale(${(1 + st.hero * 0.06).toFixed(4)})`;
        content.style.transform = `translate3d(0,${(st.hero * vh * 0.18).toFixed(2)}px,0)`;
        content.style.opacity = clamp(1 - st.hero * 1.5, 0, 1).toFixed(3);
      }

      st.steps += (progressIn(stepsEl, 0.85, 0.35) - st.steps) * ease;
      stepsFill.style.transform = `scaleX(${st.steps.toFixed(4)})`;

      const ra = aboutImg.parentElement.getBoundingClientRect();
      const tAbout = clamp(1 - (ra.top + ra.height) / (vh + ra.height), 0, 1);
      st.about += (tAbout - st.about) * ease;
      aboutImg.style.transform = `translate3d(0,${((0.5 - st.about) * 40).toFixed(2)}px,0) scale(1.1)`;

      const rc = contactBg.parentElement.getBoundingClientRect();
      const tContact = clamp(1 - (rc.top + rc.height) / (vh + rc.height), 0, 1);
      st.contact += (tContact - st.contact) * ease;
      contactBg.style.transform = `translate3d(0,${((0.5 - st.contact) * 80).toFixed(2)}px,0)`;
    } else {
      stepsFill.style.transform = 'scaleX(1)';
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- active nav link ---------- */
  const links = $$('.nav__links a');
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['services', 'work', 'process', 'reviews', 'faq', 'contact'].forEach(id => { const el = document.getElementById(id); el && secObs.observe(el); });

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), menu = $('#mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { menu.hidden = false; lenis && lenis.stop(); document.body.style.overflow = 'hidden'; requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open'))); }
    else { menu.classList.remove('is-open'); lenis && lenis.start(); document.body.style.overflow = ''; setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 450); }
  }
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- reveal on scroll (reverses when scrolled back out) ---------- */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { threshold: 0.1, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => revObs.observe(el));

  /* ---------- counters ---------- */
  const cObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0);
      cObs.unobserve(el);
      if (reduce) { el.textContent = end.toFixed(dec); return; }
      const t0 = performance.now(), dur = 2000;
      const step = t => {
        const k = Math.min((t - t0) / dur, 1), e2 = 1 - Math.pow(1 - k, 4);
        el.textContent = (end * e2).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach(el => cObs.observe(el));

  /* ---------- before / after: eased follow so dragging feels smooth ---------- */
  const baFrame = $('#baFrame'), range = $('#baRange');
  let baTarget = 50, baPos = 50, baAnimating = false, userTouched = false;
  const baTick = () => {
    baPos += (baTarget - baPos) * 0.22;
    if (Math.abs(baTarget - baPos) < 0.02) baPos = baTarget;
    baFrame.style.setProperty('--pos', baPos.toFixed(2) + '%');
    if (baPos !== baTarget) requestAnimationFrame(baTick); else baAnimating = false;
  };
  const setBa = v => { baTarget = v; if (!baAnimating) { baAnimating = true; requestAnimationFrame(baTick); } };
  range.addEventListener('input', () => { userTouched = true; setBa(+range.value); });
  if (!reduce) {
    const baObs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      baObs.disconnect();
      const keys = [[0, 50], [1300, 18], [2900, 82], [4100, 50]];
      let t0 = null;
      const sweep = t => {
        if (userTouched) return;
        if (t0 === null) t0 = t;
        const dt = t - t0;
        let v = 50;
        for (let k = 1; k < keys.length; k++) {
          if (dt <= keys[k][0]) {
            const [ta, va] = keys[k - 1], [tb, vb] = keys[k];
            const p = (dt - ta) / (tb - ta);
            const e = p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            v = va + (vb - va) * e; break;
          }
        }
        baPos = baTarget = v; range.value = v;
        baFrame.style.setProperty('--pos', v.toFixed(2) + '%');
        if (dt < keys[keys.length - 1][0]) requestAnimationFrame(sweep);
      };
      setTimeout(() => requestAnimationFrame(sweep), 600);
    }, { threshold: 0.55 });
    baObs.observe(baFrame);
  }

  /* ---------- gallery (real job photos) ---------- */
  const photos = [
    ['ig-crane', 'Boom truck lifting shingle bundles onto a roof'],
    ['hero-1', 'Gray craftsman home with a new roof and white trim'],
    ['ig-install', 'Roofer nailing down new decking among the pines'],
    ['ig-detail', 'Cedar beam detail against new dark siding'],
    ['hero-3', 'Two-story home with new roof and three-car garage'],
    ['ig-aerial2', 'Drone view of a lakeside estate roof'],
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
  const gallery = $('#gallery');
  gallery.innerHTML = photos.map(([f, alt], n) =>
    `<figure data-i="${n}" style="transition-delay:${(n % 4) * 0.07}s"><img src="assets/img/${f}.jpg" alt="${alt}" loading="lazy" decoding="async"></figure>`
  ).join('');
  const figs = $$('figure', gallery);
  const gObs = new IntersectionObserver(entries => {
    entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
  }, { threshold: 0.06 });
  figs.forEach(f => gObs.observe(f));

  const moreBtn = $('#moreBtn');
  moreBtn.addEventListener('click', () => {
    const open = gallery.hidden;
    gallery.hidden = !open;
    moreBtn.setAttribute('aria-expanded', open);
    moreBtn.firstChild.textContent = open ? 'Hide Projects ' : 'View All Projects ';
    lenis && lenis.resize();
    if (open) goTo('#gallery');
  });

  /* ---------- FAQ: one open at a time, keep smooth scroll height in sync ---------- */
  const faqs = $$('.faq details');
  faqs.forEach(d => d.addEventListener('toggle', () => {
    if (d.open) faqs.forEach(o => { if (o !== d) o.open = false; });
    lenis && lenis.resize();
  }));

  /* ---------- lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb);
  let lbI = 0;
  const lbShow = n => {
    lbI = (n + photos.length) % photos.length;
    lbImg.src = `assets/img/${photos[lbI][0]}.jpg`;
    lbImg.alt = photos[lbI][1];
  };
  const lbOpen = n => { lbShow(n); lb.hidden = false; lenis && lenis.stop(); document.body.style.overflow = 'hidden'; requestAnimationFrame(() => requestAnimationFrame(() => lb.classList.add('is-open'))); $('.lightbox__close').focus(); };
  const lbClose = () => { lb.classList.remove('is-open'); lenis && lenis.start(); document.body.style.overflow = ''; setTimeout(() => { if (!lb.classList.contains('is-open')) lb.hidden = true; }, 450); };
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
  const card = ([name, text], hidden) => `
    <article class="rv"${hidden ? ' aria-hidden="true"' : ''}>
      <div class="stars" aria-label="5 stars">★★★★★</div>
      <p>“${text}”</p>
      <footer><span class="rv__av" aria-hidden="true">${name[0]}</span><span>${name}<small>Google review</small></span></footer>
    </article>`;
  const half = Math.ceil(reviews.length / 2);
  const fill = (el, list) => { el.innerHTML = list.map(r => card(r)).join('') + (reduce ? '' : list.map(r => card(r, true)).join('')); };
  fill($('#marqueeA'), reviews.slice(0, half));
  fill($('#marqueeB'), reviews.slice(half));

  /* ---------- quote form ---------- */
  const form = $('#quoteForm'), note = $('#formNote');
  const TO = 'revivalroofingandexteriors@gmail.com';
  const btn = $('button[type=submit]', form), btnHTML = btn.innerHTML;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    note.className = 'form__note'; note.textContent = '';
    const name = form.name.value.trim(), digits = form.phone.value.replace(/\D/g, '');
    form.name.classList.toggle('is-bad', !name);
    form.phone.classList.toggle('is-bad', digits.length < 7);
    if (!name || digits.length < 7) {
      note.classList.add('err'); note.textContent = 'Please add your name and a phone number so we can reach you.';
      return;
    }
    if (form._honey.value) return;
    const data = Object.fromEntries(new FormData(form));
    delete data._honey;
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
      btn.disabled = false; btn.innerHTML = btnHTML;
    }
  });

  $('#yr').textContent = new Date().getFullYear();
  window.addEventListener('load', () => lenis && lenis.resize());
})();
