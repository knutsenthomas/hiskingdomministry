<?php
/*
Template Name: Arrangementer
*/
get_header();
?>

<main>
    <!-- Page Hero -->
    <section class="page-hero"
        style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1499750310159-5b600aaf0320?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80');">
        <div class="container">
            <h1 class="page-hero-title">
                <?php the_title(); ?>
            </h1>
            <p class="page-hero-subtitle">Bli med på våre kommende arrangementer, seminarer og konferanser.</p>
        </div>
    </section>

    <!-- Events List -->
    <section class="events-page section">
        <div class="container">
            <div class="section-header">
                <span class="section-label">Bli med oss</span>
                <h2 class="section-title">Kommende arrangementer</h2>
                <p class="section-description">Vi inviterer deg til å delta på våre seminarer, møter og konferanser.
                    Se oversikten under for hva som skjer fremover.</p>
            </div>

            <div class="events-grid">
                <!-- Events loaded dynamically from Google Calendar via JS -->
            </div>
        </div>
    </section>

    <!-- Month Calendar -->
    <section class="calendar-section" id="arrangement-kalender">
        <div class="container">
            <div class="calendar-container" data-cal-view="month">
                <div class="calendar-view-toggle">
                    <button class="cal-view-btn active" data-cal-view="month">Månedsvisning</button>
                    <button class="cal-view-btn" data-cal-view="agenda">Agenda</button>
                </div>

                <div class="calendar-header">
                    <h2 class="calendar-title" id="current-month-year">Månedskalender</h2>
                    <div class="calendar-nav">
                        <button class="cal-btn" id="prev-month"><i class="fas fa-chevron-left"></i></button>
                        <button class="cal-btn" id="today-btn"
                            style="width: auto; padding: 0 15px; border-radius: 20px; font-size: 13px; font-weight: 600;">I
                            dag</button>
                        <button class="cal-btn" id="next-month"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>

                <div class="calendar-grid" id="calendar-grid">
                    <!-- Header days -->
                    <div class="cal-day-header">Man</div>
                    <div class="cal-day-header">Tir</div>
                    <div class="cal-day-header">Ons</div>
                    <div class="cal-day-header">Tor</div>
                    <div class="cal-day-header">Fre</div>
                    <div class="cal-day-header">Lør</div>
                    <div class="cal-day-header">Søn</div>

                    <!-- Calendar cells will be injected here by content-manager.js -->
                </div>

                <div class="calendar-agenda-card">
                    <div class="calendar-agenda-header">
                        <div>
                            <h3 class="calendar-agenda-title">Agenda-oversikt</h3>
                        </div>
                    </div>
                    <ul class="calendar-agenda-list" id="calendar-agenda-list"></ul>
                </div>
            </div>
        </div>
    </section>

    <!-- Contact CTA -->
    <section class="cta section" style="background: var(--bg-light);">
        <div class="container" style="text-align: center;">
            <h2 class="section-title">Har du spørsmål om våre arrangementer?</h2>
            <p class="section-description" style="margin-left: auto; margin-right: auto;">Vi hjelper deg gjerne med
                informasjon om påmelding, overnatting eller program.</p>
            <a href="<?php echo site_url('/kontakt'); ?>" class="btn btn-primary">Kontakt oss i dag</a>
        </div>
    </section>
</main>

<?php get_footer(); ?>