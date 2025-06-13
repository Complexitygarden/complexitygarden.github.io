// static/js/roadmap.js
// Loads roadmap.json and populates the checklist on roadmap.html

(function() {
    document.addEventListener('DOMContentLoaded', function () {
        const checklistEl = document.getElementById('roadmap-checklist');
        if (!checklistEl) return;

        fetch('./roadmap.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Unable to load roadmap.json');
                }
                return response.json();
            })
            .then(items => {
                // Clear any placeholder content
                checklistEl.innerHTML = '';

                items.forEach(item => {
                    const li = document.createElement('li');

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = item.id;
                    checkbox.disabled = true; // non-interactive
                    if (item.completed) {
                        checkbox.checked = true;
                    }

                    const span = document.createElement('span');
                    span.textContent = item.text;

                    li.appendChild(checkbox);
                    li.appendChild(span);
                    checklistEl.appendChild(li);
                });
            })
            .catch(err => {
                console.error(err);
                checklistEl.innerHTML = '<li>Error loading roadmap.</li>';
            });
    });
})(); 