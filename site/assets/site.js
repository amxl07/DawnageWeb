/* Dawnage site behaviour: mobile menu, scroll reveal, guide filters, hero video, film, stories, apply form. */
(function () {
  "use strict";

  // ---------- Pure helpers (unit-tested in tests/site.test.mjs) ----------
  var MSG = {
    name: "Please enter your name.",
    whatsapp: "Please enter your WhatsApp number with country code, e.g. +91 98765 43210.",
    goal: "Please choose your main goal."
  };
  var str = function (v) { return String(v == null ? "" : v).trim(); };

  function validateApplication(data) {
    var errors = {};
    if (!str(data.name)) errors.name = MSG.name;
    var digits = str(data.whatsapp).replace(/[^0-9]/g, "");
    if (digits.length < 10 || digits.length > 15) errors.whatsapp = MSG.whatsapp;
    if (!str(data.goal)) errors.goal = MSG.goal;
    return errors;
  }

  function buildWhatsAppUrl(number, data) {
    var v = function (k) { return str(data[k]) || "-"; };
    var msg = "Hi Dawnage, I'd like to apply for coaching." +
      "\nName: " + v("name") + "\nWhatsApp: " + v("whatsapp") + "\nGoal: " + v("goal") +
      "\nBiggest obstacle: " + v("obstacle") + "\nStart: " + v("start");
    return "https://wa.me/" + number + "?text=" + encodeURIComponent(msg);
  }

  function buildSheetBody(data, pageUrl, isoTime) {
    var p = new URLSearchParams();
    p.append("timestamp", isoTime);
    ["name", "whatsapp", "goal", "obstacle", "start"].forEach(function (k) { p.append(k, str(data[k])); });
    p.append("page", pageUrl);
    return p.toString();
  }

  // Saves to the Sheet (fire-and-forget) and always opens WhatsApp; never waits on the save.
  function submitApplication(data, deps) {
    var errors = validateApplication(data);
    if (Object.keys(errors).length) return errors;
    if (!str(data.website) && str(deps.sheetUrl)) {
      try {
        var r = deps.fetch(str(deps.sheetUrl), {
          method: "POST", mode: "no-cors", keepalive: true,
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: buildSheetBody(data, deps.pageUrl, deps.now())
        });
        if (r && typeof r.catch === "function") r.catch(function () {});
      } catch (e) { /* the WhatsApp step below still runs */ }
    }
    deps.navigate(buildWhatsAppUrl(deps.waNumber, data));
    return errors;
  }

  // YouTube / Vimeo share link → embed URL; "" when not recognised.
  function embedUrl(shareUrl) {
    var u, raw = str(shareUrl);
    if (raw && !/^https?:\/\//i.test(raw)) raw = "https://" + raw;
    try { u = new URL(raw); } catch (e) { return ""; }
    var host = u.hostname.replace(/^(www\.|m\.)/, "");
    var parts = u.pathname.split("/").filter(Boolean);
    var id = "";
    if (host === "youtu.be") id = parts[0] || "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parts[0] === "watch") id = u.searchParams.get("v") || "";
      else if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") id = parts[1] || "";
    } else if (host === "vimeo.com" && /^\d+$/.test(parts[0] || "")) {
      var h = parts[1] && /^[\da-f]+$/i.test(parts[1]) ? "&h=" + parts[1] : "";
      return "https://player.vimeo.com/video/" + parts[0] + "?autoplay=1" + h;
    } else if (host === "player.vimeo.com" && parts[0] === "video" && /^\d+$/.test(parts[1] || "")) {
      var ph = /^[\da-f]+$/i.test(u.searchParams.get("h") || "") ? "&h=" + u.searchParams.get("h") : "";
      return "https://player.vimeo.com/video/" + parts[1] + "?autoplay=1" + ph;
    }
    return /^[\w-]{11}$/.test(id) ? "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1" : "";
  }

  function shouldPlayLoop(env) { return !env.reducedMotion && !env.saveData; }

  function storyIndex(scrollLeft, width, count) {
    if (!(width > 0)) return 1;
    return Math.min(count, Math.max(1, Math.round(scrollLeft / width) + 1));
  }

  window.Dawnage = {
    validateApplication: validateApplication, buildWhatsAppUrl: buildWhatsAppUrl, buildSheetBody: buildSheetBody,
    submitApplication: submitApplication, embedUrl: embedUrl, shouldPlayLoop: shouldPlayLoop, storyIndex: storyIndex
  };

  // Mobile menu
  var btn = document.querySelector(".menu-btn");
  var menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    var close = function (focusBtn) {
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (focusBtn) btn.focus();
    };
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      if (open) { close(false); return; }
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      var first = menu.querySelector("a");
      if (first) first.focus();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") close(true);
      if (e.key === "Tab" && btn.getAttribute("aria-expanded") === "true") {
        var items = [btn].concat(Array.prototype.slice.call(menu.querySelectorAll("a")));
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && i === 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    document.addEventListener("click", function (e) {
      if (btn.getAttribute("aria-expanded") === "true" && !menu.contains(e.target) && !btn.contains(e.target)) close(false);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1100) close(false); });
  }

  // Scroll reveal (content is visible without JS; this only adds a gentle entrance)
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Guide category filters
  var chips = document.querySelectorAll(".filter-chips button");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var cat = chip.getAttribute("data-cat");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
      document.querySelectorAll("[data-guide-cat]").forEach(function (card) {
        card.hidden = !(cat === "all" || card.getAttribute("data-guide-cat") === cat);
      });
    });
  });

  // Hero loop (homepage): silent background video, only loaded when motion and data allow
  var loop = document.querySelector(".hero-loop");
  if (loop) {
    var toggle = document.querySelector(".loop-toggle");
    var conn = navigator.connection;
    // Paint the poster behind the video: phones that block, fail or never start the video
    // still show the picture (the video itself stays invisible until it really plays)
    var heroBox = loop.closest(".hero-video");
    var poster = loop.getAttribute("poster");
    if (heroBox && poster) heroBox.style.backgroundImage = 'url("' + poster + '")';
    loop.addEventListener("playing", function () { loop.classList.add("is-playing"); });
    var canPlay = shouldPlayLoop({
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      saveData: !!(conn && conn.saveData)
    });
    if (canPlay) {
      var tall = window.matchMedia("(max-aspect-ratio: 3/4)").matches;
      if (toggle) loop.addEventListener("playing", function () { toggle.hidden = false; });
      loop.src = loop.getAttribute(tall ? "data-src-tall" : "data-src-wide");
      var started = loop.play();
      if (started && typeof started.catch === "function") started.catch(function () {});
    }
    if (toggle) {
      toggle.addEventListener("click", function () {
        var pause = !loop.paused;
        if (pause) loop.pause(); else loop.play();
        toggle.setAttribute("aria-pressed", pause ? "true" : "false");
        toggle.setAttribute("aria-label", pause ? "Play background video" : "Pause background video");
      });
    }
  }

  // Film: [data-film] holds a YouTube/Vimeo link; mode "dialog" (homepage) or "inline" (coaching VSL)
  var filmDialog = document.getElementById("film-dialog");
  var filmNode = function (link) {
    var src = embedUrl(link);
    if (!src) {
      var soon = document.createElement("p");
      soon.className = "film-soon";
      soon.textContent = "The film is coming soon.";
      return soon;
    }
    var frame = document.createElement("iframe");
    frame.src = src;
    frame.title = "Dawnage film";
    frame.allow = "autoplay; fullscreen; picture-in-picture";
    frame.setAttribute("allowfullscreen", "");
    return frame;
  };
  document.querySelectorAll("[data-film]").forEach(function (filmBtn) {
    filmBtn.addEventListener("click", function () {
      var node = filmNode(filmBtn.getAttribute("data-film"));
      if (filmBtn.getAttribute("data-film-mode") === "inline") {
        var holder = filmBtn.closest(".vsl-frame");
        if (holder) holder.replaceChildren(node);
        return;
      }
      if (!filmDialog || typeof filmDialog.showModal !== "function") return;
      filmDialog.querySelector(".film-frame").replaceChildren(node);
      filmDialog.showModal();
    });
  });
  if (filmDialog) {
    // Emptying the frame on close stops playback and sound
    filmDialog.addEventListener("close", function () { filmDialog.querySelector(".film-frame").replaceChildren(); });
    filmDialog.addEventListener("click", function (e) { if (e.target === filmDialog) filmDialog.close(); });
    var filmClose = filmDialog.querySelector(".film-close");
    if (filmClose) filmClose.addEventListener("click", function () { filmDialog.close(); });
  }

  // Client stories carousel (coaching page): scroll-snap track + prev/next + counter
  document.querySelectorAll("[data-carousel]").forEach(function (box) {
    var track = box.querySelector(".stories-track");
    if (!track) return;
    var count = track.children.length;
    var prev = box.querySelector("[data-prev]");
    var next = box.querySelector("[data-next]");
    var current = box.querySelector("[data-current]");
    var total = box.querySelector("[data-total]");
    if (total) total.textContent = count;
    Array.prototype.forEach.call(track.children, function (story, i) {
      story.setAttribute("aria-label", "Client story " + (i + 1) + " of " + count);
    });
    var smooth = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    var update = function () {
      var i = storyIndex(track.scrollLeft, track.clientWidth, count);
      if (current) current.textContent = i;
      if (prev) prev.disabled = i === 1;
      if (next) next.disabled = i === count;
    };
    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -track.clientWidth, behavior: smooth }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: track.clientWidth, behavior: smooth }); });
    track.addEventListener("scroll", update, { passive: true });
    update();
  });

  // Apply form (coaching page): save to the Google Sheet, then open WhatsApp with the answers
  var form = document.getElementById("apply-form");
  if (form) {
    var goalSlug = new URLSearchParams(window.location.search).get("goal");
    if (goalSlug) {
      var goalOpt = form.querySelector('option[data-slug="' + goalSlug.replace(/[^a-z-]/g, "") + '"]');
      if (goalOpt) goalOpt.selected = true;
    }
    var applyStatus = document.getElementById("apply-status");
    var waLink = document.getElementById("apply-wa-link");
    var showError = function (name, msg) {
      var field = form.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      var err = field.querySelector(".err");
      field.classList.toggle("invalid", !!msg);
      if (err) { err.textContent = msg || ""; err.hidden = !msg; }
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {};
      ["name", "whatsapp", "goal", "obstacle", "start", "website"].forEach(function (k) {
        data[k] = form.elements[k] ? form.elements[k].value : "";
      });
      var errors = submitApplication(data, {
        waNumber: form.getAttribute("data-wa"),
        sheetUrl: form.getAttribute("data-sheet") || "",
        pageUrl: window.location.href,
        now: function () { return new Date().toISOString(); },
        fetch: function (url, opts) { return window.fetch(url, opts); },
        navigate: function (url) {
          if (waLink) waLink.href = url;
          if (applyStatus) applyStatus.hidden = false;
          window.location.href = url;
        }
      });
      ["name", "whatsapp", "goal"].forEach(function (k) { showError(k, errors[k]); });
      var firstBad = form.querySelector(".invalid input, .invalid select");
      if (firstBad) firstBad.focus();
    });
  }
})();
