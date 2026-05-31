// Community Changes Review Panel

const REVIEW_BASELINE_RAW = 'https://raw.githack.com/Complexitygarden/dataset/main/decision_complexity_classes';
const REVIEW_COMMUNITY_RAW = 'https://rawcdn.githack.com/Complexitygarden/dataset/refs/heads/community/decision_complexity_classes';
const REVIEW_LAMBDA_SAVE = 'https://587qw0cyhc.execute-api.us-east-1.amazonaws.com/save-edit';

const CLASS_DIFF_FIELDS = ['latex_name', 'definition', 'information', 'see_also', 'references'];

const FIELD_LABELS = {
    latex_name: 'LaTeX Name',
    definition: 'Definition',
    information: 'Useful Information',
    see_also: 'See Also',
    references: 'Links'
};

function fieldToDisplay(field, value) {
    if (field === 'see_also') {
        return Array.isArray(value) && value.length > 0 ? value.join(', ') : '(none)';
    }
    if (field === 'references') {
        if (!Array.isArray(value) || value.length === 0) return '(none)';
        return value.map(r => Array.isArray(r) ? r.join(' | ') : String(r)).join('\n');
    }
    return value ? String(value) : '(empty)';
}

function fieldsAreEqual(field, a, b) {
    return fieldToDisplay(field, a) === fieldToDisplay(field, b);
}

function theoremLabel(t) {
    if (t.type === 'containment') return `${t.subset} ⊆ ${t.superset}`;
    if (t.type === 'equality') return `${t.a} = ${t.b}`;
    return JSON.stringify(t);
}

function theoremsMatch(a, b) {
    if (a.type !== b.type) return false;
    if (a.type === 'containment') return a.subset === b.subset && a.superset === b.superset;
    if (a.type === 'equality') return (a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a);
    return false;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

async function openReviewModal() {
    const overlay = document.getElementById('review-modal-overlay');
    overlay.style.display = 'flex';

    const list = document.getElementById('review-changes-list');
    list.innerHTML = '<div class="review-loading"><div class="review-loading-spinner"></div><span>Loading changes...</span></div>';
    document.getElementById('review-change-count').textContent = '';

    try {
        const [mainClasses, communityClasses, mainTheorems, communityTheorems] = await Promise.all([
            fetch(`${REVIEW_BASELINE_RAW}/classes.json`).then(r => r.json()),
            fetch(`${REVIEW_COMMUNITY_RAW}/classes.json`).then(r => r.json()),
            fetch(`${REVIEW_BASELINE_RAW}/theorems.json`).then(r => r.json()),
            fetch(`${REVIEW_COMMUNITY_RAW}/theorems.json`).then(r => r.json())
        ]);

        renderDiffs(mainClasses, communityClasses, mainTheorems, communityTheorems);
    } catch (err) {
        list.innerHTML = `<div class="review-error">Failed to load data: ${escapeHtml(err.message)}</div>`;
        console.error('Review load error:', err);
    }
}

function renderDiffs(mainClasses, communityClasses, mainTheorems, communityTheorems) {
    const list = document.getElementById('review-changes-list');
    list.innerHTML = '';

    const mainList = mainClasses.class_list;
    const commList = communityClasses.class_list;
    const classDiffs = [];

    for (const id of Object.keys(commList)) {
        const mainEntry = mainList[id];
        const commEntry = commList[id];
        if (!mainEntry) {
            classDiffs.push({ id, type: 'added', mainEntry: null, commEntry });
        } else {
            const changedFields = CLASS_DIFF_FIELDS.filter(f => !fieldsAreEqual(f, mainEntry[f], commEntry[f]));
            if (changedFields.length > 0) {
                classDiffs.push({ id, type: 'modified', mainEntry, commEntry, changedFields });
            }
        }
    }

    for (const id of Object.keys(mainList)) {
        if (!commList[id]) {
            classDiffs.push({ id, type: 'removed', mainEntry: mainList[id], commEntry: null });
        }
    }

    const addedTheorems = communityTheorems.theorems.filter(
        ct => !mainTheorems.theorems.some(mt => theoremsMatch(ct, mt))
    );
    const removedTheorems = mainTheorems.theorems.filter(
        mt => !communityTheorems.theorems.some(ct => theoremsMatch(mt, ct))
    );

    const hasTheoremChanges = addedTheorems.length > 0 || removedTheorems.length > 0;
    const totalChanges = classDiffs.length + (hasTheoremChanges ? 1 : 0);

    const countEl = document.getElementById('review-change-count');
    if (totalChanges === 0) {
        countEl.textContent = 'No changes';
        countEl.className = 'review-change-count review-change-count--none';
    } else {
        countEl.textContent = `${totalChanges} change${totalChanges !== 1 ? 's' : ''}`;
        countEl.className = 'review-change-count review-change-count--has';
    }

    if (totalChanges === 0) {
        list.innerHTML = '<div class="review-empty"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg><p>Community and baseline are in sync.</p><p>No differences found.</p></div>';
        return;
    }

    classDiffs.forEach(diff => list.appendChild(buildClassCard(diff, mainClasses, communityClasses)));

    if (hasTheoremChanges) {
        list.appendChild(buildTheoremCard(addedTheorems, removedTheorems, mainTheorems, communityTheorems));
    }
}

function buildClassCard(diff, mainClasses, communityClasses) {
    const card = document.createElement('div');
    card.className = `review-card review-card--${diff.type}`;

    const header = document.createElement('div');
    header.className = 'review-card-header';

    const title = document.createElement('div');
    title.className = 'review-card-title';

    const idSpan = document.createElement('span');
    idSpan.className = 'review-class-id';
    idSpan.textContent = diff.id;
    title.appendChild(idSpan);

    const badge = document.createElement('span');
    badge.className = `review-badge review-badge--${diff.type}`;
    badge.textContent = diff.type.charAt(0).toUpperCase() + diff.type.slice(1);
    title.appendChild(badge);

    header.appendChild(title);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'review-card-body';

    if (diff.type === 'modified') {
        diff.changedFields.forEach(field => {
            body.appendChild(buildFieldDiff(field, diff.mainEntry[field], diff.commEntry[field]));
        });
    } else if (diff.type === 'added') {
        CLASS_DIFF_FIELDS.forEach(field => {
            const val = diff.commEntry[field];
            const display = fieldToDisplay(field, val);
            if (display !== '(none)' && display !== '(empty)') {
                body.appendChild(buildFieldNew(field, val));
            }
        });
    } else if (diff.type === 'removed') {
        const note = document.createElement('p');
        note.className = 'review-removed-note';
        note.textContent = 'This class exists in baseline but has been removed from the community branch.';
        body.appendChild(note);
    }

    card.appendChild(body);

    const actions = document.createElement('div');
    actions.className = 'review-card-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'review-btn review-btn--accept';
    acceptBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Accept';
    acceptBtn.onclick = () => handleAcceptClass(diff, card, mainClasses, communityClasses);

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'review-btn review-btn--reject';
    rejectBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Reject';
    rejectBtn.onclick = () => handleRejectClass(diff, card, mainClasses, communityClasses);

    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    card.appendChild(actions);

    return card;
}

function buildFieldDiff(field, oldVal, newVal) {
    const row = document.createElement('div');
    row.className = 'review-field-diff';

    const label = document.createElement('div');
    label.className = 'review-field-label';
    label.textContent = FIELD_LABELS[field] || field;
    row.appendChild(label);

    const cols = document.createElement('div');
    cols.className = 'review-field-cols';

    const oldCol = document.createElement('div');
    oldCol.className = 'review-field-col review-field-col--old';
    const oldHeader = document.createElement('span');
    oldHeader.className = 'review-col-header';
    oldHeader.textContent = 'Baseline';
    const oldContent = document.createElement('pre');
    oldContent.className = 'review-field-content';
    oldContent.textContent = fieldToDisplay(field, oldVal);
    oldCol.appendChild(oldHeader);
    oldCol.appendChild(oldContent);

    const newCol = document.createElement('div');
    newCol.className = 'review-field-col review-field-col--new';
    const newHeader = document.createElement('span');
    newHeader.className = 'review-col-header';
    newHeader.textContent = 'Community';
    const newContent = document.createElement('pre');
    newContent.className = 'review-field-content';
    newContent.textContent = fieldToDisplay(field, newVal);
    newCol.appendChild(newHeader);
    newCol.appendChild(newContent);

    cols.appendChild(oldCol);
    cols.appendChild(newCol);
    row.appendChild(cols);

    return row;
}

function buildFieldNew(field, val) {
    const row = document.createElement('div');
    row.className = 'review-field-diff';

    const label = document.createElement('div');
    label.className = 'review-field-label';
    label.textContent = FIELD_LABELS[field] || field;
    row.appendChild(label);

    const content = document.createElement('pre');
    content.className = 'review-field-content review-field-content--added';
    content.textContent = fieldToDisplay(field, val);
    row.appendChild(content);

    return row;
}

function buildTheoremCard(addedTheorems, removedTheorems, mainTheorems, communityTheorems) {
    const card = document.createElement('div');
    card.className = 'review-card review-card--theorem';

    const header = document.createElement('div');
    header.className = 'review-card-header';

    const title = document.createElement('div');
    title.className = 'review-card-title';

    const idSpan = document.createElement('span');
    idSpan.className = 'review-class-id';
    idSpan.textContent = 'Theorem Changes';
    title.appendChild(idSpan);

    const badge = document.createElement('span');
    badge.className = 'review-badge review-badge--modified';
    const total = addedTheorems.length + removedTheorems.length;
    badge.textContent = `${total} theorem${total !== 1 ? 's' : ''}`;
    title.appendChild(badge);

    header.appendChild(title);
    card.appendChild(header);

    const body = document.createElement('div');
    body.className = 'review-card-body';

    if (addedTheorems.length > 0) {
        const section = document.createElement('div');
        section.className = 'review-theorem-section';

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'review-theorem-section-title review-theorem-section-title--added';
        sectionTitle.textContent = `Added in community (${addedTheorems.length})`;
        section.appendChild(sectionTitle);

        addedTheorems.forEach(t => {
            section.appendChild(buildTheoremRow(t, 'added'));
        });
        body.appendChild(section);
    }

    if (removedTheorems.length > 0) {
        const section = document.createElement('div');
        section.className = 'review-theorem-section';

        const sectionTitle = document.createElement('div');
        sectionTitle.className = 'review-theorem-section-title review-theorem-section-title--removed';
        sectionTitle.textContent = `Removed from community (${removedTheorems.length})`;
        section.appendChild(sectionTitle);

        removedTheorems.forEach(t => {
            section.appendChild(buildTheoremRow(t, 'removed'));
        });
        body.appendChild(section);
    }

    card.appendChild(body);
    return card;
}

function buildTheoremRow(theorem, type) {
    const row = document.createElement('div');
    row.className = `review-theorem-row review-theorem-row--${type} review-theorem-row--actionable`;

    const label = document.createElement('span');
    label.className = 'review-theorem-label';
    label.textContent = theoremLabel(theorem);

    const actions = document.createElement('div');
    actions.className = 'review-theorem-row-actions';

    const acceptBtn = document.createElement('button');
    acceptBtn.className = 'review-btn-sm review-btn-sm--accept';
    acceptBtn.textContent = 'Accept';
    acceptBtn.onclick = () => handleAcceptSingleTheorem(theorem, type, row);

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'review-btn-sm review-btn-sm--reject';
    rejectBtn.textContent = 'Reject';
    rejectBtn.onclick = () => handleRejectSingleTheorem(theorem, type, row);

    actions.appendChild(acceptBtn);
    actions.appendChild(rejectBtn);
    row.appendChild(label);
    row.appendChild(actions);

    return row;
}

async function handleAcceptClass(diff, card, mainClasses, communityClasses) {
    setCardLoading(card, true);
    try {
        const [baselineClasses, commClasses] = await Promise.all([
            fetch(`${REVIEW_BASELINE_RAW}/classes.json`).then(r => r.json()),
            fetch(`${REVIEW_COMMUNITY_RAW}/classes.json`).then(r => r.json())
        ]);

        // Apply only this one class from community into the baseline
        if (diff.type === 'added') {
            baselineClasses.class_list[diff.id] = commClasses.class_list[diff.id];
        } else if (diff.type === 'removed') {
            delete baselineClasses.class_list[diff.id];
        } else {
            baselineClasses.class_list[diff.id] = commClasses.class_list[diff.id];
        }

        const response = await fetch(REVIEW_LAMBDA_SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: 'decision_complexity_classes/classes.json',
                content: JSON.stringify(baselineClasses, null, 2),
                message: `Approved community edit: ${diff.id}`,
                branch: 'main'
            })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        setCardStatus(card, 'accepted', 'Accepted — change promoted to baseline');
    } catch (err) {
        console.error('Accept failed:', err);
        setCardStatus(card, 'error', 'Failed to accept change.');
    }
}

async function handleRejectClass(diff, card, mainClasses, communityClasses) {
    if (!confirm(`Reject community changes for "${diff.id}"? This will revert it to the baseline version.`)) return;
    setCardLoading(card, true);
    try {
        const [commClasses, baselineClasses] = await Promise.all([
            fetch(`${REVIEW_COMMUNITY_RAW}/classes.json`).then(r => r.json()),
            fetch(`${REVIEW_BASELINE_RAW}/classes.json`).then(r => r.json())
        ]);

        if (diff.type === 'removed') {
            commClasses.class_list[diff.id] = JSON.parse(JSON.stringify(baselineClasses.class_list[diff.id]));
        } else if (diff.type === 'added') {
            delete commClasses.class_list[diff.id];
        } else {
            commClasses.class_list[diff.id] = JSON.parse(JSON.stringify(baselineClasses.class_list[diff.id]));
        }

        const response = await fetch(REVIEW_LAMBDA_SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: 'decision_complexity_classes/classes.json',
                content: JSON.stringify(commClasses, null, 2),
                message: `Rejected community edit: reverted ${diff.id} to baseline`
            })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        setCardStatus(card, 'rejected', 'Rejected — reverted to baseline');
    } catch (err) {
        console.error('Reject failed:', err);
        setCardStatus(card, 'error', 'Failed to reject change.');
    }
}

async function handleAcceptSingleTheorem(theorem, type, row) {
    setRowLoading(row, true);
    try {
        const commTheorems = await fetch(`${REVIEW_COMMUNITY_RAW}/theorems.json`).then(r => r.json());
        const label = theoremLabel(theorem);

        if (type === 'added') {
            // Promote: add just this one theorem to main
            const baselineTheorems = await fetch(`${REVIEW_BASELINE_RAW}/theorems.json`).then(r => r.json());
            baselineTheorems.theorems.push(theorem);
            const response = await fetch(REVIEW_LAMBDA_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filepath: 'decision_complexity_classes/theorems.json',
                    content: JSON.stringify(baselineTheorems, null, 2),
                    message: `Approved community theorem: ${label}`,
                    branch: 'main'
                })
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
        } else {
            // Removed from community — accept the deletion by removing from main too
            const baselineTheorems = await fetch(`${REVIEW_BASELINE_RAW}/theorems.json`).then(r => r.json());
            baselineTheorems.theorems = baselineTheorems.theorems.filter(t => !theoremsMatch(t, theorem));
            const response = await fetch(REVIEW_LAMBDA_SAVE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    filepath: 'decision_complexity_classes/theorems.json',
                    content: JSON.stringify(baselineTheorems, null, 2),
                    message: `Approved removal of theorem: ${label}`,
                    branch: 'main'
                })
            });
            if (!response.ok) throw new Error(`Server returned ${response.status}`);
        }

        setRowStatus(row, 'accepted');
    } catch (err) {
        console.error('Accept theorem failed:', err);
        setRowStatus(row, 'error', 'Failed to accept theorem change.');
    }
}

async function handleRejectSingleTheorem(theorem, type, row) {
    const label = theoremLabel(theorem);
    if (!confirm(`Reject this theorem change?\n"${label}"`)) return;
    setRowLoading(row, true);
    try {
        const commTheorems = await fetch(`${REVIEW_COMMUNITY_RAW}/theorems.json`).then(r => r.json());

        if (type === 'added') {
            // Reject: remove this theorem from community
            commTheorems.theorems = commTheorems.theorems.filter(t => !theoremsMatch(t, theorem));
        } else {
            // Removed from community — reject means add it back
            commTheorems.theorems.push(theorem);
        }

        const response = await fetch(REVIEW_LAMBDA_SAVE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filepath: 'decision_complexity_classes/theorems.json',
                content: JSON.stringify(commTheorems, null, 2),
                message: `Rejected theorem change: ${label}`
            })
        });
        if (!response.ok) throw new Error(`Server returned ${response.status}`);
        setRowStatus(row, 'rejected');
    } catch (err) {
        console.error('Reject theorem failed:', err);
        setRowStatus(row, 'error', 'Failed to reject theorem change.');
    }
}

function setCardLoading(card, loading) {
    card.querySelectorAll('.review-btn').forEach(btn => {
        btn.disabled = loading;
    });
    if (loading) {
        let indicator = card.querySelector('.review-action-indicator');
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'review-action-indicator';
            indicator.textContent = 'Saving…';
            card.querySelector('.review-card-actions').appendChild(indicator);
        }
    }
}

function setCardStatus(card, status, message) {
    const actions = card.querySelector('.review-card-actions');
    actions.innerHTML = '';

    const statusEl = document.createElement('div');
    statusEl.className = `review-card-status review-card-status--${status}`;
    statusEl.textContent = message || status;
    actions.appendChild(statusEl);

    if (status === 'accepted') {
        card.classList.add('review-card--done-accept');
    } else if (status === 'rejected') {
        card.classList.add('review-card--done-reject');
    } else {
        card.classList.add('review-card--error');
        // Re-enable buttons on error
        const retryNote = document.createElement('button');
        retryNote.className = 'review-btn review-btn--retry';
        retryNote.textContent = 'Dismiss';
        retryNote.onclick = () => {
            statusEl.remove();
            retryNote.remove();
            card.classList.remove('review-card--error');
            card.querySelectorAll('.review-btn').forEach(btn => { btn.disabled = false; actions.appendChild(btn); });
        };
        actions.appendChild(retryNote);
    }
}

function setRowLoading(row, loading) {
    row.querySelectorAll('.review-btn-sm').forEach(btn => { btn.disabled = loading; });
    if (loading) {
        const actions = row.querySelector('.review-theorem-row-actions');
        if (actions && !actions.querySelector('.review-action-indicator')) {
            const indicator = document.createElement('span');
            indicator.className = 'review-action-indicator';
            indicator.textContent = 'Saving…';
            actions.appendChild(indicator);
        }
    }
}

function setRowStatus(row, status, message) {
    const actions = row.querySelector('.review-theorem-row-actions');
    actions.innerHTML = '';

    const statusEl = document.createElement('span');
    statusEl.className = `review-theorem-status review-theorem-status--${status}`;
    statusEl.textContent = message || status;
    actions.appendChild(statusEl);

    if (status === 'accepted') {
        row.classList.add('review-theorem-row--done-accept');
    } else if (status === 'rejected') {
        row.classList.add('review-theorem-row--done-reject');
    } else {
        const dismissBtn = document.createElement('button');
        dismissBtn.className = 'review-btn-sm review-btn-sm--dismiss';
        dismissBtn.textContent = 'Dismiss';
        dismissBtn.onclick = () => {
            statusEl.remove();
            dismissBtn.remove();
            row.querySelectorAll('.review-btn-sm').forEach(btn => { btn.disabled = false; actions.appendChild(btn); });
        };
        actions.appendChild(dismissBtn);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const reviewLink = document.getElementById('review-changes-link');
    const reviewOverlay = document.getElementById('review-modal-overlay');
    const reviewClose = document.getElementById('review-modal-close');

    if (reviewLink) {
        reviewLink.addEventListener('click', function (e) {
            e.preventDefault();
            openReviewModal();
        });
    }

    if (reviewClose) {
        reviewClose.addEventListener('click', function () {
            reviewOverlay.style.display = 'none';
        });
    }

    if (reviewOverlay) {
        reviewOverlay.addEventListener('click', function (e) {
            if (e.target === reviewOverlay) {
                reviewOverlay.style.display = 'none';
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && reviewOverlay.style.display === 'flex') {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                reviewOverlay.style.display = 'none';
            }
        }, true);
    }
});
