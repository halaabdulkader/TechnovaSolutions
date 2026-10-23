// ========================================
// TECHNOVA SOLUTIONS - Website JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    TechnovaI18n.onChange(() => {
        const toggle = document.querySelector('.mobile-toggle');
        if (toggle) {
            const open = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-label', TechnovaI18n.t(open ? 'a11y.closeMenu' : 'a11y.openMenu'));
        }
        refreshOfferMessage();
    });
    initNavbar();
    initLeadPrefill();
    initContactForm();
    initSubscribeForm();
    initPricingRequest();
    initScrollAnimations();
});

// ========================================
// NAVBAR
// ========================================
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    const mqMobile = window.matchMedia('(max-width: 768px)');

    function closeMobileMenu() {
        if (!navLinks || !mobileToggle) return;
        navLinks.classList.remove('active');
        mobileToggle.classList.remove('active');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.setAttribute('aria-label', TechnovaI18n.t('a11y.openMenu'));
        document.body.classList.remove('nav-open');
    }

    function openMobileMenu() {
        if (!navLinks || !mobileToggle) return;
        navLinks.classList.add('active');
        mobileToggle.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileToggle.setAttribute('aria-label', TechnovaI18n.t('a11y.closeMenu'));
        document.body.classList.add('nav-open');
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        if (window.scrollY > 50) {
            navbar.style.padding = '14px 0';
            navbar.style.background = 'rgba(10, 10, 10, 0.92)';
        } else {
            navbar.style.padding = '16px 0';
            navbar.style.background = 'rgba(10, 10, 10, 0.78)';
        }
    });

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const willOpen = !navLinks.classList.contains('active');
            if (willOpen) {
                openMobileMenu();
            } else {
                closeMobileMenu();
            }
        });
    }

    mqMobile.addEventListener('change', (e) => {
        if (!e.matches) closeMobileMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            closeMobileMenu();
        });
    });
}

// ========================================
// CONTACT FORM → email (FormSubmit, static-host friendly)
// ========================================
const CONTACT_INBOX = 'info@technova-solutions.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${CONTACT_INBOX}`;
const LEAD_PREFILL_KEY = 'technovaLeadPrefill';

let activeOffer = '';

function offerKey(offer) {
    if (offer === 'manufacturing-starter') return 'offer.erp';
    if (offer === 'margin-pricing') return 'offer.pricing';
    return '';
}

function offerMessage(offer) {
    const key = offerKey(offer);
    return key ? TechnovaI18n.t(key) : '';
}

function refreshOfferMessage() {
    const msgEl = document.querySelector('#contactForm [name="message"]');
    const key = offerKey(activeOffer);
    if (!msgEl || !key) return;
    const pair = TechnovaI18n.pair(key);
    const current = msgEl.value;
    if (!current.trim() || current === pair.en || current === pair.tr) {
        msgEl.value = TechnovaI18n.t(key);
    }
}

function readPrefillFromEl(el) {
    const mode = el.getAttribute('data-prefill') || '';
    let projectType = mode;
    let budget = el.getAttribute('data-budget') || '';
    if (mode === 'erp') {
        projectType = 'erp';
        budget = budget || 'erp-custom';
    } else if (mode === 'pricing') {
        projectType = 'pricing';
        budget = budget || 'pricing-custom';
    } else if (mode === 'website') {
        projectType = 'website';
    }
    const offer = el.getAttribute('data-offer') || '';
    return { projectType, budget, offer, message: offerMessage(offer) };
}

function applyLeadPrefill(prefill) {
    const form = document.getElementById('contactForm');
    if (!form || !prefill) return;
    const typeEl = form.elements.namedItem('project-type');
    const budgetEl = form.elements.namedItem('budget');
    const msgEl = form.elements.namedItem('message');
    if (prefill.projectType && typeEl) typeEl.value = prefill.projectType;
    if (prefill.budget && budgetEl) budgetEl.value = prefill.budget;
    if (prefill.offer) activeOffer = prefill.offer;
    if (prefill.message && msgEl && !String(msgEl.value || '').trim()) {
        msgEl.value = prefill.message;
    }
}

function initLeadPrefill() {
    document.querySelectorAll('[data-prefill]').forEach((el) => {
        el.addEventListener('click', () => {
            const prefill = readPrefillFromEl(el);
            const href = el.getAttribute('href') || '';
            const hasLocalForm = Boolean(document.getElementById('contactForm'));
            const goesHomeHash =
                href.startsWith('/#') ||
                href.startsWith('index.html') ||
                href.includes('index.html#');

            if (hasLocalForm && (href.startsWith('#') || href.includes('#contact'))) {
                applyLeadPrefill(prefill);
            } else if (!hasLocalForm || goesHomeHash) {
                try {
                    sessionStorage.setItem(LEAD_PREFILL_KEY, JSON.stringify(prefill));
                } catch (_) {
                    /* ignore quota / private mode */
                }
            } else {
                applyLeadPrefill(prefill);
            }
        });
    });

    const params = new URLSearchParams(window.location.search);
    const fromUrl = {
        projectType: params.get('type') || '',
        budget: params.get('budget') || '',
        offer: params.get('offer') || '',
        message: offerMessage(params.get('offer') || '')
    };

    let stored = null;
    try {
        stored = JSON.parse(sessionStorage.getItem(LEAD_PREFILL_KEY) || 'null');
        if (stored) sessionStorage.removeItem(LEAD_PREFILL_KEY);
    } catch (_) {
        stored = null;
    }

    applyLeadPrefill(
        stored || (fromUrl.projectType || fromUrl.budget || fromUrl.offer ? fromUrl : null)
    );
}

function quoteMailtoLink(data) {
    const subject = 'Quote request — Technova Solutions';
    const body = [
        `Name: ${data.name}`,
        `Company: ${data.company || '—'}`,
        `Email: ${data.email}`,
        `Industry: ${data.industry || '—'}`,
        `Company size: ${data['company-size'] || '—'}`,
        `Project type: ${data['project-type'] || '—'}`,
        `Budget: ${data.budget || '—'}`,
        '',
        'Message:',
        data.message || '—'
    ].join('\n');
    return `mailto:${CONTACT_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        if ((fd.get('_honey') || '').toString().trim() !== '') {
            return;
        }

        const data = {
            name: (fd.get('name') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            company: (fd.get('company') || '').toString().trim(),
            industry: (fd.get('industry') || '').toString().trim(),
            'company-size': (fd.get('company-size') || '').toString().trim(),
            'project-type': (fd.get('project-type') || '').toString().trim(),
            budget: (fd.get('budget') || '').toString().trim(),
            message: (fd.get('message') || '').toString().trim()
        };

        const payload = {
            name: data.name,
            email: data.email,
            company: data.company || '—',
            industry: data.industry || '—',
            'company-size': data['company-size'] || '—',
            'project-type': data['project-type'] || '—',
            budget: data.budget || '—',
            message: data.message || '—',
            _subject: 'New inquiry — Technova Solutions (ERP / AI / Web)',
            _template: 'table',
            _captcha: false
        };

        const sentNote = showNotification(TechnovaI18n.t('contact.thanks'), 'success');
        form.reset();

        try {
            const res = await fetch(FORMSUBMIT_URL, {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json().catch(() => ({}));
            const ok =
                res.ok && (json.success === 'true' || json.success === true || json.success === 'True');

            if (!ok) {
                sentNote.remove();
                const hint =
                    typeof json.message === 'string'
                        ? json.message
                        : typeof json.error === 'string'
                          ? json.error
                          : TechnovaI18n.t('contact.tryAgain');
                showNotification(`${TechnovaI18n.t('contact.fail')}${hint}`, 'error', {
                    duration: 8000,
                    mailtoHref: quoteMailtoLink(data),
                    mailtoLabel: TechnovaI18n.t('contact.mail')
                });
            }
        } catch {
            sentNote.remove();
            showNotification(TechnovaI18n.t('contact.offline'), 'error', {
                duration: 9000,
                mailtoHref: quoteMailtoLink(data),
                mailtoLabel: TechnovaI18n.t('contact.mail')
            });
        }
    });
}

function subscribeMailto(data) {
    const subject = 'What to charge — Technova Solutions';
    const body = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Company: ${data.company || '—'}`,
        `Plan: ${data.plan}`,
        '',
        'Catalog:',
        data.catalog || '—'
    ].join('\n');
    return `mailto:${CONTACT_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function initSubscribeForm() {
    const form = document.getElementById('subscribeForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        if ((fd.get('_honey') || '').toString().trim() !== '') return;
        if (!form.reportValidity()) return;

        const plans = {
            monthly: 'Monthly — $15',
            yearly: 'Yearly — $150'
        };
        const plan = plans[(fd.get('plan') || '').toString()] || plans.monthly;
        const data = {
            name: (fd.get('name') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            company: (fd.get('company') || '').toString().trim(),
            catalog: (fd.get('catalog') || '').toString().trim(),
            plan
        };

        const payload = {
            name: data.name,
            email: data.email,
            company: data.company || '—',
            plan: data.plan,
            catalog: data.catalog,
            _subject: `What to charge — ${data.plan}`,
            _template: 'table',
            _captcha: false
        };

        const sentNote = showNotification(TechnovaI18n.t('price.sub.thanks'), 'success');
        form.reset();

        try {
            const res = await fetch(FORMSUBMIT_URL, {
                method: 'POST',
                keepalive: true,
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });
            const json = await res.json().catch(() => ({}));
            const ok =
                res.ok && (json.success === 'true' || json.success === true || json.success === 'True');
            if (!ok) {
                sentNote.remove();
                const hint =
                    typeof json.message === 'string'
                        ? json.message
                        : typeof json.error === 'string'
                          ? json.error
                          : TechnovaI18n.t('contact.tryAgain');
                showNotification(`${TechnovaI18n.t('contact.fail')}${hint}`, 'error', {
                    duration: 8000,
                    mailtoHref: subscribeMailto(data),
                    mailtoLabel: TechnovaI18n.t('contact.mail')
                });
            }
        } catch {
            sentNote.remove();
            showNotification(TechnovaI18n.t('contact.offline'), 'error', {
                duration: 9000,
                mailtoHref: subscribeMailto(data),
                mailtoLabel: TechnovaI18n.t('contact.mail')
            });
        }
    });
}

function pricingMailtoLink(data) {
    const subject = 'What to charge — Technova Solutions';
    const body = [
        `Name: ${data.name}`,
        `Email: ${data.email}`,
        `Item: ${data.item}`,
        `Item cost: ${data.cost || '—'}`,
        `Other costs: ${data.other || '—'}`,
        `Actual shipping: ${data.ship || '—'}`,
        `Customer shipping: ${data.customerShip || '—'}`,
        `VAT: ${data.vat || '—'}`,
        `Price includes VAT: ${data.vatIncluded || '—'}`,
        `Card commission: ${data.card || '—'}`,
        `Card fee: ${data.fee || '—'}`,
        `Company tax: ${data.tax || '—'}`,
        `Target net margin: ${data.margin || '—'}`,
        '',
        'Note:',
        data.note || '—'
    ].join('\n');
    return `mailto:${CONTACT_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function initPricingRequest() {
    const form = document.getElementById('pricingRequest');
    if (!form) return;

    const status = document.getElementById('pricingStatus');
    const submitBtn = form.querySelector('button[type="submit"]');
    const btnLabel = submitBtn?.querySelector('span');
    const submitLabel = btnLabel?.textContent ?? '';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fd = new FormData(form);
        if ((fd.get('_honey') || '').toString().trim() !== '') {
            return;
        }

        const data = {
            name: (fd.get('name') || '').toString().trim(),
            email: (fd.get('email') || '').toString().trim(),
            item: (fd.get('item') || '').toString().trim(),
            cost: (fd.get('item-cost') || '').toString().trim(),
            other: (fd.get('other-costs') || '').toString().trim(),
            ship: (fd.get('actual-shipping') || '').toString().trim(),
            customerShip: (fd.get('customer-shipping') || '').toString().trim(),
            vat: (fd.get('vat') || '').toString().trim(),
            vatIncluded: (fd.get('price-includes-vat') || '').toString().trim(),
            card: (fd.get('card-commission') || '').toString().trim(),
            fee: (fd.get('card-fee') || '').toString().trim(),
            tax: (fd.get('company-tax') || '').toString().trim(),
            margin: (fd.get('target-margin') || '').toString().trim(),
            note: (fd.get('note') || '').toString().trim()
        };

        const payload = {
            name: data.name,
            email: data.email,
            item: data.item,
            'item-cost': data.cost || '—',
            'other-costs': data.other || '—',
            'actual-shipping': data.ship || '—',
            'customer-shipping': data.customerShip || '—',
            vat: data.vat || '—',
            'price-includes-vat': data.vatIncluded || 'Not sure',
            'card-commission': data.card || '—',
            'card-fee': data.fee || '—',
            'company-tax': data.tax || '—',
            'target-margin': data.margin || '—',
            note: data.note || '—',
            _subject: `What to charge — ${data.item || data.name}`,
            _template: 'table',
            _captcha: false
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            if (btnLabel) btnLabel.textContent = 'Sending…';
        }
        if (status) {
            status.textContent = '';
            status.classList.remove('is-saved');
        }

        try {
            const res = await fetch(FORMSUBMIT_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const json = await res.json().catch(() => ({}));
            const ok =
                res.ok && (json.success === 'true' || json.success === true || json.success === 'True');

            if (ok) {
                if (status) {
                    status.textContent = 'Sent. We will reply with the price.';
                    status.classList.add('is-saved');
                }
                showNotification('Sent. We will reply with the price for this item.', 'success');
                form.reset();
            } else {
                const hint =
                    typeof json.message === 'string'
                        ? json.message
                        : typeof json.error === 'string'
                          ? json.error
                          : 'Please try again or use the email link.';
                if (status) status.textContent = "Couldn't send. Use the email link.";
                showNotification(`Couldn't send: ${hint}`, 'error', {
                    duration: 8000,
                    mailtoHref: pricingMailtoLink(data),
                    mailtoLabel: 'Open email draft'
                });
            }
        } catch {
            if (status) status.textContent = 'Connection problem. Use the email link.';
            showNotification('Connection problem. Try again in a moment, or open an email draft below.', 'error', {
                duration: 9000,
                mailtoHref: pricingMailtoLink(data),
                mailtoLabel: 'Open email draft'
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.removeAttribute('aria-busy');
                if (btnLabel && submitLabel) btnLabel.textContent = submitLabel;
            }
        }
    });
}

/** @param {{ duration?: number, mailtoHref?: string, mailtoLabel?: string }} [opts] */
function showNotification(message, type = 'info', opts = {}) {
    const duration = opts.duration ?? (type === 'error' ? 8000 : 5000);

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const text = document.createElement('span');
    text.textContent = message;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.alignItems = 'center';
    actions.style.gap = '12px';
    actions.style.flexWrap = 'wrap';
    actions.appendChild(text);

    if (opts.mailtoHref && opts.mailtoLabel) {
        const mail = document.createElement('a');
        mail.href = opts.mailtoHref;
        mail.textContent = opts.mailtoLabel;
        mail.style.color = 'inherit';
        mail.style.fontWeight = '700';
        mail.style.textDecoration = 'underline';
        mail.style.whiteSpace = 'nowrap';
        actions.appendChild(mail);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = '×';
    closeBtn.setAttribute('aria-label', TechnovaI18n.t('a11y.dismiss'));
    closeBtn.addEventListener('click', () => notification.remove());

    notification.appendChild(actions);
    notification.appendChild(closeBtn);

    const bg = type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#d4af37';
    const fg = type === 'success' || type === 'error' ? '#fff' : '#0a0a0a';

    Object.assign(notification.style, {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        maxWidth: 'min(420px, calc(100vw - 32px))',
        padding: '18px 20px',
        background: bg,
        color: fg,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        zIndex: '9999',
        animation: 'slideIn 0.3s ease',
        fontWeight: '500',
        lineHeight: '1.45'
    });

    document.body.appendChild(notification);

    const t = setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, duration);

    closeBtn.addEventListener('click', () => clearTimeout(t));
    return notification;
}

// ========================================
// SCROLL ANIMATIONS
// ========================================
function initScrollAnimations() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements
    const animateElements = document.querySelectorAll(
        '.service-card, .feature-card, .pricing-card, .process-step, .problem-card, .trust-block, .work-layout, .portfolio-project'
    );

    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
        observer.observe(el);
    });
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    .animate-in {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

`;
document.head.appendChild(style);

