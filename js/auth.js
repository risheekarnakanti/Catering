// AWS Cognito Configuration
// TODO: Replace these with your actual Cognito User Pool details
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_XXXXXXXXX', // Your User Pool ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // Your App Client ID
    Region: 'us-east-1'
};

// Initialize Cognito User Pool
const poolData = {
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
};

let userPool;
let cognitoUser;

// Initialize only if amazon-cognito-identity-js is loaded
if (typeof AmazonCognitoIdentity !== 'undefined') {
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

// Check if user is already logged in
function isAuthenticated() {
    if (!userPool) return false;
    const cognitoUser = userPool.getCurrentUser();
    
    if (cognitoUser != null) {
        return new Promise((resolve) => {
            cognitoUser.getSession((err, session) => {
                if (err || !session.isValid()) {
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    }
    return Promise.resolve(false);
}

// Get current session and JWT token
function getCurrentSession() {
    return new Promise((resolve, reject) => {
        const cognitoUser = userPool.getCurrentUser();
        
        if (cognitoUser != null) {
            cognitoUser.getSession((err, session) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(session);
            });
        } else {
            reject(new Error('No user logged in'));
        }
    });
}

// Get ID Token for API calls
async function getIdToken() {
    try {
        const session = await getCurrentSession();
        return session.getIdToken().getJwtToken();
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

// Login function
function login(username, password) {
    return new Promise((resolve, reject) => {
        const authenticationData = {
            Username: username,
            Password: password,
        };
        
        const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
        
        const userData = {
            Username: username,
            Pool: userPool
        };
        
        cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
        
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function(result) {
                console.log('Login successful!');
                resolve(result);
            },
            onFailure: function(err) {
                console.error('Login failed:', err);
                reject(err);
            },
            newPasswordRequired: function(userAttributes, requiredAttributes) {
                // Handle new password required case
                reject(new Error('New password required'));
            }
        });
    });
}

// Logout function
function logout() {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.signOut();
    }
    window.location.href = 'login.html';
}

// Get current user info
async function getCurrentUserInfo() {
    try {
        const session = await getCurrentSession();
        const idToken = session.getIdToken();
        return {
            username: idToken.payload['cognito:username'],
            email: idToken.payload.email,
            sub: idToken.payload.sub
        };
    } catch (error) {
        console.error('Error getting user info:', error);
        return null;
    }
}

// Protect pages that require authentication
async function requireAuth() {
    const authenticated = await isAuthenticated();
    if (!authenticated) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// Login form handler
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('error-message');
        
        try {
            errorDiv.textContent = '';
            const result = await login(username, password);
            
            // Redirect to main app
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        }
    });
}

// Forgot password handler
if (document.getElementById('forgot-password-link')) {
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset functionality coming soon!\nContact your administrator for password reset.');
    });
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isAuthenticated,
        getCurrentSession,
        getIdToken,
        login,
        logout,
        getCurrentUserInfo,
        requireAuth
    };
}
