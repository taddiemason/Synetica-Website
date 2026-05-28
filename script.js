// ===========================
// Particle System (Hero Canvas)
// ===========================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: -9999, y: -9999 };
        this.frame = 0;
        this.running = true;

        this.resize();
        this.init();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            this.mouse.x = -9999;
            this.mouse.y = -9999;
        });
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.W = this.canvas.width;
        this.H = this.canvas.height;
    }

    randBetween(a, b) { return a + Math.random() * (b - a); }

    init() {
        this.particles = [];

        // Stars — small twinkling dots
        for (let i = 0; i < 160; i++) {
            this.particles.push({
                type: 'star',
                x: Math.random() * this.W,
                y: Math.random() * this.H,
                size: this.randBetween(0.3, 1.4),
                opacity: Math.random(),
                speed: this.randBetween(0.003, 0.012),
                dir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        // Nodes — moving glowing dots forming a network
        for (let i = 0; i < 45; i++) {
            this.particles.push({
                type: 'node',
                x: Math.random() * this.W,
                y: Math.random() * this.H,
                vx: this.randBetween(-0.3, 0.3),
                vy: this.randBetween(-0.3, 0.3),
                size: this.randBetween(1.2, 2.8),
                opacity: this.randBetween(0.35, 0.8),
                color: Math.random() > 0.5 ? '59,130,246' : '6,182,212',
            });
        }

        // Data streams — vertical light lines
        for (let i = 0; i < 10; i++) {
            const len = this.randBetween(50, 130);
            this.particles.push({
                type: 'stream',
                x: Math.random() * this.W,
                y: this.randBetween(-len, this.H),
                len,
                speed: this.randBetween(1.0, 2.8),
                opacity: this.randBetween(0.06, 0.18),
                color: Math.random() > 0.5 ? '59,130,246' : '6,182,212',
            });
        }
    }

    drawConnections(nodes) {
        const CONN_DIST = 150;
        const MOUSE_DIST = 200;
        const ctx = this.ctx;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONN_DIST) {
                    const alpha = (1 - dist / CONN_DIST) * 0.18;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(59,130,246,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Lines to mouse — orange highlight
            const mdx = nodes[i].x - this.mouse.x;
            const mdy = nodes[i].y - this.mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < MOUSE_DIST) {
                const alpha = (1 - mdist / MOUSE_DIST) * 0.5;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(this.mouse.x, this.mouse.y);
                ctx.strokeStyle = `rgba(249,115,22,${alpha})`;
                ctx.lineWidth = 0.7;
                ctx.stroke();
            }
        }
    }

    update() {
        const nodes = [];

        this.particles.forEach(p => {
            if (p.type === 'star') {
                p.opacity += p.speed * p.dir;
                if (p.opacity > 1) { p.opacity = 1; p.dir = -1; }
                if (p.opacity < 0.05) { p.opacity = 0.05; p.dir = 1; }

            } else if (p.type === 'node') {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0) { p.x = 0; p.vx *= -1; }
                if (p.x > this.W) { p.x = this.W; p.vx *= -1; }
                if (p.y < 0) { p.y = 0; p.vy *= -1; }
                if (p.y > this.H) { p.y = this.H; p.vy *= -1; }

                // Mouse repulsion
                const dx = p.x - this.mouse.x;
                const dy = p.y - this.mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 80 && dist > 0) {
                    const force = (80 - dist) / 80 * 1.5;
                    p.x += (dx / dist) * force;
                    p.y += (dy / dist) * force;
                }

                nodes.push(p);

            } else if (p.type === 'stream') {
                p.y -= p.speed;
                if (p.y + p.len < 0) {
                    p.y = this.H + p.len;
                    p.x = Math.random() * this.W;
                }
            }
        });

        return nodes;
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.W, this.H);

        const nodes = this.update();
        this.drawConnections(nodes);

        this.particles.forEach(p => {
            if (p.type === 'star') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(180,210,255,${p.opacity * 0.7})`;
                ctx.fill();

            } else if (p.type === 'node') {
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
                grd.addColorStop(0, `rgba(${p.color},${p.opacity * 0.4})`);
                grd.addColorStop(1, `rgba(${p.color},0)`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
                ctx.fill();

            } else if (p.type === 'stream') {
                const grd = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.len);
                grd.addColorStop(0, `rgba(${p.color},0)`);
                grd.addColorStop(0.4, `rgba(${p.color},${p.opacity})`);
                grd.addColorStop(0.7, `rgba(${p.color},${p.opacity * 0.5})`);
                grd.addColorStop(1, `rgba(${p.color},0)`);
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x, p.y + p.len);
                ctx.strokeStyle = grd;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });

        this.frame++;
    }

    animate() {
        if (!this.running) return;
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    destroy() { this.running = false; }
}

// Init particle system
const heroCanvas = document.getElementById('hero-canvas');
let particleSystem = null;

if (heroCanvas) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
        particleSystem = new ParticleSystem(heroCanvas);
    }
}


// ===========================
// Mobile Menu Toggle
// ===========================
const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            menuToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}


// ===========================
// Navbar Scroll Effect
// ===========================
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (!navbar) return;
    navbar.classList.toggle('scrolled', window.pageYOffset > 80);
}, { passive: true });


// ===========================
// Smooth Scroll
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target && navbar) {
            e.preventDefault();
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbar.offsetHeight;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});


// ===========================
// Scroll Reveal (Intersection Observer)
// ===========================
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.service-card, .feature, .contact-item, .stat, .benefit-card, .job-card, .about-panel').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});


// ===========================
// Animated Stat Counters
// ===========================
function animateCounter(el, target, suffix, decimal) {
    const duration = 1800;
    const start = performance.now();

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = target * eased;
        el.textContent = (decimal ? current.toFixed(decimal) : Math.floor(current)) + suffix;
        if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseFloat(el.dataset.target);
            const suffix = el.dataset.suffix || '';
            const decimal = parseInt(el.dataset.decimal || '0', 10);
            animateCounter(el, target, suffix, decimal || 0);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-counter').forEach(el => counterObserver.observe(el));


// ===========================
// Active Nav Link Highlighting
// ===========================
function highlightActiveSection() {
    if (!navbar) return;
    const sections = document.querySelectorAll('section[id]');
    const navbarHeight = navbar.offsetHeight;
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop - navbarHeight - 120;
        if (window.pageYOffset >= sectionTop) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${current}` || (href && href.includes('#') && href.split('#')[1] === current)) {
            if (!link.classList.contains('nav-link-cta')) {
                link.classList.add('active');
            }
        }
    });
}

window.addEventListener('scroll', highlightActiveSection, { passive: true });


// ===========================
// Hero Parallax
// ===========================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    if (heroContent && scrolled < window.innerHeight) {
        const factor = scrolled * 0.3;
        heroContent.style.transform = `translateY(${factor}px)`;
        heroContent.style.opacity = Math.max(0, 1 - scrolled / 650);
    }
}, { passive: true });


// ===========================
// Form Handling
// ===========================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const formData = new FormData(contactForm);
        const name = formData.get('name');
        const email = formData.get('email');
        const message = formData.get('message');

        if (!name || !email || !message) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotification('Please enter a valid email address.', 'error');
            return;
        }

        const submitButton = contactForm.querySelector('.btn');
        const originalText = submitButton.querySelector('.btn-inner')
            ? submitButton.querySelector('.btn-inner').textContent
            : submitButton.textContent;

        const setButtonText = (text) => {
            const inner = submitButton.querySelector('.btn-inner');
            if (inner) inner.textContent = text;
            else submitButton.textContent = text;
        };

        setButtonText('Sending...');
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                showNotification(data.message || 'Message sent successfully!', 'success');
                const scrollPos = window.pageYOffset;
                contactForm.reset();
                window.scrollTo(0, scrollPos);
            } else {
                showNotification(data.message || 'Failed to send. Please try again.', 'error');
            }
        } catch (error) {
            showNotification('Connection error. Please try again or call us directly.', 'error');
        } finally {
            setButtonText(originalText);
            submitButton.disabled = false;
        }
    });
}


// ===========================
// Notification System
// ===========================
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const colors = {
        success: { bg: 'rgba(2, 44, 34, 0.97)', border: '#4ade80', icon: '#4ade80' },
        error:   { bg: 'rgba(44, 8, 8, 0.97)',  border: '#f87171', icon: '#f87171' },
        info:    { bg: 'rgba(10, 20, 50, 0.97)', border: '#3B82F6', icon: '#3B82F6' },
    };
    const c = colors[type] || colors.info;

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        padding: 1rem 1.5rem;
        background: ${c.bg};
        border: 1px solid ${c.border};
        border-radius: 10px;
        color: #F8FAFC;
        box-shadow: 0 0 20px ${c.border}33, 0 8px 30px rgba(0,0,0,0.5);
        z-index: 10000;
        max-width: 340px;
        font-size: 0.875rem;
        font-family: 'Inter', sans-serif;
        line-height: 1.5;
        backdrop-filter: blur(12px);
        animation: notifIn 0.35s cubic-bezier(0.4,0,0.2,1);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'notifOut 0.35s cubic-bezier(0.4,0,0.2,1) forwards';
        setTimeout(() => notification.remove(), 350);
    }, 5000);
}

// Notification animations
const notifStyle = document.createElement('style');
notifStyle.textContent = `
    @keyframes notifIn {
        from { transform: translateX(120%); opacity: 0; }
        to   { transform: translateX(0); opacity: 1; }
    }
    @keyframes notifOut {
        from { transform: translateX(0); opacity: 1; }
        to   { transform: translateX(120%); opacity: 0; }
    }
`;
document.head.appendChild(notifStyle);


// ===========================
// DOMContentLoaded Init
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    const homeLink = document.querySelector('a[href="#home"]');
    if (homeLink) homeLink.classList.add('active');

    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    if (images.length) {
        const imgObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imgObserver.unobserve(img);
                }
            });
        });
        images.forEach(img => imgObserver.observe(img));
    }
});


// ===========================
// Console Signature
// ===========================
console.log('%c Synetica ', 'background:#0A0E1A; color:#3B82F6; font-size:18px; font-weight:bold; font-family:sans-serif; padding:8px 16px; border:1px solid #3B82F6; border-radius:4px;');
console.log('%cBuffalo\'s Intelligent MSP — synetica.us', 'color:#64748B; font-size:11px; font-family:sans-serif;');
