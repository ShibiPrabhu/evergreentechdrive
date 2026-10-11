// Mobile menu toggle, right-aligned hamburger animation,
// dynamic header offset, anchor scrolling with sticky-header offset,
// logo click to hero, optional 10-digit mobile validation,
// and WhatsApp floating button handler.

(function () {
  // ---------- helpers ----------
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function headerHeight() {
    const h = qs('header');
    return h ? h.getBoundingClientRect().height : 0;
  }

  function adjustBodyOffset() {
    const h = headerHeight();
    document.body.style.paddingTop = h ? h + 'px' : '';
  }

  function smoothScrollToId(id) {
    const target = qs(id);
    if (!target) return;
    const y = window.scrollY + target.getBoundingClientRect().top;
    const offset = headerHeight() + 8; // ensure the H2 or hero title is fully visible
    window.scrollTo({ top: Math.max(0, y - offset), behavior: 'smooth' });
  }


  // ---------- navigation ----------
  function setupMenuToggle() {
    const btn = qs('.menu-toggle');
    const nav = qs('#site-nav');
    if (!btn || !nav) return;

    // Toggle open/close
    btn.addEventListener('click', function () {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // Intercept in-page links for offset scrolling
    qsa('nav a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          e.preventDefault();
          if (nav.classList.contains('open')) {
            nav.classList.remove('open');
            btn.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
          }
          smoothScrollToId(href);
        }
      });
    });

    // Close menu when resizing to desktop
    window.addEventListener('resize', function () {
      const isMobile = window.matchMedia('(max-width: 700px)').matches;
      if (!isMobile && nav.classList.contains('open')) {
        nav.classList.remove('open');
        btn.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setupLogoScroll() {
    const logo = qs('a.logo-link[href^="#"]');
    if (!logo) return;

    logo.addEventListener('click', function (e) {
      const href = logo.getAttribute('href');
      if (!href || href.length < 2) return;
      e.preventDefault();

      // Close mobile menu if open
      const nav = qs('#site-nav');
      const btn = qs('.menu-toggle');
      if (nav && nav.classList.contains('open')) {
        nav.classList.remove('open');
        if (btn) {
          btn.classList.remove('is-open');
          btn.setAttribute('aria-expanded', 'false');
        }
      }

      smoothScrollToId(href);
    });
  }

  // ---------- optional mobile number validation ----------
  function setupMobileValidation() {
    const form = qs('form');
    const mobile = qs('#mobile');
    if (!form || !mobile) return;

    function isValidMobile(val) {
      return /^\d{10}$/.test(val);
    }

    // Keep only digits and cap at 10
    mobile.addEventListener('input', function () {
      const digits = mobile.value.replace(/\D+/g, '').slice(0, 10);
      if (mobile.value !== digits) mobile.value = digits;
      mobile.setCustomValidity('');
    });

    // Validate on blur if user entered something
    mobile.addEventListener('blur', function () {
      if (mobile.value && !isValidMobile(mobile.value)) {
        mobile.setCustomValidity('Enter a 10-digit mobile number');
      } else {
        mobile.setCustomValidity('');
      }
    });

    // Validate on submit only if field is filled (field is optional)
    form.addEventListener('submit', function (e) {
      if (mobile.value && !isValidMobile(mobile.value)) {
        e.preventDefault();
        mobile.reportValidity();
      }
    });
  }
// ---------- Back-to-Top floater -> scroll to #hero (new, minimal) ----------
function setupBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  btn.addEventListener('click', function (e) {
  const href = btn.getAttribute('href');
  if (href && href.startsWith('#')) {
  e.preventDefault();
  smoothScrollToId(href);
  }
  });
  }

  //back to top hide/unhide fucntion
  function setupBackToTopVisibility() {
    const backToTop = document.getElementById('back-to-top');
    const heroSection = document.getElementById('hero');
    if (!backToTop || !heroSection) return;
  
    function updateBackToTopVisibility() {
      // Find distance from hero section's bottom to top of viewport
      const rect = heroSection.getBoundingClientRect();
      if (rect.bottom < 0) {
        // Hero section is completely above the viewport
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  
    window.addEventListener('scroll', updateBackToTopVisibility);
    // Run once at load
    updateBackToTopVisibility();
  }
  
  // ---------- init ----------
  function init() {
    setupMenuToggle();
    setupLogoScroll(); // now reloads the page
    setupMobileValidation();
    setupBackToTop(); // new addition; safe if element absent
    setupBackToTopVisibility(); 
    adjustBodyOffset();
    window.addEventListener('resize', adjustBodyOffset);
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

  // Optional honeypot (keeps your UI/validation unchanged)
  let hp = form.querySelector('input[name="company"]');
  if (!hp) {
    hp = document.createElement('input');
    hp.type = 'text';
    hp.name = 'company';
    hp.autocomplete = 'off';
    hp.tabIndex = -1;
    hp.style.position = 'absolute';
    hp.style.left = '-9999px';
    form.appendChild(hp);
  }

  form.addEventListener('submit', function(e) {
    if (!form.checkValidity()) return; // preserve your existing validations
    e.preventDefault();

    if (hp && hp.value) { alert('Submission blocked.'); return; }

    const fd = new FormData(form);
    const payload = new FormData();
    payload.append(map.name,    (fd.get('name') || '').toString().trim());
    payload.append(map.mobile,  (fd.get('mobile') || '').toString().trim());
    payload.append(map.email,   (fd.get('email') || '').toString().trim());
    payload.append(map.message, (fd.get('message') || '').toString().trim());

    const btn = form.querySelector('button[type="submit"]');
    const prev = btn?.textContent;
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

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

    const cleanup = () => {
      ghost.remove();
      iframe.remove();
      if (btn) { btn.disabled = false; btn.textContent = prev || 'Send Message'; }
      alert('Thanks! Your message was sent.');
      form.reset();
    };

    iframe.addEventListener('load', cleanup);
    ghost.submit();

    setTimeout(() => { if (document.body.contains(ghost)) cleanup(); }, 2000);
  });
})();


// ---------- Product Loading and Category Switching ----------
const initialProducts = document.querySelector('#products .products').innerHTML;

function loadInitialProducts() {
    const productsContainer = document.querySelector('#products .products');
    productsContainer.innerHTML = initialProducts;
      // Re-add "View More" buttons after content reload
  addViewMoreButtons();
}

function loadProductCategory(category) {
    const productsContainer = document.querySelector('#products .products');
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

    productsContainer.innerHTML = html;
    window.scrollTo({ top: document.getElementById('products').offsetTop - 80, behavior: 'smooth' });
}

/* customer carousel function */

(function setupCustomerCarousel() {
  const carousel = document.querySelector('.customers-carousel');
  if (!carousel) return;

  const track = carousel.querySelector('.customers-track');
  const leftArrow = carousel.querySelector('.left-arrow');
  const rightArrow = carousel.querySelector('.right-arrow');
  const cards = track.querySelectorAll('.customer-item');

  let visibleCards = window.matchMedia('(max-width:700px)').matches ? 1 : 5;
  let autoScrollTimer;
  let scrollStep = 0;

  function updateVisibleCards() {
    visibleCards = window.matchMedia('(max-width:700px)').matches ? 1 : 5;
    const card = cards[0];
    if (card) {
      const cardStyle = window.getComputedStyle(card);
      scrollStep = card.offsetWidth + parseInt(cardStyle.marginLeft) + parseInt(cardStyle.marginRight);
    }
  }

  function scrollToPosition(pos) {
    track.scrollTo({ left: pos, behavior: 'smooth' });
  }

  updateVisibleCards();

  leftArrow.addEventListener('click', () => {
    track.scrollBy({ left: -scrollStep, behavior: 'smooth' });
    resetAutoScroll();
  });

  rightArrow.addEventListener('click', () => {
    track.scrollBy({ left: scrollStep, behavior: 'smooth' });
    resetAutoScroll();
  });

  function autoScroll() {
    if (track.scrollLeft + track.offsetWidth >= track.scrollWidth - scrollStep) {
      track.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      track.scrollBy({ left: scrollStep, behavior: 'smooth' });
    }
    autoScrollTimer = setTimeout(autoScroll, 1000);
  }

  function resetAutoScroll() {
    clearTimeout(autoScrollTimer);
    autoScrollTimer = setTimeout(autoScroll, 1500);
  }

  autoScrollTimer = setTimeout(autoScroll, 1500);

  window.addEventListener('resize', () => {
    updateVisibleCards();
  });

  carousel.addEventListener('mouseenter', () => clearTimeout(autoScrollTimer));
  carousel.addEventListener('mouseleave', resetAutoScroll);
})();


/* -----View more button logic --------*/
/* -------- Add "View More" button only to initial product cards -------- */
function addViewMoreButtons() {
  const initialSection = document.querySelector('.initial-products');
  if (!initialSection) return;

  const productCards = initialSection.querySelectorAll('.product-item');
  productCards.forEach(card => {
    // Prevent duplicate button
    if (card.querySelector('.view-more-btn')) return;

    const btn = document.createElement('button');
    btn.className = 'view-more-btn';
    btn.textContent = 'View More';
    btn.onclick = () => loadInitialProducts();

    card.appendChild(btn);
  });
}

// Run once on load
document.addEventListener('DOMContentLoaded', addViewMoreButtons);

window.scrollToQuoteForm = function scrollToQuoteForm() {
  const form = document.getElementById('contact-form');
  const header = document.querySelector('header');
  if (!form) return;

  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const formRect = form.getBoundingClientRect();
  const availableHeight = window.innerHeight - headerHeight - 32;
  const extraSpace = Math.max(0, availableHeight - formRect.height);
  const scrollTop = window.scrollY + formRect.top - headerHeight - 16 - (extraSpace / 2);

  window.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  });
};
