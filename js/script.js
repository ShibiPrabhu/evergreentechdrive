// Evergreen TechDrive - site behaviour
// theme toggle, sheet-index rail, product catalogue menu + datasheet, quote viewer,
// back-to-top, enquiry form (Google Forms bridge), WhatsApp button.

(function () {
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- theme toggle (light / dark) ----------
  function setupTheme() {
    var root = document.documentElement;
    var btns = qsa('.theme-toggle');
    if (!btns.length) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', dark ? 'true' : 'false');
        b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
      });
    }
    sync();

    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.setAttribute('data-theme', next);
        try { localStorage.setItem('etd-theme', next); } catch (e) {}
        sync();
      });
    });
  }

  // ---------- rail: mobile drawer, active sheet, progress line ----------
  function setupRail() {
    var rail = qs('#rail');
    var nav = qs('#site-nav');
    var toggle = qs('.menu-toggle');
    if (!rail || !nav) return;

    function setOpen(open) {
      rail.classList.toggle('open', open);
      if (toggle) {
        toggle.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }
      document.body.style.overflow = open ? 'hidden' : '';
    }

    if (toggle) toggle.addEventListener('click', function () { setOpen(!rail.classList.contains('open')); });
    qsa('a', rail).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1100px)').matches) setOpen(false);
    });

    var links = qsa('a[href^="#"]', nav);
    var byId = {};
    links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });

    function mark(a) {
      links.forEach(function (l) { l.classList.remove('is-active'); });
      a.classList.add('is-active');
      nav.style.setProperty('--fill', (a.offsetTop + a.offsetHeight / 2) + 'px');
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && byId[en.target.id]) mark(byId[en.target.id]);
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      Object.keys(byId).forEach(function (id) {
        var el = document.getElementById(id);
        if (el) io.observe(el);
      });
    }
    if (byId.hero) mark(byId.hero);
  }

  // ---------- product catalogue: menu (Category > Sub-category > Product) + datasheet ----------
  // Everything is drawn from window.ETD_CATALOG (js/data.js).
  // A product can be linked directly:  index.html#product/<product-slug>
  function setupCatalog() {
    var data = window.ETD_CATALOG || [];
    var tree = qs('#tree');
    var sheet = qs('#datasheet');
    if (!tree || !sheet || !data.length) return;

    // flat list of each category's products, in menu order (used for prev / next and the "n / total" counter)
    var flat = data.map(function (c) {
      var list = [];
      c.subcategories.forEach(function (s) {
        s.products.forEach(function (p) { list.push({ cat: c, sub: s, product: p }); });
      });
      return list;
    });
    var bySlug = {};
    flat.forEach(function (list, ci) {
      list.forEach(function (it, i) { bySlug[it.product.slug] = { c: ci, i: i }; });
    });

    var ci = 0;       // category shown in the datasheet
    var pi = 0;       // position of the product within that category
    var openC = 0;    // category expanded in the menu

    function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

    tree.innerHTML = data.map(function (c, i) {
      var n = flat[i].length;
      return '<div class="cat" data-c="' + i + '">' +
        '<button type="button" class="cat-btn" data-c="' + i + '" aria-expanded="false" aria-controls="models-' + i + '">' +
          '<span class="n">' + pad(i + 1) + '</span>' +
          '<span class="name">' + esc(c.title) + '</span>' +
          '<span class="count">' + plural(n, 'product', 'products') + '</span>' +
        '</button>' +
        '<div class="models" id="models-' + i + '" hidden>' +
          c.subcategories.map(function (s) {
            return '<div class="sub" role="group" aria-label="' + esc(s.title) + '">' +
              '<p class="sub-label"><span>' + esc(s.title) + '</span><span>' + s.products.length + '</span></p>' +
              '<ul>' + s.products.map(function (p) {
                return '<li><button type="button" class="model-btn" data-slug="' + esc(p.slug) + '">' + esc(p.name) + '</button></li>';
              }).join('') + '</ul>' +
            '</div>';
          }).join('') +
        '</div></div>';
    }).join('');

    function paintTree() {
      var cur = flat[ci][pi].product.slug;
      qsa('.cat', tree).forEach(function (el, i) {
        var open = i === openC;
        el.classList.toggle('is-open', open);
        qs('.cat-btn', el).setAttribute('aria-expanded', open ? 'true' : 'false');
        qs('.models', el).hidden = !open;
      });
      qsa('.model-btn', tree).forEach(function (b) {
        if (b.dataset.slug === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }

    function paintSheet() {
      var it = flat[ci][pi];
      var c = it.cat, s = it.sub, p = it.product;
      var n = flat[ci].length;
      sheet.innerHTML =
        '<div class="ds-top mono-label"><span>' + esc(c.title) + ' &rsaquo; ' + esc(s.title) + '</span><span>' + pad(pi + 1) + ' / ' + pad(n) + '</span></div>' +
        '<figure class="ds-figure"><img src="' + esc(p.img) + '" alt="' + esc(p.name) + '" width="1920" height="1152"></figure>' +
        '<h3 class="ds-model">' + esc(p.name) + '</h3>' +
        (p.specs.length ? '<h4 class="ds-h mono-label">Specifications</h4><dl class="specs">' + p.specs.map(function (r) {
          return '<div class="spec"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
        }).join('') + '</dl>' : '') +
        (p.features.length ? '<h4 class="ds-h mono-label">Key features</h4><ul class="feats">' + p.features.map(function (f) {
          return '<li>' + esc(f) + '</li>';
        }).join('') + '</ul>' : '') +
        '<div class="ds-actions">' +
          '<button type="button" class="btn" data-enquire>Enquire about this product <span aria-hidden="true">&rarr;</span></button>' +
          (n > 1 ?
            '<div class="ds-step">' +
              '<button type="button" class="round-btn" data-step="-1" aria-label="Previous product">&larr;</button>' +
              '<button type="button" class="round-btn" data-step="1" aria-label="Next product">&rarr;</button>' +
            '</div>' : '') +
        '</div>';
    }

    function select(c, i, scroll, updateHash) {
      ci = c; pi = i; openC = c;
      paintTree();
      paintSheet();
      if (updateHash !== false) {
        try { history.replaceState(null, '', '#product/' + flat[c][i].product.slug); } catch (e) {}
      }
      if (scroll && window.matchMedia('(max-width: 899px)').matches) {
        sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    tree.addEventListener('click', function (e) {
      var mb = e.target.closest('.model-btn');
      if (mb) {
        var at = bySlug[mb.dataset.slug];
        select(at.c, at.i, true);
        return;
      }
      var cb = e.target.closest('.cat-btn');
      if (!cb) return;
      var i = +cb.dataset.c;
      if (i === ci) {                 // same category: just fold / unfold its products
        openC = openC === i ? -1 : i;
        paintTree();
      } else {
        select(i, 0, false);
      }
    });

    sheet.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) {
        var n = flat[ci].length;
        select(ci, (pi + (+step.dataset.step) + n) % n, false);
        var again = qs('[data-step="' + step.dataset.step + '"]', sheet);
        if (again) again.focus();
        return;
      }
      if (e.target.closest('[data-enquire]')) enquire(flat[ci][pi]);
    });

    // put the chosen product into the contact form and jump to it
    function enquire(it) {
      var msg = qs('#message-field');
      var contact = qs('#contact');
      if (msg) {
        var line = 'Enquiry about: ' + it.product.name + ' (' + it.cat.title + ' > ' + it.sub.title + ')\nQuantity / application: ';
        if (!msg.value.trim() || msg.dataset.auto === '1') {
          msg.value = line;
          msg.dataset.auto = '1';
        } else {
          msg.value = msg.value.replace(/\s+$/, '') + '\n\n' + line;
          msg.dataset.auto = '';
        }
      }
      if (contact) contact.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () {
        if (msg) {
          msg.focus({ preventScroll: true });
          msg.setSelectionRange(msg.value.length, msg.value.length);
        }
      }, 650);
    }
    var msgField = qs('#message-field');
    if (msgField) msgField.addEventListener('input', function () { msgField.dataset.auto = ''; });

    // a shared link (#product/<slug>) opens straight onto that product
    function fromHash() {
      var m = (location.hash || '').match(/^#product\/([^/]+)$/);
      return m && bySlug[m[1]] ? bySlug[m[1]] : null;
    }
    window.addEventListener('hashchange', function () {
      var at = fromHash();
      if (at) select(at.c, at.i, false, false);
    });

    var first = fromHash();
    if (first) {
      select(first.c, first.i, false, false);
      window.addEventListener('load', function () { qs('#products').scrollIntoView(); }, { once: true });
    } else {
      select(0, 0, false, false);   // first product is selected...
      openC = -1;                   // ...but the menu starts folded
      paintTree();
    }
  }

  // ---------- customer quotes: automatic, one at a time ----------
  // Each quote stays for QUOTE_MS, fades out, the next fades in, and after the last it loops to the first.
  // Not clickable. Rotation pauses while the tab is hidden or the pointer rests on the quote.
  function setupQuotes() {
    var wrap = qs('#quotes');
    if (!wrap) return;
    var panels = qsa('.quote', wrap);
    var count = qs('#quote-count');
    var bar = qs('.quote-progress', wrap);
    var QUOTE_MS = 5000;
    var cur = 0, timer = null, hovering = false;
    if (panels.length < 2) return;

    function show(i) {
      cur = (i + panels.length) % panels.length;
      panels.forEach(function (p, k) {
        var on = k === cur;
        p.classList.toggle('is-active', on);
        p.setAttribute('aria-hidden', on ? 'false' : 'true');
      });
      if (count) count.textContent = (cur + 1) + ' / ' + panels.length;
      if (bar) { bar.classList.remove('run'); void bar.offsetWidth; bar.classList.add('run'); }
    }

    function schedule() {
      clearTimeout(timer);
      timer = setTimeout(function () {
        if (document.hidden || hovering) { schedule(); return; }
        show(cur + 1);
        schedule();
      }, QUOTE_MS);
    }

    wrap.addEventListener('mouseenter', function () { hovering = true; if (bar) bar.classList.add('paused'); });
    wrap.addEventListener('mouseleave', function () {
      hovering = false;
      if (bar) bar.classList.remove('paused');
      show(cur); schedule();   // give the current quote a fresh 5 seconds
    });

    show(0);
    schedule();
  }

  // ---------- optional 10-digit mobile validation ----------
  function setupMobileValidation() {
    var form = qs('#contact-form');
    var mobile = qs('#mobile');
    if (!form || !mobile) return;

    function isValid(val) { return /^\d{10}$/.test(val); }

    mobile.addEventListener('input', function () {
      var digits = mobile.value.replace(/\D+/g, '').slice(0, 10);
      if (mobile.value !== digits) mobile.value = digits;
      mobile.setCustomValidity('');
    });

    mobile.addEventListener('blur', function () {
      mobile.setCustomValidity(mobile.value && !isValid(mobile.value) ? 'Enter a 10-digit mobile number' : '');
    });

    form.addEventListener('submit', function (e) {
      if (mobile.value && !isValid(mobile.value)) {
        e.preventDefault();
        mobile.setCustomValidity('Enter a 10-digit mobile number');
        mobile.reportValidity();
      }
    });
  }

  // ---------- "Talk to our team" focuses the form after scrolling ----------
  function setupQuoteLinks() {
    qsa('[data-quote]').forEach(function (a) {
      a.addEventListener('click', function () {
        setTimeout(function () {
          var field = qs('#name-field');
          if (field) field.focus({ preventScroll: true });
        }, 700);
      });
    });
  }

  // ---------- back-to-top: only shown once the visitor has scrolled down ----------
  function setupBackToTop() {
    var btn = qs('#back-to-top');
    if (!btn) return;
    var ticking = false;
    function update() {
      ticking = false;
      btn.classList.toggle('is-visible', window.scrollY > 320);
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  function init() {
    setupTheme();
    setupRail();
    setupCatalog();
    setupQuotes();
    setupMobileValidation();
    setupQuoteLinks();
    setupBackToTop();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ---------- WhatsApp floating icon ----------
(function () {
  const whatsappFloat = document.getElementById('whatsapp-float');
  if (!whatsappFloat) return;

  // Replace with your phone number here, in international format without + or spaces
  // Example: 919999999999
  const phoneNumber = '919092097887';

  whatsappFloat.addEventListener('click', function (e) {
    e.preventDefault();
    const url = `https://wa.me/${phoneNumber}`;
    window.open(url, '_blank', 'noopener');
  });
})();


// ---- Google Forms bridge (using your real IDs) ----
(function setupGoogleFormBridge() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSfm4KqSHKhxAMI6A2FLNHqJ-H_JCZ4NBdsup3XXJDeLKvyGig/formResponse';

  const map = {
    name:    'entry.511196757',
    mobile:  'entry.1678160039',
    email:   'entry.1408178537',
    message: 'entry.850678214'
  };

  const status = document.getElementById('form-status');
  function say(text, isError) {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle('is-error', !!isError);
  }

  // Optional honeypot
  let hp = form.querySelector('input[name="company"]');
  if (!hp) {
    hp = document.createElement('input');
    hp.type = 'text';
    hp.name = 'company';
    hp.autocomplete = 'off';
    hp.tabIndex = -1;
    hp.setAttribute('aria-hidden', 'true');
    hp.style.position = 'absolute';
    hp.style.left = '-9999px';
    form.appendChild(hp);
  }

  form.addEventListener('submit', function (e) {
    if (!form.checkValidity()) return; // let the browser show its validation messages
    e.preventDefault();

    if (hp && hp.value) { say('Submission blocked.', true); return; }

    const fd = new FormData(form);
    const payload = new FormData();
    payload.append(map.name,    (fd.get('name') || '').toString().trim());
    payload.append(map.mobile,  (fd.get('mobile') || '').toString().trim());
    payload.append(map.email,   (fd.get('email') || '').toString().trim());
    payload.append(map.message, (fd.get('message') || '').toString().trim());

    const btn = form.querySelector('button[type="submit"]');
    const prev = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    say('');

    const iframe = document.createElement('iframe');
    iframe.name = 'gform_iframe';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const ghost = document.createElement('form');
    ghost.action = ACTION;
    ghost.method = 'POST';
    ghost.target = 'gform_iframe';
    ghost.style.display = 'none';

    for (const [k, v] of payload.entries()) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = k;
      input.value = v;
      ghost.appendChild(input);
    }

    document.body.appendChild(ghost);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      ghost.remove();
      iframe.remove();
      if (btn) { btn.disabled = false; btn.innerHTML = prev; }
      say('Thank you for connecting. We will get back to you shortly.');
      form.reset();
    };

    iframe.addEventListener('load', cleanup);
    ghost.submit();

    setTimeout(cleanup, 2000);
  });
})();


