(function (global) {
  'use strict';

  var cfg = JSON.parse(JSON.stringify(global.OFFICIAL_INVITATION_DATA || {}));
  var pageCtrl = null;
  var autoCtrl = null;
  var countdownTimer = null;
  var audioEl = null;
  var audioCtx = null;
  var ambientTimer = null;
  var isMusicPlaying = false;
  var musicVolume = cfg.music ? cfg.music.volume : 0.55;
  var binderInitialized = false;

  function $(id) { return document.getElementById(id); }

  function sanitizeText(str, maxLen) {
    var clean = String(str || '').replace(/[<>]/g, '').trim();
    if (maxLen && clean.length > maxLen) clean = clean.slice(0, maxLen);
    return clean;
  }

  function showToast(msg) {
    var t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  function copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        showToast(label + ' berhasil disalin');
      }).catch(function () {
        fallbackCopy(text, label);
      });
    } else {
      fallbackCopy(text, label);
    }
  }

  function fallbackCopy(text, label) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(label + ' berhasil disalin');
    } catch (e) {
      showToast('Gagal menyalin ' + label);
    }
    document.body.removeChild(ta);
  }

  function getGuestNameFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      var raw = params.get('to');
      if (!raw) return '';
      return sanitizeText(raw.replace(/\+/g, ' '), 80);
    } catch (e) {
      return '';
    }
  }

  function applyTheme(theme) {
    if (!theme) return;
    var r = document.documentElement.style;
    if (theme.ivory) r.setProperty('--ivory', theme.ivory);
    if (theme.cream) r.setProperty('--cream', theme.cream);
    if (theme.gold) r.setProperty('--gold', theme.gold);
    if (theme.taupe) r.setProperty('--taupe', theme.taupe);
    if (theme.charcoal) r.setProperty('--charcoal', theme.charcoal);
  }

  function applyDynamicPages() {
    var viewport = $('binder-viewport');
    if (!viewport) return;

    viewport.querySelectorAll('.binder-page[data-custom="true"]').forEach(function (el) {
      el.remove();
    });

    var vis = cfg.pageVisibility || {};
    var pageMap = {};
    for (var p = 2; p <= 10; p++) {
      var el = viewport.querySelector('.binder-page[data-page="' + p + '"]');
      if (el) {
        var visible = vis[p] !== false && vis[String(p)] !== false;
        if (!visible) {
          el.remove();
        } else {
          pageMap[String(p)] = el;
        }
      }
    }

    var customList = Array.isArray(cfg.customPages) ? cfg.customPages : [];
    customList.forEach(function (cp, idx) {
      var key = cp.id || ('cp_' + idx);
      var sec = document.createElement('section');
      sec.className = 'binder-page';
      sec.setAttribute('data-custom', 'true');
      sec.setAttribute('data-page-key', key);
      var inner = document.createElement('div');
      inner.className = 'page-inner';
      var frame = document.createElement('div');
      frame.className = 'page-frame';
      if (cp.eyebrow) {
        var eb = document.createElement('div');
        eb.className = 'section-eyebrow';
        eb.textContent = cp.eyebrow;
        frame.appendChild(eb);
      }
      var h2 = document.createElement('h2');
      h2.className = 'section-title';
      h2.style.marginBottom = '10px';
      h2.textContent = cp.title || 'Informasi Tambahan';
      frame.appendChild(h2);

      var div = document.createElement('div');
      div.className = 'divider-gold';
      div.innerHTML = '<span class="divider-diamond"></span>';
      frame.appendChild(div);

      String(cp.body || '').split(/\n\s*\n/).filter(Boolean).forEach(function (para) {
        var pEl = document.createElement('p');
        pEl.className = 'body-serif';
        pEl.style.marginBottom = '10px';
        pEl.textContent = para;
        frame.appendChild(pEl);
      });

      var badge = document.createElement('span');
      badge.className = 'page-number-badge';
      inner.appendChild(frame);
      inner.appendChild(badge);
      sec.appendChild(inner);
      pageMap[key] = sec;
    });

    var order = Array.isArray(cfg.pageOrder) && cfg.pageOrder.length
      ? cfg.pageOrder.slice()
      : ['2', '3', '4', '5', '6', '7', '8', '9', '10'];

    /* Append any keys present in pageMap that are missing from order */
    Object.keys(pageMap).forEach(function (k) {
      if (order.indexOf(k) === -1) order.push(k);
    });

    order.forEach(function (k) {
      if (pageMap[k]) viewport.appendChild(pageMap[k]);
    });

    var activePages = Array.prototype.slice.call(viewport.querySelectorAll('.binder-page'));
    activePages.forEach(function (pg, idx) {
      var b = pg.querySelector('.page-number-badge');
      if (b) b.textContent = String(idx + 1);
    });
  }

  function populateData() {
    applyTheme(cfg.theme);

    var guestName = getGuestNameFromUrl();
    var guestEl = $('guest-name-display');
    if (guestEl) {
      guestEl.textContent = guestName || 'Bapak/Ibu/Saudara/i';
    }
    var rsvpNameInput = $('rsvp-name');
    if (rsvpNameInput && guestName && !rsvpNameInput.value) {
      rsvpNameInput.value = guestName;
    }

    /* Page 1: Cover */
    if ($('cover-couple')) $('cover-couple').textContent = cfg.groom.fullName + ' & ' + cfg.bride.fullName;
    if ($('cover-arabic')) $('cover-arabic').textContent = cfg.groom.arabicName + '  &  ' + cfg.bride.arabicName;
    if ($('cover-date')) $('cover-date').textContent = cfg.dateLabel;
    if ($('site-copyright')) {
      var cr = typeof cfg.copyrightText === 'string' ? cfg.copyrightText.trim() : '© 2026 Saepudin Hidayatullah & Khodijah';
      $('site-copyright').textContent = cr;
      $('site-copyright').style.display = cr ? '' : 'none';
    }

    /* Page 2: Pembukaan */
    if (cfg.opening) {
      if ($('opening-salam')) $('opening-salam').textContent = cfg.opening.salam || '';
      if ($('opening-p1')) $('opening-p1').textContent = cfg.opening.paragraph1 || '';
      if ($('opening-p2')) $('opening-p2').textContent = cfg.opening.paragraph2 || '';
    }

    /* Page 3: Kalam Hikmah */
    var hikmahBox = $('hikmah-body');
    if (hikmahBox && cfg.kalamHikmah) {
      hikmahBox.innerHTML = '';
      (cfg.kalamHikmah.paragraphs || []).forEach(function (p) {
        var el = document.createElement('p');
        el.textContent = p;
        hikmahBox.appendChild(el);
      });
      if (cfg.kalamHikmah.closing) {
        var cl = document.createElement('p');
        cl.className = 'hikmah-closing';
        cl.textContent = cfg.kalamHikmah.closing;
        hikmahBox.appendChild(cl);
      }
    }

    /* Page 4: Groom */
    if ($('groom-name')) {
      $('groom-name').textContent = cfg.groom.fullName.toUpperCase();
      $('groom-arabic').textContent = cfg.groom.arabicName;
      $('groom-nick').textContent = '(' + cfg.groom.nickname + ')';
      $('groom-parents').textContent = cfg.groom.parents;
      renderPortrait($('groom-portrait'), cfg.media && cfg.media.groomPhoto, 'S', cfg.groom.nickname);
    }

    /* Page 5: Bride */
    if ($('bride-name')) {
      $('bride-name').textContent = cfg.bride.fullName.toUpperCase();
      $('bride-arabic').textContent = cfg.bride.arabicName;
      $('bride-nick').textContent = '(' + cfg.bride.nickname + ')';
      $('bride-parents').textContent = cfg.bride.parents;
      renderPortrait($('bride-portrait'), cfg.media && cfg.media.bridePhoto, 'K', cfg.bride.nickname);
    }

    /* Page 6: Resepsi */
    if ($('resepsi-title')) {
      $('resepsi-title').textContent = cfg.events.resepsi.title.toUpperCase();
      $('resepsi-date').textContent = cfg.events.resepsi.dayDate;
      $('resepsi-time').textContent = 'Pukul: ' + cfg.events.resepsi.time;
      $('resepsi-venue').textContent = 'Tempat: ' + cfg.events.resepsi.venue;
      $('resepsi-address').textContent = cfg.events.resepsi.address;
    }

    /* Page 7: Tablig Akbar */
    if ($('tablig-title')) {
      $('tablig-title').textContent = cfg.events.tablig.title.toUpperCase();
      $('tablig-sub').textContent = cfg.events.tablig.subtitle || 'Muludan Rajaban';
      $('tablig-date').textContent = cfg.events.tablig.dayDate;
      $('tablig-time').textContent = 'Pukul: ' + cfg.events.tablig.time;
      $('tablig-address').textContent = cfg.events.tablig.address;
    }

    /* Page 8: Gallery */
    renderGallery(cfg.media && cfg.media.gallery ? cfg.media.gallery : []);

    /* Page 9: Location & DANA */
    if ($('loc-address')) {
      $('loc-address').textContent = cfg.location.address;
      $('btn-open-maps').href = cfg.location.mapsUrl;
      var qrTarget = $('qr-code-box');
      if (qrTarget && global.IvoryQR) {
        qrTarget.innerHTML = global.IvoryQR.toSVG(cfg.location.mapsUrl, {
          fg: '#38352F',
          bg: '#F8F4EA',
          quiet: 2
        });
      }
      if ($('gift-title')) $('gift-title').textContent = 'Bagian B • ' + (cfg.gift.title || 'Tanda Kasih');
      if ($('dana-method')) $('dana-method').textContent = cfg.gift.method || 'DANA';
      $('dana-number').textContent = cfg.gift.accountNumber;
      $('dana-name').textContent = 'a.n. ' + cfg.gift.accountName;
      $('dana-note').textContent = cfg.gift.note;
      if ($('dana-voluntary') && cfg.gift.voluntaryNote) $('dana-voluntary').textContent = cfg.gift.voluntaryNote;
      var extraWrap = $('extra-gift-accounts');
      if (!extraWrap && $('btn-copy-dana')) {
        extraWrap = document.createElement('div');
        extraWrap.id = 'extra-gift-accounts';
        extraWrap.style.cssText = 'margin-top:8px; display:flex; flex-direction:column; gap:6px;';
        $('btn-copy-dana').parentNode.insertBefore(extraWrap, $('dana-voluntary'));
      }
      if (extraWrap) {
        extraWrap.innerHTML = '';
        (cfg.gift.extraAccounts || []).forEach(function (acc) {
          var row = document.createElement('div');
          row.style.cssText = 'padding:7px 9px; border-radius:6px; background:rgba(248,244,234,0.85); border:1px solid rgba(198,166,107,0.45); display:flex; align-items:center; justify-content:space-between; gap:8px;';
          var left = document.createElement('div');
          left.innerHTML = '<div style="font-size:0.7rem; font-weight:700; color:var(--gold-dark);">' + sanitizeText(acc.method, 30) + '</div>' +
            '<div style="font-size:0.86rem; font-weight:700;">' + sanitizeText(acc.accountNumber, 40) + '</div>' +
            '<div style="font-size:0.7rem; color:var(--taupe);">a.n. ' + sanitizeText(acc.accountName, 60) + '</div>';
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'btn-outline';
          btn.style.cssText = 'padding:5px 10px; font-size:0.7rem; flex-shrink:0;';
          btn.textContent = 'SALIN';
          btn.addEventListener('click', function () {
            copyText(acc.accountNumber, acc.method || 'Nomor Rekening');
          });
          ['mousedown', 'touchstart', 'pointerdown'].forEach(function (ev) {
            btn.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true });
          });
          row.appendChild(left);
          row.appendChild(btn);
          extraWrap.appendChild(row);
        });
      }
    }

    /* Page 10: Closing */
    if (cfg.closing) {
      if ($('closing-text') && Array.isArray(cfg.closing.paragraphs)) {
        $('closing-text').textContent = cfg.closing.paragraphs.join(' ');
      }
      if ($('closing-salam') && cfg.closing.salam) $('closing-salam').textContent = cfg.closing.salam;
    }
    if ($('closing-family')) {
      $('closing-family').textContent = (cfg.closing && cfg.closing.family) || (cfg.groom.fullName + ' & ' + cfg.bride.fullName + '.');
    }
  }

  function renderPortrait(container, src, initial, label) {
    if (!container) return;
    container.innerHTML = '';
    if (src) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = 'Foto ' + label;
      img.loading = 'lazy';
      container.appendChild(img);
    } else {
      var ph = document.createElement('div');
      ph.className = 'portrait-placeholder';
      var mono = document.createElement('div');
      mono.className = 'portrait-monogram';
      mono.textContent = initial;
      var cap = document.createElement('div');
      cap.style.fontSize = '0.68rem';
      cap.textContent = 'Ruang Foto ' + label;
      ph.appendChild(mono);
      ph.appendChild(cap);
      container.appendChild(ph);
    }
  }

  function renderGallery(items) {
    var grid = $('scrapbook-grid');
    if (!grid) return;
    grid.innerHTML = '';
    var list = items && items.length ? items : [
      { title: 'Potret Mempelai I', orientation: 'portrait', data_url: '' },
      { title: 'Potret Mempelai II', orientation: 'portrait', data_url: '' },
      { title: 'Momen Kebersamaan', orientation: 'landscape', data_url: '' }
    ];
    list.forEach(function (item) {
      var card = document.createElement('div');
      card.className = 'polaroid-card ' + (item.orientation === 'landscape' ? 'landscape' : '');
      var tape = document.createElement('div');
      tape.className = 'polaroid-tape';
      var media = document.createElement('div');
      media.className = 'polaroid-media';
      if (item.data_url) {
        var img = document.createElement('img');
        img.src = item.data_url;
        img.alt = item.title || 'Galeri Pernikahan';
        img.loading = 'lazy';
        media.appendChild(img);
        card.addEventListener('click', function () {
          openLightbox(item.data_url, item.title || '');
        });
      } else {
        media.textContent = 'Belum ada foto (unggah melalui Dashboard Admin)';
      }
      var cap = document.createElement('div');
      cap.className = 'polaroid-caption';
      cap.textContent = item.title || 'Kenangan';
      card.appendChild(tape);
      card.appendChild(media);
      card.appendChild(cap);
      grid.appendChild(card);
    });
  }

  function openLightbox(src, caption) {
    var lb = $('lightbox');
    if (!lb) return;
    $('lightbox-img').src = src;
    $('lightbox-caption').textContent = caption;
    lb.classList.add('open');
  }

  function startCountdown() {
    if (!$('cd-days') && !$('cover-cd-days')) return;
    clearInterval(countdownTimer);
    var targetMs = new Date(cfg.events.resepsi.isoStart || '2026-12-31T08:00:00+07:00').getTime();
    function tick() {
      var diff = Math.max(0, targetMs - Date.now());
      var d = String(Math.floor(diff / 86400000)).padStart(2, '0');
      var h = String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0');
      var m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      var s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      if ($('cd-days')) { $('cd-days').textContent = d; $('cd-hours').textContent = h; $('cd-mins').textContent = m; $('cd-secs').textContent = s; }
      if ($('cover-cd-days')) { $('cover-cd-days').textContent = d; $('cover-cd-hours').textContent = h; $('cover-cd-mins').textContent = m; $('cover-cd-secs').textContent = s; }
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  /* Safe Audio Engine (user-interaction gated) */
  function startMusic() {
    if (cfg.music && cfg.music.enabled === false) return;
    if (isMusicPlaying) return;
    var customSrc = cfg.music && cfg.music.audioDataUrl;
    if (customSrc) {
      if (!audioEl) {
        audioEl = new Audio(customSrc);
        audioEl.loop = true;
      }
      audioEl.volume = musicVolume;
      audioEl.play().then(function () {
        isMusicPlaying = true;
        updateMusicUI();
      }).catch(function () {});
      return;
    }

    try {
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      isMusicPlaying = true;
      updateMusicUI();
      var notes = [261.63, 329.63, 392.0, 493.88, 392.0, 329.63];
      var step = 0;
      clearInterval(ambientTimer);
      ambientTimer = setInterval(function () {
        if (!isMusicPlaying || !audioCtx) return;
        var osc = audioCtx.createOscillator();
        var gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = notes[step % notes.length];
        step++;
        var now = audioCtx.currentTime;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.01, musicVolume * 0.08), now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 1.65);
      }, 1700);
    } catch (e) {}
  }

  function stopMusic() {
    isMusicPlaying = false;
    if (audioEl) audioEl.pause();
    clearInterval(ambientTimer);
    updateMusicUI();
  }

  function updateMusicUI() {
    var btn = $('btn-music-toggle');
    if (!btn) return;
    btn.textContent = isMusicPlaying ? '♪ Musik: ON' : '♪ Musik: OFF';
    btn.classList.toggle('active', isMusicPlaying);
  }

  function updateNavUI(pageIdx) {
    var total = pageCtrl ? pageCtrl.totalPages : 10;
    $('page-indicator').textContent = 'Hal ' + (pageIdx + 1) + ' / ' + total;
    var dots = document.querySelectorAll('.page-dot');
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i === pageIdx);
    });
    $('btn-prev').disabled = pageIdx <= 0;
    $('btn-next').disabled = pageIdx >= total - 1;
  }

  function initBinder() {
    if (binderInitialized) return;
    binderInitialized = true;

    applyDynamicPages();
    populateData();
    startCountdown();

    var spiralEl = $('binder-spiral');
    if (global.IvoryBinderEngine) {
      global.IvoryBinderEngine.renderBinderSpiral(spiralEl, 14);
      var pages = Array.prototype.slice.call(document.querySelectorAll('.binder-page'));
      pages.forEach(function (p) {
        global.IvoryBinderEngine.renderPageHoles(p, 14);
      });

      pageCtrl = new global.IvoryBinderEngine.PageFlipController($('binder-viewport'), pages, function (idx) {
        updateNavUI(idx);
      }, cfg.animation || {});

      autoCtrl = new global.IvoryBinderEngine.AutoFlipController(
        pageCtrl,
        (cfg.autoplay && cfg.autoplay.intervalMs) || 3800,
        function (playing) {
          var btn = $('btn-autoplay-toggle');
          if (btn) {
            btn.textContent = playing ? '❚❚ Pause' : '▶ Play';
            btn.classList.toggle('active', playing);
          }
        }
      );
    }

    var dotsWrap = $('page-dots');
    if (dotsWrap && pageCtrl) {
      dotsWrap.innerHTML = '';
      for (var i = 0; i < pageCtrl.totalPages; i++) {
        (function (idx) {
          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'page-dot' + (idx === 0 ? ' active' : '');
          b.textContent = String(idx + 1);
          b.setAttribute('aria-label', 'Halaman ' + (idx + 1));
          b.addEventListener('click', function () {
            autoCtrl.handleManualInteraction();
            pageCtrl.goToPage(idx, 'manual');
          });
          dotsWrap.appendChild(b);
        })(i);
      }
    }

    updateNavUI(0);
    bindEvents();
  }

  function bindEvents() {
    /* Prevent StPageFlip from flipping page when interacting with inputs, buttons, links, or forms */
    document.querySelectorAll('.binder-page input, .binder-page textarea, .binder-page select, .binder-page button, .binder-page a, #rsvp-form').forEach(function (el) {
      ['mousedown', 'touchstart', 'pointerdown'].forEach(function (evt) {
        el.addEventListener(evt, function (e) { e.stopPropagation(); }, { passive: true });
      });
    });

    if ($('btn-open-invitation')) {
      $('btn-open-invitation').addEventListener('click', function () {
        startMusic();
        pageCtrl.next('open');
        if (!cfg.autoplay || cfg.autoplay.enabled !== false) {
          autoCtrl.play();
        }
      });
    }

    $('btn-prev').addEventListener('click', function () {
      autoCtrl.handleManualInteraction();
      pageCtrl.prev('manual');
    });

    $('btn-next').addEventListener('click', function () {
      autoCtrl.handleManualInteraction();
      pageCtrl.next('manual');
    });

    $('btn-cover').addEventListener('click', function () {
      autoCtrl.handleManualInteraction();
      pageCtrl.goToPage(0, 'manual');
    });

    $('btn-autoplay-toggle').addEventListener('click', function () {
      autoCtrl.toggle();
    });

    $('btn-music-toggle').addEventListener('click', function () {
      if (isMusicPlaying) stopMusic();
      else startMusic();
    });

    $('music-volume').addEventListener('input', function (e) {
      musicVolume = parseFloat(e.target.value);
      if (audioEl) audioEl.volume = musicVolume;
    });

    if ($('btn-copy-address')) {
      $('btn-copy-address').addEventListener('click', function () {
        copyText(cfg.location.address, 'Alamat');
      });
    }

    if ($('btn-copy-dana')) {
      $('btn-copy-dana').addEventListener('click', function () {
        copyText(cfg.gift.accountNumber, 'Nomor DANA');
      });
    }

    $('lightbox').addEventListener('click', function () {
      $('lightbox').classList.remove('open');
    });

    if ($('rsvp-form')) {
      $('rsvp-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var payload = {
          guest_name: sanitizeText($('rsvp-name').value, 80),
          attendance: $('rsvp-attendance').value,
          guest_count: parseInt($('rsvp-count').value || '1', 10),
          message: sanitizeText($('rsvp-message').value, 400)
        };
        if (!payload.guest_name) {
          showToast('Mohon isi nama tamu terlebih dahulu');
          return;
        }
        fetch('/api/rsvp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json(); })
          .then(function (res) {
            if (res && res.ok) {
              showToast('Terima kasih, konfirmasi RSVP tersimpan');
              $('rsvp-message').value = '';
              loadWishes();
            } else {
              showToast((res && res.error) || 'Gagal menyimpan RSVP');
            }
          })
          .catch(function () {
            showToast('RSVP tercatat secara lokal (mode pratinjau)');
          });
      });
    }
  }

  function loadWishes() {
    fetch('/api/rsvp')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && Array.isArray(data.items)) {
          renderWishes(data.items);
        }
      })
      .catch(function () {});
  }

  function renderWishes(items) {
    var box = $('wishes-list');
    if (!box) return;
    box.innerHTML = '';
    if (!items.length) {
      var empty = document.createElement('div');
      empty.className = 'wish-item';
      empty.textContent = 'Jadilah yang pertama mengirimkan doa restu.';
      box.appendChild(empty);
      return;
    }
    items.slice(0, 12).forEach(function (w) {
      var item = document.createElement('div');
      item.className = 'wish-item';
      var strong = document.createElement('strong');
      strong.textContent = w.guest_name + ' (' + w.attendance.replace('_', ' ') + '): ';
      var msg = document.createElement('span');
      msg.textContent = w.message || 'Semoga sakinah mawaddah warahmah.';
      item.appendChild(strong);
      item.appendChild(msg);
      box.appendChild(item);
    });
  }

  function init() {
    fetch('/api/invitation')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data && data.config) {
          cfg = Object.assign({}, cfg, data.config);
          if (data.media) cfg.media = data.media;
        }
      })
      .catch(function () {})
      .finally(function () {
        initBinder();
        loadWishes();
      });
  }

  document.addEventListener('DOMContentLoaded', init);
})(window);
