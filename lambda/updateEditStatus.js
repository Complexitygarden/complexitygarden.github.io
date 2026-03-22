const AWS = require('aws-sdk');
const https = require('https');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.EDIT_REQUESTS_TABLE || 'ComplexityGarden-EditRequests';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'YOUR_USERNAME/complexitygarden.github.io';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'PUT,OPTIONS'
    };
    
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Verify admin authorization
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'Unauthorized' })
            };
        }
        
        // Parse request body
        const body = JSON.parse(event.body);
        const { requestId, status, adminNote, reviewedBy } = body;
        
        if (!requestId || !status || !['approved', 'rejected'].includes(status)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Invalid request' })
            };
        }
        
        // Get the edit request from DynamoDB
        const getResult = await dynamodb.get({
            TableName: TABLE_NAME,
            Key: { id: requestId }
        }).promise();
        
        if (!getResult.Item) {
            return {
                statusCode: 404,
                headers,
                body: JSON.stringify({ message: 'Edit request not found' })
            };
        }
        
        const editRequest = getResult.Item;
        
        // Update status in DynamoDB
        await dynamodb.update({
            TableName: TABLE_NAME,
            Key: { id: requestId },
            UpdateExpression: 'SET #status = :status, adminNote = :adminNote, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': status,
                ':adminNote': adminNote || '',
                ':reviewedBy': reviewedBy,
                ':reviewedAt': new Date().toISOString()
            }
        }).promise();
        
        // If approved, update GitHub
        if (status === 'approved') {
            await updateGitHub(editRequest);
        }
        
        // TODO: Send notification to user
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: `Edit request ${status}`,
                requestId
            })
        };
        
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
            })
        };
    }
};

// Update classes.json in GitHub
async function updateGitHub(editRequest) {
    if (!GITHUB_TOKEN) {
        console.warn('GitHub token not configured, skipping GitHub update');
        return;
    }
    
    try {
        // Get current classes.json from GitHub
        const currentFile = await getGitHubFile('classes.json');
        const currentContent = JSON.parse(Buffer.from(currentFile.content, 'base64').toString());
        
        // Update the specific class
        if (currentContent.class_list[editRequest.classId]) {
            currentContent.class_list[editRequest.classId].description = editRequest.newDescription;
            currentContent.class_list[editRequest.classId].information = editRequest.newInformation;
        }
        
        // Commit back to GitHub
        const newContent = Buffer.from(JSON.stringify(currentContent, null, 4)).toString('base64');
        await updateGitHubFile('classes.json', newContent, currentFile.sha, 
            `Update ${editRequest.className}: ${editRequest.reason}`);
        
        console.log('Successfully updated GitHub');
        
    } catch (error) {
        console.error('Error updating GitHub:', error);
        throw error;
    }
}

function getGitHubFile(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/contents/${path}`,
            method: 'GET',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'ComplexityGarden-Lambda',
                'Accept': 'application/vnd.github.v3+json'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

function updateGitHubFile(path, content, sha, message) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            message,
            content,
            sha
        });
        
        const options = {
            hostname: 'api.github.com',
            path: `/repos/${GITHUB_REPO}/contents/${path}`,
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'User-Agent': 'ComplexityGarden-Lambda',
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 || res.statusCode === 201) {
                    resolve(JSON.parse(data));
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}
