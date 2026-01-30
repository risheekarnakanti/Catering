# 🔐 Authentication Implementation - Quick Reference

## ✅ What's Been Added

### New Files Created
1. **[login.html](login.html)** - Login page with username/password form
2. **[js/auth.js](js/auth.js)** - Authentication logic using AWS Cognito
3. **[cognito_authorizer.py](cognito_authorizer.py)** - Lambda authorizer for API Gateway
4. **[AUTH_SETUP.md](AUTH_SETUP.md)** - Complete setup guide
5. **[update-auth.sh](update-auth.sh)** - Script to update remaining fetch calls

### Modified Files
1. **[index.html](index.html)** - Added auth check & logout button
2. **[orders.html](orders.html)** - Added auth check
3. **[admin.html](admin.html)** - Added auth check
4. **[js/app.js](js/app.js)** - Added `authenticatedFetch()` helper

---

## 🚀 Quick Setup (5 Steps)

### 1️⃣ Create Cognito User Pool
```bash
# In AWS Console:
Services → Cognito → Create User Pool
# Follow wizard, note the User Pool ID and App Client ID
```

### 2️⃣ Update Configuration
Edit **[js/auth.js](js/auth.js)** line 2-6:
```javascript
const COGNITO_CONFIG = {
    UserPoolId: 'us-east-1_XXXXXXXXX',     // ← Your User Pool ID
    ClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // ← Your App Client ID
    Region: 'us-east-1'
};
```

### 3️⃣ Create Test User
```bash
# In AWS Console:
Cognito → Your Pool → Users → Create user
Username: admin
Email: admin@example.com
Password: YourPassword123!
```

### 4️⃣ Deploy Lambda Authorizer
```bash
# Create new Lambda function with cognito_authorizer.py
# Set environment variables:
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_APP_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
COGNITO_REGION=us-east-1

# Install dependencies:
pip install pyjwt cryptography -t .
```

### 5️⃣ Configure API Gateway
```bash
# In API Gateway Console:
1. Create Authorizer → Cognito
2. Select your User Pool
3. Token Source: Authorization
4. Apply to all routes
5. Deploy API
```

---

## 🧪 Testing Locally

### Without AWS Setup (Mock Mode)
Edit **[js/auth.js](js/auth.js)**, add after line 15:
```javascript
// MOCK MODE - For testing without Cognito
async function getIdToken() {
    return 'mock-token';
}
async function requireAuth() {
    console.log('⚠️ Running in MOCK mode - no real auth');
    return true;
}
```

### With Python Server
```bash
cd /Users/risheek/Desktop/All/Catering
python3 -m http.server 8000
# Open: http://localhost:8000/login.html
```

### With Live Server (VS Code)
Right-click **[login.html](login.html)** → Open with Live Server

---

## 🔄 Update Remaining API Calls

Run the update script:
```bash
cd /Users/risheek/Desktop/All/Catering
chmod +x update-auth.sh
./update-auth.sh
```

Or manually replace in **[js/app.js](js/app.js)**:
- Find: `fetch(`
- Replace: `authenticatedFetch(`

---

## 📋 Authentication Flow

```
┌─────────────┐
│ User visits │
│  any page   │
└──────┬──────┘
       │
       ▼
┌──────────────┐      No      ┌─────────────┐
│ Authenticated?├─────────────►│ Redirect to │
└──────┬───────┘               │ login.html  │
       │ Yes                   └──────┬──────┘
       ▼                              │
┌──────────────┐                      │
│ Show content │                      │
│ Add logout   │◄─────────────────────┘
└──────┬───────┘         Login Success
       │
       ▼
┌──────────────────┐
│ API calls include│
│ JWT token in     │
│ Authorization    │
│ header           │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Lambda Authorizer│
│ validates token  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Lambda function  │
│ processes request│
└──────────────────┘
```

---

## 🔍 Troubleshooting

### Login page not redirecting?
- Check browser console for errors
- Verify Cognito credentials in [js/auth.js](js/auth.js)
- Ensure Cognito User Pool exists

### API calls failing with 401?
- Verify Lambda authorizer is deployed
- Check API Gateway has authorizer attached
- Confirm token is being sent (check Network tab)

### User can't login?
- Verify user exists in Cognito
- Check password meets requirements
- Confirm email is verified (if required)

---

## 🎯 Next Steps

- [ ] Set up Cognito User Pool
- [ ] Update credentials in [js/auth.js](js/auth.js)
- [ ] Create test users
- [ ] Deploy Lambda authorizer
- [ ] Configure API Gateway
- [ ] Update remaining fetch calls ([update-auth.sh](update-auth.sh))
- [ ] Test login flow
- [ ] Add role-based access (admin vs user)
- [ ] Implement password reset
- [ ] Enable MFA (optional)

---

## 📚 Resources

- **Full Guide:** [AUTH_SETUP.md](AUTH_SETUP.md)
- **AWS Cognito Docs:** https://docs.aws.amazon.com/cognito/
- **Cognito JS SDK:** https://github.com/aws-amplify/amplify-js

---

## 🆘 Need Help?

Common issues and solutions in [AUTH_SETUP.md](AUTH_SETUP.md) → Troubleshooting section
