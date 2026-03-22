/* ============================================
   CARC-7A — Ship Map Controller
   Touch-friendly pinch/zoom/pan for iPad
   ============================================ */

(function () {
  "use strict";

  let mapReady = false;

  // State
  let scale = 1;
  let minScale = 0.5;
  let maxScale = 5;
  let posX = 0;
  let posY = 0;

  // Touch tracking
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;
  let lastDist = 0;
  let lastMidX = 0;
  let lastMidY = 0;

  // Elements
  let viewport, img, zoomDisplay, resetBtn, container;

  function initMap() {
    viewport = document.getElementById("map-viewport");
    img = document.getElementById("map-image");
    zoomDisplay = document.getElementById("map-zoom-display");
    resetBtn = document.getElementById("map-reset");
    container = viewport.closest(".map-container");

    if (!viewport || !img) return;

    // Loading state
    container.classList.add("loading");

    img.addEventListener("load", onMapLoaded);

    // If already cached
    if (img.complete && img.naturalWidth > 0) {
      onMapLoaded();
    }

    // Touch events
    viewport.addEventListener("touchstart", onTouchStart, { passive: false });
    viewport.addEventListener("touchmove", onTouchMove, { passive: false });
    viewport.addEventListener("touchend", onTouchEnd, { passive: true });
    viewport.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // Mouse fallback (for testing on desktop)
    viewport.addEventListener("mousedown", onMouseDown);
    viewport.addEventListener("mousemove", onMouseMove);
    viewport.addEventListener("mouseup", onMouseUp);
    viewport.addEventListener("mouseleave", onMouseUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });

    // Reset button
    resetBtn.addEventListener("click", resetView);

    mapReady = true;
  }

  function onMapLoaded() {
    container.classList.remove("loading");
    img.classList.add("loaded");
    fitMapToViewport();
  }

  function fitMapToViewport() {
    if (!img.naturalWidth) return;

    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Fit image so it fills viewport nicely
    scale = Math.min(vw / iw, vh / ih) * 0.92;
    minScale = scale * 0.5;

    // Center it
    posX = (vw - iw * scale) / 2;
    posY = (vh - ih * scale) / 2;

    applyTransform();
    updateZoomDisplay();
    resetBtn.classList.remove("visible");
  }

  function applyTransform() {
    img.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
  }

  function updateZoomDisplay() {
    const displayScale = scale / minScale * 0.5;
    zoomDisplay.textContent = displayScale.toFixed(1) + "x";

    // Show reset button when zoomed in
    const baseScale = Math.min(viewport.clientWidth / img.naturalWidth, viewport.clientHeight / img.naturalHeight) * 0.92;
    if (Math.abs(scale - baseScale) > 0.01) {
      resetBtn.classList.add("visible");
    } else {
      resetBtn.classList.remove("visible");
    }
  }

  function clampPosition() {
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;
    const iw = img.naturalWidth * scale;
    const ih = img.naturalHeight * scale;

    // Keep at least 20% of the image visible on each edge
    const keepVisible = 0.2;
    const minX = vw - iw * (1 - keepVisible);
    const maxX = iw * keepVisible;
    const minY = vh - ih * (1 - keepVisible);
    const maxY = ih * keepVisible;

    posX = Math.min(maxX, Math.max(minX, posX));
    posY = Math.min(maxY, Math.max(minY, posY));
  }

  // --- Touch handlers ---

  function onTouchStart(e) {
    if (e.touches.length === 1) {
      isDragging = true;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
      isDragging = false;
      lastDist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);
      lastMidX = mid.x;
      lastMidY = mid.y;
    }
    e.preventDefault();
  }

  function onTouchMove(e) {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging) {
      const dx = e.touches[0].clientX - lastX;
      const dy = e.touches[0].clientY - lastY;
      posX += dx;
      posY += dy;
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
      clampPosition();
      applyTransform();
    } else if (e.touches.length === 2) {
      // Pinch zoom
      const dist = getTouchDist(e.touches);
      const mid = getTouchMid(e.touches);

      const zoomFactor = dist / lastDist;
      const newScale = Math.min(maxScale, Math.max(minScale, scale * zoomFactor));

      // Zoom toward pinch center
      const rect = viewport.getBoundingClientRect();
      const cx = mid.x - rect.left;
      const cy = mid.y - rect.top;

      const ratio = newScale / scale;
      posX = cx - ratio * (cx - posX);
      posY = cy - ratio * (cy - posY);
      scale = newScale;

      // Also pan with the pinch
      posX += mid.x - lastMidX;
      posY += mid.y - lastMidY;

      lastDist = dist;
      lastMidX = mid.x;
      lastMidY = mid.y;

      clampPosition();
      applyTransform();
      updateZoomDisplay();
    }
  }

  function onTouchEnd(e) {
    if (e.touches && e.touches.length === 0) {
      isDragging = false;
    }
  }

  // --- Mouse handlers (desktop testing) ---

  function onMouseDown(e) {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    posX += dx;
    posY += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    clampPosition();
    applyTransform();
  }

  function onMouseUp() {
    isDragging = false;
  }

  function onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.92 : 1.08;
    const newScale = Math.min(maxScale, Math.max(minScale, scale * zoomFactor));

    const rect = viewport.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    const ratio = newScale / scale;
    posX = cx - ratio * (cx - posX);
    posY = cy - ratio * (cy - posY);
    scale = newScale;

    clampPosition();
    applyTransform();
    updateZoomDisplay();
  }

  // --- Helpers ---

  function getTouchDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getTouchMid(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  }

  function resetView() {
    fitMapToViewport();
    // Brief flash effect on reset
    img.style.transition = "transform 0.4s ease, filter 0.4s ease";
    img.style.filter = "brightness(1.5) contrast(1.3)";
    setTimeout(() => {
      img.style.filter = "";
      setTimeout(() => {
        img.style.transition = "";
      }, 400);
    }, 200);
  }

  // Handle viewport resize
  window.addEventListener("resize", () => {
    if (mapReady) fitMapToViewport();
  });

  // Expose init and refit for app.js to call
  window.initShipMap = initMap;
  window.refitShipMap = function () {
    if (mapReady) fitMapToViewport();
  };
})();
