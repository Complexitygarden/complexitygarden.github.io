# AWS Lambda Functions for Complexity Garden

This directory contains AWS Lambda functions for handling user authentication and edit requests.

## Functions

### 1. submitEditRequest
Handles POST requests to submit new edit requests

### 2. getEditRequests
Handles GET requests to retrieve edit requests (admin only)

### 3. updateEditStatus
Handles PUT requests to approve/reject edit requests (admin only)

### 4. applyApprovedEdit
Handles the GitHub API integration to update classes.json when edits are approved

## Setup Instructions

See the main AWS_SETUP_GUIDE.md for deployment instructions.
