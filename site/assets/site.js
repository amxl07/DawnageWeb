/* Dawnage site behaviour: mobile menu, scroll reveal, guide filters, apply form → WhatsApp. */
(function () {
  "use strict";

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

  // Apply form → WhatsApp (nothing is stored or sent anywhere else)
  var form = document.getElementById("apply-form");
  if (form) {
    var number = form.getAttribute("data-wa");
    var template = form.getAttribute("data-template");
    // Pre-fill from links like apply.html?goal=fat-loss or apply.html?plan=Growth
    var params = new URLSearchParams(window.location.search);
    var goalSlug = params.get("goal");
    if (goalSlug) {
      var radio = form.querySelector('input[name="goal"][data-slug="' + goalSlug.replace(/[^a-z-]/g, "") + '"]');
      if (radio) radio.checked = true;
    }
    var plan = (params.get("plan") || "").replace(/[^\w ]/g, "").slice(0, 30);
    var chip = document.getElementById("plan-chip");
    if (plan && chip) { chip.textContent = "Plan: " + plan; chip.hidden = false; }
    var setErr = function (name, msg) {
      var field = form.querySelector('[data-field="' + name + '"]');
      if (!field) return;
      var err = field.querySelector(".err");
      field.classList.toggle("invalid", !!msg);
      if (err) { err.textContent = msg || ""; err.hidden = !msg; }
    };
    var val = function (name) {
      var el = form.elements[name];
      if (!el) return "";
      if (el.length !== undefined && el.tagName !== "SELECT") {
        for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value;
        return "";
      }
      return (el.value || "").trim();
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = {
        name: val("name"), whatsapp: val("whatsapp"), goal: val("goal"),
        experience: val("experience"), callTime: val("callTime"), notes: val("notes")
      };
      var ok = true;
      setErr("name", data.name ? "" : "Please enter your name."); if (!data.name) ok = false;
      var digits = data.whatsapp.replace(/[^0-9]/g, "");
      var phoneOk = digits.length >= 10 && digits.length <= 15;
      setErr("whatsapp", phoneOk ? "" : "Please enter your WhatsApp number with country code, e.g. +91 98765 43210."); if (!phoneOk) ok = false;
      setErr("goal", data.goal ? "" : "Please choose a goal."); if (!data.goal) ok = false;
      if (!ok) {
        var firstBad = form.querySelector(".invalid input, .invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var msg = template.replace(/\{(\w+)\}/g, function (_, k) { return data[k] || "-"; });
      if (plan) msg += "\nPlan: " + plan;
      var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(msg);
      var status = document.getElementById("apply-status");
      if (status) { status.hidden = false; }
      window.location.href = url;
    });
  }
})();
