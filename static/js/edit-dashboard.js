// Edit Dashboard JavaScript
// API Gateway endpoint - UPDATE THIS after AWS setup
const API_ENDPOINT = 'https://YOUR_API_ID.execute-api.YOUR_REGION.amazonaws.com/prod';

let classesData = {};
let currentEditClass = null;
let userToken = null;

// Load complexity classes
async function loadClasses() {
    try {
        const response = await fetch('classes.json');
        const data = await response.json();
        classesData = data.class_list;
        displayClasses(classesData);
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

// Display classes in grid
function displayClasses(classes) {
    const classList = document.getElementById('classList');
    classList.innerHTML = '';
    
    Object.keys(classes).forEach(key => {
        const classObj = classes[key];
        const card = document.createElement('div');
        card.className = 'class-card';
        card.innerHTML = `
            <div class="class-name">${classObj.latex_name || classObj.name}</div>
            <div class="class-description">${classObj.description || 'No description'}</div>
            <button class="btn-edit" onclick="openEditModal('${key}')">Propose Edit</button>
        `;
        classList.appendChild(card);
    });
}

// Search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('searchBox');
    if (searchBox) {
        searchBox.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filtered = {};
            
            Object.keys(classesData).forEach(key => {
                const classObj = classesData[key];
                if (key.toLowerCase().includes(searchTerm) ||
                    (classObj.name && classObj.name.toLowerCase().includes(searchTerm)) ||
                    (classObj.description && classObj.description.toLowerCase().includes(searchTerm))) {
                    filtered[key] = classObj;
                }
            });
            
            displayClasses(filtered);
        });
    }
});

// Open edit modal
function openEditModal(classId) {
    currentEditClass = classId;
    const classObj = classesData[classId];
    
    document.getElementById('modalClassName').textContent = classObj.name;
    document.getElementById('editClassId').value = classId;
    document.getElementById('currentDescription').innerHTML = classObj.description || '<em>No description</em>';
    document.getElementById('currentInformation').innerHTML = classObj.information || '<em>No information</em>';
    document.getElementById('newDescription').value = classObj.description || '';
    document.getElementById('newInformation').value = classObj.information || '';
    document.getElementById('editReason').value = '';
    
    document.getElementById('editModal').style.display = 'block';
}

// Close modal
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('editModal').style.display = 'none';
});

window.addEventListener('click', (e) => {
    const modal = document.getElementById('editModal');
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Submit edit request
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const classId = document.getElementById('editClassId').value;
    const newDescription = document.getElementById('newDescription').value;
    const newInformation = document.getElementById('newInformation').value;
    const editReason = document.getElementById('editReason').value;
    
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.style.display = 'none';
    
    try {
        // Get user token
        getUserSession((err, data) => {
            if (err || !data) {
                showStatusMessage('Please login to submit edits', 'error');
                return;
            }
            
            submitEdit(classId, newDescription, newInformation, editReason, data.idToken);
        });
        
    } catch (error) {
        showStatusMessage('Error submitting edit: ' + error.message, 'error');
    }
});

// Submit edit to API
async function submitEdit(classId, description, information, reason, token) {
    const statusMessage = document.getElementById('statusMessage');
    
    try {
        const response = await fetch(`${API_ENDPOINT}/edit-requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                classId: classId,
                className: classesData[classId].name,
                currentDescription: classesData[classId].description,
                currentInformation: classesData[classId].information,
                newDescription: description,
                newInformation: information,
                reason: reason,
                submittedBy: localStorage.getItem('userEmail'),
                timestamp: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            showStatusMessage('Edit request submitted successfully! It will be reviewed by admins.', 'success');
            setTimeout(() => {
                document.getElementById('editModal').style.display = 'none';
                loadMyEdits();
            }, 2000);
        } else {
            const error = await response.json();
            showStatusMessage('Error: ' + (error.message || 'Failed to submit'), 'error');
        }
    } catch (error) {
        // For demo purposes, simulate success if API is not set up
        console.log('API not configured yet. Simulating success...');
        showStatusMessage('✅ Edit request submitted! (Demo mode - configure AWS to enable real submissions)', 'success');
        
        // Store locally for demo
        const edits = JSON.parse(localStorage.getItem('demoEdits') || '[]');
        edits.push({
            id: Date.now(),
            classId,
            className: classesData[classId].name,
            newDescription: description,
            newInformation: information,
            reason,
            status: 'pending',
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('demoEdits', JSON.stringify(edits));
        
        setTimeout(() => {
            document.getElementById('editModal').style.display = 'none';
            loadMyEdits();
        }, 2000);
    }
}

// Load user's edit requests
async function loadMyEdits() {
    const myEditsDiv = document.getElementById('myEdits');
    
    try {
        // For demo, load from localStorage
        const edits = JSON.parse(localStorage.getItem('demoEdits') || '[]');
        
        if (edits.length === 0) {
            myEditsDiv.innerHTML = '<p style="color: #666;">No edit requests yet. Propose your first edit!</p>';
            return;
        }
        
        myEditsDiv.innerHTML = edits.map(edit => `
            <div class="edit-request ${edit.status}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong>${edit.className}</strong>
                    <span class="edit-status ${edit.status}">${edit.status}</span>
                </div>
                <div style="color: #666; font-size: 14px;">
                    <strong>New Description:</strong> ${edit.newDescription}<br>
                    <strong>Reason:</strong> ${edit.reason}<br>
                    <strong>Submitted:</strong> ${new Date(edit.timestamp).toLocaleString()}
                </div>
                ${edit.adminNote ? `<div style="margin-top: 10px; padding: 10px; background: #fff; border-radius: 4px;"><strong>Admin Note:</strong> ${edit.adminNote}</div>` : ''}
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading edits:', error);
        myEditsDiv.innerHTML = '<p style="color: #f44336;">Error loading edit requests</p>';
    }
}

// Show status message
function showStatusMessage(message, type) {
    const statusMessage = document.getElementById('statusMessage');
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';
}

// Check authentication (DISABLED for demo mode)
// Skip login check and go directly to dashboard
const demoEmail = 'demo@complexitygarden.com';
localStorage.setItem('userEmail', demoEmail);
document.getElementById('userEmail').textContent = demoEmail;
userToken = 'demo-token';

// Original authentication code (disabled):
/*
getUserSession((err, data) => {
    if (err || !data) {
        window.location.href = 'login.html';
        return;
    }
    
    userToken = data.idToken;
    const email = localStorage.getItem('userEmail');
    document.getElementById('userEmail').textContent = email || 'User';
});
*/

// Initialize
loadClasses();
loadMyEdits();
