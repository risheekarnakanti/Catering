// AWS Cognito Configuration
// Replace these with your actual Cognito User Pool details
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_pv2aDHSoF',
    ClientId: '41a85ebt6n0tjvuhguoni1o9iq',
    Region: 'us-east-1'
};

// Initialize Cognito User Pool
const poolData = {
    UserPoolId: COGNITO_CONFIG.UserPoolId,
    ClientId: COGNITO_CONFIG.ClientId
};

let userPool;
let cognitoUser;
let pendingNewPasswordUserAttributes = null;
let pendingNewPasswordUser = null;
let pendingNewPasswordRequiredAttributes = null;

// Initialize only if amazon-cognito-identity-js is loaded
if (typeof AmazonCognitoIdentity !== 'undefined') {
    userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

function isAuthenticated() {
    if (!userPool) return Promise.resolve(false);
    const currentUser = userPool.getCurrentUser();
    if (currentUser != null) {
        return new Promise((resolve) => {
            currentUser.getSession((err, session) => {
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

function getCurrentSession() {
    return new Promise((resolve, reject) => {
        const currentUser = userPool ? userPool.getCurrentUser() : null;
        if (currentUser != null) {
            currentUser.getSession((err, session) => {
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

async function getIdToken() {
    try {
        const session = await getCurrentSession();
        return session.getIdToken().getJwtToken();
    } catch (error) {
        console.error('Error getting token:', error);
        return null;
    }
}

function login(username, password) {
    return new Promise((resolve, reject) => {
        if (!userPool) {
            reject(new Error('Cognito SDK not loaded'));
            return;
        }

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
                // Cognito requires a new password on first login
                try {
                    // Remove read-only attributes
                    delete userAttributes.email_verified;
                    delete userAttributes.phone_number_verified;
                } catch (e) {
                    // ignore
                }
                pendingNewPasswordUserAttributes = userAttributes;
                pendingNewPasswordUser = cognitoUser;
                pendingNewPasswordRequiredAttributes = requiredAttributes || [];
                showNewPasswordScreen();
            }
        });
    });
}

function showNewPasswordScreen() {
    const loginForm = document.getElementById('login-form');
    const newPasswordForm = document.getElementById('new-password-form');
    const errorDiv = document.getElementById('error-message');
    const emailGroup = document.getElementById('new-password-email-group');
    const emailInput = document.getElementById('new-password-email');
    const phoneGroup = document.getElementById('new-password-phone-group');
    const phoneInput = document.getElementById('new-password-phone');
    if (errorDiv) {
        errorDiv.textContent = 'New password required. Please set a new password.';
    }
    if (loginForm) loginForm.classList.add('hidden');
    if (newPasswordForm) newPasswordForm.classList.remove('hidden');

    const requiresEmail = Array.isArray(pendingNewPasswordRequiredAttributes)
        && pendingNewPasswordRequiredAttributes.includes('email');
    if (emailGroup && emailInput) {
        if (requiresEmail) {
            emailGroup.classList.remove('hidden');
            emailInput.required = true;
        } else {
            emailGroup.classList.add('hidden');
            emailInput.required = false;
        }
    }

    const requiresPhone = Array.isArray(pendingNewPasswordRequiredAttributes)
        && pendingNewPasswordRequiredAttributes.includes('phone_number');
    if (phoneGroup && phoneInput) {
        if (requiresPhone) {
            phoneGroup.classList.remove('hidden');
            phoneInput.required = true;
        } else {
            phoneGroup.classList.add('hidden');
            phoneInput.required = false;
        }
    }
}

function setupNewPasswordForm() {
    const newPasswordForm = document.getElementById('new-password-form');
    if (!newPasswordForm || newPasswordForm.dataset.bound === 'true') return;

    newPasswordForm.dataset.bound = 'true';
    newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPasswordInput = document.getElementById('new-password');
        const confirmInput = document.getElementById('confirm-new-password');
        const emailInput = document.getElementById('new-password-email');
        const phoneInput = document.getElementById('new-password-phone');
        const errorDiv = document.getElementById('new-password-error');
        const submitBtn = newPasswordForm.querySelector('button[type="submit"]');

        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmInput ? confirmInput.value : '';

        if (!newPassword || !confirmPassword) {
            if (errorDiv) errorDiv.textContent = 'Please enter and confirm your new password.';
            return;
        }

        if (newPassword !== confirmPassword) {
            if (errorDiv) errorDiv.textContent = 'Passwords do not match.';
            return;
        }

        if (!pendingNewPasswordUser || !pendingNewPasswordUserAttributes) {
            if (errorDiv) errorDiv.textContent = 'No pending password challenge found. Please login again.';
            return;
        }

        const requiredAttrs = Array.isArray(pendingNewPasswordRequiredAttributes)
            ? pendingNewPasswordRequiredAttributes
            : [];

        const challengeAttributes = {};

        if (requiredAttrs.includes('email')) {
            const emailValue = emailInput ? emailInput.value.trim() : '';
            if (!emailValue) {
                if (errorDiv) errorDiv.textContent = 'Email is required.';
                return;
            }
            challengeAttributes.email = emailValue;
        }

        if (requiredAttrs.includes('phone_number')) {
            const phoneValue = phoneInput ? phoneInput.value.trim() : '';
            if (phoneValue) {
                challengeAttributes.phone_number = phoneValue;
            } else if (pendingNewPasswordUserAttributes && pendingNewPasswordUserAttributes.phone_number) {
                // Use existing phone number if present; avoid modifying it
                challengeAttributes.phone_number = pendingNewPasswordUserAttributes.phone_number;
            } else {
                if (errorDiv) errorDiv.textContent = 'Phone number is required (format: +1XXXXXXXXXX).';
                return;
            }
        }

        try {
            if (errorDiv) errorDiv.textContent = '';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';

            pendingNewPasswordUser.completeNewPasswordChallenge(
                newPassword,
                challengeAttributes,
                {
                    onSuccess: function(result) {
                        console.log('Password updated successfully');
                        window.location.href = 'index.html';
                    },
                    onFailure: function(err) {
                        console.error('Password update failed:', err);
                        if (errorDiv) errorDiv.textContent = err.message || 'Password update failed.';
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Set New Password';
                    }
                }
            );
        } catch (err) {
            if (errorDiv) errorDiv.textContent = err.message || 'Password update failed.';
            submitBtn.disabled = false;
            submitBtn.textContent = 'Set New Password';
        }
    });
}

function logout() {
    const currentUser = userPool ? userPool.getCurrentUser() : null;
    if (currentUser != null) {
        currentUser.signOut();
    }
    window.location.href = 'login.html';
}

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
        const submitBtn = document.querySelector('#login-form button[type="submit"]');

        try {
            errorDiv.textContent = '';
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing in...';
            await login(username, password);
            window.location.href = 'index.html';
        } catch (error) {
            errorDiv.textContent = error.message || 'Login failed. Please check your credentials.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    });
}

setupNewPasswordForm();

// Forgot password handler
if (document.getElementById('forgot-password-link')) {
    document.getElementById('forgot-password-link').addEventListener('click', (e) => {
        e.preventDefault();
        alert('Password reset functionality coming soon!\nContact your administrator for password reset.');
    });
}

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
