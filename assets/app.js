(async function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s = '') => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const data = await fetch('data/product.json').then(r => { if (!r.ok) throw new Error('data'); return r.json(); });

  const ICONS = {
    leaf: '<svg class="icon" viewBox="0 0 48 48"><path d="M10 38C8 22 18 10 38 9c1 20-9 30-24 28"/><path d="M10 38c6-10 13-17 22-22"/></svg>',
    shield: '<svg class="icon" viewBox="0 0 48 48"><path d="M24 6l15 5v11c0 10-6 17-15 20C15 39 9 32 9 22V11z"/><path d="M17 24l5 5 9-10"/></svg>',
    factory: '<svg class="icon" viewBox="0 0 48 48"><path d="M7 41V19l10 6v-6l10 6v-6l10 6V41z"/><path d="M33 25V9h6v16"/><path d="M14 41v-6h6v6M24 41v-6h6v6"/></svg>',
    globe: '<svg class="icon" viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M8 24h32M24 8c-8 9-8 23 0 32M24 8c8 9 8 23 0 32"/></svg>'
  };

  // image tile: gradient always present, picture removed if it fails to load, monogram shown when no image
  const tile = (src, label, cls = 'ph') => `<div class="${cls}">${src ? `<img src="${esc(src)}" alt="${esc(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : `<div class="mono">${esc(label)}</div>`}</div>`;

  const card = (x, o = {}) => `
    <article class="card">
      ${tile(x.image, x.name || x.title || x.publisher)}
      <div class="card-body">
        <span class="kicker">${esc(o.kicker || x.tag || x.kind || x.topic || '')}</span>
        <h3>${esc(x.name || x.title || x.publisher)}</h3>
        <p>${esc(x.desc || x.subtitle || '')}</p>
        <a class="go" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(o.link || 'Explore ↗')}</a>
      </div>
    </article>`;

  const p = data.product;
  $('#hero-img').src = p.heroImage;
  $('#hero-img').addEventListener('error', e => e.target.remove());
  $('#story-img').src = p.storyImage;
  $('#story-img').addEventListener('error', e => e.target.remove());
  $('#quote-img').src = p.closingImage;
  $('#quote-img').addEventListener('error', e => e.target.remove());

  $('#impact-grid').innerHTML = data.transparency.map(x => `
    <article class="impact-card">${ICONS[x.icon]}<h3>${esc(x.title)}</h3>
      <span class="status ${/Brand/.test(x.status) ? 'ok' : ''}">${esc(x.status)}</span>
      <p>${esc(x.desc)}</p><a href="${esc(x.link)}" target="_blank" rel="noopener noreferrer">${esc(x.linkText)} →</a></article>`).join('');

  $('#featured').innerHTML = data.featured.map(x => card(x, { link: 'Read about this aesthetic ↗' })).join('');
  $('#more-list').innerHTML = data.moreAesthetics.map(x => `<li><b>${esc(x.name)}</b><span>${esc(x.desc)} <a href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">↗</a></span></li>`).join('');
  $('#places').innerHTML = data.places.map(x => card(x, { link: 'Explore the place ↗' })).join('');
  $('#events').innerHTML = data.events.map(x => card(x, { link: 'Explore the reference ↗' })).join('');
  $('#muses').innerHTML = data.muses.map(x => `
    <article class="card muse">${tile(x.image, x.name)}
      <div class="card-body"><span class="kicker">${esc(x.role)}</span><h3>${esc(x.name)}</h3><p>${esc(x.desc)}</p>
      <a class="go" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">${esc(x.urlLabel || 'Explore the reference ↗')}</a></div></article>`).join('');
  $('#articles').innerHTML = data.articles.map(x => `
    <article class="card article-card">${tile(x.image, x.publisher)}
      <div class="card-body"><span class="kicker">${esc(x.publisher)}</span>
      <h3>${esc(x.title || x.topic)}</h3>${x.title ? `<p>${esc(x.topic)}</p>` : ''}
      <a class="go" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Read at ${esc(x.publisher)} ↗</a></div></article>`).join('');
  $('#trace').innerHTML = data.trace.map(x => `<li><span class="mark ${x.ok ? '' : 'no'}">${x.ok ? '✓' : '○'}</span><span><b>${esc(x.label)}</b><small>${esc(x.note)}</small></span></li>`).join('');
  $('#creators').innerHTML = data.creators.map(c => `<a href="${esc(c.profile)}" target="_blank" rel="noopener noreferrer">${esc(c.platform)} · ${esc(c.handle)}</a>`).join('');

  // ---- click-to-play video panel (one embed at a time, loaded only on click)
  const player = $('#player'), now = $('#now'), thumbs = $('#thumbs');
  const media = data.media;
  const label = m => m.platform === 'Ralph Lauren' ? 'Product video' : m.title.replace(/ — .*$/, '').replace(/^@/, '@');
  function show(i, autoplay) {
    const m = media[i];
    thumbs.querySelectorAll('.thumb').forEach((t, j) => t.classList.toggle('on', j === i));
    player.className = 'player' + (m.platform === 'Instagram' || m.platform === 'TikTok' ? ' tall' : '');
    player.innerHTML = '';
    const mount = () => {
      player.innerHTML = '';
      if (m.type === 'native') {
        const v = document.createElement('video'); v.controls = true; v.playsInline = true; v.autoplay = true; v.poster = m.thumb || '';
        const s = document.createElement('source'); s.src = m.embedUrl; s.type = 'video/mp4'; v.append(s); player.append(v);
      } else {
        const f = document.createElement('iframe');
        f.src = m.embedUrl + (m.platform === 'YouTube' ? '?autoplay=1&rel=0' : '');
        f.title = m.title; f.allow = 'autoplay; encrypted-media; picture-in-picture; clipboard-write; fullscreen';
        f.allowFullscreen = true; f.referrerPolicy = 'strict-origin-when-cross-origin'; player.append(f);
      }
    };
    const b = document.createElement('button'); b.className = 'facade'; b.setAttribute('aria-label', 'Play ' + m.title);
    b.innerHTML = (m.thumb ? `<img src="${esc(m.thumb)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">` : '') + '<span class="play"></span><span class="plat">' + esc(m.platform) + '</span>';
    b.addEventListener('click', mount); player.append(b);
    now.innerHTML = `<b>${esc(label(m))}</b><small>${esc(m.platform)} · playback depends on the platform's embed rules</small><br><a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener noreferrer">Open original post ↗</a>`;
    if (autoplay) mount();
  }
  thumbs.innerHTML = media.map((m, i) => `<button class="thumb" data-i="${i}" aria-label="${esc(m.title)}">${m.thumb ? `<img src="${esc(m.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}<i class="glyph">${m.platform === 'TikTok' ? '♪' : m.platform === 'Instagram' ? '◎' : '▶'}</i><span>${esc(m.platform)}</span></button>`).join('');
  thumbs.addEventListener('click', e => { const t = e.target.closest('.thumb'); if (t) show(+t.dataset.i, false); });
  $('#t-prev').addEventListener('click', () => thumbs.scrollBy({ left: -170, behavior: 'smooth' }));
  $('#t-next').addEventListener('click', () => thumbs.scrollBy({ left: 170, behavior: 'smooth' }));
  const first = Math.max(0, media.findIndex(m => m.platform === 'YouTube'));
  show(first, false);

  // ---- mobile menu
  const menu = $('.menu-toggle'), nav = $('.primary-nav');
  menu.addEventListener('click', () => { const o = menu.getAttribute('aria-expanded') === 'true'; menu.setAttribute('aria-expanded', String(!o)); nav.classList.toggle('open', !o); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));

  // ---- active tab
  const links = [...document.querySelectorAll('.tabs a')];
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-35% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
  }
})().catch(err => { console.error(err); document.querySelectorAll('#impact-grid,#featured,#places,#events,#muses,#articles,#trace').forEach(el => el.innerHTML = '<p>Data could not be loaded. If you opened this file directly, use a local server (VS Code Live Server) or the GitHub Pages URL.</p>'); });
