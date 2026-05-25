// ── Pixel Loader ─────────────────────────────────────────────────
// Runs synchronously when the script loads (DOM already parsed since
// scripts are at the bottom of <body>). GSAP is loaded before this file.
(function initPixelLoader() {
    const loader   = document.getElementById('pixelLoader');
    const tileGrid = document.getElementById('pixelTileGrid');
    const barFill  = document.getElementById('pixelBarFill');
    const statusEl = document.getElementById('pixelStatusText');

    function fireLoaderDone() {
        document.dispatchEvent(new Event('loaderDone'));
    }

    if (!loader || !tileGrid) { fireLoaderDone(); return; }

    // Create pixel tile grid ──────────────────────────────────────
    const TILE = window.innerWidth < 600 ? 48 : 64;
    const cols = Math.ceil(window.innerWidth  / TILE) + 1;
    const rows = Math.ceil(window.innerHeight / TILE) + 1;
    const tileEls = [];

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const t = document.createElement('div');
            t.className = 'pixel-tile';
            t.style.cssText =
                `width:${TILE}px;height:${TILE}px;` +
                `left:${c * TILE}px;top:${r * TILE}px;`;
            tileGrid.appendChild(t);
            tileEls.push(t);
        }
    }

    // Progress bar stages ─────────────────────────────────────────
    const STAGES = [
        { pct: 28,  text: 'LOADING ASSETS', ms: 220 },
        { pct: 60,  text: 'BUILDING UI',    ms: 280 },
        { pct: 88,  text: 'ALMOST READY',   ms: 240 },
        { pct: 100, text: 'READY',          ms: 160 },
    ];
    let si = 0;

    function nextStage() {
        if (si >= STAGES.length) { beginReveal(); return; }
        const s = STAGES[si++];
        if (barFill) barFill.style.width = s.pct + '%';
        if (statusEl) statusEl.textContent = s.text;
        setTimeout(nextStage, s.ms + Math.random() * 80);
    }
    setTimeout(nextStage, 140);

    // Reveal animation ────────────────────────────────────────────
    function beginReveal() {
        if (typeof gsap === 'undefined') {
            // GSAP not available — just hide loader and proceed
            setTimeout(() => { loader.classList.add('is-done'); fireLoaderDone(); }, 300);
            return;
        }

        const inner = loader.querySelector('.pixel-loader-inner');

        // 1. Fade + slide out the "BC" branding
        gsap.to(inner, { autoAlpha: 0, y: -14, duration: 0.32, ease: 'power2.in' });

        // 2. Tiles scatter off-screen (random directions, brief delay)
        gsap.to(tileEls, {
            scale: 0,
            duration: 0.28,
            ease: 'power2.in',
            stagger: { amount: 0.55, from: 'random' },
            delay: 0.18,
            onComplete() {
                loader.classList.add('is-done');
                fireLoaderDone();
            }
        });
    }
})();


// ── Main App ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {

    // ── Bento card data ──────────────────────────────────────────
    const bentoDetails = {
        helport: {
            type: 'Work', badge: 'badge-work', org: 'Helport AI',
            logo: 'images/HelportLogo.jpg', live: false,
            title: 'AI Product Developer / PM',
            date: 'Sep 2024 – Jun 2025', award: null, demo: null,
            metrics: [
                { label: '35% AHT ↓',         color: 'green' },
                { label: '6× cost reduction',  color: 'green' },
                { label: '14d → 5d release cycle', color: 'green' },
                { label: '15% conversion ↑',   color: 'green' },
            ],
            points: [
                'Led product strategy for an AI-driven call assistant across mortgage, healthcare, insurance, and government verticals.',
                'Migrated intent-matching from Dialogflow to Gemini 2.0 + Vertex AI, reducing per-match cost by 6× while improving accuracy.',
                'Reduced average handling time 35% through systematic A/B testing of conversational flows and escalation triggers.',
                'Compressed product release cycle from 14 days to 5 days via CI/CD automation and cross-functional stakeholder alignment.',
                'Built weekly data pipelines with Pandas + NumPy processing 50k+ call records for performance analytics dashboards.',
                'Promoted to full-time Product Developer in March 2025; drove a 15% conversion rate lift across enterprise accounts.',
            ],
            tags: ['FastAPI', 'Gemini 2.0', 'Vertex AI', 'A/B Testing', 'Pandas', 'NumPy', 'Docker', 'CI/CD', 'Python'],
        },
        nighty: {
            type: 'Project', badge: 'badge-project', org: 'Independent',
            logo: null, live: true,
            title: 'NightyNight',
            date: 'Apr 2025 – Present', award: null,
            demo: 'https://nightynight-1.onrender.com/',
            metrics: [
                { label: 'LangGraph multi-agent', color: 'blue' },
                { label: 'ElevenLabs TTS',        color: 'blue' },
                { label: '4 audience profiles',   color: 'blue' },
                { label: '7 narrator voices',     color: 'blue' },
            ],
            points: [
                'Full-stack AI bedtime science story generator with React/TypeScript frontend and FastAPI backend.',
                'LangGraph multi-agent pipeline handles story ideation, narrative generation, and age-adaptive rewriting in parallel.',
                'Integrated ElevenLabs TTS with 7 narrator voices for immersive, character-driven audio playback.',
                'SSE streaming architecture delivers real-time story chunks to the client without polling.',
                'Supports 4 audience profiles (toddler, child, teen, adult) with dynamically adjusted vocabulary, sentence length, and tone.',
            ],
            tags: ['LangGraph', 'FastAPI', 'React', 'TypeScript', 'ElevenLabs', 'SSE', 'Python'],
        },
        convoloo: {
            type: 'Work', badge: 'badge-work', org: 'Convoloo',
            logo: 'images/convoloo_logo.jpeg', live: false,
            title: 'Software Development Engineer Intern',
            date: 'Jul 2024 – Sep 2024', award: null, demo: null,
            metrics: [
                { label: '2.5s → 1.5s response',    color: 'green' },
                { label: '50+ confirmed bookings',   color: 'green' },
            ],
            points: [
                'Built AI event-matching feature with LangChain, reducing average query response time from 2.5s to 1.5s.',
                'Architected GCP cloud infrastructure with Terraform for scalable, reproducible deployments.',
                'Implemented full-stack features across React + FastAPI powering 50+ confirmed user bookings.',
                'Designed and maintained MySQL database schema for events, users, and availability management.',
            ],
            tags: ['LangChain', 'FastAPI', 'React', 'GCP', 'Terraform', 'MySQL'],
        },
        research: {
            type: 'Project', badge: 'badge-project', org: 'CMU 14-825',
            logo: 'images/CMULogo.jpg', live: false,
            title: 'Research Assistant Agent',
            date: 'Jan 2026 – Mar 2026', award: null, demo: null,
            metrics: [
                { label: '30+ papers indexed', color: 'blue' },
                { label: 'GKE auto-scale',     color: 'blue' },
                { label: 'Multilingual',       color: 'blue' },
            ],
            points: [
                'Agentic research assistant using LangGraph for multi-step literature review, gap analysis, and summarization.',
                'RAG pipeline over 30+ indexed academic papers using Milvus vector database for semantic retrieval.',
                'Deployed on GKE with Horizontal Pod Autoscaler for concurrent multi-user workloads.',
                'Added multilingual support enabling cross-language academic paper retrieval and translation.',
                'Streamlit UI for interactive paper exploration, citation generation, and export.',
            ],
            tags: ['LangGraph', 'RAG', 'Streamlit', 'GKE', 'Milvus', 'Docker', 'Python'],
        },
        parking: {
            type: 'Project', badge: 'badge-project', org: 'CMU × BOSCH',
            logo: null, live: false,
            title: 'Parking Spot Locator',
            date: 'Aug – Dec 2025', award: null,
            demo: 'https://psl.fogx.link',
            metrics: [{ label: '3× faster (45s → 15s)', color: 'green' }],
            points: [
                'Vision-language parking spot locator using VLMap + CLIP for semantic, natural-language-queryable maps.',
                'Achieved 3× speed improvement (45s → 15s) over traditional visual search baselines.',
                'Deployed inference endpoint on AWS EC2 with FastAPI and async request queuing.',
                'Natural language query interface: "find a spot near the elevator on level 2" returns a highlighted map overlay.',
            ],
            tags: ['VLMap', 'CLIP', 'FastAPI', 'AWS', 'Python'],
        },
        capitawise: {
            type: 'Project', badge: 'badge-project', org: 'Franklin Templeton Hack-a-Thon',
            logo: 'images/ft_logo_pos_0119.png', live: false,
            title: 'Capitawise',
            date: 'Mar – Jun 2024',
            award: '🏆 2nd Place — $7,000 Prize', demo: null,
            metrics: [
                { label: '🏆 2nd Place · $7,000', color: 'amber' },
                { label: '20+ teams',             color: 'amber' },
            ],
            points: [
                'AI-powered financial advisor for Franklin Templeton Hack-a-Thon, placing 2nd of 20+ competing teams.',
                'GPT-4o integration for personalized investment strategy recommendations based on user risk profile.',
                'Interactive portfolio analysis dashboard built with React + Node.js with real-time charting.',
                'Flask backend with live market data ingestion and portfolio rebalancing suggestions.',
            ],
            tags: ['GPT-4o', 'React', 'Node.js', 'Flask', 'OpenAI API'],
        },
        pawprints: {
            type: 'Project', badge: 'badge-project', org: 'Franklin Templeton Hack-a-Thon',
            logo: 'images/ft_logo_pos_0119.png', live: false,
            title: 'PawPrints',
            date: 'Mar – Jun 2023',
            award: '🥇 1st Place — $15,000 Prize', demo: null,
            metrics: [
                { label: '🥇 1st Place · $15,000', color: 'amber' },
                { label: '30+ teams',               color: 'amber' },
            ],
            points: [
                'Web3 pet adoption platform for Franklin Templeton Hack-a-Thon, placing 1st of 30+ teams.',
                'Blockchain-based pet identity and adoption history stored on-chain for immutable provenance.',
                'Full-stack application: React.js frontend, Express.js API, MySQL relational database.',
                'Led a team of 4 as product owner and primary full-stack developer.',
            ],
            tags: ['Web3', 'React.js', 'Express.js', 'MySQL', 'Blockchain'],
        },
    };

    // ── Bento overlay ────────────────────────────────────────────
    const bentoOverlay      = document.querySelector('.bento-overlay');
    const bentoOverlayPanel = document.querySelector('.bento-overlay-panel');
    const bentoOverlayBody  = document.querySelector('.bento-overlay-body');
    const bentoCloseBtn     = document.querySelector('.bento-close-btn');
    let overlayOpen = false;

    function renderOverlay(key) {
        const d = bentoDetails[key];
        if (!d || !bentoOverlayBody) return;

        const logoHtml = d.logo
            ? `<img src="${d.logo}" alt="${d.org}" class="overlay-logo">`
            : d.live
                ? `<span class="live-badge" style="flex-shrink:0">● LIVE</span>`
                : '';

        const awardHtml = d.award
            ? `<div class="overlay-award">${d.award}</div>` : '';

        const demoHtml = d.demo
            ? `<div class="overlay-links">
                 <a href="${d.demo}" target="_blank" rel="noopener" class="overlay-link">View Demo ↗</a>
               </div>` : '';

        const metricsHtml = d.metrics.map(m =>
            `<span class="metric ${m.color}">${m.label}</span>`).join('');
        const pointsHtml  = d.points.map(p => `<li>${p}</li>`).join('');
        const tagsHtml    = d.tags.map(t => `<span>${t}</span>`).join('');

        bentoOverlayBody.innerHTML = `
            <div class="overlay-header">
                ${logoHtml}
                <div class="overlay-header-info">
                    <span class="bento-badge ${d.badge}">${d.type}</span>
                    <span class="overlay-org">${d.org}</span>
                </div>
            </div>
            ${awardHtml}
            <h2 class="overlay-title">${d.title}</h2>
            <p class="overlay-date">${d.date}</p>
            <div class="overlay-metrics">${metricsHtml}</div>
            <ul class="overlay-points">${pointsHtml}</ul>
            <div class="overlay-tags">${tagsHtml}</div>
            ${demoHtml}
        `;
    }

    function openOverlay(key) {
        if (!bentoOverlay || !bentoOverlayPanel) return;
        renderOverlay(key);
        overlayOpen = true;
        bentoOverlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        gsap.fromTo(bentoOverlay,
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.25, ease: 'none' });
        gsap.fromTo(bentoOverlayPanel,
            { y: 52, scale: 0.94, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, duration: 0.42, ease: 'power3.out' });
    }

    function closeOverlay() {
        if (!overlayOpen || !bentoOverlay || !bentoOverlayPanel) return;
        overlayOpen = false;
        gsap.to(bentoOverlayPanel,
            { y: 32, scale: 0.96, autoAlpha: 0, duration: 0.22, ease: 'power2.in' });
        gsap.to(bentoOverlay, {
            autoAlpha: 0, duration: 0.3, ease: 'none', delay: 0.08,
            onComplete() {
                bentoOverlay.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            }
        });
    }

    if (bentoOverlay && bentoCloseBtn) {
        document.querySelectorAll('.bento-card').forEach(card => {
            card.addEventListener('click', () => openOverlay(card.dataset.key));
            card.addEventListener('keydown', e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault(); openOverlay(card.dataset.key);
                }
            });
        });
        bentoCloseBtn.addEventListener('click', closeOverlay);
        bentoOverlay.addEventListener('click', e => {
            if (e.target === bentoOverlay) closeOverlay();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlayOpen) closeOverlay();
        });
    }

    // ── Mobile Navigation ────────────────────────────────────────
    const hamburger = document.querySelector('.hamburger');
    const navMenu   = document.querySelector('.nav-menu');
    const navLinks  = document.querySelectorAll('.nav-link');
    const navbar    = document.querySelector('.navbar');

    function closeNav() {
        if (!navMenu || !hamburger) return;
        navMenu.classList.remove('active');
        hamburger.setAttribute('aria-expanded', 'false');
        const spans = hamburger.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity   = '1';
        spans[2].style.transform = 'none';
    }

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function () {
            const isOpen = navMenu.classList.toggle('active');
            hamburger.setAttribute('aria-expanded', isOpen);
            const spans = hamburger.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(-45deg) translate(-5px, 6px)';
                spans[1].style.opacity   = '0';
                spans[2].style.transform = 'rotate(45deg) translate(-5px, -6px)';
            } else {
                closeNav();
            }
        });
        hamburger.addEventListener('keypress', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault(); hamburger.click();
            }
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = navbar ? navbar.offsetHeight : 0;
                window.scrollTo({ top: target.offsetTop - offset, behavior: 'smooth' });
            }
            closeNav();
        });
    });

    function updateNav() {
        if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
        const navbarH = navbar ? navbar.offsetHeight : 0;
        const scrollY = window.pageYOffset;
        document.querySelectorAll('section[id]').forEach(section => {
            const top  = section.offsetTop - navbarH - 60;
            const link = document.querySelector(`.nav-link[href="#${section.id}"]`);
            if (scrollY >= top && scrollY < top + section.offsetHeight) {
                navLinks.forEach(l => l.classList.remove('active'));
                if (link) link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', updateNav, { passive: true });

    // ── Contact Form ─────────────────────────────────────────────
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const name    = document.getElementById('name').value;
            const email   = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            if (!name || !email || !message) { alert('Please fill in all fields'); return; }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Please enter a valid email address'); return;
            }
            const btn  = contactForm.querySelector('button[type="submit"]');
            const orig = btn.textContent;
            btn.textContent = 'Sending…';
            btn.disabled    = true;
            const subject = encodeURIComponent(`Contact from ${name}`);
            const body    = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`);
            try {
                window.location.href = `mailto:bruceche@andrew.cmu.edu?subject=${subject}&body=${body}`;
                setTimeout(() => {
                    if (confirm(`Thanks, ${name}! Your email client should have opened. Click OK to copy the address.`)) {
                        navigator.clipboard.writeText('bruceche@andrew.cmu.edu')
                            .then(() => alert('Email copied!'))
                            .catch(() => alert('Email: bruceche@andrew.cmu.edu'));
                    }
                    contactForm.reset(); btn.textContent = orig; btn.disabled = false;
                }, 500);
            } catch {
                alert('Please email: bruceche@andrew.cmu.edu');
                contactForm.reset(); btn.textContent = orig; btn.disabled = false;
            }
        });
    }

    // ── GSAP ─────────────────────────────────────────────────────
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Remove CSS transition from overlay so GSAP owns opacity
    const bentoOv = document.querySelector('.bento-overlay');
    if (bentoOv) bentoOv.style.transition = 'none';

    // Custom cursor (fine pointer / desktop only)
    const cursorDot  = document.querySelector('.cursor-dot');
    const cursorRing = document.querySelector('.cursor-ring');
    if (cursorDot && cursorRing && window.matchMedia('(pointer:fine)').matches) {
        document.body.classList.add('has-custom-cursor');
        gsap.set([cursorDot, cursorRing], { xPercent: -50, yPercent: -50 });
        document.addEventListener('mousemove', e => {
            gsap.to(cursorDot,  { x: e.clientX, y: e.clientY, duration: 0.07, ease: 'none' });
            gsap.to(cursorRing, { x: e.clientX, y: e.clientY, duration: 0.40, ease: 'power3.out' });
        });
        document.querySelectorAll(
            'a, button, .btn, .bento-card, .exp-card, .hobby-card, .contact-card, .stack-pills span'
        ).forEach(el => {
            el.addEventListener('mouseenter', () => cursorRing.classList.add('is-hovered'));
            el.addEventListener('mouseleave', () => cursorRing.classList.remove('is-hovered'));
        });
    }

    // Scroll progress bar
    gsap.to('.scroll-progress', {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 'top top', end: 'max', scrub: 0.3 }
    });

    // Navbar entrance
    gsap.from('.navbar', { y: -72, autoAlpha: 0, duration: 0.8, ease: 'power3.out' });

    // Pre-hide hero elements before entrance timeline
    gsap.set([
        '.hero-status', '.hero-name-line1', '.hero-name-line2',
        '.hero-name-underline', '.hero-role', '.hero-tagline',
        '.hero-ctas .btn', '.hero-photo-wrap'
    ], { autoAlpha: 0 });

    // Pre-set SVG path for draw animation
    const svgPath = document.querySelector('.hero-name-underline path');
    if (svgPath) {
        const len = svgPath.getTotalLength ? svgPath.getTotalLength() : 380;
        gsap.set(svgPath, { strokeDasharray: len, strokeDashoffset: len });
    }

    // Hero entrance timeline — triggered when loader fires 'loaderDone'
    function startHeroTimeline() {
        gsap.timeline({ delay: 0 })
            .fromTo('.hero-status',
                { y: -16, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' })
            .fromTo('.hero-name-line1',
                { y: 64, autoAlpha: 0, skewY: 5 },
                { y: 0, autoAlpha: 1, skewY: 0, duration: 0.78, ease: 'power4.out' }, '-=0.28')
            .fromTo('.hero-name-line2',
                { y: 64, autoAlpha: 0, skewY: 5 },
                { y: 0, autoAlpha: 1, skewY: 0, duration: 0.78, ease: 'power4.out' }, '-=0.6')
            .fromTo('.hero-name-underline',
                { autoAlpha: 0 },
                { autoAlpha: 1, duration: 0.1, ease: 'none' }, '-=0.55')
            .to('.hero-name-underline path',
                { strokeDashoffset: 0, duration: 0.7, ease: 'power2.out' }, '<')
            .fromTo('.hero-role',
                { y: 22, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out' }, '-=0.3')
            .fromTo('.hero-tagline',
                { y: 18, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out' }, '-=0.38')
            .fromTo('.hero-ctas .btn',
                { y: 16, autoAlpha: 0 },
                { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.32')
            .fromTo('.hero-photo-wrap',
                { scale: 0.82, autoAlpha: 0 },
                { scale: 1, autoAlpha: 1, duration: 0.95, ease: 'back.out(1.3)' }, '-=1.0');

        // Profile photo float loop
        gsap.to('.hero-photo', {
            y: -12, duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.4
        });
    }

    // Listen for loader completion; fallback if loader fires immediately or not at all
    const heroFallback = setTimeout(startHeroTimeline, 3800);
    document.addEventListener('loaderDone', function () {
        clearTimeout(heroFallback);
        startHeroTimeline();
    }, { once: true });

    // Hero mouse parallax
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.addEventListener('mousemove', e => {
            const r = heroSection.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width  / 2) / r.width;
            const y = (e.clientY - r.top  - r.height / 2) / r.height;
            gsap.to('.hero-photo-wrap',
                { x: x * 20, y: y * 10, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
            gsap.to('.hero-content',
                { x: x * -8, duration: 0.9, ease: 'power2.out', overwrite: 'auto' });
        });
        heroSection.addEventListener('mouseleave', () => {
            gsap.to('.hero-photo-wrap', { x: 0, y: 0, duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
            gsap.to('.hero-content',    { x: 0,        duration: 1.1, ease: 'power2.out', overwrite: 'auto' });
        });
    }

    // Section label + heading reveals
    gsap.utils.toArray('.section-kicker').forEach(el => {
        gsap.fromTo(el,
            { y: 14, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.55, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 91%' } });
    });
    gsap.utils.toArray('.section-heading, .about-heading, .contact-heading').forEach(el => {
        gsap.fromTo(el,
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.72, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 89%' } });
    });

    // Stat counter animation
    document.querySelectorAll('.stat-value[data-count]').forEach(el => {
        const target   = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals, 10) || 0;
        const counter  = { val: 0 };
        el.textContent = (0).toFixed(decimals);
        ScrollTrigger.create({
            trigger: el, start: 'top 90%', once: true,
            onEnter() {
                gsap.to(counter, {
                    val: target, duration: 1.5, ease: 'power2.out',
                    onUpdate() { el.textContent = counter.val.toFixed(decimals); }
                });
            }
        });
    });

    // About section
    gsap.fromTo('.edu-card',
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.edu-cards', start: 'top 89%' } });
    gsap.fromTo('.about-body, .about-links',
        { y: 20, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.65, stagger: 0.1, ease: 'power3.out',
          scrollTrigger: { trigger: '.about-right', start: 'top 87%' } });

    // Experience section heading
    gsap.fromTo('.section-experience .section-heading',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.section-experience', start: 'top 85%' } });

    // Bento grid cards
    gsap.fromTo('.bento-card',
        { y: 44, scale: 0.95, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.65, stagger: 0.07, ease: 'back.out(1.3)',
          scrollTrigger: { trigger: '.bento-grid', start: 'top 87%' } });

    // Stack rows
    gsap.utils.toArray('.stack-row').forEach((row, i) => {
        gsap.fromTo(row,
            { x: -28, autoAlpha: 0 },
            { x: 0, autoAlpha: 1, duration: 0.6, delay: i * 0.05, ease: 'power3.out',
              scrollTrigger: { trigger: row, start: 'top 91%' } });
    });

    // Hobby cards
    gsap.fromTo('.hobby-card',
        { y: 36, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: 'back.out(1.5)',
          scrollTrigger: { trigger: '.hobbies-grid', start: 'top 88%' } });

    // Life showcase
    gsap.fromTo('.artwork-block, .mbti-block',
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.75, stagger: 0.14, ease: 'power3.out',
          scrollTrigger: { trigger: '.life-showcase', start: 'top 88%' } });

    // Contact
    gsap.fromTo('.contact-cards',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-cards', start: 'top 89%' } });
    gsap.fromTo('.contact-form',
        { y: 30, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-form', start: 'top 91%' } });

    // Respect prefers-reduced-motion
    gsap.matchMedia().add('(prefers-reduced-motion: reduce)', () => {
        gsap.globalTimeline.timeScale(100);
    });

});
