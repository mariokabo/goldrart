// Tag all <button> elements whose visible text is exactly "close" (case-insensitive)
(() => {
  function tagCloseButtons() {
    try {
      document.querySelectorAll('button').forEach(btn => {
        const txt = (btn.textContent || '').trim().toLowerCase();
        if (txt === 'close') btn.classList.add('btn-close-custom');
      });
    } catch (e) {
      console.warn('close-buttons: failed to tag buttons', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tagCloseButtons);
  } else {
    tagCloseButtons();
  }
})();
