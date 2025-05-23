// About modal implementation
document.addEventListener('DOMContentLoaded', function() {
    var aboutLink = document.getElementById('about-link');
    var aboutModal = document.getElementById('about-modal-overlay');
    var aboutClose = document.getElementById('about-modal-close');

    if (aboutLink && aboutModal && aboutClose) {
        aboutLink.onclick = function(e) {
            e.preventDefault();
            aboutModal.style.display = 'flex';
        };
        aboutClose.onclick = function() {
            aboutModal.style.display = 'none';
        };
        aboutModal.onclick = function(e) {
            if (e.target === aboutModal) aboutModal.style.display = 'none';
        };
    }
});