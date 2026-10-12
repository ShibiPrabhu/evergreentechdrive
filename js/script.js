// Evergreen TechDrive - site behaviour
// theme toggle, sheet-index rail, product catalogue explorer, quote viewer,
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

  // ---------- theme toggle (paper / blueprint) ----------
  function setupTheme() {
    var root = document.documentElement;
    var btns = qsa('.theme-toggle');
    if (!btns.length) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btns.forEach(function (b) {
        b.setAttribute('aria-pressed', dark ? 'true' : 'false');
        b.setAttribute('aria-label', dark ? 'Switch to paper mode' : 'Switch to blueprint mode');
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

  // ---------- product catalogue: tree + datasheet ----------
  function setupExplorer() {
    var data = window.ETD_CATALOG || [];
    var tree = qs('#tree');
    var sheet = qs('#datasheet');
    if (!tree || !sheet || !data.length) return;

    var ci = 0;       // category shown in the datasheet
    var mi = 0;       // model shown in the datasheet
    var openC = 0;    // category expanded in the tree

    tree.innerHTML = data.map(function (c, i) {
      var n = c.items.length;
      return '<div class="cat" data-c="' + i + '">' +
        '<button type="button" class="cat-btn" data-c="' + i + '" aria-expanded="false" aria-controls="models-' + i + '">' +
          '<span class="n">' + pad(i + 1) + '</span>' +
          '<span class="name">' + esc(c.title) + '</span>' +
          '<span class="count">' + n + (n === 1 ? ' model' : ' models') + '</span>' +
        '</button>' +
        '<ul class="models" id="models-' + i + '" hidden>' +
          c.items.map(function (m, j) {
            return '<li><button type="button" class="model-btn" data-c="' + i + '" data-m="' + j + '">' + esc(m.name) + '</button></li>';
          }).join('') +
        '</ul></div>';
    }).join('');

    function paintTree() {
      qsa('.cat', tree).forEach(function (el, i) {
        var open = i === openC;
        el.classList.toggle('is-open', open);
        qs('.cat-btn', el).setAttribute('aria-expanded', open ? 'true' : 'false');
        qs('.models', el).hidden = !open;
      });
      qsa('.model-btn', tree).forEach(function (b) {
        var on = +b.dataset.c === ci && +b.dataset.m === mi;
        if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
    }

    function paintSheet() {
      var c = data[ci];
      var m = c.items[mi];
      var n = c.items.length;
      sheet.innerHTML =
        '<div class="ds-top mono-label"><span>Datasheet &middot; ' + esc(c.title) + '</span><span>' + pad(mi + 1) + ' / ' + pad(n) + '</span></div>' +
        '<figure class="ds-figure"><img src="' + esc(m.img) + '" alt="' + esc(m.alt || m.name) + '"></figure>' +
        '<h3 class="ds-model">' + esc(m.name) + '</h3>' +
        '<dl class="specs">' + m.specs.map(function (r) {
          return '<div class="spec"><dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd></div>';
        }).join('') + '</dl>' +
        '<div class="ds-actions">' +
          '<button type="button" class="btn" data-enquire>Enquire about this model <span aria-hidden="true">&rarr;</span></button>' +
          (n > 1 ?
            '<div class="ds-step">' +
              '<button type="button" class="round-btn" data-step="-1" aria-label="Previous model">&larr;</button>' +
              '<button type="button" class="round-btn" data-step="1" aria-label="Next model">&rarr;</button>' +
            '</div>' : '') +
        '</div>' +
        '<div class="ds-note"><p class="mono-label">About this range</p><p>' + esc(c.blurb) + '</p></div>';
    }

    function select(c, m, scroll) {
      ci = c; mi = m; openC = c;
      paintTree();
      paintSheet();
      if (scroll && window.matchMedia('(max-width: 899px)').matches) {
        sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    tree.addEventListener('click', function (e) {
      var mb = e.target.closest('.model-btn');
      if (mb) { select(+mb.dataset.c, +mb.dataset.m, true); return; }
      var cb = e.target.closest('.cat-btn');
      if (!cb) return;
      var i = +cb.dataset.c;
      if (i === ci) {                 // same category: just fold / unfold its models
        openC = openC === i ? -1 : i;
        paintTree();
      } else {
        select(i, 0, false);
      }
    });

    sheet.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (step) {
        var n = data[ci].items.length;
        select(ci, (mi + (+step.dataset.step) + n) % n, false);
        var again = qs('[data-step="' + step.dataset.step + '"]', sheet);
        if (again) again.focus();
        return;
      }
      if (e.target.closest('[data-enquire]')) enquire(data[ci], data[ci].items[mi]);
    });

    // put the chosen model into the contact form and jump to it
    function enquire(c, m) {
      var msg = qs('#message-field');
      var contact = qs('#contact');
      if (msg) {
        var line = 'Enquiry about: ' + m.name + ' (' + c.title + ')\nQuantity / application: ';
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

    select(0, 0, false);
  }

  // ---------- customer quotes: one at a time ----------
  function setupQuotes() {
    var wrap = qs('#quotes');
    if (!wrap) return;
    var tabs = qsa('[role="tab"]', wrap);
    var panels = qsa('.quote', wrap);
    var count = qs('#quote-count');
    var cur = 0;

    function show(i, focusTab) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
      });
      panels.forEach(function (p, k) {
        var on = k === cur;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
      if (count) count.textContent = (cur + 1) + ' / ' + tabs.length;
      if (focusTab) tabs[cur].focus();
    }

    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
      });
    });
    var prev = qs('#quote-prev'), next = qs('#quote-next');
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
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
    setupExplorer();
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
  const phoneNumber = '919003790287';

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


