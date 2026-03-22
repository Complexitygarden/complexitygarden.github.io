# User Contribution System - Quick Start

This system allows users to login and propose edits to complexity class descriptions, which you can then approve or reject as an admin.

## 🚀 Quick Demo (No AWS Required)

Test the system locally without AWS setup:

1. Start the local server:
   ```powershell
   cd complexitygarden.github.io
   python -m http.server 8080
   ```

2. Open in browser: http://localhost:8080

3. Try these pages:
   - **Signup**: http://localhost:8080/signup.html (Demo mode - no real signup yet)
   - **Login**: http://localhost:8080/login.html (Demo mode)
   - **Edit Dashboard**: http://localhost:8080/edit-dashboard.html
   - **Admin Dashboard**: http://localhost:8080/admin-dashboard.html

4. In demo mode:
   - All data is stored in browser's localStorage
   - You can submit edit requests
   - You can approve/reject as admin
   - No real data is changed

## 📁 New Files Added

### Frontend Pages
- `login.html` - User login page
- `signup.html` - New user registration
- `edit-dashboard.html` - Where users propose edits
- `admin-dashboard.html` - Where admins approve/reject edits

### JavaScript
- `static/js/auth.js` - AWS Cognito authentication
- `static/js/edit-dashboard.js` - User edit interface logic
- `static/js/admin-dashboard.js` - Admin approval interface logic

### Backend (AWS Lambda)
- `lambda/submitEditRequest.js` - Submit new edit
- `lambda/getEditRequests.js` - List edit requests
- `lambda/updateEditStatus.js` - Approve/reject edits + update GitHub

### Documentation
- `AWS_SETUP_GUIDE.md` - Complete AWS setup instructions

## 🛠️ How It Works

### For Regular Users:
1. **Sign up** → Create account with AWS Cognito
2. **Login** → Get authenticated
3. **Search** → Find complexity class to edit
4. **Propose Edit** → Submit changes with reason
5. **Wait** → Admin reviews the change
6. **Get Notified** → Email when approved/rejected

### For Admins:
1. **Login** → Must be in "Admins" Cognito group
2. **Review** → See all pending edit requests
3. **Compare** → View current vs proposed changes
4. **Decide** → Approve or reject with note
5. **Auto-update** → On approval, GitHub updates automatically

### Architecture:
```
User Browser
    ↓
AWS Cognito (Login)
    ↓
API Gateway (Routes requests)
    ↓
Lambda Functions (Process requests)
    ↓
DynamoDB (Store edit requests)
    ↓
GitHub API (Update classes.json when approved)
```

## 🎯 To Make This Live

Follow the detailed instructions in **AWS_SETUP_GUIDE.md**

**Estimated Setup Time**: 45-60 minutes
**Monthly AWS Cost**: ~$0-5 (95% covered by free tier)

### Key Steps:
1. Create AWS Cognito User Pool
2. Create DynamoDB table
3. Deploy 3 Lambda functions
4. Configure API Gateway
5. Update frontend config files
6. Test and deploy

## 💡 Benefits

✅ **No manual GitHub edits** - Users can edit directly
✅ **Quality control** - You approve all changes
✅ **User tracking** - Know who submitted what
✅ **Audit trail** - All changes are logged
✅ **Email notifications** - Stay informed
✅ **Automatic deployment** - Approved edits go live instantly

## 🔐 Security Features

- ✅ AWS Cognito authentication
- ✅ Email verification required
- ✅ Admin-only approval system
- ✅ Rate limiting via API Gateway
- ✅ Audit logs in DynamoDB
- ✅ GitHub token stored securely

## 📊 Admin Dashboard Features

- View pending/approved/rejected edits
- See side-by-side comparison of changes
- Filter by status
- Add admin notes to decisions
- Statistics dashboard
- One-click approve/reject

## 🌟 User Dashboard Features

- Search all complexity classes
- View current descriptions
- Propose edits with reason
- Track status of submissions
- See admin feedback
- Edit history

## 🚦 Next Steps

### Option 1: Test Demo Mode (Now)
Just open the HTML files in your browser and explore the interface.

### Option 2: Full AWS Setup (Production)
Follow AWS_SETUP_GUIDE.md to make it fully functional.

### Option 3: Customize First
Modify the UI/UX in the HTML/CSS files before deploying.

## ❓ FAQ

**Q: Do users need AWS accounts?**
A: No, only you need an AWS account. Users just sign up with email.

**Q: Can I limit who can sign up?**
A: Yes, in Cognito you can set domain restrictions or require admin approval.

**Q: What if I want to review edits offline?**
A: You can configure SNS to email you each edit request, and approve later.

**Q: Can I bulk approve edits?**
A: Not currently, but you can add this feature by modifying the Lambda functions.

**Q: How do I make someone an admin?**
A: Add them to the "Admins" group in Cognito User Pool.

## 🎨 Customization Ideas

- Add reputation system for frequent contributors
- Implement edit suggestions (not just replacements)
- Add LaTeX preview for math formulas
- Enable commenting/discussion on edits
- Create leaderboard of top contributors
- Add tags/categories for edits

---

## Summary

You now have a complete user contribution system! Users can propose edits, you can review and approve them, and approved changes automatically update your website.

Start with demo mode to see how it works, then follow AWS_SETUP_GUIDE.md when ready to deploy.

🌳 Happy editing!
