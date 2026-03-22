# AWS Setup Guide for Complexity Garden User Contributions

This guide will help you set up the complete AWS infrastructure for user authentication and content contributions with admin approval workflow.

## Architecture Overview

```
User Browser
    ↓
AWS Cognito (Authentication)
    ↓
API Gateway (REST API)
    ↓
Lambda Functions (Business Logic)
    ↓
DynamoDB (Edit Requests Storage)
    ↓
GitHub API (Update classes.json when approved)
```

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- GitHub Personal Access Token (for auto-updates)
- Access to your AWS Console at: https://console.aws.amazon.com/

---

## Step 1: Set Up AWS Cognito (User Authentication)

### 1.1 Create User Pool

1. Go to **AWS Cognito Console**: https://console.aws.amazon.com/cognito/
2. Click **Create user pool**
3. Configure as follows:

**Step 1: Configure sign-in experience**
- Sign-in options: ✅ Email
- Click **Next**

**Step 2: Configure security requirements**
- Password policy: Default (or customize)
- Multi-factor authentication: **Optional** (recommended for production)
- Click **Next**

**Step 3: Configure sign-up experience**
- Self-registration: ✅ **Enable**
- Attributes: 
  - Required: ✅ email, ✅ name
- Click **Next**

**Step 4: Configure message delivery**
- Email provider: **Send email with Cognito** (for testing)
  - For production, configure SES
- Click **Next**

**Step 5: Integrate your app**
- User pool name: `ComplexityGarden-Users`
- App client name: `ComplexityGarden-Web`
- Client secret: ❌ **Don't generate** (for web apps)
- Click **Next**

**Step 6: Review and create**
- Review settings and click **Create user pool**

### 1.2 Note Your Configuration

After creation, note these values (you'll need them later):

- **User Pool ID**: Found on the user pool overview page (e.g., `us-east-1_ABC123def`)
- **App Client ID**: Go to "App integration" tab → "App clients" (e.g., `1a2b3c4d5e6f7g8h9i0j`)
- **Region**: The AWS region you're using (e.g., `us-east-1`)

### 1.3 Create Admin Group

1. In your user pool, go to **Groups** tab
2. Click **Create group**
3. Group name: `Admins`
4. Description: `Administrators who can approve/reject edits`
5. Click **Create group**

### 1.4 Add Yourself as Admin

1. Go to **Users** tab
2. Click **Create user**
3. Enter your email and temporary password
4. After creation, click on the user
5. Click **Add user to group**
6. Select `Admins` group

---

## Step 2: Set Up DynamoDB (Data Storage)

### 2.1 Create Table

1. Go to **DynamoDB Console**: https://console.aws.amazon.com/dynamodb/
2. Click **Create table**
3. Configure:
   - Table name: `ComplexityGarden-EditRequests`
   - Partition key: `id` (String)
   - Table settings: **Default settings**
   - Enable **Time to Live (TTL)**: Yes
   - TTL attribute name: `ttl`
4. Click **Create table**

### 2.2 Note Your Table ARN

After creation, go to the table's **Overview** tab and note the **ARN** (Amazon Resource Name).

---

## Step 3: Set Up Lambda Functions

### 3.1 Create IAM Role for Lambda

1. Go to **IAM Console**: https://console.aws.amazon.com/iam/
2. Click **Roles** → **Create role**
3. Trusted entity type: **AWS service**
4. Use case: **Lambda**
5. Click **Next**
6. Attach policies:
   - ✅ `AWSLambdaBasicExecutionRole`
   - ✅ `AmazonDynamoDBFullAccess`
7. Click **Next**
8. Role name: `ComplexityGarden-LambdaRole`
9. Click **Create role**

### 3.2 Create Lambda Functions

For **each** of the three functions, follow these steps:

#### Function 1: submitEditRequest

1. Go to **Lambda Console**: https://console.aws.amazon.com/lambda/
2. Click **Create function**
3. Function name: `ComplexityGarden-SubmitEdit`
4. Runtime: **Node.js 18.x**
5. Execution role: Use existing → `ComplexityGarden-LambdaRole`
6. Click **Create function**
7. In the code editor, paste the code from `lambda/submitEditRequest.js`
8. Add environment variable:
   - Key: `EDIT_REQUESTS_TABLE`
   - Value: `ComplexityGarden-EditRequests`
9. Click **Deploy**

#### Function 2: getEditRequests

Repeat the same process:
- Function name: `ComplexityGarden-GetEdits`
- Code from: `lambda/getEditRequests.js`
- Environment variable: Same as above

#### Function 3: updateEditStatus

Repeat the same process:
- Function name: `ComplexityGarden-UpdateEditStatus`
- Code from: `lambda/updateEditStatus.js`
- Environment variables:
  - `EDIT_REQUESTS_TABLE`: `ComplexityGarden-EditRequests`
  - `GITHUB_TOKEN`: Your GitHub Personal Access Token (see Step 4)
  - `GITHUB_REPO`: `YOUR_USERNAME/complexitygarden.github.io`

---

## Step 4: Get GitHub Personal Access Token

1. Go to GitHub: https://github.com/settings/tokens
2. Click **Generate new token (classic)**
3. Note: `ComplexityGarden-Lambda`
4. Scopes: ✅ `repo` (full control of private repositories)
5. Click **Generate token**
6. **COPY THE TOKEN** (you won't see it again!)
7. Add this to the `updateEditStatus` Lambda environment variables

---

## Step 5: Set Up API Gateway

### 5.1 Create REST API

1. Go to **API Gateway Console**: https://console.aws.amazon.com/apigateway/
2. Click **Create API**
3. Choose **REST API** (not private)
4. Click **Build**
5. API name: `ComplexityGarden-API`
6. Click **Create API**

### 5.2 Enable CORS (Important!)

1. Select the root resource `/`
2. Click **Actions** → **Enable CORS**
3. Check all methods
4. Click **Enable CORS and replace existing CORS headers**

### 5.3 Create Resources and Methods

#### Resource 1: /edit-requests (POST)

1. Click **Actions** → **Create Resource**
2. Resource Name: `edit-requests`
3. Click **Create Resource**
4. Select `/edit-requests` resource
5. Click **Actions** → **Create Method** → **POST**
6. Integration type: **Lambda Function**
7. Lambda Region: Your region
8. Lambda Function: `ComplexityGarden-SubmitEdit`
9. Click **Save** and **OK** to grant permissions

#### Resource 2: /edit-requests (GET)

1. Select `/edit-requests` resource
2. Click **Actions** → **Create Method** → **GET**
3. Integration type: **Lambda Function**
4. Lambda Function: `ComplexityGarden-GetEdits`
5. Click **Save**

#### Resource 3: /edit-requests/{id} (PUT)

1. Select `/edit-requests` resource
2. Click **Actions** → **Create Resource**
3. Resource Name: `{id}`
4. Click **Create Resource**
5. Select `/edit-requests/{id}` resource
6. Click **Actions** → **Create Method** → **PUT**
7. Integration type: **Lambda Function**
8. Lambda Function: `ComplexityGarden-UpdateEditStatus`
9. Click **Save**

### 5.4 Enable CORS for Each Method

For **each method** (POST, GET, PUT):
1. Click on the method
2. Click **Actions** → **Enable CORS**
3. Click **Enable CORS and replace existing CORS headers**

### 5.5 Deploy API

1. Click **Actions** → **Deploy API**
2. Deployment stage: **[New Stage]**
3. Stage name: `prod`
4. Click **Deploy**

### 5.6 Note Your API Endpoint

After deployment, you'll see an **Invoke URL** like:
```
https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

**Save this URL!** You need it in the next step.

---

## Step 6: Configure Frontend

### 6.1 Update auth.js

Open `static/js/auth.js` and update:

```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_ABC123def',     // Your User Pool ID
    ClientId: '1a2b3c4d5e6f7g8h9i0j',      // Your App Client ID
    Region: 'us-east-1'                     // Your AWS Region
};
```

### 6.2 Update edit-dashboard.js

Open `static/js/edit-dashboard.js` and update:

```javascript
const API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod';
```

### 6.3 Update admin-dashboard.js

Open `static/js/admin-dashboard.js` and update:

```javascript
const API_ENDPOINT = 'https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod';
```

---

## Step 7: Test the System

### 7.1 Test User Registration

1. Open your website locally: http://localhost:8080
2. Navigate to `/signup.html`
3. Create a test account
4. Check your email for verification code
5. Verify your email

### 7.2 Test Login

1. Navigate to `/login.html`
2. Login with your credentials
3. You should be redirected to `/edit-dashboard.html`

### 7.3 Test Submitting an Edit

1. On the edit dashboard, search for a complexity class (e.g., "PSPACE")
2. Click **Propose Edit**
3. Make changes to description/information
4. Add a reason
5. Click **Submit for Review**
6. Check DynamoDB table to verify the edit was saved

### 7.4 Test Admin Approval

1. Add your user to the `Admins` group in Cognito (see Step 1.4)
2. Navigate to `/admin-dashboard.html`
3. You should see the pending edit request
4. Click **Approve**
5. The edit should update in DynamoDB
6. If GitHub integration is set up, `classes.json` should be updated automatically

---

## Step 8: Deploy to GitHub Pages

### 8.1 Commit Changes

```bash
git add .
git commit -m "Add user authentication and contribution system"
git push origin main
```

### 8.2 Verify Deployment

1. Wait for GitHub Pages to deploy (usually 1-2 minutes)
2. Visit your live site
3. Test the complete workflow

---

## Cost Estimates

For a small website with moderate traffic:

- **Cognito**: Free tier covers 50,000 MAU (Monthly Active Users)
- **Lambda**: Free tier covers 1M requests/month
- **DynamoDB**: Free tier covers 25GB storage + 200M requests/month
- **API Gateway**: Free tier covers 1M requests/month for first 12 months

**Estimated monthly cost after free tier**: ~$1-5 for small traffic

---

## Security Best Practices

### 1. Use Environment Variables
Never hardcode sensitive values in Lambda. Use environment variables or AWS Secrets Manager.

### 2. Implement Rate Limiting
Add rate limiting to API Gateway to prevent abuse:
1. Go to your API in API Gateway
2. Click **Usage Plans**
3. Create a usage plan with rate and burst limits

### 3. Enable CloudWatch Logging
For each Lambda function:
1. Go to **Configuration** → **Monitoring**
2. Enable **CloudWatch Logs**

### 4. Set Up SNS Notifications
Create SNS topic to notify admins of new edit requests:
1. Go to **SNS Console**
2. Create topic: `ComplexityGarden-Notifications`
3. Subscribe with your email
4. Update Lambda to publish to this topic

### 5. Regular Backups
Enable point-in-time recovery for DynamoDB:
1. Go to your DynamoDB table
2. **Backups** tab → **Enable** point-in-time recovery

---

## Troubleshooting

### Issue: "CORS error" in browser console
**Solution**: 
- Ensure CORS is enabled on all API Gateway methods
- Check response headers include `Access-Control-Allow-Origin: *`

### Issue: "Unauthorized" when submitting edits
**Solution**:
- Verify Cognito configuration in `auth.js`
- Check Lambda has permission to verify JWT tokens
- Ensure Authorization header is being sent

### Issue: Lambda timeout
**Solution**:
- Increase Lambda timeout: Configuration → General → Timeout → 30 seconds
- Check CloudWatch Logs for specific errors

### Issue: GitHub API not updating
**Solution**:
- Verify GitHub token has `repo` permissions
- Check token hasn't expired
- Verify repository name is correct in environment variable

---

## Advanced Features (Optional)

### Email Notifications
Set up SES to send notification emails when:
- User submits an edit
- Admin approves/rejects an edit

### Search and Filtering
Add DynamoDB Global Secondary Indexes for better querying:
- Index by `status`
- Index by `submittedBy`
- Index by `timestamp`

### Audit Trail
Log all admin actions:
- Create CloudTrail for API Gateway
- Store admin decisions in separate DynamoDB table

### Automatic Content Validation
Add Lambda layer to validate:
- Description length
- Information formatting
- References validity
- LaTeX syntax checking

---

## Support and Monitoring

### View your AWS Resources:
- **Cognito users**: https://console.aws.amazon.com/cognito/
- **DynamoDB data**: https://console.aws.amazon.com/dynamodb/
- **Lambda logs**: https://console.aws.amazon.com/cloudwatch/
- **API Gateway metrics**: https://console.aws.amazon.com/apigateway/

### Monitor Usage:
Check your visitor analytics at: https://603858357349.signin.aws.amazon.com/console

---

## Next Steps

1. ✅ Set up AWS Cognito
2. ✅ Create DynamoDB table
3. ✅ Deploy Lambda functions
4. ✅ Configure API Gateway
5. ✅ Update frontend configuration
6. ✅ Test locally
7. ✅ Deploy to production
8. 🎉 Users can now contribute!

---

## Questions or Issues?

- Check CloudWatch Logs for detailed error messages
- Review IAM permissions if getting access denied errors
- Ensure all resource names match exactly
- Test each component individually before integrating

Good luck! 🌳
