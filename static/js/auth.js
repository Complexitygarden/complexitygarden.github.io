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

// Update UI based on auth state (for pages like index.html)
function updateAuthUI() {
    const sidebarAuthButton = document.getElementById('sidebarAuthButton');
    if (!sidebarAuthButton) return;

    if (isLoggedIn()) {
        const session = getSession();
        const name = session && session.name ? session.name.split(' ')[0] : 'Account';
        const email = session ? session.email : '';

        sidebarAuthButton.innerHTML = `
            <div class="settings-header" id="cgSidebarUserBtn">
                <span>&#128100; ${name}</span>
                <span class="toggle-indicator"></span>
            </div>
            <ul style="display: none;" id="cgSidebarDropdown">
                <li class="leftSidebarMenuInner_sub_li">
                    <div class="settings-item">
                        <span style="text-transform:none; font-size:12px; opacity:0.7;">${email}</span>
                    </div>
                </li>
                <li class="leftSidebarMenuInner_sub_li">
                    <div class="settings-item">
                        <button onclick="logout()" class="settings-button">Log Out</button>
                    </div>
                </li>
            </ul>`;

        document.getElementById('cgSidebarUserBtn').addEventListener('click', function() {
            const $submenu = $(this).next('ul');
            if ($submenu.is(':animated')) return;
            sidebarAuthButton.classList.toggle('open');
            $submenu.slideToggle('fast');
        });

        sidebarAuthButton.addEventListener('click', function(e) {
            if (e.target.closest('#cgSidebarDropdown')) e.stopPropagation();
        });
    } else {
        sidebarAuthButton.innerHTML = '<a href="login.html">Sign In</a>';
    }
}

// Run on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});
