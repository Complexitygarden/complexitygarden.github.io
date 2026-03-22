const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.EDIT_REQUESTS_TABLE || 'ComplexityGarden-EditRequests';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
    }
    
    try {
        // Verify JWT token from Cognito
        const authHeader = event.headers.Authorization || event.headers.authorization;
        if (!authHeader) {
            return {
                statusCode: 401,
                headers,
                body: JSON.stringify({ message: 'No authorization token provided' })
            };
        }
        
        // Parse request body
        const body = JSON.parse(event.body);
        const {
            classId,
            className,
            currentDescription,
            currentInformation,
            newDescription,
            newInformation,
            reason,
            submittedBy
        } = body;
        
        // Validate required fields
        if (!classId || !newDescription || !newInformation || !reason) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ message: 'Missing required fields' })
            };
        }
        
        // Create edit request item
        const editRequest = {
            id: `edit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            classId,
            className,
            currentDescription,
            currentInformation,
            newDescription,
            newInformation,
            reason,
            submittedBy,
            status: 'pending',
            timestamp: new Date().toISOString(),
            ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60) // 90 days TTL
        };
        
        // Save to DynamoDB
        await dynamodb.put({
            TableName: TABLE_NAME,
            Item: editRequest
        }).promise();
        
        console.log('Edit request saved:', editRequest.id);
        
        // TODO: Send SNS notification to admins
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                message: 'Edit request submitted successfully',
                requestId: editRequest.id
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
