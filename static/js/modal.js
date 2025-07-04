document.addEventListener('DOMContentLoaded', function () {
  // For all modals with triggers
  const modals = [
    { linkId: 'about-link', modalId: 'about-modal-overlay', closeId: 'about-modal-close' },
    { linkId: 'howto-link', modalId: 'howto-modal-overlay', closeId: 'howto-modal-close' }
  ];

  modals.forEach(({ linkId, modalId, closeId }) => {
    const link = document.getElementById(linkId);
    const modal = document.getElementById(modalId);
    const close = document.getElementById(closeId);

    if (link && modal && close) {
      // Open modal
      link.addEventListener('click', e => {
        e.preventDefault();
        modal.style.display = 'flex';
      });

      // Close modal on X
      close.addEventListener('click', () => {
        modal.style.display = 'none';
      });

      // Close modal on backdrop click
      modal.addEventListener('click', e => {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });

      // Close on ESC key
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
          // Close only the modal and prevent other ESC handlers (e.g., search bar) from executing
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          modal.style.display = 'none';
        }
      }, true); // capture=true ensures we intercept before other listeners
    }
  });
});
