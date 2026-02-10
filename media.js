// ===================================
// Media Page - Dynamic Loading Logic
// ===================================
import { firebaseService } from "./js/firebase-service.js";

document.addEventListener('DOMContentLoaded', async function () {
    const settings = await loadMediaSettings();

    initMediaNavigation();

    if (settings) {
        // Init YouTube hvis elementene finnes
        if (settings.youtubeChannelId && (document.getElementById('youtube-grid') || window.location.pathname.includes('youtube.html'))) {
            initYouTubeAPI(settings.youtubeChannelId, settings.youtubePlaylists);
        }
        // Init Podcast med din nye Proxy
        if (document.getElementById('podcast-grid')) {
            initPodcastRSS();
        }

        updatePlatformLinks(settings);
    } else {
        console.warn("⚠️ Ingen media-innstillinger funnet i databasen.");
    }
});

async function loadMediaSettings() {
    if (!firebaseService.isInitialized) {
        console.warn("⚠️ Firebase ikke initialisert. Bruker statisk innhold.");
        return null;
    }
    return await firebaseService.getPageContent('settings_media');
}

/**
 * Navigasjon og Tabs
 */
function initMediaNavigation() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const tabs = document.querySelectorAll('.media-tab');

    tabs.forEach(tab => {
        const href = tab.getAttribute('href');
        if (href === currentPath) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    const mediaCards = document.querySelectorAll('.media-card[data-category], .podcast-card[data-category]');
    if (mediaCards.length > 0 && currentPath === 'media.html') {
        const filterTabs = document.querySelectorAll('.media-tab[data-tab]');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', function (e) {
                const category = this.getAttribute('data-tab');
                if (!category) return;

                e.preventDefault();
                filterTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');

                mediaCards.forEach(card => {
                    const cardCategory = card.getAttribute('data-category');
                    if (category === 'all' || cardCategory === category) {
                        card.style.display = '';
                        setTimeout(() => card.style.opacity = '1', 10);
                    } else {
                        card.style.opacity = '0';
                        setTimeout(() => card.style.display = 'none', 300);
                    }
                });
            });
        });
    }
}

/**
 * YouTube Integrasjon
 */
async function initYouTubeAPI(channelId, playlistsRaw = "") {
    const grid = document.getElementById('youtube-grid');
    const container = document.querySelector('.media-content-section .container');
    const categoriesDiv = document.getElementById('youtube-categories');
    if (!grid && !container) return;

    // Hent alle playlists (kategorier)
    let playlists = [];
    if (playlistsRaw) {
        playlists = parsePlaylists(playlistsRaw);
    }

    // Vis kategorier øverst hvis på youtube.html
    if (window.location.pathname.includes('youtube.html') && categoriesDiv && playlists.length > 0) {
        categoriesDiv.innerHTML = '';
        // "Alle"-knapp
        const allBtn = document.createElement('button');
        allBtn.textContent = 'Alle';
        allBtn.className = 'category-btn active';
        allBtn.onclick = () => loadVideosByCategory();
        categoriesDiv.appendChild(allBtn);
        // Playlist-knapper
        playlists.forEach(pl => {
            const btn = document.createElement('button');
            btn.textContent = pl.name;
            btn.className = 'category-btn';
            btn.onclick = () => loadVideosByCategory(pl.id);
            categoriesDiv.appendChild(btn);
        });
    }

    // Funksjon for å hente og vise videoer fra valgt kategori/playlist

    // YouTube Data API v3
    const YT_API_KEY = 'AIzaSyD622cBjPAsMir81Vpdx6yDtO638NAT1Ys';
    let allVideosCache = {};
    let currentCategory = null;
    let currentShowCount = 0;
    const SHOW_STEP = 6;
    const showMoreBtn = document.getElementById('youtube-show-more');

    // Hent ALLE videoer fra en spilleliste med YouTube Data API v3
    async function fetchAllPlaylistVideos(playlistId) {
        let videos = [];
        let nextPageToken = '';
        do {
            let url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YT_API_KEY}`;
            if (nextPageToken) url += `&pageToken=${nextPageToken}`;
            const resp = await fetch(url);
            const data = await resp.json();
            if (data.items) {
                videos = videos.concat(data.items.map(item => ({
                    title: item.snippet.title,
                    pubDate: item.snippet.publishedAt,
                    link: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
                    thumbnail: item.snippet.thumbnails && item.snippet.thumbnails.high ? item.snippet.thumbnails.high.url : '',
                    description: item.snippet.description || ''
                })));
            }
            nextPageToken = data.nextPageToken;
        } while (nextPageToken);
        return videos;
    }

    async function loadVideosByCategory(playlistId) {
        grid.innerHTML = '<div class="loader-container" style="grid-column: 1/-1; text-align: center; padding: 50px;"><div class="loader"></div><p style="margin-top: 15px; color: var(--text-muted);">Henter videoer fra YouTube...</p></div>';
        // Marker aktiv kategori
        if (categoriesDiv) {
            categoriesDiv.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
            if (!playlistId) {
                categoriesDiv.querySelector('.category-btn').classList.add('active');
            } else {
                const btn = Array.from(categoriesDiv.children).find(b => b.textContent === playlists.find(pl => pl.id === playlistId).name);
                if (btn) btn.classList.add('active');
            }
        }
        let videos = [];
        if (playlistId) {
            // Hent ALLE videoer fra playlist med Data API v3
            if (allVideosCache[playlistId]) {
                videos = allVideosCache[playlistId];
            } else {
                try {
                    videos = await fetchAllPlaylistVideos(playlistId);
                    allVideosCache[playlistId] = videos;
                } catch (e) { videos = []; }
            }
        } else {
            // Hent alle videoer fra kanal (fortsatt via RSS, pga. Data API v3 krever mer logikk for kanal)
            if (allVideosCache['all']) {
                videos = allVideosCache['all'];
            } else {
                const rssFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
                try {
                    const response = await fetch(proxyUrl);
                    const data = await response.json();
                    videos = data.items || [];
                    allVideosCache['all'] = videos;
                } catch (e) { videos = []; }
            }
        }
        currentCategory = playlistId || 'all';
        currentShowCount = SHOW_STEP;
        renderVideos();
    }

    function renderVideos() {
        let videos = allVideosCache[currentCategory] || [];
        grid.innerHTML = '';
        if (videos.length === 0) {
            grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:var(--text-muted);">Ingen videoer funnet.</p>';
            if (showMoreBtn) showMoreBtn.style.display = 'none';
            return;
        }
        videos.slice(0, currentShowCount).forEach(video => {
            let videoId = '';
            if (video.link && video.link.includes('v=')) {
                videoId = video.link.split('v=')[1];
            }
            const card = createYouTubeCard(video, videoId);
            grid.appendChild(card);
        });
        if (showMoreBtn) {
            if (currentShowCount < videos.length) {
                showMoreBtn.style.display = '';
            } else {
                showMoreBtn.style.display = 'none';
            }
        }
    }

    if (showMoreBtn) {
        showMoreBtn.onclick = function() {
            let videos = allVideosCache[currentCategory] || [];
            currentShowCount += SHOW_STEP;
            renderVideos();
        };
    }

    // Last inn alle videoer som standard
    if (window.location.pathname.includes('youtube.html')) {
        loadVideosByCategory();
    } else {
        // Standard visning på media.html (siste 6 videoer)
        const rssFeedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssFeedUrl)}`;
        try {
            const response = await fetch(proxyUrl);
            const data = await response.json();
            if (grid && data.items && data.items.length > 0) {
                grid.innerHTML = '';
                data.items.slice(0, 6).forEach(video => {
                    const videoId = video.link.split('v=')[1];
                    const card = createYouTubeCard(video, videoId);
                    grid.appendChild(card);
                });
            }
        } catch (error) {
            console.error('Error fetching YouTube:', error);
        }
    }
}

function createYouTubeCard(video, videoId) {
    const card = document.createElement('div');
    card.className = 'media-card';
    card.setAttribute('data-category', 'youtube');
    const pubDate = new Date(video.pubDate).toLocaleDateString('no-NO');
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    card.innerHTML = `
        <div class="media-thumbnail" style="cursor: pointer;">
            <img src="${thumbnail}" alt="${video.title}">
            <div class="media-play-button"><i class="fab fa-youtube"></i></div>
        </div>
        <div class="media-content">
            <h3 class="media-title">${video.title}</h3>
            <div class="media-meta"><span><i class="far fa-calendar"></i> ${pubDate}</span></div>
        </div>
    `;

    // Fallback hvis YouTube gir "no thumbnail"-bilde
    const img = card.querySelector('img');
    // Pixabay fallback
    // Fast fallback-bilde for YouTube-videoer uten thumbnail
    const fallbackImg = '/img/YouTube_social_white_squircle_(2017).svg'; // Bruker eksisterende SVG i img/

    img.onerror = function() {
        this.onerror = null;
        this.src = fallbackImg;
    };
    img.onload = function() {
        if (this.src.includes('hqdefault.jpg')) {
            fetch(this.src)
                .then(res => res.blob())
                .then(blob => {
                    if (blob.size < 2000) {
                        this.src = fallbackImg;
                    }
                });
        }
    };
    card.addEventListener('click', () => window.open(video.link, '_blank'));
    return card;
}

/**
 * PODCAST INTEGRASJON (OPPDATERT FOR CLOUD FUNCTION)
 */
let currentAudio = null;

async function initPodcastRSS() {
    const grid = document.getElementById('podcast-grid');
    if (!grid) return;

    try {
        // DIN FUNGERENDE PROXY-URL
        const proxyUrl = 'https://getpodcast-42bhgdjkcq-uc.a.run.app';
        const response = await fetch(proxyUrl);
        const data = await response.json();

        const items = data.rss?.channel?.item;

        if (items) {
            grid.innerHTML = '';
            const episodes = Array.isArray(items) ? items : [items];
            
            const isFullPage = window.location.pathname.includes('podcast.html');
            const limit = isFullPage ? episodes.length : 3;

            episodes.slice(0, limit).forEach((episode, index) => {
                const mappedEpisode = {
                    title: episode.title,
                    pubDate: episode.pubDate,
                    link: episode.link,
                    description: episode.description,
                    thumbnail: data.rss.channel.image?.url || episode["itunes:image"]?.$?.href || episode["itunes:image"]?.href,
                    audioUrl: episode.enclosure?.$?.url || episode.enclosure?.url,
                    episodeNumber: episodes.length - index
                };
                
                const card = createPodcastCard(mappedEpisode);
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('[Podcast] Feil ved henting:', error);
        grid.innerHTML = '<p class="text-danger">Kunne ikke laste episoder.</p>';
    }
}

function createPodcastCard(episode) {
    const card = document.createElement('div');
    card.className = 'podcast-card';
    card.setAttribute('data-category', 'podcast');

    const pubDate = new Date(episode.pubDate).toLocaleDateString('no-NO');
    const thumbnail = episode.thumbnail || 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=400&h=400&fit=crop';
    
    // Rens beskrivelse
    let descText = "";
    if (episode.description) {
        descText = (typeof episode.description === 'string' ? episode.description : (episode.description._ || ""));
        descText = descText.replace(/<[^>]*>/g, '').substring(0, 120) + '...';
    }

    card.innerHTML = `
        <div class="podcast-artwork">
            <img src="${thumbnail}" alt="${episode.title}">
            <div class="podcast-play-overlay">
                <button class="play-btn-circle" data-audio="${episode.audioUrl}">
                    <i class="fas fa-play"></i>
                </button>
            </div>
        </div>
        <div class="podcast-content">
            <span class="podcast-episode">Episode ${episode.episodeNumber}</span>
            <h3 class="podcast-title">${episode.title}</h3>
            <p class="podcast-description">${descText}</p>
            <div class="podcast-meta"><span><i class="far fa-calendar"></i> ${pubDate}</span></div>
            <div class="podcast-actions">
                <button class="btn-play-internal" data-audio="${episode.audioUrl}"><i class="fas fa-play"></i> Hør nå</button>
                <a href="${episode.link}" target="_blank" class="btn-icon-outline"><i class="fas fa-external-link-alt"></i></a>
            </div>
        </div>
    `;

    card.querySelectorAll('[data-audio]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (episode.audioUrl) toggleAudio(episode.audioUrl, episode.title, thumbnail, btn);
        });
    });

    return card;
}

/**
 * Audio Player Logikk
 */
function toggleAudio(url, title, thumbnail, btn) {
    let playerBar = document.getElementById('podcast-player-bar');
    if (!playerBar) createPlayerBar();

    const audio = document.getElementById('global-audio-element');
    const barTitle = document.querySelector('.player-info-title');
    const barImg = document.querySelector('.player-info-img');

    if (currentAudio === url) {
        if (audio.paused) { audio.play(); updatePlayIcons(true, btn); }
        else { audio.pause(); updatePlayIcons(false, btn); }
    } else {
        currentAudio = url;
        audio.src = url;
        barTitle.textContent = title;
        barImg.src = thumbnail;
        audio.play();
        document.getElementById('podcast-player-bar').classList.add('active');
        updatePlayIcons(true, btn);
    }
}

function updatePlayIcons(isPlaying, activeBtn) {
    document.querySelectorAll('.play-btn-circle i, .btn-play-internal i, .player-control-play i').forEach(i => {
        i.className = 'fas fa-play';
    });
    if (isPlaying) {
        if (activeBtn) activeBtn.querySelector('i').className = 'fas fa-pause';
        const barPlayIcon = document.querySelector('.player-control-play i');
        if (barPlayIcon) barPlayIcon.className = 'fas fa-pause';
    }
}

function createPlayerBar() {
    const bar = document.createElement('div');
    bar.id = 'podcast-player-bar';
    bar.innerHTML = `
        <div class="player-container">
            <audio id="global-audio-element"></audio>
            <div class="player-info">
                <img src="" class="player-info-img">
                <div class="player-info-text"><span class="player-info-title">Velg en episode</span></div>
            </div>
            <div class="player-controls">
                <button class="player-control-btn player-control-prev"><i class="fas fa-undo"></i></button>
                <button class="player-control-btn player-control-play"><i class="fas fa-play"></i></button>
                <button class="player-control-btn player-control-next"><i class="fas fa-redo"></i></button>
            </div>
            <div class="player-progress-container">
                <span class="time-current">0:00</span>
                <div class="player-progress-bar"><div class="player-progress-fill"></div></div>
                <span class="time-total">0:00</span>
            </div>
            <div class="player-extra"><button class="player-control-btn player-close"><i class="fas fa-times"></i></button></div>
        </div>
    `;
    document.body.appendChild(bar);

    const audio = document.getElementById('global-audio-element');
    const playBtn = bar.querySelector('.player-control-play');
    const progressFill = bar.querySelector('.player-progress-fill');

    playBtn.addEventListener('click', () => {
        if (audio.paused) { audio.play(); updatePlayIcons(true); }
        else { audio.pause(); updatePlayIcons(false); }
    });

    audio.addEventListener('timeupdate', () => {
        const percent = (audio.currentTime / audio.duration) * 100;
        progressFill.style.width = percent + '%';
        bar.querySelector('.time-current').textContent = formatTime(audio.currentTime);
    });

    audio.addEventListener('loadedmetadata', () => {
        bar.querySelector('.time-total').textContent = formatTime(audio.duration);
    });

    bar.querySelector('.player-close').addEventListener('click', () => {
        audio.pause();
        bar.classList.remove('active');
        updatePlayIcons(false);
    });
}

function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

// Hjelpefunksjoner for YouTube playlists
function parsePlaylists(raw) {
    if (!raw) return [];
    return raw.split('\n').map(line => {
        const parts = line.split(':');
        return parts.length >= 2 ? { name: parts[0].trim(), id: parts[1].trim() } : null;
    }).filter(pl => pl);
}

async function renderPlaylistSection(playlist, container) {
    const section = document.createElement('div');
    section.innerHTML = `<h3 style="margin-top:40px">${playlist.name}</h3><div class="media-grid" id="pl-${playlist.id}"></div>`;
    container.appendChild(section);
}

function updatePlatformLinks(settings) {}