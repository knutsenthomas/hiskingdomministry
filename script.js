// ===================================
// Wishon Template - His Kingdom Ministry
// JavaScript Functionality
// ===================================

// DOM Elements
const header = document.getElementById('header');
const mobileToggle = document.getElementById('mobile-toggle');
const nav = document.getElementById('nav');
const navLinks = document.querySelectorAll('.nav-link');

// ===================================
// Header Scroll Effect
// ===================================
window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// ===================================
// Mobile Menu Toggle
// ===================================
mobileToggle.addEventListener('click', () => {
    const isOpening = !nav.classList.contains('active');

    if (isOpening) {
        // Calculate scrollbar width before hiding it
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        // Add padding to compensate for scrollbar removal
        document.body.style.paddingRight = scrollbarWidth + 'px';
        document.body.style.overflow = 'hidden';
    } else {
        // Remove compensation when closing menu
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
    }

    nav.classList.toggle('active');
    mobileToggle.classList.toggle('active');
});

// Close mobile menu when clicking on a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        mobileToggle.classList.remove('active');
        // Remove scrollbar compensation
        document.body.style.paddingRight = '';
        document.body.style.overflow = '';
    });
});

// ===================================
// Hero Slider
// ===================================
class HeroSlider {
    constructor() {
        this.slides = document.querySelectorAll('.slide');
        if (this.slides.length === 0) return;
        this.currentSlide = 0;
        this.slideInterval = null;
        this.init();
    }

    init() {
        const dotsContainer = document.querySelector('.slider-dots');
        if (dotsContainer) dotsContainer.innerHTML = '';
        this.createDots();
        this.startAutoPlay();
        this.setupNavigation();
    }

    createDots() {
        const dotsContainer = document.querySelector('.slider-dots');
        this.slides.forEach((_, index) => {
            const dot = document.createElement('div');
            dot.classList.add('slider-dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => this.goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        this.dots = document.querySelectorAll('.slider-dot');
    }

    setupNavigation() {
        const prevBtn = document.querySelector('.slider-prev');
        const nextBtn = document.querySelector('.slider-next');

        prevBtn.addEventListener('click', () => this.prevSlide());
        nextBtn.addEventListener('click', () => this.nextSlide());
    }

    goToSlide(index) {
        this.slides[this.currentSlide].classList.remove('active');
        this.dots[this.currentSlide].classList.remove('active');

        this.currentSlide = index;

        this.slides[this.currentSlide].classList.add('active');
        this.dots[this.currentSlide].classList.add('active');

        this.resetAutoPlay();
    }

    nextSlide() {
        const next = (this.currentSlide + 1) % this.slides.length;
        this.goToSlide(next);
    }

    prevSlide() {
        const prev = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
        this.goToSlide(prev);
    }

    startAutoPlay() {
        this.slideInterval = setInterval(() => this.nextSlide(), 5000);
    }

    resetAutoPlay() {
        clearInterval(this.slideInterval);
        this.startAutoPlay();
    }
}

// Initialize Hero Slider
window.heroSlider = new HeroSlider();

// ===================================
// Smooth Scrolling
// ===================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '#gi-gave') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// ===================================
// Active Navigation Link
// ===================================
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section[id]');

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// ===================================
// Counter Animation (Fun Facts)
// ===================================
class CounterAnimation {
    constructor() {
        this.counters = document.querySelectorAll('.funfact-number');
        this.animated = false;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animated) {
                    this.animateCounters();
                    this.animated = true;
                }
            });
        }, { threshold: 0.5 });

        const funfactsSection = document.querySelector('.funfacts');
        if (funfactsSection) {
            observer.observe(funfactsSection);
        }
    }

    animateCounters() {
        this.counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const duration = 2000;
            const increment = target / (duration / 16);
            let current = 0;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };

            updateCounter();
        });
    }
}

// Initialize Counter Animation
new CounterAnimation();

// ===================================
// Progress Bars Animation
// ===================================
class ProgressBarAnimation {
    constructor() {
        this.progressBars = document.querySelectorAll('.progress-fill');
        this.animated = false;
        this.init();
    }

    init() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const progressBar = entry.target;
                    const progress = progressBar.getAttribute('data-progress');
                    progressBar.style.width = progress + '%';
                }
            });
        }, { threshold: 0.5 });

        this.progressBars.forEach(bar => observer.observe(bar));
    }
}

// Initialize Progress Bar Animation
new ProgressBarAnimation();

// ===================================
// Testimonial Slider
// ===================================
class TestimonialSlider {
    constructor() {
        this.testimonials = document.querySelectorAll('.testimonial-card');
        this.currentTestimonial = 0;
        this.testimonialInterval = null;

        if (this.testimonials.length > 0) {
            this.init();
        }
    }

    init() {
        this.setupNavigation();
        this.startAutoPlay();
    }

    setupNavigation() {
        const prevBtn = document.querySelector('.testimonial-prev');
        const nextBtn = document.querySelector('.testimonial-next');

        if (prevBtn && nextBtn) {
            prevBtn.addEventListener('click', () => this.prevTestimonial());
            nextBtn.addEventListener('click', () => this.nextTestimonial());
        }
    }

    goToTestimonial(index) {
        this.testimonials[this.currentTestimonial].classList.remove('active');
        this.currentTestimonial = index;
        this.testimonials[this.currentTestimonial].classList.add('active');
        this.resetAutoPlay();
    }

    nextTestimonial() {
        const next = (this.currentTestimonial + 1) % this.testimonials.length;
        this.goToTestimonial(next);
    }

    prevTestimonial() {
        const prev = (this.currentTestimonial - 1 + this.testimonials.length) % this.testimonials.length;
        this.goToTestimonial(prev);
    }

    startAutoPlay() {
        this.testimonialInterval = setInterval(() => this.nextTestimonial(), 6000);
    }

    resetAutoPlay() {
        clearInterval(this.testimonialInterval);
        this.startAutoPlay();
    }
}

// Initialize Testimonial Slider
new TestimonialSlider();

// ===================================
// Newsletter Form
// ===================================
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input[type="email"]').value;

        // Simulate form submission
        alert(`Takk for at du meldte deg på nyhetsbrevet! Vi har sendt en bekreftelse til ${email}`);
        newsletterForm.reset();
    });
}

// Footer Newsletter Form
const footerNewsletterForm = document.querySelector('.footer-newsletter');
if (footerNewsletterForm) {
    footerNewsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = footerNewsletterForm.querySelector('input[type="email"]').value;

        alert(`Takk for at du meldte deg på! Vi har sendt en bekreftelse til ${email}`);
        footerNewsletterForm.reset();
    });
}

// ===================================
// Video Play Button
// ===================================
const playButton = document.querySelector('.play-button');
if (playButton) {
    playButton.addEventListener('click', () => {
        alert('Video-funksjonalitet vil bli implementert her. Du kan koble til YouTube eller Vimeo.');
    });
}

// ===================================
// Lazy Loading Images
// ===================================
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===================================
// Scroll Animations
// ===================================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply fade-in animation to cards
document.querySelectorAll('.feature-box, .cause-card, .event-card, .blog-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    fadeInObserver.observe(el);
});

// ===================================
// Dynamic Year in Footer
// ===================================
const yearElement = document.getElementById('year');
if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
}

// ===================================
// Donation Button Tracking
// ===================================
document.querySelectorAll('a[href="#gi-gave"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        // Here you can integrate with a payment gateway like Stripe or Vipps
        alert('Takk for at du vil støtte vårt arbeid! Denne funksjonen vil kobles til et betalingssystem.');
    });
});

// ===================================
// Accessibility: Keyboard Navigation
// ===================================
document.addEventListener('keydown', (e) => {
    // ESC to close mobile menu
    if (e.key === 'Escape' && nav.classList.contains('active')) {
        nav.classList.remove('active');
        mobileToggle.classList.remove('active');
    }

    // Arrow keys for slider navigation
    if (e.key === 'ArrowLeft') {
        heroSlider.prevSlide();
    } else if (e.key === 'ArrowRight') {
        heroSlider.nextSlide();
    }
});

// ===================================
// Console Welcome Message
// ===================================
console.log('%c His Kingdom Ministry ', 'background: linear-gradient(135deg, #FF8C42, #E74C3C); color: white; font-size: 20px; padding: 10px; border-radius: 5px;');
console.log('%c Website built with Wishon Template ', 'color: #FF8C42; font-size: 14px;');

// ===================================
// Performance: Preload Critical Images
// ===================================
window.addEventListener('load', () => {
    // Preload next slide images
    const slides = document.querySelectorAll('.slide');
    if (slides.length === 0) return;

    slides.forEach((slide, index) => {
        if (index > 0) {
            const bg = slide.querySelector('.slide-bg');
            if (bg) {
                const imgUrl = bg.style.backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/)?.[1];
                if (imgUrl) {
                    const img = new Image();
                    img.src = imgUrl;
                }
            }
        }
    });
});


// ===================================
// Donation Form Interactivity
// ===================================
function initDonationForm() {
    // Amount button selection
    const amountButtons = document.querySelectorAll('.amount-btn');
    const customAmountInput = document.getElementById('custom-amount');

    if (amountButtons.length > 0) {
        amountButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all buttons
                amountButtons.forEach(btn => {
                    btn.style.borderColor = '#e0e0e0';
                    btn.style.background = 'white';
                    btn.style.color = 'inherit';
                });
                // Add active class to clicked button
                button.style.borderColor = 'var(--primary-orange)';
                button.style.background = 'var(--primary-orange)';
                button.style.color = 'white';
                // Set custom amount to selected value
                if (customAmountInput) {
                    customAmountInput.value = button.dataset.amount;
                }
            });
        });

        // Clear button selection when typing custom amount
        if (customAmountInput) {
            customAmountInput.addEventListener('input', () => {
                amountButtons.forEach(btn => {
                    btn.style.borderColor = '#e0e0e0';
                    btn.style.background = 'white';
                    btn.style.color = 'inherit';
                });
            });
        }
    }

    // Payment method selection highlighting
    const paymentLabels = document.querySelectorAll('input[name="payment-method"]');
    if (paymentLabels.length > 0) {
        paymentLabels.forEach(radio => {
            radio.addEventListener('change', () => {
                // Remove highlight from all labels
                document.querySelectorAll('input[name="payment-method"]').forEach(r => {
                    r.parentElement.style.borderColor = '#e0e0e0';
                    r.parentElement.style.background = 'white';
                });
                // Highlight selected label
                if (radio.checked) {
                    radio.parentElement.style.borderColor = 'var(--primary-orange)';
                    radio.parentElement.style.background = '#fff5f2';
                }
            });
        });
    }
}

// Run after everything is fully loaded
window.addEventListener('load', () => {
    // Small delay to ensure all other scripts have finished
    setTimeout(initDonationForm, 100);
});

// ===================================
// Google Calendar Tabs (Events page)
// ===================================

function initCalendarTabs() {
    const tabsContainer = document.querySelector('[data-calendar-tabs]');
    if (!tabsContainer) return;

    const tabs = tabsContainer.querySelectorAll('.calendar-tab');
    const frames = document.querySelectorAll('.calendar-frame');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const view = tab.getAttribute('data-calendar-view');

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show matching frame
            frames.forEach(frame => {
                const frameView = frame.getAttribute('data-calendar-view');
                frame.classList.toggle('active', frameView === view);
            });
        });
    });
}

// Month vs agenda toggle for custom calendar
function initCalendarViewToggle() {
    const containers = document.querySelectorAll('.calendar-container');
    if (!containers.length) return;

    containers.forEach(container => {
        const buttons = container.querySelectorAll('.cal-view-btn');
        if (!buttons.length) return;

        const grid = container.querySelector('.calendar-grid');
        const agenda = container.querySelector('.calendar-agenda-card');
        if (!grid || !agenda) return;

        // Default view: month on desktop, agenda on tablet/mobil
        const isSmall = window.matchMedia('(max-width: 1024px)').matches;
        const defaultView = isSmall ? 'agenda' : 'month';
        container.setAttribute('data-cal-view', defaultView);

        buttons.forEach(btn => {
            const view = btn.getAttribute('data-cal-view');
            btn.classList.toggle('active', view === defaultView);

            btn.addEventListener('click', () => {
                const selected = btn.getAttribute('data-cal-view');
                container.setAttribute('data-cal-view', selected);

                buttons.forEach(b => {
                    b.classList.toggle('active', b === btn);
                });
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initCalendarTabs();
    initCalendarViewToggle();
});
