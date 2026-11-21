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
    var u;
    try { u = new URL(str(shareUrl)); } catch (e) { return ""; }
    var host = u.hostname.replace(/^(www\.|m\.)/, "");
    var parts = u.pathname.split("/").filter(Boolean);
    var id = "";
    if (host === "youtu.be") id = parts[0] || "";
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (parts[0] === "watch") id = u.searchParams.get("v") || "";
      else if (parts[0] === "shorts" || parts[0] === "embed") id = parts[1] || "";
    } else if (host === "vimeo.com" && /^\d+$/.test(parts[0] || "")) {
      var h = parts[1] && /^[\da-f]+$/i.test(parts[1]) ? "&h=" + parts[1] : "";
      return "https://player.vimeo.com/video/" + parts[0] + "?autoplay=1" + h;
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
})();
