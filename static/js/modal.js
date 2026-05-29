document.addEventListener('DOMContentLoaded', function () {
    // for all modals with triggers
    const modals = [
        { linkId: 'about-link', modalId: 'about-modal-overlay', closeId: 'about-modal-close' },
        { linkId: 'howto-link', modalId: 'howto-modal-overlay', closeId: 'howto-modal-close' },
        { linkId: null, modalId: 'edit-class-modal-overlay', closeId: 'edit-class-modal-close' },
    ];

    modals.forEach(({ linkId, modalId, closeId }) => {
        const link = document.getElementById(linkId);
        const modal = document.getElementById(modalId);
        const close = document.getElementById(closeId);

        if (modal && close) {
            if (link) {
                link.addEventListener('click', e => {
                    e.preventDefault();
                    modal.style.display = 'flex';
                });
            }

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

            // Close on esc key
            document.addEventListener('keydown', e => {
                if (e.key === 'Escape' && modal.style.display === 'flex') {
                    // Close only the modal and prevent other ESC handlers from executing
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    modal.style.display = 'none';
                }
            }, true); // true so we intercept before other listeners
        }
    });
});

// ------- Edit Modal -------------- //
var currentEditClass = null;
var pendingDeletedIndices = new Set();

/**
 * 
 * @param {*} classData information about a class, expects name, latex_name, definition, information, and see_also array
 * @returns null
 * 
 * defines the openEditModal function in window
 * 
 * Sets the edit class modal information, like name, latex name, definition, information, and populates the see_also classes
 */
window.openEditModal = function (classData) {
    if (!classData) {
        return;
    }

    currentEditClass = classData;

    pendingDeletedIndices = new Set();

    document.getElementById('edit-modal-class-name').textContent = classData.name || classData.id;
    document.getElementById('edit-latex-name').value = classData.latex_name || '';
    document.getElementById('edit-definition').value = classData.definition || '';
    document.getElementById('edit-information').value = classData.information || '';
    document.getElementById('edit-see-also').value = Array.isArray(classData.see_also) ? classData.see_also.join(' ') : '';

    buildTheoremsList(classData);
    document.getElementById('edit-class-modal-overlay').style.display = 'flex';
};


function buildTheoremsList(classData) {
    var list = document.getElementById('edit-theorems-list');

    list.innerHTML = '';

    pendingDeletedIndices = new Set();

    if (!window.networkProcessor) {
        list.innerHTML = '<span class="edit-theorems-empty"> Network not loaded </span>'
        return;
    }

    var classId = classData.id;
    var theorems = window.networkProcessor.getAllTheorems();
    var related = [];
    theorems.forEach(function (thm, idx) {
        if (thm.type === 'containment' && (thm.subset === classId || thm.superset === classId))
            related.push({ thm, idx });
        else if (thm.type === 'equality' && (thm.a === classId || thm.b === classId))
            related.push({ thm, idx });
    });

    if (related.length === 0) {
        list.innerHTML = '<span class="edit-theorems-empty"> No theorems for this class </span>';
        return;
    }

    related.forEach(function ({ thm, idx }) {
        var label = thm.type === 'containment' ? thm.subset + ' ⊆ ' + thm.superset : thm.a + ' = ' + thm.b;

        var row = document.createElement('div');
        row.className = 'edit-theorem-row';

        var labelSpan = document.createElement('span');
        labelSpan.className = 'edit-theorem-label';
        labelSpan.textContent = label;

        var btn = document.createElement('button');
        btn.className = 'edit-theorem-delete';
        btn.textContent = 'x';
        btn.title = 'Mark for deletion';
        btn.addEventListener('click', function () {
            if (pendingDeletedIndices.has(idx)) {
                pendingDeletedIndices.delete(idx);
                row.classList.remove('edit-theorem-row--deleted');
                btn.title = 'Mark for deletion';
            } else {
                pendingDeletedIndices.add(idx);
                row.classList.add('edit-theorem-row--deleted');
                btn.title = 'Undo';
            }
        });

        row.appendChild(labelSpan);
        row.appendChild(btn);
        list.appendChild(row);
    });
}

document.addEventListener('DOMContentLoaded', function () {

    // save button
    document.getElementById('edit-modal-save-btn').addEventListener('click', async function () {
        if (!currentEditClass) return;

        // Apply field updates
        currentEditClass.latex_name = document.getElementById('edit-latex-name').value.trim();
        currentEditClass.definition = document.getElementById('edit-definition').value;
        currentEditClass.information = document.getElementById('edit-information').value;
        var seeAlsoRaw = document.getElementById('edit-see-also').value.trim();
        currentEditClass.see_also = seeAlsoRaw ? seeAlsoRaw.split(/\s+/) : [];
        var refsRaw = document.getElementById('edit-references').value.trim();
        currentEditClass.references = refsRaw
            ? refsRaw.split('\n').filter(Boolean).map(function (line) {
                var sep = line.indexOf(' | ');
                return sep !== -1
                    ? [line.slice(0, sep).trim(), line.slice(sep + 3).trim()]
                    : [line.trim(), ''];
            })
            : [];

        // save deleted theorem objects before modifying the array
        var deletedTheorems = [];
        if (pendingDeletedIndices.size > 0 && window.networkProcessor) {
            var theorems = window.networkProcessor.getAllTheorems();
            pendingDeletedIndices.forEach(function (idx) {
                if (theorems[idx]) deletedTheorems.push(theorems[idx]);
            });
            pendingDeletedIndices.forEach(function (idx) {
                var thm = theorems[idx];
                if (!thm) return;
                if (thm.type === 'containment') {
                    var sub = window.networkProcessor.getClass(thm.subset);
                    var sup = window.networkProcessor.getClass(thm.superset);
                    if (sub) { sub.within.delete(thm.superset); sub.trim_within.delete(thm.superset); sub.relationships.delete(thm.superset); }
                    if (sup) { sup.contains.delete(thm.subset); sup.trim_contains.delete(thm.subset); sup.relationships.delete(thm.subset); }
                } else if (thm.type === 'equality') {
                    var ca = window.networkProcessor.getClass(thm.a);
                    var cb = window.networkProcessor.getClass(thm.b);
                    if (ca) ca.equals.delete(thm.b);
                    if (cb) cb.equals.delete(thm.a);
                }
                theorems[idx] = null;
            });
            var filtered = theorems.filter(Boolean);
            theorems.splice(0, theorems.length, ...filtered);
        }

        document.getElementById('edit-class-modal-overlay').style.display = 'none';
        if (typeof draw_graph === 'function') draw_graph();

        if (window.currentView === 'community') {
            await saveToCommunity(currentEditClass, deletedTheorems);
        }
    });

});

const LAMBDA_URL = 'https://587qw0cyhc.execute-api.us-east-1.amazonaws.com/save-edit';
const COMMUNITY_RAW = 'https://raw.githubusercontent.com/Complexitygarden/dataset/refs/heads/community/decision_complexity_classes';

async function saveToCommunity(editedClass, deletedTheorems) {
    try {
        // get current classes.json from community branch and update the edited class
        const classesFile = await fetch(`${COMMUNITY_RAW}/classes.json`).then(r => r.json());
        const entry = classesFile.class_list[editedClass.id];
        if (entry) {
            entry.latex_name = editedClass.latex_name;
            entry.definition = editedClass.definition;
            entry.information = editedClass.information;
            entry.see_also = editedClass.see_also;
            entry.references = editedClass.references;
        }
        await fetch(LAMBDA_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: 'decision_complexity_classes/classes.json',
                content: JSON.stringify(classesFile, null, 2),
                message: `Community edit: updated ${editedClass.id}`
            })
        });

        //update theorems.json too
        if (deletedTheorems.length > 0) {
            const theoremsFile = await fetch(`${COMMUNITY_RAW}/theorems.json`).then(r => r.json());
            theoremsFile.theorems = theoremsFile.theorems.filter(t => !deletedTheorems.some(d => theoremsMatch(t, d)));
            await fetch(LAMBDA_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filepath: 'decision_complexity_classes/theorems.json',
                    content: JSON.stringify(theoremsFile, null, 2),
                    message: `Community edit: removed theorems for ${editedClass.id}`
                })
            });
        }
    } catch (err) {
        console.error('Failed to save to community branch:', err);
    }
}

function theoremsMatch(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === 'containment') return a.subset === b.subset && a.superset === b.superset;
    if (a.type === 'equality') return (a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a);
    return false;
}