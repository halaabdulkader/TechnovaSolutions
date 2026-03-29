// ========================================
// TECHNOVA SOLUTIONS - Website JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initContactForm();
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
        mobileToggle.setAttribute('aria-label', 'Open menu');
        document.body.classList.remove('nav-open');
    }

    function openMobileMenu() {
        if (!navLinks || !mobileToggle) return;
        navLinks.classList.add('active');
        mobileToggle.classList.add('active');
        mobileToggle.setAttribute('aria-expanded', 'true');
        mobileToggle.setAttribute('aria-label', 'Close menu');
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
const CONTACT_INBOX = 'hello@technovasolutions.com';
const FORMSUBMIT_URL = `https://formsubmit.co/ajax/${CONTACT_INBOX}`;

function quoteMailtoLink(data) {
    const subject = 'Quote request — Technova Solutions';
    const body = [
        `Name: ${data.name}`,
        `Company: ${data.company || '—'}`,
        `Email: ${data.email}`,
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

    const submitBtn = form.querySelector('button[type="submit"]');
    const btnLabel = submitBtn?.querySelector('span');
    let submitLabel = btnLabel?.textContent ?? '';

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
            'project-type': (fd.get('project-type') || '').toString().trim(),
            budget: (fd.get('budget') || '').toString().trim(),
            message: (fd.get('message') || '').toString().trim()
        };

        const payload = {
            name: data.name,
            email: data.email,
            company: data.company || '—',
            'project-type': data['project-type'] || '—',
            budget: data.budget || '—',
            message: data.message || '—',
            _subject: 'New quote request — Technova Solutions',
            _template: 'table',
            _captcha: false
        };

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.setAttribute('aria-busy', 'true');
            if (btnLabel) btnLabel.textContent = 'Sending…';
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
                showNotification(
                    "Thanks! We'll email you within 24 hours with your quote.",
                    'success'
                );
                form.reset();
            } else {
                const hint =
                    typeof json.message === 'string'
                        ? json.message
                        : typeof json.error === 'string'
                          ? json.error
                          : 'Please try again or use the email link.';
                showNotification(`Couldn't send: ${hint}`, 'error', {
                    duration: 8000,
                    mailtoHref: quoteMailtoLink(data),
                    mailtoLabel: 'Open email draft'
                });
            }
        } catch {
            showNotification('Connection problem. Try again in a moment, or open an email draft below.', 'error', {
                duration: 9000,
                mailtoHref: quoteMailtoLink(data),
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
    closeBtn.setAttribute('aria-label', 'Dismiss');
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
        '.service-card, .feature-card, .pricing-card, .process-step, .problem-card'
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

