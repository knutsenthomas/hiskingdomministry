// ===================================
// Public Content Manager
// ===================================
import { firebaseService } from "./firebase-service.js";

class ContentManager {
    constructor() {
        this.pageId = this.detectPageId();
        this.currentDate = new Date();
        this.init();
    }

    async init() {
        if (!firebaseService.isInitialized) {
            console.log("ℹ️ Content Manager: Firebase not configured. Using static content.");
            return;
        }

        // 1. Initial Load
        const content = await firebaseService.getPageContent(this.pageId);
        const globalSettings = await firebaseService.getPageContent('settings_design');

        if (globalSettings) {
            this.applyGlobalSettings(globalSettings);
        }

        if (content) {
            this.updateDOM(content);
        }

        // 2. SEO & Meta
        const seoSettings = await firebaseService.getPageContent('settings_seo');
        if (seoSettings) {
            // Check if we are viewing a specific item (blog post or teaching item)
            let itemSEO = null;
            const urlParams = new URLSearchParams(window.location.search);
            const itemId = urlParams.get('id');

            if (itemId) {
                // Try to find the item in blog or teaching collections
                const blogData = await firebaseService.getPageContent('collection_blog');
                const teachingData = await firebaseService.getPageContent('collection_teaching');
                const allItems = [
                    ...(Array.isArray(blogData) ? blogData : (blogData?.items || [])),
                    ...(Array.isArray(teachingData) ? teachingData : (teachingData?.items || []))
                ];
                const item = allItems.find(i => i.title === itemId || i.id === itemId);
                if (item && (item.seoTitle || item.seoDescription || item.geoPosition)) {
                    itemSEO = {
                        title: item.seoTitle,
                        description: item.seoDescription,
                        geoPosition: item.geoPosition
                    };
                }
            }
            this.applySEO(seoSettings, itemSEO);
        }

        // 2. Specialized Loaders
        if (this.pageId === 'index') {
            const heroData = await firebaseService.getPageContent('hero_slides');
            if (heroData && heroData.slides) this.renderHeroSlides(heroData.slides);

            // Also load recent blog posts on index if needed
            const blogData = await firebaseService.getPageContent('collection_blog');
            const blogItems = Array.isArray(blogData) ? blogData : (blogData && blogData.items ? blogData.items : []);
            if (blogItems.length > 0) this.renderBlogPosts(blogItems, '#blogg .blog-grid');

            this.enableHeroAnimations();
        }

        if (this.pageId === 'blogg-post') {
            await this.renderSingleBlogPost();
        }

        if (this.pageId === 'arrangementer') {
            const events = await this.loadEvents();

            // Tegn alltid kalenderen, selv om det ikke finnes events ennå
            this.setupCalendarNavigation(events || []);
            this.renderCalendar(events || []);
            this.renderAgenda(events || [], '#calendar-agenda-list');

            // Selve kort-listen med arrangementer vises bare hvis vi faktisk har noe å vise
            if (events && events.length > 0) {
                this.renderEvents(events);
            }
        }

        if (this.pageId === 'kalender') {
            const events = await this.loadEvents();

            // Samme logikk her: vis kalender + agenda selv uten events
            this.setupCalendarNavigation(events || []);
            this.renderCalendar(events || []);
            this.renderAgenda(events || [], '#calendar-agenda-list');
        }

        if (this.pageId === 'blogg') {
            const blogData = await firebaseService.getPageContent('collection_blog');
            const blogItems = Array.isArray(blogData) ? blogData : (blogData && blogData.items ? blogData.items : []);
            if (blogItems.length > 0) this.renderBlogPosts(blogItems, '.blog-page .blog-grid');
        }

        if (this.pageId === 'undervisningsserier' || this.pageId === 'media') {
            const teachingData = await firebaseService.getPageContent('collection_teaching');
            const teachingItems = Array.isArray(teachingData) ? teachingData : (teachingData && teachingData.items ? teachingData.items : []);
            if (teachingItems.length > 0) this.renderTeachingSeries(teachingItems, '.media-grid');
        }

        // 3. Subscribe to Real-time Updates
        firebaseService.subscribeToPage(this.pageId, (updatedContent) => {
            this.updateDOM(updatedContent);
        });
    }

    async renderSingleBlogPost() {
        const container = document.getElementById('single-post-content');
        const titleEl = document.getElementById('single-post-title');
        const breadcrumbEl = document.getElementById('single-post-breadcrumb');
        const dateEl = document.getElementById('single-post-date');
        const categoryEl = document.getElementById('single-post-category');
        const heroEl = document.getElementById('blog-hero');

        if (!container) return;

        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('id');

        if (!itemId) {
            container.innerHTML = '<p>Fant ikke innlegget.</p>';
            return;
        }

        const blogData = await firebaseService.getPageContent('collection_blog');
        const items = Array.isArray(blogData) ? blogData : (blogData?.items || []);
        const item = items.find(i => i.title === itemId || i.id === itemId);

        if (!item) {
            container.innerHTML = '<p>Innlegget ble ikke funnet.</p>';
            return;
        }

        if (titleEl) titleEl.textContent = item.title || 'Blogginnlegg';
        if (breadcrumbEl) breadcrumbEl.textContent = item.title || 'Blogginnlegg';

        if (dateEl) {
            const dateStr = item.date ? this.formatDate(item.date) : '';
            dateEl.innerHTML = `<i class="far fa-calendar"></i> ${dateStr}`;
        }

        if (categoryEl) {
            const cat = item.category || '';
            categoryEl.innerHTML = cat ? `<i class="fas fa-tag"></i> ${cat}` : '';
        }

        if (heroEl && item.imageUrl) {
            heroEl.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${item.imageUrl}')`;
        }

        container.innerHTML = item.content || '<p>Dette innlegget har foreløpig ikke noe innhold.</p>';
    }

    async loadEvents() {
        console.log("ℹ️ Loading events...");

        // 1. Try cached events from Firestore (updated by Cloud Function)
        const eventData = await firebaseService.getPageContent('collection_events');
        const firebaseItems = Array.isArray(eventData) ? eventData : (eventData?.items || []);

        if (firebaseItems.length > 0) {
            console.log("✅ Using synced/cached events.");
            return firebaseItems;
        }

        // 2. Direct GCal Fetch (Fallback)
        const integrations = await firebaseService.getPageContent('settings_integrations');
        const gcal = integrations?.googleCalendar;

        if (gcal && gcal.apiKey && gcal.calendarId) {
            console.log("ℹ️ Fetching directly from Google Calendar (fallback)...");
            const events = await this.fetchGoogleCalendarEvents(gcal.apiKey, gcal.calendarId);
            if (events && events.length > 0) {
                return events;
            }
        }

        return [];
    }


    setupCalendarNavigation(events) {
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        const todayBtn = document.getElementById('today-btn');

        if (prevBtn) prevBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar(events);
        };

        if (nextBtn) nextBtn.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar(events);
        };

        if (todayBtn) todayBtn.onclick = () => {
            this.currentDate = new Date();
            this.renderCalendar(events);
        };
    }

    renderCalendar(events) {
        const grid = document.getElementById('calendar-grid');
        const monthTitle = document.getElementById('current-month-year');
        if (!grid || !monthTitle) return;

        // Set Month Title
        const monthNames = ["Januar", "Februar", "Mars", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Desember"];
        monthTitle.innerText = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

        // Clear previous cells (keeping headers)
        const headers = grid.querySelectorAll('.cal-day-header');
        grid.innerHTML = '';
        headers.forEach(h => grid.appendChild(h));

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // First day of month (Adjusted for Mon-Sun)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // 0=Mon, 6=Sun

        // Days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Days in previous month
        const prevMonthDays = new Date(year, month, 0).getDate();

        // Total cells needed (multiple of 7)
        const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

        for (let i = 0; i < totalCells; i++) {
            const cell = document.createElement('div');
            cell.className = 'cal-cell';

            let displayDay;
            let currentCellDate;

            if (i < startOffset) {
                // Prev Month
                cell.classList.add('other-month');
                displayDay = prevMonthDays - startOffset + i + 1;
                currentCellDate = new Date(year, month - 1, displayDay);
            } else if (i < startOffset + daysInMonth) {
                // Current Month
                displayDay = i - startOffset + 1;
                currentCellDate = new Date(year, month, displayDay);

                const today = new Date();
                if (displayDay === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                    cell.classList.add('today');
                }
            } else {
                // Next Month
                cell.classList.add('other-month');
                displayDay = i - (startOffset + daysInMonth) + 1;
                currentCellDate = new Date(year, month + 1, displayDay);
            }

            cell.innerHTML = `<div class="day-num">${displayDay}</div><div class="cal-events"></div>`;

            // Add Events to this cell
            const cellEvents = events.filter(e => {
                const eDate = new Date(e.start);
                return eDate.getDate() === currentCellDate.getDate() &&
                    eDate.getMonth() === currentCellDate.getMonth() &&
                    eDate.getFullYear() === currentCellDate.getFullYear();
            });

            const eventsContainer = cell.querySelector('.cal-events');
            cellEvents.forEach(e => {
                const tag = document.createElement('div');
                tag.className = 'cal-event-tag';
                tag.innerText = e.title;
                tag.title = `${e.title}\nKl: ${new Date(e.start).toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' })}\n${e.location || ''}`;
                tag.onclick = () => window.location.href = `arrangement-detaljer.html?id=${e.id || encodeURIComponent(e.title)}`;
                eventsContainer.appendChild(tag);
            });

            grid.appendChild(cell);
        }
    }

    async fetchGoogleCalendarEvents(apiKey, calendarId) {
        try {
            const now = new Date().toISOString();
            const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${apiKey}&timeMin=${now}&orderBy=startTime&singleEvents=true&maxResults=20`;

            const response = await fetch(url);
            const data = await response.json();

            if (data.error) {
                console.error("❌ GCal Error:", data.error.message);
                return [];
            }

            return data.items.map(item => ({
                id: item.id,
                title: item.summary,
                description: item.description || '',
                location: item.location || '',
                start: item.start.dateTime || item.start.date,
                end: item.end.dateTime || item.end.date,
                link: item.htmlLink
            }));
        } catch (err) {
            console.error("❌ Failed to fetch Google Calendar events:", err);
            return [];
        }
    }

    renderEvents(events) {
        const container = document.querySelector('.events-grid');
        if (!container) return;

        container.innerHTML = events.map(event => {
            const startDate = new Date(event.start);
            const day = startDate.getDate();
            const monthStr = startDate.toLocaleString('no-NO', { month: 'short' }).replace('.', '');
            const monthUpper = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
            const timeStr = startDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="event-card">
                    <div class="event-image">
                        <div class="event-image-zoom">
                            <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="${event.title}">
                        </div>
                        <div class="event-date">
                            <span class="day">${day}</span>
                            <span class="month">${monthUpper}</span>
                        </div>
                    </div>
                    <div class="event-content">
                        <h3 class="event-title">${event.title}</h3>
                        <div class="event-meta">
                            <span><i class="far fa-clock"></i> ${timeStr}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${event.location || 'Stavanger'}</span>
                        </div>
                        <p class="event-text">${this.stripHtml(event.description).substring(0, 120)}${event.description.length > 120 ? '...' : ''}</p>
                        <a href="${event.link || 'arrangement-detaljer.html'}" target="_blank" class="event-link">Les mer <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderAgenda(events, selector) {
        const container = document.querySelector(selector);
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = '<li class="agenda-empty">Ingen kommende arrangementer er registrert.</li>';
            return;
        }

        const sorted = [...events].sort((a, b) => new Date(a.start) - new Date(b.start));

        container.innerHTML = sorted.slice(0, 10).map(event => {
            const startDate = new Date(event.start);
            const dateStr = startDate.toLocaleDateString('nb-NO', { day: '2-digit', month: 'short' }).replace('.', '');
            const timeStr = startDate.toLocaleTimeString('nb-NO', { hour: '2-digit', minute: '2-digit' });
            const location = event.location || 'Sted ikke satt';

            const link = event.link || 'arrangement-detaljer.html';

            return `
                <li class="calendar-agenda-item">
                    <div class="agenda-main">
                        <span class="agenda-date">${dateStr} kl. ${timeStr}</span>
                        <span class="agenda-title">${event.title}</span>
                        <span class="agenda-meta">${location}</span>
                    </div>
                    <a href="${link}" ${event.link ? 'target="_blank"' : ''} class="agenda-link">Detaljer</a>
                </li>
            `;
        }).join('');
    }

    /**
     * Determine which page we are on based on filename
     */
    detectPageId() {
        const path = window.location.pathname;
        const page = path.split("/").pop().replace(".html", "") || "index";
        return page;
    }

    /**
     * Update DOM elements based on Firestore data
     * @param {object} data 
     */
    updateDOM(data) {
        if (!data) return;

        // Find all elements with data-content-key
        const elements = document.querySelectorAll("[data-content-key]");

        elements.forEach(el => {
            const key = el.getAttribute("data-content-key");
            const value = this.getValueByPath(data, key);

            if (value !== undefined) {
                if (el.tagName === "IMG") {
                    el.src = value;
                } else {
                    el.textContent = value;
                }
            }
        });
    }

    /**
     * Apply global branding and typography
     */
    applyGlobalSettings(data) {
        if (data.logoUrl) {
            const logos = document.querySelectorAll('.logo img');
            logos.forEach(img => img.src = data.logoUrl);
        }
        if (data.faviconUrl) {
            let favicon = document.querySelector('link[rel="icon"]');
            if (!favicon) {
                favicon = document.createElement('link');
                favicon.rel = 'icon';
                document.head.appendChild(favicon);
            }
            favicon.href = data.faviconUrl;
        }
        if (data.siteTitle && this.pageId === 'index') {
            document.title = data.siteTitle;
        }

        // Apply Typography
        if (data.mainFont) {
            document.body.style.fontFamily = `'${data.mainFont}', sans-serif`;
            if (!document.getElementById('google-font-injection')) {
                const link = document.createElement('link');
                link.id = 'google-font-injection';
                link.href = `https://fonts.googleapis.com/css2?family=${data.mainFont.replace(/ /g, '+')}:wght@300;400;500;600;700&display=swap`;
                link.rel = 'stylesheet';
                document.head.appendChild(link);
            }
        }
        if (data.fontSizeBase) {
            document.documentElement.style.fontSize = `${data.fontSizeBase}px`;
        }
        if (data.primaryColor) {
            document.documentElement.style.setProperty('--primary-color', data.primaryColor);
        }
    }

    /**
     * Apply SEO settings to the page head
     */
    applySEO(data, itemOverride = null) {
        const pageId = this.pageId;
        const pageSEO = (data.pages && data.pages[pageId]) || {};

        // 1. Page Title
        let title = itemOverride?.title || pageSEO.title || data.globalTitle || document.title;
        document.title = title;

        // 2. Meta Tags (Description, Keywords)
        const desc = itemOverride?.description || pageSEO.description || data.globalDescription || '';
        this.updateMetaTag('description', desc);
        this.updateMetaTag('keywords', data.globalKeywords || '');

        // 3. GEO Tags
        const geoPos = itemOverride?.geoPosition || pageSEO.geoPosition || data.geoPosition || '';
        const geoPlace = pageSEO.geoPlacename || data.geoPlacename || '';
        const geoRegion = data.geoRegion || '';

        if (geoPos) this.updateMetaTag('geo.position', geoPos);
        if (geoPlace) this.updateMetaTag('geo.placename', geoPlace);
        if (geoRegion) this.updateMetaTag('geo.region', geoRegion);
        if (geoPos) this.updateMetaTag('ICBM', geoPos);

        // 4. Open Graph (og:title, og:description, og:image)
        this.updateMetaTag('og:title', title, 'property');
        this.updateMetaTag('og:description', desc, 'property');
        if (data.ogImage) {
            this.updateMetaTag('og:image', data.ogImage, 'property');
        }

        // 5. Twitter Card
        this.updateMetaTag('twitter:card', 'summary_large_image');
        this.updateMetaTag('twitter:title', title);
        this.updateMetaTag('twitter:description', desc);
        if (data.ogImage) {
            this.updateMetaTag('twitter:image', data.ogImage);
        }
    }

    updateMetaTag(name, content, attr = 'name') {
        if (!content) return;
        let tag = document.querySelector(`meta[${attr}="${name}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute(attr, name);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    }

    /**
     * Dynamically render Hero Slides
     */
    renderHeroSlides(slides) {
        const sliderContainer = document.querySelector('.slider-container');
        if (!sliderContainer) return;

        if (slides.length > 0) {
            document.body.classList.remove('hero-animate');
            sliderContainer.innerHTML = slides.map((slide, index) => `
                <div class="slide ${index === 0 ? 'active' : ''}">
                    <div class="slide-bg" style="background-image: url('${slide.imageUrl}')"></div>
                    <div class="slide-content">
                        <div class="container">
                            <h1 class="slide-title">${slide.title}</h1>
                            <p class="slide-text">${slide.subtitle}</p>
                            ${slide.btnText ? `
                                <div class="slide-buttons">
                                    <a href="${slide.btnLink}" class="btn btn-primary">${slide.btnText}</a>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `).join('');

            // Re-init HeroSlider from script.js
            if (window.heroSlider) {
                window.heroSlider.slides = document.querySelectorAll('.slide');
                window.heroSlider.currentSlide = 0;
                window.heroSlider.init();
            }

            this.enableHeroAnimations();
        }
    }

    enableHeroAnimations() {
        if (this.pageId !== 'index') return;
        document.body.classList.add('hero-animate');
    }

    /**
     * Dynamically render Blog Posts
     */
    renderBlogPosts(posts, selector) {
        const container = document.querySelector(selector);
        if (!container) return;

        if (posts.length > 0) {
            container.innerHTML = posts.map(post => `
                <article class="blog-card">
                    <div class="blog-image">
                        <img src="${post.imageUrl || 'https://via.placeholder.com/600x400?text=Ingen+bilde'}" alt="${post.title}">
                        ${post.category ? `<span class="blog-category" style="position: absolute; top: 15px; left: 15px; background: var(--secondary-color, #ff6b2b); color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">${post.category}</span>` : ''}
                    </div>
                    <div class="blog-content" style="padding: 25px;">
                        <div class="blog-meta" style="display: flex; gap: 15px; font-size: 13px; color: #6c757d; margin-bottom: 15px;">
                            ${post.date ? `<span><i class="fas fa-calendar-alt"></i> ${this.formatDate(post.date)}</span>` : ''}
                            ${post.author ? `<span><i class="fas fa-user"></i> ${post.author}</span>` : '<span><i class="fas fa-user"></i> Admin</span>'}
                        </div>
                        <h3 class="blog-title" style="margin-bottom: 12px; font-size: 1.25rem;">${post.title}</h3>
                        <p class="blog-excerpt" style="color: #666; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">${this.stripHtml(post.content || '').substring(0, 120)}...</p>
                        <a href="blogg-post.html?id=${encodeURIComponent(post.title)}" class="blog-link" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">Les mer <i class="fas fa-arrow-right" style="margin-left: 5px;"></i></a>
                    </div>
                </article>
            `).join('');
        }
    }

    /**
     * Dynamically render Teaching Series
     */
    renderTeachingSeries(series, selector) {
        const container = document.querySelector(selector);
        if (!container) return;

        if (series.length > 0) {
            container.innerHTML = series.map(item => `
                <div class="media-card">
                    <div class="media-thumbnail">
                        <img src="${item.imageUrl || 'https://via.placeholder.com/600x400?text=Ingen+bilde'}" alt="${item.title}">
                        <div class="media-play-button">
                            <i class="fas fa-chalkboard-teacher"></i>
                        </div>
                        ${item.category ? `<span class="media-duration" style="background: var(--primary-color); left: 10px; right: auto; padding: 3px 10px; border-radius: 4px;">${item.category}</span>` : ''}
                    </div>
                    <div class="media-content">
                        <h3 class="media-title">${item.title}</h3>
                        <p class="media-description">${this.stripHtml(item.content || '').substring(0, 100)}...</p>
                        <div class="media-meta" style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-size: 12px; color: #6c757d;"><i class="fas fa-user"></i> ${item.author || 'His Kingdom'}</span>
                            <span style="font-size: 12px; color: #6c757d;"><i class="fas fa-calendar"></i> ${item.date ? this.formatDate(item.date) : ''}</span>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    stripHtml(html) {
        if (!html) return "";
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    }

    formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('no-NO', { day: 'numeric', month: 'long', year: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    /**
     * Helper to get nested object values
     * @param {object} obj 
     * @param {string} path - e.g. "hero.title"
     */
    getValueByPath(obj, path) {
        return path.split('.').reduce((prev, curr) => {
            return prev ? prev[curr] : undefined;
        }, obj);
    }
}

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    window.contentManager = new ContentManager();
});
