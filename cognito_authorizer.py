import json
import jwt
from jwt import PyJWKClient
import os

# Cognito configuration - set these as environment variables in Lambda
COGNITO_REGION = os.environ.get('COGNITO_REGION', 'us-east-1')
COGNITO_USER_POOL_ID = os.environ.get('COGNITO_USER_POOL_ID')  # e.g., us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID = os.environ.get('COGNITO_APP_CLIENT_ID')  # Your app client ID

# JWK URL for token verification
JWK_URL = f'https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{COGNITO_USER_POOL_ID}/.well-known/jwks.json'

def lambda_handler(event, context):
    """
    Lambda Authorizer for API Gateway
    Validates Cognito JWT tokens from the Authorization header
    
    Event structure:
    {
        "type": "TOKEN",
        "authorizationToken": "Bearer <JWT_TOKEN>",
        "methodArn": "arn:aws:execute-api:..."
    }
    """
    print(f"Authorizer event: {json.dumps(event)}")
    
    # Extract token from Authorization header
    token = event.get('authorizationToken', '')
    if token.startswith('Bearer '):
        token = token[7:]  # Remove 'Bearer ' prefix
    
    method_arn = event['methodArn']
    
    try:
        # Verify token is not empty
        if not token:
            raise Exception('No token provided')
        
        # Get signing key from Cognito JWK endpoint
        jwks_client = PyJWKClient(JWK_URL)
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        
        # Decode and verify the JWT token
        decoded = jwt.decode(
            token,
            signing_key.key,
            algorithms=['RS256'],
            audience=COGNITO_APP_CLIENT_ID,
            options={
                'verify_exp': True,      # Verify expiration
                'verify_aud': True,      # Verify audience
                'verify_signature': True # Verify signature
            }
        )
        
        print(f"Token decoded successfully for user: {decoded.get('cognito:username')}")
        
        # Extract user information
        user_id = decoded['sub']
        username = decoded.get('cognito:username', '')
        email = decoded.get('email', '')
        
        # Generate and return authorization policy
        policy = generate_policy(user_id, 'Allow', method_arn, {
            'userId': user_id,
            'username': username,
            'email': email
        })
        
        print(f"Generated policy: {json.dumps(policy)}")
        return policy
        
    except jwt.ExpiredSignatureError:
        print("Token has expired")
        raise Exception('Unauthorized: Token expired')
    except jwt.InvalidAudienceError:
        print("Invalid token audience")
        raise Exception('Unauthorized: Invalid token audience')
    except jwt.InvalidTokenError as e:
        print(f"Invalid token: {str(e)}")
        raise Exception(f'Unauthorized: Invalid token - {str(e)}')
    except Exception as e:
        print(f"Authorization failed: {str(e)}")
        raise Exception(f'Unauthorized: {str(e)}')


def generate_policy(principal_id, effect, resource, context_data):
    """
    Generate IAM policy for API Gateway
    
    Args:
        principal_id: User identifier (sub from JWT)
        effect: 'Allow' or 'Deny'
        resource: Method ARN
        context_data: Additional context to pass to backend Lambda
    
    Returns:
        Authorization policy document
    """
    auth_response = {
        'principalId': principal_id
    }
    
    if effect and resource:
        # Create policy document
        policy_document = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'execute-api:Invoke',
                'Effect': effect,
                'Resource': resource
            }]
        }
        auth_response['policyDocument'] = policy_document
    
    # Add context to pass user info to backend Lambda functions
    # This will be available in event['requestContext']['authorizer']
    auth_response['context'] = {
        'userId': str(context_data.get('userId', '')),
        'username': str(context_data.get('username', '')),
        'email': str(context_data.get('email', ''))
    }
    
    return auth_response


# For local testing
if __name__ == '__main__':
    # Test event
    test_event = {
        'type': 'TOKEN',
        'authorizationToken': 'Bearer <YOUR_TEST_TOKEN>',
        'methodArn': 'arn:aws:execute-api:us-east-1:123456789012:abcdef123/dev/GET/menu'
    }
    
    # Set test environment variables
    os.environ['COGNITO_USER_POOL_ID'] = 'us-east-1_XXXXXXXXX'
    os.environ['COGNITO_APP_CLIENT_ID'] = 'xxxxxxxxxxxxxxxxxxxxxxxxxx'
    
    result = lambda_handler(test_event, None)
    print(json.dumps(result, indent=2))
