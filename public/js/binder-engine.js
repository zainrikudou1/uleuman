(function (global) {
  'use strict';

  /* BinderSpiral: renders metallic champagne gold spiral rings & punch holes */
  function renderBinderSpiral(container, ringCount) {
    if (!container) return;
    var count = ringCount || 14;
    container.innerHTML = '';
    for (var i = 0; i < count; i++) {
      var ring = document.createElement('div');
      ring.className = 'spiral-ring';
      container.appendChild(ring);
    }
  }

  function renderPageHoles(pageEl, holeCount) {
    var holes = document.createElement('div');
    holes.className = 'page-holes';
    var count = holeCount || 14;
    for (var i = 0; i < count; i++) {
      var h = document.createElement('div');
      h.className = 'page-hole';
      holes.appendChild(h);
    }
    pageEl.insertBefore(holes, pageEl.firstChild);
  }

  /* PageFlipController: wraps StPageFlip if available, otherwise uses 3D CSS perspective flip */
  function PageFlipController(viewportEl, pages, onPageChange) {
    this.viewportEl = viewportEl;
    this.pages = pages;
    this.onPageChange = onPageChange || function () {};
    this.currentIndex = 0;
    this.totalPages = pages.length;
    this.stFlip = null;
    this.mode = 'css3d';
    this._init();
  }

  PageFlipController.prototype._init = function () {
    var self = this;
    var useSt = typeof global.St !== 'undefined' && global.St && typeof global.St.PageFlip === 'function';
    if (useSt) {
      try {
        this.mode = 'stpageflip';
        var rect = this.viewportEl.getBoundingClientRect();
        var w = Math.max(280, Math.round(rect.width || 380));
        var h = Math.max(460, Math.round(rect.height || 580));
        this.stFlip = new global.St.PageFlip(this.viewportEl, {
          width: w,
          height: h,
          size: 'stretch',
          minWidth: 260,
          maxWidth: 620,
          minHeight: 420,
          maxHeight: 820,
          drawShadow: true,
          maxShadowOpacity: 0.45,
          showCover: false,
          mobileScrollSupport: true,
          usePortrait: true,
          flippingTime: 750
        });
        this.stFlip.loadFromHTML(this.pages);
        this.stFlip.on('flip', function (e) {
          self.currentIndex = e.data;
          self.onPageChange(self.currentIndex, 'flip');
        });
        return;
      } catch (err) {
        this.mode = 'css3d';
      }
    }

    this.viewportEl.classList.add('fallback-pages');
    this.pages.forEach(function (p, idx) {
      p.classList.remove('is-active', 'is-flipped', 'is-entering');
      if (idx === 0) p.classList.add('is-active');
    });
  };

  PageFlipController.prototype.goToPage = function (index, source) {
    var target = Math.max(0, Math.min(this.totalPages - 1, index));
    if (target === this.currentIndex) return;

    if (this.mode === 'stpageflip' && this.stFlip) {
      this.stFlip.turnToPage(target);
      this.currentIndex = target;
      this.onPageChange(target, source || 'programmatic');
      return;
    }

    var prevIdx = this.currentIndex;
    var prevEl = this.pages[prevIdx];
    var nextEl = this.pages[target];
    var forward = target > prevIdx;

    this.pages.forEach(function (p) {
      p.classList.remove('is-active', 'is-flipped', 'is-entering');
    });

    if (forward && prevEl) {
      prevEl.classList.add('is-flipped');
      nextEl.classList.add('is-entering');
      setTimeout(function () {
        prevEl.classList.remove('is-flipped');
        nextEl.classList.remove('is-entering');
        nextEl.classList.add('is-active');
      }, 420);
    } else {
      nextEl.classList.add('is-active');
    }

    this.currentIndex = target;
    this.onPageChange(target, source || 'programmatic');
  };

  PageFlipController.prototype.next = function (source) {
    if (this.currentIndex < this.totalPages - 1) {
      if (this.mode === 'stpageflip' && this.stFlip) {
        this.stFlip.flipNext();
      } else {
        this.goToPage(this.currentIndex + 1, source);
      }
      return true;
    }
    return false;
  };

  PageFlipController.prototype.prev = function (source) {
    if (this.currentIndex > 0) {
      if (this.mode === 'stpageflip' && this.stFlip) {
        this.stFlip.flipPrev();
      } else {
        this.goToPage(this.currentIndex - 1, source);
      }
      return true;
    }
    return false;
  };

  /* AutoFlipController: Semi-Automatic Page Flip (3-4s interval, pauses on manual flip, stops at last page) */
  function AutoFlipController(pageController, intervalMs, onStateChange) {
    this.pageController = pageController;
    this.intervalMs = intervalMs || 3800;
    this.onStateChange = onStateChange || function () {};
    this.isPlaying = false;
    this._timer = null;
  }

  AutoFlipController.prototype.play = function () {
    var self = this;
    if (this.isPlaying) return;
    if (this.pageController.currentIndex >= this.pageController.totalPages - 1) {
      this.stop();
      return;
    }
    this.isPlaying = true;
    this.onStateChange(true);
    this._clearTimer();
    this._timer = setInterval(function () {
      if (!self.isPlaying) return;
      var moved = self.pageController.next('auto');
      if (!moved || self.pageController.currentIndex >= self.pageController.totalPages - 1) {
        self.pause();
      }
    }, this.intervalMs);
  };

  AutoFlipController.prototype.pause = function () {
    this.isPlaying = false;
    this._clearTimer();
    this.onStateChange(false);
  };

  AutoFlipController.prototype.stop = function () {
    this.pause();
  };

  AutoFlipController.prototype.toggle = function () {
    if (this.isPlaying) this.pause();
    else this.play();
  };

  AutoFlipController.prototype.handleManualInteraction = function () {
    if (this.isPlaying) {
      this.pause();
    }
  };

  AutoFlipController.prototype._clearTimer = function () {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  };

  global.IvoryBinderEngine = {
    renderBinderSpiral: renderBinderSpiral,
    renderPageHoles: renderPageHoles,
    PageFlipController: PageFlipController,
    AutoFlipController: AutoFlipController
  };
})(typeof window !== 'undefined' ? window : globalThis);
