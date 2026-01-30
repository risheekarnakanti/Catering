# AWS Cognito Authentication Setup Guide

This guide walks you through adding AWS Cognito authentication to your catering application.

## Option 1: AWS Cognito (Recommended for Web Apps) ⭐

### Step 1: Create Cognito User Pool

1. **Go to AWS Console** → Cognito → Create User Pool
2. **Configure sign-in experience:**
   - Sign-in options: Username, Email
   - Password requirements: Set as per your needs
3. **Configure security:**
   - MFA: Optional (recommended for production)
   - User account recovery: Email
4. **Configure sign-up:**
   - Self-registration: Enable/Disable as needed
   - Attribute verification: Email
5. **Configure message delivery:**
   - Email provider: Amazon SES or Cognito defaults
6. **Integrate your app:**
   - App type: Public client
   - App client name: `catering-web-app`
   - Don't generate client secret (for web apps)
7. **Review and create**

### Step 2: Note Your Credentials

After creation, note these values:
```
User Pool ID: us-east-1_XXXXXXXXX
App Client ID: xxxxxxxxxxxxxxxxxxxxxxxxxx
Region: us-east-1
```

### Step 3: Update Configuration

Edit `js/auth.js` and replace:
```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_XXXXXXXXX', // Your User Pool ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Your App Client ID
    Region: 'us-east-1'
};
```

### Step 4: Create Test Users

In AWS Console → Cognito → Users → Create user:
- Username: `testadmin`
- Email: `admin@example.com`
- Password: Set temporary password
- Mark email as verified

### Step 5: Update Lambda Authorizer

Your Lambda function needs to validate Cognito JWT tokens. Create or update the authorizer:

```python
import json
import jwt
from jwt import PyJWKClient
import os

# Cognito configuration
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'us-east-1')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')

# JWK URL for token verification
JWK_URL = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json'

def lambda_handler(event, context):
    """
    Lambda Authorizer for API Gateway
    Validates Cognito JWT tokens
    """
    token = event['authorizationToken'].replace('Bearer ', '')
    method_arn = event['methodArn']
    
    try:
        # Get signing key from Cognito JWK
        jwks_client = PyJWKClient(JWK_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify token
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            options={'verify_exp': True}
        )
        
        # Extract user info
        user_id = decoded['sub']
        username = decoded.get('cognito:username', '')
        
        # Generate policy
        policy = generate_policy(user_id, 'Allow', method_arn, decoded)
        return policy
        
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError as e:
        raise Exception(f'Invalid token: {str(e)}')
    except Exception as e:
        raise Exception(f'Unauthorized: {str(e)}')


def generate_policy(principal_id, effect, resource, context_data):
    """Generate IAM policy for API Gateway"""
    auth_response = {
        'principalId': principal_id
    }
    
    if effect and resource:
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }]
        }
        auth_response['policyDocument'] = policy_document
    
    # Add user context to pass to Lambda functions
    auth_response['context'] = {
        'userId': context_data.get('sub', ''),
        'username': context_data.get('cognito:username', ''),
        'email': context_data.get('email', '')
    }
    
    return auth_response
```

### Step 6: Update API Gateway

1. **Go to API Gateway** → Your API → Authorizers
2. **Create new authorizer:**
   - Name: `CognitoAuthorizer`
   - Type: Cognito
   - Cognito User Pool: Select your pool
   - Token Source: `Authorization`
3. **Apply to routes:**
   - Go to each route (GET /menu, POST /orders, etc.)
   - Method Request → Authorization: Select `CognitoAuthorizer`
4. **Deploy API**

### Step 7: Update Your Lambda Functions

Access user info in your Lambda functions via the authorizer context:

```python
def lambda_handler(event, context):
    # Get user info from authorizer context
    user_id = event['requestContext']['authorizer']['userId']
    username = event['requestContext']['authorizer']['username']
    email = event['requestContext']['authorizer']['email']
    
    # Use in your logic
    print(f"Request from user: {username} ({email})")
    
    # Rest of your code...
```

### Step 8: Replace All fetch() Calls

Update all remaining `fetch()` calls in `js/app.js` to use `authenticatedFetch()`:

**Find and replace:**
- `fetch(` → `authenticatedFetch(`

This ensures all API calls include the JWT token.

### Step 9: Test

1. Open `login.html` in your browser
2. Login with your test credentials
3. You should be redirected to `index.html`
4. All API calls will now include authentication

---

## Option 2: IAM Users (Not Recommended for Web Apps)

⚠️ **Warning:** IAM users are for AWS service access, not web application users. Use Cognito instead.

If you still want to use IAM for programmatic access:

1. **Create IAM Users** in AWS Console
2. **Generate Access Keys** (Access Key ID + Secret)
3. **Use AWS SDK** with credentials:

```javascript
// Install: npm install aws-sdk
import AWS from 'aws-sdk';

AWS.config.update({
    accessKeyId: 'YOUR_ACCESS_KEY',
    secretAccessKey: 'YOUR_SECRET_KEY',
    region: 'us-east-1'
});

// Sign requests with SigV4
const request = new AWS.HttpRequest(endpoint, region);
request.method = 'POST';
request.headers['Content-Type'] = 'application/json';
// AWS SDK will automatically sign the request
```

**Issues with IAM for web apps:**
- ❌ Exposes AWS credentials in browser (security risk)
- ❌ No user management UI
- ❌ No password reset
- ❌ Not designed for end users
- ❌ Requires managing secrets client-side

---

## Quick Test Without AWS Setup

For local testing without AWS:

1. Comment out the `requireAuth()` call in `index.html`
2. Mock the authentication in `js/auth.js`:

```javascript
async function getIdToken() {
    return 'mock-token-for-testing';
}

async function requireAuth() {
    return true; // Skip auth check
}
```

3. Update Lambda to accept mock tokens (DEV ONLY)

---

## Security Best Practices

✅ **Do:**
- Use HTTPS in production
- Enable MFA for admin users
- Rotate secrets regularly
- Use Cognito User Pools for web users
- Implement token refresh logic
- Set appropriate token expiration (1 hour recommended)

❌ **Don't:**
- Store credentials in client-side code
- Use IAM users for web application authentication
- Disable token expiration
- Share user credentials

---

## Troubleshooting

**"User is not authenticated" error:**
- Check if User Pool ID and Client ID are correct
- Verify user exists in Cognito User Pool
- Check browser console for detailed errors

**Token expired:**
- Implement token refresh logic
- Check token expiration settings in Cognito

**CORS errors:**
- Ensure API Gateway has CORS enabled
- Check allowed origins in Lambda response headers

---

## Next Steps

1. ✅ Set up Cognito User Pool
2. ✅ Update configuration in `js/auth.js`
3. ✅ Create test users
4. ✅ Update Lambda authorizer
5. ✅ Configure API Gateway
6. ✅ Replace all fetch calls
7. ✅ Test login flow
8. 🔄 Implement password reset
9. 🔄 Add MFA (optional)
10. 🔄 Implement remember me functionality

For questions or issues, refer to:
- [AWS Cognito Documentation](https://docs.aws.amazon.com/cognito/)
- [Amazon Cognito Identity SDK for JavaScript](https://github.com/aws-amplify/amplify-js/tree/main/packages/amazon-cognito-identity-js)
