# 🍽️ Catering App - Complete Setup Guide

A full-featured catering management system with order taking, thermal printing, inventory management, and customer receipts.

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Setup Instructions](#️-setup-instructions)
- [Running the Project](#-running-the-project)
- [Features](#-features)
- [Thermal Printer Setup](#️-thermal-printer-setup)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.8+** (for menu synchronization)
- **Web browser** (Chrome recommended for thermal printing)
- **Local web server** (Python, Live Server, or similar)
- **AWS Account** (for backend services)

### 1-Minute Setup
```bash
# Clone or download the project
cd /Users/sreerk/Desktop/cateringapp

# Start local web server (choose one method)
# Method 1: Python
python3 -m http.server 8000

# Method 2: Node.js (if you have it)
npx serve .

# Method 3: PHP (if you have it)
php -S localhost:8000

# Open browser
open http://localhost:8000
```

---

## 📁 Project Structure

```
cateringapp/
├── index.html              # Main order taking page
├── orders.html             # View orders by date
├── order-details.html      # Order details with thermal printing
├── admin.html              # Menu management
├── menu_template.csv       # Menu import template
├── sync_menu_to_dynamodb.py # Menu sync script
├── lambda_function.py      # AWS Lambda backend
├── THERMAL_PRINTER_SETUP.md # Printer setup guide
├── css/
│   └── style.css           # Main styling
├── js/
│   └── app.js              # Main application logic
└── images/
    └── (logo and images)
```

---

## ⚙️ Setup Instructions

### Step 1: Backend Setup (AWS)

#### 1.1 DynamoDB Tables
Create these tables in AWS DynamoDB:

**Table 1: `CateringOrders`**
- Partition Key: `PK` (String)
- Sort Key: `SK` (String)

**Table 2: `CateringMenu`**
- Partition Key: `PK` (String)  
- Sort Key: `SK` (String)

#### 1.2 Lambda Function
1. Create new Lambda function in AWS
2. Copy code from `lambda_function.py`
3. Set environment variables:
   - `ORDERS_TABLE_NAME`: `CateringOrders`
   - `MENU_TABLE_NAME`: `CateringMenu`
4. Add DynamoDB permissions to Lambda role

#### 1.3 API Gateway
1. Create REST API in API Gateway
2. Enable CORS for all methods
3. Create resources and methods:
   ```
   /menu (GET, POST)
   /orders (POST)
   /orders/{date} (GET)
   /order/{orderId} (GET)
   ```
4. Deploy API and note the endpoint URL

### Step 2: Frontend Configuration

#### 2.1 Update API URL
Edit `js/app.js` line 3:
```javascript
const API_BASE_URL = 'https://jx9bpvt58i.execute-api.us-east-1.amazonaws.com/dev';
```

#### 2.2 Menu Setup
1. Edit `menu_template.csv` with your menu items
2. Run menu sync script:
```bash
python3 sync_menu_to_dynamodb.py
```

---

## 🏃 Running the Project

### Method 1: Python Server (Recommended)
```bash
cd /Users/sreerk/Desktop/cateringapp
python3 -m http.server 8000
```
Open: http://localhost:8000

### Method 2: Live Server (VS Code)
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

### Method 3: Node.js Serve
```bash
npx serve . -p 8000
```

### Method 4: XAMPP/MAMP
Place project folder in `htdocs` and access via localhost

---

## ✨ Features

### 🛒 Order Management
- **Take Orders**: Add items with sizes, spice levels, special instructions
- **Cart Management**: Add/remove items, apply discounts
- **Customer Info**: Name, phone, email, delivery details
- **Address Autocomplete**: OpenStreetMap integration

### 📊 Order Viewing
- **View by Date**: See all orders for specific dates
- **Order Details**: Complete order information
- **Status Tracking**: Order status management

### 🖨️ Thermal Printing
- **Multiple Receipt Types**:
  - Customer Receipt (with pricing)
  - Kitchen Receipt (no pricing)
  - Front Desk Receipt (full details)
- **Print Methods**:
  - Direct USB/Serial (Web Serial API)
  - USB thermal printers (Web USB API)
  - Browser printing (universal fallback)

### 👨‍💼 Admin Panel
- **Menu Management**: Add/edit menu items
- **Pricing**: Multiple sizes per item
- **Categories**: Organize menu by categories

### 🔊 Enhanced UI
- **Notifications**: Success/error messages with sound
- **Glassmorphism Design**: Modern UI effects
- **Mobile Responsive**: Works on tablets/phones

---

## 🖨️ Thermal Printer Setup

### Recommended Printers
- **Star Micronics TSP143III** ($100-150)
- **Epson TM-T20III** ($120-180)
- **MUNBYN Thermal Printer** ($50-80)

### Connection Methods

#### USB Direct Printing (Best)
1. Connect printer via USB
2. Use Chrome browser
3. Click receipt buttons
4. Grant USB access when prompted

#### Browser Printing (Universal)
1. Install printer drivers
2. Set as default printer
3. Any browser works
4. Optimized for 80mm thermal paper

### Paper Setup
- **Paper Type**: Thermal paper (no ink needed)
- **Width**: 80mm (3.15 inches)
- **Length**: Continuous roll

---

## 🔧 Troubleshooting

### Common Issues

#### "Failed to fetch menu"
- Check API_BASE_URL in `js/app.js`
- Verify Lambda function is deployed
- Check API Gateway CORS settings

#### "Cart is empty" when adding items
- Open browser console (F12)
- Check for JavaScript errors
- Verify menu data is loading

#### Thermal printer not working
- Try "Test Receipt" button first
- Check browser console for errors
- Use browser printing as fallback
- Verify printer is ESC/POS compatible

#### Orders not saving
- Check Lambda function logs
- Verify DynamoDB table permissions
- Check network connectivity

#### Discount not applying
- Verify discount radio buttons are selected
- Check cart total calculations
- Clear browser cache

### Debug Mode
Open browser console (F12) to see:
- API requests and responses
- Menu data loading
- Cart operations
- Error messages

---

## 📱 Browser Compatibility

### Recommended: Chrome/Edge
- Full thermal printing support
- Web Serial/USB APIs
- Best performance

### Firefox/Safari
- Basic functionality works
- Thermal printing via browser print only
- All other features functional

---

## 🛠️ Development

### File Editing
- **Menu Items**: Edit `menu_template.csv` and run sync script
- **Styling**: Modify `css/style.css`
- **Functionality**: Update `js/app.js`
- **Backend**: Edit `lambda_function.py`

### Testing
- Use "Test Receipt" button for printer testing
- Check browser console for debugging
- Test with different order types

### Deployment
1. Update API endpoint in `js/app.js`
2. Deploy Lambda function
3. Upload frontend to web hosting
4. Configure domain/SSL if needed

---

## 📞 Support

### Getting Help
1. Check browser console for errors
2. Verify all setup steps completed
3. Test with "Test Receipt" button
4. Check printer compatibility

### Common Commands
```bash
# Start development server
python3 -m http.server 8000

# Sync menu to database
python3 sync_menu_to_dynamodb.py

# Check if Python is installed
python3 --version

# Install Python (if needed)
# Visit: https://www.python.org/downloads/
```

---

## 🎉 You're Ready!

1. **Start the server**: `python3 -m http.server 8000`
2. **Open browser**: http://localhost:8000
3. **Take your first order**: Add items, customer info, print receipt!

**Happy Catering! 🍽️✨**
