const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.EDIT_REQUESTS_TABLE || 'ComplexityGarden-EditRequests';

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
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
                body: JSON.stringify({ message: 'No authorization token provided' })
            };
        }
        
        // TODO: Verify user is in admin group via Cognito
        
        // Get query parameters
        const status = event.queryStringParameters?.status || 'all';
        
        let params = {
            TableName: TABLE_NAME
        };
        
        // Add filter if status specified
        if (status !== 'all') {
            params.FilterExpression = '#status = :status';
            params.ExpressionAttributeNames = {
                '#status': 'status'
            };
            params.ExpressionAttributeValues = {
                ':status': status
            };
        }
        
        // Scan DynamoDB for edit requests
        const result = await dynamodb.scan(params).promise();
        
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                editRequests: result.Items,
                count: result.Count
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
