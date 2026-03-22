// ============================================
// AUTH SYSTEM (localStorage-based)
// ============================================
// Replaces old AWS Cognito auth. Uses localStorage.
// Keys: cg_users, cg_session
// ============================================

// Initialize demo user if not exists
(function initDemoUsers() {
    const users = JSON.parse(localStorage.getItem('cg_users') || '[]');
    if (!users.some(u => u.email === 'demo@complexitygarden.com')) {
        users.push({
            email: 'demo@complexitygarden.com',
            password: 'demo123',
            name: 'Demo User',
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('cg_users', JSON.stringify(users));
    }
})();

// Check if user is logged in
function isLoggedIn() {
    const session = JSON.parse(localStorage.getItem('cg_session') || 'null');
    return session && session.loggedIn;
}

// Get current session
function getSession() {
    return JSON.parse(localStorage.getItem('cg_session') || 'null');
}

// Logout
function logout() {
    localStorage.removeItem('cg_session');
    window.location.href = 'login.html';
}

// Inject dropdown styles once
function injectDropdownStyles() {
    if (document.getElementById('cg-auth-dropdown-style')) return;
    const style = document.createElement('style');
    style.id = 'cg-auth-dropdown-style';
    style.textContent = `
        .cg-user-dropdown { position: relative; display: inline-block; }
        .cg-user-btn {
            color: #fff; padding: 7px 18px;
            background: rgba(76,175,80,0.25);
            border: 1.5px solid rgba(76,175,80,0.8);
            border-radius: 20px; font-size: 13px;
            font-weight: 500; letter-spacing: 0.3px;
            white-space: nowrap; cursor: pointer;
            font-family: inherit;
        }
        .cg-user-btn:hover { background: rgba(76,175,80,0.4); }
        .cg-dropdown-menu {
            display: none; position: absolute;
            right: 0; top: calc(100% + 6px);
            background: #fff; border-radius: 10px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.18);
            min-width: 170px; z-index: 9999;
            overflow: hidden;
            border: 1px solid #e5e7eb;
        }
        .cg-dropdown-menu.open { display: block; }
        .cg-dropdown-item {
            display: block; width: 100%;
            padding: 11px 18px; font-size: 13px;
            color: #1f2937; text-decoration: none;
            background: none; border: none;
            text-align: left; cursor: pointer;
            font-family: inherit; white-space: nowrap;
        }
        .cg-dropdown-item:hover { background: #f3f4f6; }
        .cg-dropdown-item.danger { color: #b91c1c; }
        .cg-dropdown-item.danger:hover { background: #fee2e2; }
        .cg-dropdown-divider { height: 1px; background: #e5e7eb; margin: 4px 0; }
    `;
    document.head.appendChild(style);
}

// Update UI based on auth state (for pages like index.html)
function updateAuthUI() {
    const authButton = document.getElementById('authButton');
    if (!authButton) return;

    if (isLoggedIn()) {
        injectDropdownStyles();
        const session = getSession();
        const name = session && session.name ? session.name.split(' ')[0] : 'Account';
        const email = session ? session.email : '';

        authButton.innerHTML = `
            <div class="cg-user-dropdown" id="cgUserDropdown">
                <button class="cg-user-btn" id="cgUserBtn">👤 ${name} ▾</button>
                <div class="cg-dropdown-menu" id="cgDropdownMenu">
                    <div style="padding:10px 18px 6px;font-size:12px;color:#6b7280;">${email}</div>
                    <div class="cg-dropdown-divider"></div>
                    <button class="cg-dropdown-item danger" onclick="logout()">🚪 Logout</button>
                </div>
            </div>`;

        // Toggle on button click
        document.getElementById('cgUserBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            document.getElementById('cgDropdownMenu').classList.toggle('open');
        });
        // Close when clicking outside
        document.addEventListener('click', function closeDropdown() {
            const menu = document.getElementById('cgDropdownMenu');
            if (menu) menu.classList.remove('open');
        });
    } else {
        authButton.innerHTML = '<a href="login.html" style="color:#fff;text-decoration:none;padding:7px 18px;background:transparent;border:1.5px solid rgba(255,255,255,0.7);border-radius:20px;font-size:13px;font-weight:500;letter-spacing:0.3px;white-space:nowrap;">Sign in</a>';
    }
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
