// Evergreen TechDrive - site behaviour
// theme toggle, mobile menu, scroll reveal, product category browser,
// enquiry form (Google Forms bridge), WhatsApp button.

(function () {
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  // ---------- theme toggle ----------
  function setupTheme() {
    var root = document.documentElement;
    var btn = qs('.theme-toggle');
    if (!btn) return;

    function sync() {
      var dark = root.getAttribute('data-theme') === 'dark';
      btn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    }
    sync();

    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('etd-theme', next); } catch (e) {}
      sync();
    });
  }

  // ---------- mobile menu ----------
  function setupMenu() {
    var btn = qs('.menu-toggle');
    var nav = qs('#site-nav');
    if (!btn || !nav) return;

    function close() {
      nav.classList.remove('open');
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    qsa('a', nav).forEach(function (a) { a.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 901px)').matches) close();
    });
  }

  // ---------- highlight the nav link of the section in view ----------
  function setupActiveNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = qsa('#site-nav a[href^="#"]');
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[en.target.id];
        if (a) a.classList.add('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // ---------- reveal on scroll ----------
  function setupReveal() {
    var items = qsa('.reveal');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
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

  // ---------- "Talk to our team" focuses the form on the contact section ----------
  function setupQuoteLinks() {
    qsa('[data-quote]').forEach(function (a) {
      a.addEventListener('click', function () {
        setTimeout(function () {
          var field = qs('#name-field');
          if (field) field.focus({ preventScroll: true });
        }, 600);
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
    setupBackToTop();
    setupTheme();
    setupMenu();
    setupActiveNav();
    setupReveal();
    setupMobileValidation();
    setupQuoteLinks();
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


// ---------- Product categories ----------
const productsGrid = document.getElementById('products-grid');
const backButton = document.getElementById('products-back');
const initialProducts = productsGrid ? productsGrid.innerHTML : '';

function scrollToProducts() {
  const sec = document.getElementById('products');
  if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadInitialProducts() {
  if (!productsGrid) return;
  productsGrid.innerHTML = initialProducts;
  productsGrid.classList.add('initial-products');
  if (backButton) backButton.hidden = true;
}

function loadProductCategory(category) {
    let html = '';


    switch (category) {
        case 'nord-gear-motors':
            html += `
                <div class="product-item">
                    <img src="images/nord-inline-helical-geared-motors.webp" alt="Nord Unicase Inline Helical Geared Motors">
                    <h3>Nord Unicase Inline Helical Geared Motors</h3>
                    <p>
                      <ul>
                      <li>Power <b>7.5kW</b></li>
                      <li>Rate Speed <b>90RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Unicase Inline</b></li>
                      </ul>  
                    </p>                 
                </div>
                <div class="product-item">
                    <img src="images/nord-unicase-parallel-shaft-gear-motors.webp" alt="Nord Unicase Parallel Shaft Gear Motors">
                    <h3>Nord Unicase Parallel Shaft Gear Motors</h3>
                    <p>
                      <ul>
                      <li>Power <b>2.2kW</b></li>
                      <li>Rate Speed <b>90RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Unicase Parallel</b></li>
                      </ul>  
                    </p>   
                </div>
                <div class="product-item">
                    <img src="images/nord-b5010-duodrive-geared-motor.webp" alt="Nord B5010 DuoDrive Geared Motor">
                    <h3>Nord B5010 DuoDrive Geared Motor</h3>
                    <p>
                      <ul>
                      <li>Power <b>3kW</b></li>
                      <li>Rate Speed <b>1440RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>440V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>B5010</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/mr4.webp" alt="Nord Max Drive XC Right Angle Gear Motor">
                    <h3>Nord Max Drive XC Right Angle Gear Motor</h3>
                    <p>
                      <ul>
                      <li>Power <b>140kW</b></li>
                      <li>Rate Speed <b>1800RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Used in heavy-duty industrial applications</b></li>
                      <li>Phase <b>3 Phase</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Max Drive XC</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/maxxdrive-xc-parallel-gear-units.webp" alt="Nord Max Drive XC Parallel Shaft Gear Motor">
                    <h3>Nord Max Drive XC Parallel Shaft Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>55kW</b></li>
                      <li>Rate Speed <b>3000RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Max Drive XC</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/hw2.webp" alt="Nord Unicase Worm Gear Motor">
                    <h3>Nord Unicase Worm Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>15kW</b></li>
                      <li>Rate Speed <b>90RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Model <b>Unicase</b></li>
                      <li>Brand <b>Nord</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/nordbloc-1-bevel-geared-motor.webp" alt="Nord Bloc 1 Bevel Geared Motor">
                    <h3>Nord Bloc 1 Bevel Geared Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>9.2kW</b></li>
                      <li>Rate Speed <b>90RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Nord Bevel</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/nord-universal-worm-gear-motors.webp" alt="Nord Universal SMI Worm Gear Motor">
                    <h3>Nord Universal SMI Worm Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>4kW</b></li>
                      <li>Rate Speed <b>90RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Universal SMI</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/v1.webp" alt="Nord V Belt Variator Gear Motor">
                    <h3>Nord V Belt Variator Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>90kW</b></li>
                      <li>Rate Speed <b>200RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415 V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>	V Belt</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/nord-unicase-bevel-helical-bevel-gear-motor.webp" alt="Nord Unicase Bevel Helical Bevel Gear Motor">
                    <h3>Nord Unicase Bevel Helical Bevel Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>220Kw</b></li>
                      <li>Rate Speed <b>90 RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Unicase Bevel</b></li>
                      </ul>  
                    </p>   
                </div>
                <div class="product-item">
                    <img src="images/nord-bloc-1-helical-inline-gear-motor.webp" alt="Nord Bloc 1 Helical Inline Gear Motor">
                    <h3>Nord Bloc 1 Helical Inline Gear Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>37Kw</b></li>
                      <li>Rate Speed <b>1440 RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>440V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Bloc 1</b></li>
                      </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/242163.webp" alt="Nord Standard Inline Helical Geared Motor">
                    <h3>Nord Standard Inline Helical Geared Motor</h3>
                      <p>
                      <ul>
                      <li>Power <b>7.5Kw</b></li>
                      <li>Rate Speed <b>90 RPM</b></li>
                      <li>Phase <b>Three Phase</b></li>
                      <li>Usage/Application <b>Conveyors</b></li>
                      <li>Voltage <b>415V</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Model <b>Standard Inline</b></li>
                      </ul>  
                    </p>
                </div>
           
            `;
            break;
        // Add similar cases for each new category as you add products
        case 'electric-motor':
            html += `
                <div class="product-item">
                    <img src="images/nord-single-phase-motors.webp" alt="Nord Single Phase Motor">
                    <h3>Nord Single Phase Motor</h3>
                    <p>
                      <ul>
                      <li>Power <b>45kW</b></li>
                      <li>Speed <b>750RPM</b></li>
                      <li>No Of Poles <b>2</b></li>
                      <li>Voltage <b>220V</b></li>
                      <li>Frequency <b>50Hz</b></li>
                      <li>Brand <b>Nord</b></li>
                    </ul>  
                    </p>
                </div>
               
            `;
            break;
            case 'asynchronous-electric-motor':
            html += `
                <div class="product-item">
                    <img src="images/standard-motors-asynchronous-motors-1.webp" alt="Nord Standard Asynchronous Motor">
                    <h3>Nord Standard Asynchronous Motor</h3>
                    <p>
                     <ul>
                      <li>Power <b>45kW</b></li>
                      <li>Speed <b>1400RPM</b></li>
                      <li>Motor Voltage <b>415V</b></li>
                      <li>No Of Phase <b>Three Phase</b></li>
                      <li>Type <b>Hight Voltage</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>IP Rating <b>IP66</b></li>
                      <li>Efficiency Class <b>IE3</b></li>
                    </ul>  
                    </p>
                </div>
                <div class="product-item">
                    <img src="images/nord-single-phase-motors.webp" alt="Nord Standard Asynchronous Motor">
                    <h3>Nord Standard Asynchronous Motor</h3>
                     <p>
                     <ul>
                      <li>Power <b>45kW</b></li>
                      <li>No Of Phase <b>Single Phase</b></li>
                      <li>No Of Poles <b>2</b></li>
                      <li>Brand <b>Nord</b></li>
                      <li>Country of Origin <b>India</b></li>
                    </ul>  
                    </p>
                </div>
            `;
            break;
            case 'synchronous-motors':
              html += `
                  <div class="product-item">
                      <img src="images/nord-tefc-synchronous-motor.webp" alt="Synchronous Motors">
                      <h3>Nord Standard Asynchronous Motor</h3>
                      <p>
                       <ul>
                        <li>Power <b>4kW</b></li>
                        <li>Horsepower <b>2HP</b></li>
                        <li>Speed <b>2800 rpm</b></li>
                        <li>No Of Phase <b>Three Phase</b></li>
                        <li>Voltage <b>415V</b></li>
                        <li>Frquency <b>60Hz</b></li>
                        <li>Brand <b>Nord</b></li>
                        <li>Model <b>synchronous</b></li>
                        <li>No Of Poles <b>4</b></li>
                      </ul>  
                      </p>
                  </div>
                  <div class="product-item">
                      <img src="images/nord-tefc-synchronous-motor.webp" alt="Synchronous Motors">
                      <h3>Nord Standard Asynchronous Motor</h3>
                       <p>
                       <ul>
                        <li>Power <b>4kW</b></li>
                        <li>Horsepower <b>2HP</b></li>
                        <li>Speed <b>750 rpm</b></li>
                        <li>No Of Phase <b>Single Phase</b></li>
                        <li>Voltage <b>220V</b></li>
                        <li>Frquency <b>50Hz</b></li>
                        <li>Brand <b>Nord</b></li>
                        <li>Model <b>synchronous</b></li>
                        <li>No Of Poles <b>4</b></li>
                      </ul>  
                      </p>
                  </div>
              `;
              break;
              case 'explosion-proof-motor':
                html += `
                    <div class="product-item">
                        <img src="images/nord-dust-explosion-protected-motor2.webp" alt="Nord Gas Explosion Protected Motor">
                        <h3>Nord Gas Explosion Protected Motor</h3>
                        <p>
                         <ul>
                          <li>Power <b>22kW</b></li>
                          <li>Brand <b>Nord</b></li>
                          <li>Voltage <b>415V</b></li>
                          <li>Frquency <b>50Hz</b></li>
                          <li>Product Type <b>Gas Explosion Protected Motor</b></li>
                        </ul>  
                        </p>
                    </div>
                    <div class="product-item">
                        <img src="images/nord-dust-explosion-protected-motor2.webp" alt="Nord Dust Explosion Protected Motor">
                        <h3>Nord Dust Explosion Protected Motor</h3>
                        <p>
                         <ul>
                          <li>Power <b>22kW</b></li>
                          <li>Brand <b>Nord</b></li>
                          <li>Voltage <b>415V</b></li>
                          <li>Frquency <b>50Hz</b></li>
                          <li>Product Type <b>Dust Explosion Protected Motor</b></li>
                        </ul>  
                        </p>
                    </div>
                `;
                break;
                case 'variable-frequency-drive-inverter':
                  html += `
                      <div class="product-item">
                          <img src="images/nord-pro-sk500e-vfd-inverter.webp" alt="Nord Pro SK500E VFD Inverter">
                          <h3>Nord Pro SK500E VFD Inverter</h3>
                          <p>
                           <ul>
                            <li>Power <b>160kW</b></li>
                            <li>Usage <b>For Industrial Machinery</b></li>
                            <li>Brand <b>Nord</b></li>
                            <li>Model <b>SK500E</b></li>
                            <li>Protection Class <b>IP20 </b></li>
                            <li>Voltage <b>480V</b></li>
                          </ul>  
                          </p>
                      </div>
                      <div class="product-item">
                          <img src="images/nordac-pro-vfd.webp" alt="Nordac Pro SK 500P VFD">
                          <h3>Nordac Pro SK 500P VFD</h3>
                          <p>
                           <ul>
                            <li>Power Rating <b>0.33 kW 30 HP</b></li>
                            <li>Input Voltage <b>415V</b></li>
                            <li>Input Phase <b>3 Phase</b></li>
                            <li>Brand <b>Nord</b></li>
                            <li>Model <b>SK 500P</b></li>
                            <li>Input Frequency <b>50 Hz</b></li>
                            <li>Protection Class <b>IP20</b></li>
                          </ul>                        
                          </p>
                      </div>

                  `;
                  break;
        default:
            html = initialProducts;
    }

    if (!productsGrid) return;
    productsGrid.innerHTML = html;
    productsGrid.classList.remove('initial-products');
    if (backButton) backButton.hidden = false;
    scrollToProducts();
}

// click anywhere on a category card to open it; the button handles keyboard users
if (productsGrid) {
  productsGrid.addEventListener('click', function (e) {
    const card = e.target.closest('.product-item[data-category]');
    if (card) loadProductCategory(card.getAttribute('data-category'));
  });
}

if (backButton) {
  backButton.addEventListener('click', function () {
    loadInitialProducts();
    scrollToProducts();
  });
}

// clicking the Products nav link always returns to the category overview
document.querySelectorAll('a[href="#products"]').forEach(function (a) {
  a.addEventListener('click', loadInitialProducts);
});
