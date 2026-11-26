(function (global) {
  'use strict';

  var cfg = JSON.parse(JSON.stringify(global.OFFICIAL_INVITATION_DATA || {}));
  function $(id) { return document.getElementById(id); }

  function showStatus(id, msg) {
    var el = $(id);
    if (!el) return;
    el.textContent = msg;
    el.classList.remove('hidden');
  }

  function fillForm() {
    $('f-groom-name').value = cfg.groom.fullName;
    $('f-groom-nick').value = cfg.groom.nickname;
    $('f-groom-arabic').value = cfg.groom.arabicName;
    $('f-groom-parents').value = cfg.groom.parents;
    $('f-bride-name').value = cfg.bride.fullName;
    $('f-bride-nick').value = cfg.bride.nickname;
    $('f-bride-arabic').value = cfg.bride.arabicName;
    $('f-bride-parents').value = cfg.bride.parents;

    $('f-resepsi-date').value = cfg.events.resepsi.dayDate;
    $('f-resepsi-time').value = cfg.events.resepsi.time;
    $('f-resepsi-venue').value = cfg.events.resepsi.venue;
    $('f-tablig-sub').value = cfg.events.tablig.subtitle || 'Muludan Rajaban';
    $('f-tablig-time').value = cfg.events.tablig.time;
    $('f-tablig-address').value = cfg.events.tablig.address;

    $('f-loc-address').value = cfg.location.address;
    $('f-loc-maps').value = cfg.location.mapsUrl;
    $('f-hikmah').value = (cfg.kalamHikmah.paragraphs || []).join('\n\n');
    $('f-hikmah-closing').value = cfg.kalamHikmah.closing || '';

    $('f-music-enabled').value = cfg.music && cfg.music.enabled === false ? 'false' : 'true';
    $('f-autoplay-ms').value = (cfg.autoplay && cfg.autoplay.intervalMs) || 3800;
    $('f-col-ivory').value = (cfg.theme && cfg.theme.ivory) || '#F8F4EA';
    $('f-col-gold').value = (cfg.theme && cfg.theme.gold) || '#C6A66B';
    $('f-col-charcoal').value = (cfg.theme && cfg.theme.charcoal) || '#38352F';
  }

  function collectForm() {
    cfg.groom.fullName = $('f-groom-name').value.trim();
    cfg.groom.nickname = $('f-groom-nick').value.trim();
    cfg.groom.arabicName = $('f-groom-arabic').value.trim();
    cfg.groom.parents = $('f-groom-parents').value.trim();
    cfg.bride.fullName = $('f-bride-name').value.trim();
    cfg.bride.nickname = $('f-bride-nick').value.trim();
    cfg.bride.arabicName = $('f-bride-arabic').value.trim();
    cfg.bride.parents = $('f-bride-parents').value.trim();

    cfg.events.resepsi.dayDate = $('f-resepsi-date').value.trim();
    cfg.events.resepsi.time = $('f-resepsi-time').value.trim();
    cfg.events.resepsi.venue = $('f-resepsi-venue').value.trim();
    cfg.events.tablig.subtitle = $('f-tablig-sub').value.trim();
    cfg.events.tablig.time = $('f-tablig-time').value.trim();
    cfg.events.tablig.address = $('f-tablig-address').value.trim();

    cfg.location.address = $('f-loc-address').value.trim();
    cfg.location.mapsUrl = $('f-loc-maps').value.trim();
    cfg.kalamHikmah.paragraphs = $('f-hikmah').value.split(/\n\s*\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    cfg.kalamHikmah.closing = $('f-hikmah-closing').value.trim();

    cfg.music.enabled = $('f-music-enabled').value === 'true';
    cfg.autoplay.intervalMs = parseInt($('f-autoplay-ms').value || '3800', 10);
    cfg.theme.ivory = $('f-col-ivory').value;
    cfg.theme.gold = $('f-col-gold').value;
    cfg.theme.charcoal = $('f-col-charcoal').value;
  }

  function saveConfig() {
    collectForm();
    fetch('/api/invitation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: cfg })
    })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res.ok) showStatus('config-status', 'Perubahan berhasil disimpan ke D1.');
        else showStatus('config-status', res.error || 'Gagal menyimpan.');
      })
      .catch(function () { showStatus('config-status', 'Gagal terhubung ke server.'); });
  }

  function compressImage(file, cb) {
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var maxDim = 960;
        var w = img.width, h = img.height;
        if (w > maxDim || h > maxDim) {
          var scale = maxDim / Math.max(w, h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        cb(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function loadDashboardData() {
    fetch('/api/invitation').then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.config) cfg = Object.assign({}, cfg, d.config);
      fillForm();
      renderMediaList(d && d.media ? d.media.gallery : []);
    });
    loadGuests();
    loadRsvps();
  }

  function renderMediaList(gallery) {
    var box = $('media-list');
    if (!box) return;
    box.innerHTML = '';
    (gallery || []).forEach(function (m) {
      var card = document.createElement('div');
      card.style.cssText = 'border:1px solid var(--gold); border-radius:8px; padding:8px; background:#fff;';
      var img = document.createElement('img');
      img.src = m.data_url;
      img.style.cssText = 'width:100%; height:140px; object-fit:cover; border-radius:6px;';
      var cap = document.createElement('div');
      cap.style.cssText = 'font-size:0.78rem; margin:6px 0; font-weight:600;';
      cap.textContent = (m.title || 'Foto') + ' (' + m.orientation + ')';
      var del = document.createElement('button');
      del.className = 'btn btn-danger';
      del.textContent = 'Hapus';
      del.addEventListener('click', function () {
        fetch('/api/admin/media?id=' + m.id, { method: 'DELETE' }).then(loadDashboardData);
      });
      card.appendChild(img);
      card.appendChild(cap);
      card.appendChild(del);
      box.appendChild(card);
    });
  }

  function buildInviteUrl(name) {
    return window.location.origin + '/?to=' + encodeURIComponent(name).replace(/%20/g, '+');
  }

  function buildWaLink(name, phone) {
    var url = buildInviteUrl(name);
    var msg = 'Assalamu\'alaikum Warahmatullahi Wabarakatuh.\n\nKepada Yth. ' + name + ',\nDengan penuh hormat kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan Saepudin Hidayatullah & Khodijah pada Kamis, 31 Desember 2026.\n\nBuka undangan digital:\n' + url;
    var cleanPhone = String(phone || '').replace(/[^0-9]/g, '');
    return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(msg);
  }

  function loadGuests() {
    fetch('/api/admin/guests').then(function (r) { return r.json(); }).then(function (d) {
      var tb = $('guests-tbody');
      if (!tb || !d || !d.items) return;
      tb.innerHTML = '';
      d.items.forEach(function (g) {
        var tr = document.createElement('tr');
        var td1 = document.createElement('td'); td1.textContent = g.name;
        var td2 = document.createElement('td');
        var a = document.createElement('a');
        a.href = buildInviteUrl(g.name);
        a.target = '_blank';
        a.textContent = '/?to=' + g.slug_param;
        td2.appendChild(a);
        var td3 = document.createElement('td');
        var wa = document.createElement('a');
        wa.href = buildWaLink(g.name, g.phone);
        wa.target = '_blank';
        wa.className = 'btn btn-outline';
        wa.style.marginRight = '6px';
        wa.textContent = 'Kirim WA';
        var del = document.createElement('button');
        del.className = 'btn btn-danger';
        del.textContent = 'Hapus';
        del.addEventListener('click', function () {
          fetch('/api/admin/guests?id=' + g.id, { method: 'DELETE' }).then(loadGuests);
        });
        td3.appendChild(wa);
        td3.appendChild(del);
        tr.appendChild(td1); tr.appendChild(td2); tr.appendChild(td3);
        tb.appendChild(tr);
      });
    });
  }

  function loadRsvps() {
    fetch('/api/rsvp').then(function (r) { return r.json(); }).then(function (d) {
      var tb = $('rsvp-tbody');
      if (!tb || !d || !d.items) return;
      tb.innerHTML = '';
      d.items.forEach(function (r) {
        var tr = document.createElement('tr');
        ['guest_name', 'attendance', 'guest_count', 'message'].forEach(function (k) {
          var td = document.createElement('td');
          td.textContent = r[k];
          tr.appendChild(td);
        });
        var tdAct = document.createElement('td');
        var del = document.createElement('button');
        del.className = 'btn btn-danger';
        del.textContent = 'Hapus';
        del.addEventListener('click', function () {
          fetch('/api/rsvp?id=' + r.id, { method: 'DELETE' }).then(loadRsvps);
        });
        tdAct.appendChild(del);
        tr.appendChild(tdAct);
        tb.appendChild(tr);
      });
    });
  }

  function enterAdmin() {
    $('login-card').classList.add('hidden');
    $('admin-workspace').classList.remove('hidden');
    $('btn-logout').classList.remove('hidden');
    loadDashboardData();
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        $(btn.getAttribute('data-tab')).classList.add('active');
      });
    });

    $('login-form').addEventListener('submit', function (e) {
      e.preventDefault();
      fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: $('admin-password').value })
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (res.ok) enterAdmin();
          else showStatus('login-status', res.error || 'Login gagal');
        })
        .catch(function () { showStatus('login-status', 'Endpoint login tidak terjangkau.'); });
    });

    $('btn-logout').addEventListener('click', function () {
      fetch('/api/admin/logout', { method: 'POST' }).then(function () { window.location.reload(); });
    });

    $('btn-save-config').addEventListener('click', saveConfig);
    $('btn-save-theme').addEventListener('click', saveConfig);

    $('f-music-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      if (file.size > 850000) {
        alert('File audio terlalu besar (maks 800 KB).');
        return;
      }
      var r = new FileReader();
      r.onload = function (ev) { cfg.music.audioDataUrl = ev.target.result; };
      r.readAsDataURL(file);
    });

    $('btn-upload-media').addEventListener('click', function () {
      var file = $('m-file').files[0];
      if (!file) return;
      compressImage(file, function (dataUrl) {
        fetch('/api/admin/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slot: $('m-slot').value,
            orientation: $('m-orientation').value,
            title: $('m-title').value.trim(),
            mime_type: 'image/jpeg',
            data_url: dataUrl
          })
        }).then(loadDashboardData);
      });
    });

    $('btn-add-guest').addEventListener('click', function () {
      var name = $('g-name').value.trim();
      var phone = $('g-phone').value.trim();
      if (!name) return;
      fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, phone: phone })
      }).then(function () {
        showStatus('guest-link-preview', 'Link dibuat: ' + buildInviteUrl(name));
        $('g-name').value = '';
        $('g-phone').value = '';
        loadGuests();
      });
    });

    /* Check existing session */
    fetch('/api/admin/guests').then(function (r) {
      if (r.ok) enterAdmin();
    }).catch(function () {});
  });
})(window);
