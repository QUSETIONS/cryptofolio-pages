(function () {
  function sanitizeText(value, maxLen = 512) {
    const raw = String(value ?? '');
    const noScripts = raw
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(['"]).*?\1/gi, '')
      .replace(/javascript:/gi, '');
    const noTags = noScripts.replace(/<[^>]*>/g, '');
    return noTags.slice(0, maxLen).trim();
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function animateTextNumber(element, toValue, formatter, options = {}) {
    if (!element) return;
    const duration = options.duration || 520;
    const start = Number(element.dataset.numericValue || 0);
    if (!Number.isFinite(toValue)) {
      element.textContent = formatter(toValue);
      element.dataset.numericValue = '0';
      return;
    }
    if (Math.abs(toValue - start) < 1e-8) {
      element.textContent = formatter(toValue);
      element.dataset.numericValue = String(toValue);
      return;
    }

    const startAt = performance.now();
    function frame(now) {
      const progress = Math.min(1, (now - startAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = start + (toValue - start) * eased;
      element.textContent = formatter(value);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        element.dataset.numericValue = String(toValue);
      }
    }
    requestAnimationFrame(frame);
  }

  window.AppUtils = {
    animateTextNumber,
    sanitizeText,
    escapeHtml
  };
})();
