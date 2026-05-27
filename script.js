// ===========================
// Boot Sequence
// ===========================
(function initBoot() {
    const boot = document.getElementById('boot-sequence');
    if (!boot) return;

    const alreadyBooted = sessionStorage.getItem('syn_booted');

    if (alreadyBooted) {
        boot.classList.add('hidden');
        return;
    }

    const lines = boot.querySelectorAll('.boot-line');
    const progress = boot.querySelector('.boot-progress');

    lines.forEach((line, i) => {
        const delay = parseInt(line.dataset.delay || 0, 10);
        setTimeout(() => line.classList.add('visible'), 300 + delay);
    });

    if (progress) {
        setTimeout(() => { progress.style.width = '100%'; }, 400);
    }

    setTimeout(() => {
        boot.classList.add('hidden');
        sessionStorage.setItem('syn_booted', '1');
    }, 2200);
})();


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
        for (let i = 0; i < 180; i++) {
            this.particles.push({
                type: 'star',
                x: Math.random() * this.W,
                y: Math.random() * this.H,
                size: this.randBetween(0.4, 1.8),
                opacity: Math.random(),
                speed: this.randBetween(0.003, 0.015),
                dir: Math.random() > 0.5 ? 1 : -1,
            });
        }

        // Nodes — moving glowing dots forming a network
        for (let i = 0; i < 55; i++) {
            this.particles.push({
                type: 'node',
                x: Math.random() * this.W,
                y: Math.random() * this.H,
                vx: this.randBetween(-0.35, 0.35),
                vy: this.randBetween(-0.35, 0.35),
                size: this.randBetween(1.5, 3.5),
                opacity: this.randBetween(0.4, 0.9),
                color: Math.random() > 0.5 ? '0,245,255' : '123,47,255',
            });
        }

        // Data streams — vertical light lines
        for (let i = 0; i < 14; i++) {
            const len = this.randBetween(60, 160);
            this.particles.push({
                type: 'stream',
                x: Math.random() * this.W,
                y: this.randBetween(-len, this.H),
                len,
                speed: this.randBetween(1.2, 3.5),
                opacity: this.randBetween(0.08, 0.25),
                color: Math.random() > 0.5 ? '0,245,255' : '0,255,136',
            });
        }
    }

    drawConnections(nodes) {
        const CONN_DIST = 160;
        const MOUSE_DIST = 220;
        const ctx = this.ctx;

        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx = nodes[i].x - nodes[j].x;
                const dy = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < CONN_DIST) {
                    const alpha = (1 - dist / CONN_DIST) * 0.22;
                    ctx.beginPath();
                    ctx.moveTo(nodes[i].x, nodes[i].y);
                    ctx.lineTo(nodes[j].x, nodes[j].y);
                    ctx.strokeStyle = `rgba(0,245,255,${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }

            // Lines to mouse
            const mdx = nodes[i].x - this.mouse.x;
            const mdy = nodes[i].y - this.mouse.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < MOUSE_DIST) {
                const alpha = (1 - mdist / MOUSE_DIST) * 0.6;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(this.mouse.x, this.mouse.y);
                ctx.strokeStyle = `rgba(123,47,255,${alpha})`;
                ctx.lineWidth = 0.8;
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
                if (dist < 90 && dist > 0) {
                    const force = (90 - dist) / 90 * 2;
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
                ctx.fillStyle = `rgba(200,230,255,${p.opacity * 0.8})`;
                ctx.fill();

            } else if (p.type === 'node') {
                // Outer glow
                const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5);
                grd.addColorStop(0, `rgba(${p.color},${p.opacity * 0.5})`);
                grd.addColorStop(1, `rgba(${p.color},0)`);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2);
                ctx.fillStyle = grd;
                ctx.fill();

                // Core dot
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${p.color},${p.opacity})`;
                ctx.fill();

            } else if (p.type === 'stream') {
                const grd = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.len);
                grd.addColorStop(0, `rgba(${p.color},0)`);
                grd.addColorStop(0.4, `rgba(${p.color},${p.opacity})`);
                grd.addColorStop(0.7, `rgba(${p.color},${p.opacity * 0.6})`);
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
// Custom Cursor
// ===========================
const cursorDot = document.getElementById('cursorDot');
const cursorRing = document.getElementById('cursorRing');

let ringX = 0, ringY = 0;
let dotX = 0, dotY = 0;
let cursorRaf = null;

function updateCursorRing() {
    ringX += (dotX - ringX) * 0.12;
    ringY += (dotY - ringY) * 0.12;
    if (cursorRing) {
        cursorRing.style.left = ringX + 'px';
        cursorRing.style.top = ringY + 'px';
    }
    cursorRaf = requestAnimationFrame(updateCursorRing);
}

if (cursorDot && cursorRing) {
    window.addEventListener('mousemove', (e) => {
        dotX = e.clientX;
        dotY = e.clientY;
        cursorDot.style.left = dotX + 'px';
        cursorDot.style.top = dotY + 'px';
    });
    updateCursorRing();
}


// ===========================
// Card 3D Tilt Effect
// ===========================
document.querySelectorAll('[data-tilt]').forEach(card => {
    const MAX_TILT = 12;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const rotX = (-dy / (rect.height / 2)) * MAX_TILT;
        const rotY = (dx / (rect.width / 2)) * MAX_TILT;

        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale3d(1.03,1.03,1.03)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
        setTimeout(() => { card.style.transition = ''; }, 500);
    });
});


// ===========================
// Glitch Text Effect
// ===========================
function triggerGlitch(el) {
    el.classList.remove('glitch-active');
    void el.offsetWidth; // reflow
    el.classList.add('glitch-active');
}

document.querySelectorAll('[data-glitch]').forEach(el => {
    // Occasional random glitch
    const interval = 5000 + Math.random() * 8000;
    setInterval(() => triggerGlitch(el), interval);
});


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
    if (window.pageYOffset > 80) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});


// ===========================
// Smooth Scroll
// ===========================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target && navbar) {
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

document.querySelectorAll('.service-card, .feature, .contact-item, .stat, .benefit-card, .job-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});


// ===========================
// Animated Stat Counters
// ===========================
function animateCounter(el, target, suffix, decimal) {
    const duration = 1800;
    const start = performance.now();
    const startVal = 0;

    function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = startVal + (target - startVal) * eased;
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
            link.classList.add('active');
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
        const factor = scrolled * 0.35;
        heroContent.style.transform = `translateY(${factor}px)`;
        heroContent.style.opacity = Math.max(0, 1 - scrolled / 600);
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

        setButtonText('Transmitting...');
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();

            if (data.success) {
                showNotification(data.message || 'Message transmitted successfully.', 'success');
                const scrollPos = window.pageYOffset;
                contactForm.reset();
                window.scrollTo(0, scrollPos);
            } else {
                showNotification(data.message || 'Transmission failed. Trying backup channel...', 'error');
                await submitToWeb3Forms(formData);
            }
        } catch (error) {
            await submitToWeb3Forms(formData);
        } finally {
            setButtonText(originalText);
            submitButton.disabled = false;
        }
    });
}

async function submitToWeb3Forms(formData) {
    const payload = {
        access_key: '96109e90-d006-4c97-9436-77ad8757b056',
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone') || '',
        company: formData.get('company') || '',
        message: formData.get('message'),
        subject: `New Contact from ${formData.get('name')} - Synetica Website`,
        from_name: 'Synetica Website',
        botcheck: false,
        redirect: false,
    };

    try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload),
        });
        const result = await response.json();

        if (result.success) {
            showNotification('Message transmitted successfully. We will contact you soon.', 'success');
            if (contactForm) contactForm.reset();
        } else {
            showNotification(result.message || 'Transmission failed. Please try again.', 'error');
        }
    } catch {
        showNotification('Connection error. Please try again or call us directly.', 'error');
    }
}


// ===========================
// Notification System
// ===========================
function showNotification(message, type = 'info') {
    document.querySelectorAll('.notification').forEach(n => n.remove());

    const colors = {
        success: { bg: 'rgba(0,30,20,0.95)', border: '#00ff88', glow: '#00ff88' },
        error:   { bg: 'rgba(30,0,10,0.95)', border: '#ff2d78', glow: '#ff2d78' },
        info:    { bg: 'rgba(0,15,30,0.95)', border: '#00f5ff', glow: '#00f5ff' },
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
        border-radius: 8px;
        color: #fff;
        box-shadow: 0 0 20px ${c.glow}44, 0 8px 30px rgba(0,0,0,0.6);
        z-index: 10000;
        max-width: 340px;
        font-size: 0.875rem;
        font-family: 'Space Grotesk', sans-serif;
        line-height: 1.5;
        backdrop-filter: blur(10px);
        animation: notifIn 0.4s cubic-bezier(0.4,0,0.2,1);
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'notifOut 0.4s cubic-bezier(0.4,0,0.2,1) forwards';
        setTimeout(() => notification.remove(), 400);
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
    // Mark home link as active initially
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
console.log('%c S Y N E T I C A ', 'background:#000508; color:#00f5ff; font-size:20px; font-weight:bold; font-family:monospace; padding:8px 16px; border:1px solid #00f5ff; text-shadow:0 0 10px #00f5ff;');
console.log('%cBuffalo\'s Intelligent MSP — synetica.us', 'color:#7b2fff; font-size:11px; font-family:monospace;');
