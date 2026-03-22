// Admin Dashboard JavaScript
const API_ENDPOINT = 'https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod';

let allEdits = [];
let currentFilter = 'pending';
let userToken = null;

// Check admin permissions (DISABLED for demo mode)
function checkAdminPermissions() {
    // Skip login check for demo mode
    const demoEmail = 'admin@complexitygarden.com';
    localStorage.setItem('userEmail', demoEmail);
    userToken = 'demo-admin-token';
    
    // Load edit requests directly
    loadEditRequests();
    
    // Original authentication code (disabled):
    /*
    getUserSession((err, data) => {
        if (err || !data) {
            window.location.href = 'login.html';
            return;
        }
        
        userToken = data.idToken;
        
        // TODO: Check if user is admin in Cognito groups
        // For now, allow access (you should add admin group check in production)
        loadEditRequests();
    });
    */
}

// Load edit requests
async function loadEditRequests() {
    try {
        // For demo, load from localStorage
        const edits = JSON.parse(localStorage.getItem('demoEdits') || '[]');
        allEdits = edits;
        
        updateStats();
        filterAndDisplayEdits();
        
    } catch (error) {
        console.error('Error loading edit requests:', error);
        document.getElementById('editRequests').innerHTML = 
            '<div class="no-requests">Error loading edit requests</div>';
    }
}

// Update statistics
function updateStats() {
    const pending = allEdits.filter(e => e.status === 'pending').length;
    const approved = allEdits.filter(e => e.status === 'approved').length;
    const rejected = allEdits.filter(e => e.status === 'rejected').length;
    
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statApproved').textContent = approved;
    document.getElementById('statRejected').textContent = rejected;
}

// Filter and display edits
function filterAndDisplayEdits() {
    const container = document.getElementById('editRequests');
    
    let filtered = allEdits;
    if (currentFilter !== 'all') {
        filtered = allEdits.filter(edit => edit.status === currentFilter);
    }
    
    if (filtered.length === 0) {
        container.innerHTML = `<div class="no-requests">No ${currentFilter} requests</div>`;
        return;
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    container.innerHTML = filtered.map(edit => createEditCard(edit)).join('');
}

// Create edit request card HTML
function createEditCard(edit) {
    const isPending = edit.status === 'pending';
    const adminActions = isPending ? `
        <div class="admin-actions">
            <input type="text" class="admin-note-input" placeholder="Add a note (optional)..." id="note-${edit.id}">
            <button class="btn-approve" onclick="approveEdit(${edit.id})">✓ Approve</button>
            <button class="btn-reject" onclick="rejectEdit(${edit.id})">✗ Reject</button>
        </div>
    ` : '';
    
    return `
        <div class="edit-request-card ${edit.status}">
            <div class="edit-header">
                <div>
                    <div class="edit-title">${edit.className}</div>
                    <span class="edit-status-badge ${edit.status}">${edit.status}</span>
                </div>
                <div class="edit-meta">
                    <div><strong>By:</strong> ${edit.submittedBy || 'Unknown'}</div>
                    <div><strong>Date:</strong> ${new Date(edit.timestamp).toLocaleString()}</div>
                </div>
            </div>
            
            <div class="edit-content">
                <div class="edit-section">
                    <h4>📝 Description Change</h4>
                    <div class="edit-section-content">
                        <strong>Current:</strong><br>
                        ${edit.currentDescription || '<em>None</em>'}<br><br>
                        <strong>Proposed:</strong><br>
                        <span class="diff">${edit.newDescription}</span>
                    </div>
                </div>
                
                <div class="edit-section">
                    <h4>ℹ️ Information Change</h4>
                    <div class="edit-section-content">
                        <strong>Current:</strong><br>
                        ${truncateHTML(edit.currentInformation, 100)}<br><br>
                        <strong>Proposed:</strong><br>
                        <span class="diff">${truncateHTML(edit.newInformation, 100)}</span>
                    </div>
                </div>
            </div>
            
            <div class="edit-section">
                <h4>💬 Reason for Edit</h4>
                <div class="edit-section-content">${edit.reason}</div>
            </div>
            
            ${edit.adminNote ? `
                <div class="edit-section" style="margin-top: 15px; background: #fff;">
                    <h4>🛡️ Admin Note</h4>
                    <div class="edit-section-content">${edit.adminNote}</div>
                </div>
            ` : ''}
            
            ${adminActions}
        </div>
    `;
}

// Truncate HTML content
function truncateHTML(html, maxLength) {
    if (!html) return '<em>None</em>';
    const text = html.replace(/<[^>]*>/g, '');
    if (text.length <= maxLength) return html;
    return text.substring(0, maxLength) + '...';
}

// Approve edit
async function approveEdit(editId) {
    const adminNote = document.getElementById(`note-${editId}`).value;
    
    if (!confirm('Are you sure you want to approve this edit? This will update the complexity class data.')) {
        return;
    }
    
    try {
        // Update in localStorage for demo
        const edits = JSON.parse(localStorage.getItem('demoEdits') || '[]');
        const editIndex = edits.findIndex(e => e.id === editId);
        
        if (editIndex !== -1) {
            edits[editIndex].status = 'approved';
            edits[editIndex].adminNote = adminNote;
            edits[editIndex].reviewedAt = new Date().toISOString();
            edits[editIndex].reviewedBy = localStorage.getItem('userEmail');
            
            localStorage.setItem('demoEdits', JSON.stringify(edits));
            
            // TODO: In production, this would:
            // 1. Call Lambda to update classes.json via GitHub API
            // 2. Update DynamoDB with approval
            // 3. Send notification to user
            
            alert('✅ Edit approved successfully!\n\nIn production, this would:\n1. Update classes.json via GitHub API\n2. Notify the contributor\n3. Deploy changes to website');
            
            loadEditRequests();
        }
        
    } catch (error) {
        alert('Error approving edit: ' + error.message);
    }
}

// Reject edit
async function rejectEdit(editId) {
    const adminNote = document.getElementById(`note-${editId}`).value;
    
    if (!adminNote) {
        alert('Please provide a reason for rejection in the note field.');
        return;
    }
    
    if (!confirm('Are you sure you want to reject this edit?')) {
        return;
    }
    
    try {
        // Update in localStorage for demo
        const edits = JSON.parse(localStorage.getItem('demoEdits') || '[]');
        const editIndex = edits.findIndex(e => e.id === editId);
        
        if (editIndex !== -1) {
            edits[editIndex].status = 'rejected';
            edits[editIndex].adminNote = adminNote;
            edits[editIndex].reviewedAt = new Date().toISOString();
            edits[editIndex].reviewedBy = localStorage.getItem('userEmail');
            
            localStorage.setItem('demoEdits', JSON.stringify(edits));
            
            alert('❌ Edit rejected. The contributor will be notified.');
            
            loadEditRequests();
        }
        
    } catch (error) {
        alert('Error rejecting edit: ' + error.message);
    }
}

// Filter tabs
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            filterAndDisplayEdits();
        });
    });
});

// Initialize
checkAdminPermissions();
