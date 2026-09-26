(function() {
  "use strict";
  var navToggle = document.getElementById("navToggle");
  var primaryNav = document.getElementById("primaryNav");
  function closeNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute("aria-expanded", "false");
    primaryNav.classList.remove("is-open");
  }
  function openNav() {
    if (!navToggle || !primaryNav) return;
    navToggle.setAttribute("aria-expanded", "true");
    primaryNav.classList.add("is-open");
  }
  if (navToggle && primaryNav) {
    navToggle.addEventListener("click", function() {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) {
        closeNav();
      } else {
        openNav();
      }
    });
    primaryNav.querySelectorAll("a").forEach(function(link) {
      link.addEventListener("click", closeNav);
    });
    document.addEventListener("click", function(event) {
      var isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;
      var clickedInsideNav = primaryNav.contains(event.target);
      var clickedToggle = navToggle.contains(event.target);
      if (!clickedInsideNav && !clickedToggle) {
        closeNav();
      }
    });
    window.addEventListener("resize", function() {
      if (window.innerWidth >= 768) {
        closeNav();
      }
    });
  }
  function trackWhatsAppClick(location) {
    console.log("[Damas Cell] Klik tombol WA:", location);
  }
  document.addEventListener("click", function(event) {
    var btn = event.target.closest('[data-cta="whatsapp"]');
    if (!btn) return;
    trackWhatsAppClick(btn.getAttribute("data-cta-location") || "unknown");
  });
})();
