document.addEventListener('DOMContentLoaded', () => {
    // This is your specific API URL.
    const API_BASE_URL = 'https://72thsowis3.execute-api.us-east-1.amazonaws.com/dev';
    
    // Initialize cart
    window.orderCart = [];

    // ===== ENHANCED NOTIFICATION SYSTEM =====
    // Inject styles for notifications programmatically
    const style = document.createElement('style');
    style.innerHTML = `
        .notification {
            position: fixed !important;
            top: 20px !important;
            right: 20px !important;
            padding: 18px 28px;
            border-radius: 16px;
            color: white !important;
            font-weight: 600;
            font-size: 15px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15);
            backdrop-filter: blur(10px);
            z-index: 99999 !important;
            transform: translateX(120%) scale(0.9);
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            max-width: 350px;
            min-width: 280px;
            display: flex !important;
            align-items: center;
            gap: 15px;
            border: 1px solid rgba(255,255,255,0.2);
            overflow: hidden;
            left: auto !important;
            bottom: auto !important;
        }
        
        .notification::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: inherit;
            opacity: 0.9;
            z-index: -1;
        }
        
        .notification::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s ease;
        }
        
        .notification.show {
            transform: translateX(0) scale(1);
        }
        
        .notification.show::after {
            left: 100%;
        }
        
        .notification-icon {
            font-size: 24px;
            animation: bounceIn 0.6s ease;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            min-width: 24px;
        }
        
        .notification-content {
            flex: 1;
            line-height: 1.4;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .notification-success {
            background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #40e0d0 100%) !important;
            border-left: 4px solid #40e0d0 !important;
            animation: successPulse 0.6s ease;
            box-shadow: 0 8px 32px rgba(40, 167, 69, 0.4), 0 4px 8px rgba(40, 167, 69, 0.2) !important;
        }
        
        .notification-error {
            background: linear-gradient(135deg, #ff4444 0%, #cc0000 50%, #ff6b6b 100%);
            border-left: 4px solid #ff6b6b;
            animation: errorShake 0.6s ease;
        }
        
        .notification-info {
            background: linear-gradient(135deg, #ffd700 0%, #ffeb3b 50%, #fff59d 100%);
            border-left: 4px solid #fff59d;
            animation: infoSlide 0.5s ease;
        }
        
        .notification-close {
            position: absolute;
            top: 8px;
            right: 12px;
            background: rgba(255,255,255,0.2);
            border: none;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            color: white;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            opacity: 0.7;
        }
        
        .notification-close:hover {
            background: rgba(255,255,255,0.3);
            opacity: 1;
            transform: scale(1.1);
        }
        
        @keyframes bounceIn {
            0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(-10deg); }
            70% { transform: scale(0.9) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        
        @keyframes successPulse {
            0%, 100% { 
                box-shadow: 0 8px 32px rgba(40, 167, 69, 0.4), 0 4px 8px rgba(40, 167, 69, 0.2);
                transform: scale(1);
            }
            50% { 
                box-shadow: 0 12px 40px rgba(64, 224, 208, 0.6), 0 0 25px rgba(64, 224, 208, 0.4);
                transform: scale(1.02);
            }
        }
        
        @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
        
        @keyframes infoSlide {
            0% { transform: translateY(-20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
        }
        
        .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: rgba(255,255,255,0.4);
            border-radius: 0 0 16px 16px;
            animation: progressBar 3s linear;
        }
        
        @keyframes progressBar {
            0% { width: 100%; }
            100% { width: 0%; }
        }
        
        /* Enhanced mobile responsiveness */
        @media (max-width: 768px) {
            .notification {
                top: 10px;
                right: 10px;
                left: 10px;
                max-width: none;
                transform: translateY(-120%) scale(0.9);
            }
            
            .notification.show {
                transform: translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);

    window.showNotification = function(message, type = 'info', duration = 4000) {
        // Debug logging
        console.log('showNotification called:', { message, type, duration });
        
        // Remove existing notifications to prevent stacking
        const existing = document.querySelector('.notification');
        if (existing) {
            console.log('Removing existing notification');
            existing.style.transform = 'translateX(120%) scale(0.8)';
            existing.style.opacity = '0';
            setTimeout(() => existing.remove(), 200);
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        // Force specific styles to override any conflicts
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '99999';
        notification.style.left = 'auto';
        notification.style.bottom = 'auto';
        
        console.log('Notification class:', notification.className);
        
        // Enhanced icons with emojis and symbols
        let icon;
        if (type === 'success') {
            const successIcons = ['🎉', '✨', '🌟', '💚', '🎊'];
            icon = successIcons[Math.floor(Math.random() * successIcons.length)];
        } else if (type === 'error') {
            const errorIcons = ['❌', '🚨', '⚠️', '💥', '🔥'];
            icon = errorIcons[Math.floor(Math.random() * errorIcons.length)];
        } else {
            const infoIcons = ['💡', 'ℹ️', '🔔', '📢', '💬'];
            icon = infoIcons[Math.floor(Math.random() * infoIcons.length)];
        }

        notification.innerHTML = `
            <div class="notification-icon">${icon}</div>
            <div class="notification-content">${message}</div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
            <div class="notification-progress"></div>
        `;
        
        console.log('Adding notification to body');
        document.body.appendChild(notification);
        
        // Verify it was added and check styles
        setTimeout(() => {
            const added = document.querySelector('.notification');
            if (added) {
                const styles = window.getComputedStyle(added);
                console.log('Notification styles:', {
                    position: styles.position,
                    zIndex: styles.zIndex,
                    top: styles.top,
                    right: styles.right,
                    transform: styles.transform,
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity
                });
            } else {
                console.error('Notification was not added to DOM!');
            }
        }, 50);
        
        // Add sound effect for success notifications
        if (type === 'success') {
            // Create a subtle success sound using Web Audio API
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
                oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.2);
                
                gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.3);
            } catch (e) {
                // Fallback if audio context is not supported
                console.log('Audio context not supported');
            }
        }
        
        // Trigger animation with slight delay for better effect
        requestAnimationFrame(() => {
            setTimeout(() => {
                console.log('Adding show class for animation');
                notification.classList.add('show');
                
                // Check animation state
                setTimeout(() => {
                    const animatedStyles = window.getComputedStyle(notification);
                    console.log('Post-animation transform:', animatedStyles.transform);
                }, 200);
            }, 10);
        });

        // Auto-remove with fade out animation
        setTimeout(() => {
            if (notification.parentElement) {
                console.log('Auto-removing notification');
                notification.style.transform = 'translateX(120%) scale(0.8)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentElement) notification.remove();
                }, 400);
            }
        }, duration);
        
        // Add click to dismiss functionality
        notification.addEventListener('click', (e) => {
            if (!e.target.classList.contains('notification-close')) {
                notification.style.transform = 'translateX(120%) scale(0.8)';
                notification.style.opacity = '0';
                setTimeout(() => notification.remove(), 200);
            }
        });
        
        return notification;
    };
    
    // Debug function for testing notifications
    window.testNotification = function(type = 'success') {
        const messages = {
            'success': '🎉 Test Success Notification! Item added successfully!',
            'error': '❌ Test Error Notification! Something went wrong!',
            'info': '💡 Test Info Notification! This is just information!'
        };
        console.log('Testing notification of type:', type);
        return window.showNotification(messages[type], type);
    };

    // Splash screen logic
    const splashScreen = document.getElementById('splash-screen');
    const enterAppBtn = document.getElementById('enter-app-btn');
    if (splashScreen && enterAppBtn) {
        enterAppBtn.addEventListener('click', () => {
            splashScreen.classList.add('hidden');
        });
    }
    
    // --- Page Router ---
    const newOrderForm = document.getElementById('new-order-form');
    const viewDateInput = document.getElementById('view-date');
    const orderDetailsContainer = document.getElementById('order-details-container');
    const newMenuItemForm = document.getElementById('new-menu-item-form');

    if (newOrderForm) {
        initializeCreateOrderPage();
    } else if (viewDateInput) {
        initializeViewOrdersPage();
    } else if (orderDetailsContainer) {
        initializeOrderDetailsPage();
    } else if (newMenuItemForm) {
        initializeAdminPage();
    }

    // --- Page Initializers ---
    function initializeCreateOrderPage() {
        fetchAndDisplayMenuForOrder();
        setupDeliveryOptionToggle();
        newOrderForm.addEventListener('submit', handleCreateOrder);
        
        // Initialize cart display on page load
        if (typeof window.updateCartDisplay === 'function') {
            window.updateCartDisplay();
        }
        
        // Setup discount radio button listeners
        const discountRadios = document.getElementsByName('cash-discount');
        discountRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                window.updateCartDisplay();
            });
        });
    }

    function initializeViewOrdersPage() {
        const today = new Date().toISOString().split('T')[0];
        viewDateInput.value = today;
        fetchOrdersForDate(today);
        viewDateInput.addEventListener('change', (event) => {
            fetchOrdersForDate(event.target.value);
        });
    }

    function initializeOrderDetailsPage() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('id');
        if (orderId) {
            fetchOrderDetails(orderId);
        } else {
            orderDetailsContainer.innerHTML = '<p style="color: red;">No Order ID found.</p>';
        }
    }

    function initializeAdminPage() {
        fetchAndDisplayAdminMenu();
        newMenuItemForm.addEventListener('submit', handleCreateMenuItem);
        const addPriceBtn = document.getElementById('btn-add-price');
        const pricingContainer = document.getElementById('pricing-container');
        addPriceBtn.addEventListener('click', () => {
            const newRow = document.createElement('div');
            newRow.classList.add('pricing-row');
            newRow.innerHTML = `
                <input type="text" class="pricing-size-name" placeholder="Size Name" required>
                <input type="number" class="pricing-price" step="0.01" placeholder="Price" required>
                <button type="button" class="btn-remove-price">&times;</button>
            `;
            pricingContainer.appendChild(newRow);
        });
        pricingContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('btn-remove-price')) {
                event.target.closest('.pricing-row').remove();
            }
        });
    }

    // --- Logic Functions ---

    // Cart management functions
    window.addToCart = function(item) {
        // Add price property if missing (for display)
        if (!('price' in item)) {
            // Try to extract price from sizeName (e.g., "Shallow Tray - $45")
            const match = item.sizeName && item.sizeName.match(/\$(\d+(?:\.\d+)?)/);
            if (match) {
                item.price = match[1];
            } else {
                item.price = '0';
            }
        }
        window.orderCart.push(item);
        window.updateCartDisplay();
        window.showNotification(`<strong>${item.itemName}</strong> (${item.sizeName}) added to your cart!`, 'success');
    };

    window.removeFromCart = function(index) {
        window.orderCart.splice(index, 1);
        window.updateCartDisplay();
    };

    window.updateCartDisplay = function() {
        const cartContainer = document.getElementById('order-cart');
        const cartSection = document.getElementById('cart-section');
        const cartCount = document.getElementById('cart-count');
        const cartDisplaySection = document.getElementById('cart-display-section');
        const cartItemsContainer = document.getElementById('cart-items-container');
        const discountSection = document.getElementById('discount-section');

        if (window.orderCart.length === 0) {
            if (cartSection) cartSection.style.display = 'none';
            if (cartDisplaySection) cartDisplaySection.classList.remove('show');
            if (cartItemsContainer) cartItemsContainer.innerHTML = '';
            if (discountSection) discountSection.style.display = 'none';
            return;
        }

        if (cartSection) cartSection.style.display = 'block';
        if (cartDisplaySection) cartDisplaySection.classList.add('show');
        if (discountSection) discountSection.style.display = 'block';
        
        let totalPrice = 0;
        
        // Build cart table with better styling (only if cartContainer exists)
        if (cartContainer) {
            let cartHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                        <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                            <th style="text-align: left; padding: 12px; font-weight: 600; color: #333;">Item</th>
                            <th style="text-align: center; padding: 12px; font-weight: 600; color: #333; width: 80px;">Size</th>
                            <th style="text-align: center; padding: 12px; font-weight: 600; color: #333; width: 80px;">Spice</th>
                            <th style="text-align: center; padding: 12px; font-weight: 600; color: #333; width: 60px;">Qty</th>
                            <th style="text-align: center; padding: 12px; font-weight: 600; color: #333; width: 100px;">Action</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            window.orderCart.forEach((item, index) => {
                // Calculate item total price
                const itemPrice = parseFloat(item.price) || 0;
                const itemTotal = itemPrice * item.quantity;
                totalPrice += itemTotal;
                
                cartHtml += `
                    <tr style="border-bottom: 1px solid #e0e0e0; hover-background: #f9f9f9;">
                        <td style="padding: 12px; color: #333; font-weight: 500;">${item.itemName}${item.instructions ? '<br><small style="color: #999; font-weight: normal;">📝 ' + item.instructions + '</small>' : ''}</td>
                        <td style="padding: 12px; text-align: center; color: #666;">${item.sizeName}</td>
                        <td style="padding: 12px; text-align: center; color: #666;">${item.spiceLevel || 'N/A'}</td>
                        <td style="padding: 12px; text-align: center; color: #333; font-weight: 600;">${item.quantity}</td>
                        <td style="padding: 12px; text-align: center;">
                            <button type="button" onclick="removeFromCart(${index})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px; transition: all 0.3s;">✕ Remove</button>
                        </td>
                    </tr>
                `;
            });
            
            cartHtml += `
                    </tbody>
                </table>
            `;
            
            cartContainer.innerHTML = cartHtml;
            if (cartCount) cartCount.textContent = window.orderCart.length + ' item' + (window.orderCart.length !== 1 ? 's' : '');
        } else {
            // Calculate total price even if cartContainer doesn't exist
            window.orderCart.forEach((item) => {
                const itemPrice = parseFloat(item.price) || 0;
                totalPrice += itemPrice * item.quantity;
            });
        }
        
        // Update Cart Display Section (below delivery option)
        if (cartItemsContainer) {
            let cartDisplayHtml = '';
            // Get selected discount
            let discountPercent = 0;
            const discountRadios = document.getElementsByName('cash-discount');
            discountRadios.forEach(radio => {
                if (radio.checked) {
                    discountPercent = parseFloat(radio.value);
                }
            });
            window.orderCart.forEach((item, index) => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemTotalRaw = itemPrice * item.quantity;
                const itemDiscount = itemTotalRaw * (discountPercent / 100);
                const itemTotal = (itemTotalRaw - itemDiscount).toFixed(2);
                cartDisplayHtml += `
                    <div class="cart-item-row">
                        <div class="cart-item-name">${item.itemName}${item.instructions ? '<br><small style="color: #999; font-size: 12px;">📝 ' + item.instructions + '</small>' : ''}</div>
                        <div class="cart-item-details">${item.sizeName}</div>
                        <div class="cart-item-details">${item.spiceLevel || 'N/A'}</div>
                        <div class="cart-item-quantity">${item.quantity}</div>
                        <div class="cart-item-total">$${itemTotal}</div>
                        <div class="cart-item-remove">
                            <button type="button" onclick="removeFromCart(${index})">✕ Remove</button>
                        </div>
                    </div>
                `;
            });
            cartItemsContainer.innerHTML = cartDisplayHtml;
        }
        
        // Update discount summary
        window.updateDiscountSummary();
    };

    window.updateDiscountSummary = function() {
        const discountSummary = document.getElementById('discount-summary');
        const discountRadios = document.getElementsByName('cash-discount');
        
        if (!discountSummary) {
            console.log('Discount summary element not found');
            return;
        }
        
        // Calculate cart total
        let subtotal = 0;
        window.orderCart.forEach((item) => {
            const itemPrice = parseFloat(item.price) || 0;
            subtotal += itemPrice * item.quantity;
        });

        // Get selected discount
        let discountPercent = 0;
        discountRadios.forEach(radio => {
            if (radio.checked) {
                discountPercent = parseFloat(radio.value);
            }
        });

        // Always recalculate for all items in cart
        const discountAmount = (subtotal * discountPercent / 100);
        const totalAfterDiscount = subtotal - discountAmount;

        if (subtotal > 0) {
            discountSummary.classList.add('show');
            discountSummary.innerHTML = `
                <div class="discount-summary-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="discount-summary-row">
                    <span>Discount (${discountPercent}%):</span>
                    <span>-$${discountAmount.toFixed(2)}</span>
                </div>
                <div class="discount-summary-row total">
                    <span>Total:</span>
                    <span>$${totalAfterDiscount.toFixed(2)}</span>
                </div>
            `;
        } else {
            discountSummary.classList.remove('show');
            discountSummary.innerHTML = '';
        }
    };

    async function fetchAndDisplayMenuForOrder() {
        const container = document.getElementById('menu-items-container');
        container.parentElement.id = 'menu-items-container-fieldset'; 
        try {
            const response = await fetch(`${API_BASE_URL}/menu`);
            if (!response.ok) throw new Error('Failed to fetch menu.');
            const menuItems = await response.json();
            container.innerHTML = '';

            const groupedByCategory = menuItems.reduce((acc, item) => {
                const category = item.itemCategory || 'Others';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(item);
                return acc;
            }, {});

            for (const categoryName in groupedByCategory) {
                const itemsInCategory = groupedByCategory[categoryName];
                const types = [...new Set(itemsInCategory.map(item => item.itemType || 'Others'))];
                
                let filtersHtml = types.map((type, index) => 
                    `<button type="button" class="filter-btn ${index === 0 ? 'active' : ''}" data-filter="${type}">${type}</button>`
                ).join('');
                
                let itemsHtml = '';
                const spiceLevels = ['Mild', 'Medium', 'Spicy'];
                let spiceOptionsHtml = spiceLevels.map(level => `<option value="${level}">${level}</option>`).join('');
                
                // Categories that should not show spice selector
                const noSpiceCategories = ['Dessert', 'Bread', 'Breads', 'Beverages'];
                const showSpice = !noSpiceCategories.includes(categoryName);

                itemsInCategory.forEach((item) => {
                    const itemId = item.SK.split('#')[1];
                    // Store pricing data as JSON for later retrieval
                    const pricingData = JSON.stringify(item.pricing);
                    let sizeOptionsHtml = item.pricing.map(p => `<option value="${p.sizeName}">${p.sizeName}</option>`).join('');
                    const initialDisplay = (item.itemType || 'Others') === types[0] ? '' : 'style="display: none;"';
                    
                    // Only show spice selector if category allows it
                    const spiceSelectorHtml = showSpice ? `
                                <div class="select-wrapper">
                                    <select class="spice-selector">
                                        <option value="Mild">Mild</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Spicy">Spicy</option>
                                    </select>
                                </div>` : '';
                    
                    itemsHtml += `
                        <div class="menu-item" data-id="${itemId}" data-name="${item.itemName}" data-type="${item.itemType || 'Others'}" data-no-spice="${!showSpice}" data-pricing='${pricingData}' ${initialDisplay}>
                            <div class="menu-item-name">${item.itemName}</div>
                            <div class="menu-item-actions">
                                <div class="select-wrapper">
                                    <select class="size-selector">${sizeOptionsHtml}</select>
                                </div>
                                ${spiceSelectorHtml}
                                <input type="number" min="1" value="1" class="quantity-input">
                                <button type="button" class="btn-add-to-cart">+ Add</button>
                            </div>
                            <div class="menu-item-instructions">
                                <input type="text" class="instructions-input" placeholder="Special Instructions (e.g., extra spicy, no nuts)">
                            </div>
                        </div>
                    `;
                });

                // Check if this is the first category to make it open by default
                const isFirstCategory = Object.keys(groupedByCategory).indexOf(categoryName) === 0;
                const categoryHtml = `
                    <div class="menu-category ${isFirstCategory ? 'open' : ''}">
                        <div class="category-header">${categoryName.toUpperCase()}</div>
                        <div class="category-content">
                            <div class="category-filters">${filtersHtml}</div>
                            <div class="menu-items-list">${itemsHtml}</div>
                        </div>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', categoryHtml);
            }

            container.addEventListener('click', (event) => {
                // Handle Add to Cart button
                if (event.target.classList.contains('btn-add-to-cart')) {
                    const menuItem = event.target.closest('.menu-item');
                    const itemId = menuItem.dataset.id;
                    const itemName = menuItem.dataset.name;
                    const sizeName = menuItem.querySelector('.size-selector').value;
                    const quantity = parseInt(menuItem.querySelector('.quantity-input').value, 10);
                    const spiceLevelElement = menuItem.querySelector('.spice-selector');
                    const spiceLevel = spiceLevelElement ? spiceLevelElement.value : 'N/A';
                    const instructions = menuItem.querySelector('.instructions-input').value.trim();

                    // Get price from pricing data
                    const pricingData = JSON.parse(menuItem.dataset.pricing);
                    const priceObj = pricingData.find(p => p.sizeName === sizeName);
                    const price = priceObj ? priceObj.price : '0';

                    if (quantity < 1) {
                        window.showNotification('<strong>Oops!</strong><br>Please enter a quantity of at least 1 to add this item', 'error');
                        return;
                    }

                    window.addToCart({
                        menuItemId: itemId,
                        itemName: itemName,
                        sizeName: sizeName,
                        spiceLevel: spiceLevel,
                        quantity: quantity,
                        instructions: instructions,
                        price: price
                    });

                    // Reset the quantity and instructions for this item
                    menuItem.querySelector('.quantity-input').value = '1';
                    menuItem.querySelector('.instructions-input').value = '';
                }
                
                if (event.target.classList.contains('category-header')) {
                    event.target.parentElement.classList.toggle('open');
                }
                
                if (event.target.classList.contains('filter-btn')) {
                    const button = event.target;
                    const filter = button.dataset.filter;
                    const categoryContent = button.closest('.category-content');
                    
                    categoryContent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    categoryContent.querySelectorAll('.menu-item').forEach(item => {
                        item.style.display = (item.dataset.type === filter) ? 'flex' : 'none';
                    });
                }
            });

        } catch (error) {
            console.error('Error fetching and building menu:', error);
            container.innerHTML = '<p style="color: red;">Could not load menu.</p>';
        }
    }
    
    // --- Delivery Option Logic ---
    // Show/hide delivery address field (fix: run only on order page)
    function setupDeliveryOptionToggle() {
        const deliveryTypeRadios = document.getElementsByName('delivery-type');
        const addressGroup = document.getElementById('delivery-address-group');
        if (deliveryTypeRadios && addressGroup) {
            Array.from(deliveryTypeRadios).forEach(radio => {
                radio.addEventListener('change', function() {
                    if (this.value === 'Delivery') {
                        addressGroup.style.display = '';
                        document.getElementById('delivery-address').required = true;
                    } else {
                        addressGroup.style.display = 'none';
                        document.getElementById('delivery-address').required = false;
                    }
                });
            });
            // Initial state
            const checked = Array.from(deliveryTypeRadios).find(r => r.checked);
            if (checked && checked.value === 'Delivery') {
                addressGroup.style.display = '';
                document.getElementById('delivery-address').required = true;
            } else {
                addressGroup.style.display = 'none';
                document.getElementById('delivery-address').required = false;
            }
        }
        
        // Setup address autocomplete
        setupAddressAutocomplete();
    }

    // --- Address Autocomplete using OpenStreetMap Nominatim ---
    function setupAddressAutocomplete() {
        const addressInput = document.getElementById('delivery-address');
        const suggestionsDiv = document.getElementById('address-suggestions');
        
        if (!addressInput || !suggestionsDiv) return;
        
        let debounceTimer;
        
        addressInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            const query = this.value.trim();
            
            // Hide suggestions if input is empty or too short
            if (query.length < 3) {
                suggestionsDiv.classList.remove('show');
                return;
            }
            
            debounceTimer = setTimeout(() => {
                fetchAddressSuggestions(query);
            }, 300); // Wait 300ms after user stops typing
        });
        
        // Hide suggestions when clicking outside
        document.addEventListener('click', function(e) {
            if (e.target !== addressInput && !e.target.closest('.address-suggestions-dropdown')) {
                suggestionsDiv.classList.remove('show');
            }
        });
    }

    async function fetchAddressSuggestions(query) {
        const suggestionsDiv = document.getElementById('address-suggestions');
        
        try {
            // Using OpenStreetMap Nominatim API (free, no key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'User-Agent': 'CateringApp'
                    }
                }
            );
            
            if (!response.ok) throw new Error('Failed to fetch suggestions');
            
            const suggestions = await response.json();
            
            if (suggestions.length === 0) {
                suggestionsDiv.innerHTML = '<div class="address-suggestion-item" style="color: #999;">No addresses found</div>';
                suggestionsDiv.classList.add('show');
                return;
            }
            
            // Build suggestions list
            const html = suggestions.map((suggestion, index) => `
                <div class="address-suggestion-item" data-index="${index}">
                    <div class="address-suggestion-item-main">${suggestion.address || suggestion.display_name}</div>
                    <div class="address-suggestion-item-secondary">${suggestion.display_name}</div>
                </div>
            `).join('');
            
            suggestionsDiv.innerHTML = html;
            suggestionsDiv.classList.add('show');
            
            // Add click handlers to suggestions
            document.querySelectorAll('.address-suggestion-item').forEach(item => {
                item.addEventListener('click', function() {
                    const index = parseInt(this.getAttribute('data-index'));
                    const selectedAddress = suggestions[index].display_name;
                    document.getElementById('delivery-address').value = selectedAddress;
                    suggestionsDiv.classList.remove('show');
                });
            });
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            suggestionsDiv.innerHTML = '<div class="address-suggestion-item" style="color: #999;">Error loading suggestions</div>';
            suggestionsDiv.classList.add('show');
        }
    }

    async function handleCreateOrder(event) {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        // Get delivery type and address
        let deliveryType = 'Pickup';
        let deliveryAddress = '';
        const deliveryTypeEl = document.querySelector('input[name="delivery-type"]:checked');
        if (deliveryTypeEl) {
            deliveryType = deliveryTypeEl.value;
        }
        if (deliveryType === 'Delivery') {
            deliveryAddress = document.getElementById('delivery-address').value.trim();
        }
        
        // Get discount information
        let discountPercent = 0;
        const discountRadios = document.getElementsByName('cash-discount');
        discountRadios.forEach(radio => {
            if (radio.checked) {
                discountPercent = parseFloat(radio.value);
            }
        });
        
        // Calculate total and discount
        let subtotal = 0;
        (window.orderCart || []).forEach((item) => {
            const itemPrice = parseFloat(item.price) || 0;
            subtotal += itemPrice * item.quantity;
        });
        
        const discountAmount = (subtotal * discountPercent / 100);
        const totalPrice = subtotal - discountAmount;
        
        const orderData = {
            customerName: document.getElementById('customer-name').value,
            customerPhone: document.getElementById('customer-phone').value,
            customerEmail: document.getElementById('customer-email').value,
            deliveryDate: document.getElementById('delivery-date').value,
            deliveryTime: document.getElementById('delivery-time').value,
            customerSpecifications: document.getElementById('specifications').value,
            deliveryType: deliveryType,
            deliveryAddress: deliveryAddress,
            discountPercent: discountPercent,
            discountAmount: discountAmount.toFixed(2),
            subtotal: subtotal.toFixed(2),
            totalPrice: totalPrice.toFixed(2),
            items: window.orderCart || []
        };
        
        console.log('Order data being sent to backend:', orderData);
        
        if (orderData.items.length === 0) {
            window.showNotification('<strong>Cart is Empty!</strong><br>Please add some delicious items to your cart before placing the order', 'error', 3500);
            submitButton.disabled = false;
            submitButton.textContent = 'Save Order';
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Error creating order.');
            console.log('Backend response after creating order:', result);
            window.showNotification(`<strong>🎉 Order Created Successfully!</strong><br>Your Order ID: <strong>${result.orderId}</strong><br>We'll prepare your delicious meal!`, 'success', 5000);
            newOrderForm.reset();
            window.orderCart = [];
            window.updateCartDisplay();
            fetchAndDisplayMenuForOrder();
        } catch (error) {
            console.error('Error creating order:', error);
            window.showNotification(`✗ Failed to create order: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save Order';
        }
    }

    async function handleCreateMenuItem(event) {
        event.preventDefault();
        const submitButton = event.target.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';
        const pricing = [];
        document.querySelectorAll('.pricing-row').forEach(row => {
            const sizeName = row.querySelector('.pricing-size-name').value;
            const price = row.querySelector('.pricing-price').value;
            if (sizeName && price) {
                pricing.push({ sizeName, price });
            }
        });
        if (pricing.length === 0) {
            window.showNotification('<strong>Missing Pricing!</strong><br>Please add at least one size and price for this menu item', 'error');
            submitButton.disabled = false;
            submitButton.textContent = 'Save New Item';
            return;
        }
        const itemData = {
            itemName: document.getElementById('item-name').value,
            description: document.getElementById('item-description').value,
            pricing: pricing
        };
        try {
            const response = await fetch(`${API_BASE_URL}/menu`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Failed to create item.');
            window.showNotification(`<strong>🍽️ Menu Item Added!</strong><br>"<strong>${result.itemName}</strong>" is now available<br>Your customers will love it!`, 'success', 4000);
            newMenuItemForm.reset();
            const pricingContainer = document.getElementById('pricing-container');
            while (pricingContainer.children.length > 1) {
                pricingContainer.removeChild(pricingContainer.lastChild);
            }
            fetchAndDisplayAdminMenu();
        } catch (error) {
            window.showNotification(`✗ Failed to create item: ${error.message}`, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Save New Item';
        }
    }
    
    async function fetchAndDisplayAdminMenu() {
        const container = document.getElementById('current-menu-list');
        try {
            const response = await fetch(`${API_BASE_URL}/menu`);
            if (!response.ok) throw new Error('Failed to fetch menu.');
            const menuItems = await response.json();
            if (menuItems.length === 0) {
                container.innerHTML = '<p>No menu items have been created yet.</p>';
                return;
            }
            container.innerHTML = '';
            menuItems.sort((a, b) => a.itemName.localeCompare(b.itemName));
            menuItems.forEach(item => {
                const itemCardHtml = `
                    <div class="admin-menu-item-card">
                        <h4>${item.itemName}</h4>
                        <p class="admin-menu-item-desc">${item.description || 'No description provided.'}</p>
                        ${item.pricing.map(p => `<p class="admin-menu-item-price"><b>${p.sizeName}:</b> $${p.price}</p>`).join('')}
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', itemCardHtml);
            });
        } catch (error) {
            console.error('Error fetching admin menu:', error);
            container.innerHTML = '<p style="color: red;">Could not load current menu.</p>';
        }
    }
    
    async function fetchOrdersForDate(date) {
        if (!date) return;
        const ordersListDiv = document.getElementById('orders-list');
        ordersListDiv.innerHTML = '<p>Loading orders...</p>';
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${date}`);
            const orders = await response.json();
            if (!response.ok) throw new Error(orders.message || 'Error fetching orders.');
            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            ordersListDiv.innerHTML = `<p style="color: var(--danger-color);">Failed to load orders.</p>`;
        }
    }

    function displayOrders(orders) {
        const ordersListDiv = document.getElementById('orders-list');
        if (!orders || orders.length === 0) {
            ordersListDiv.innerHTML = '<p>No orders found for this date.</p>';
            return;
        }
        ordersListDiv.innerHTML = '';
        orders.sort((a, b) => (a.deliveryTime || '').localeCompare(b.deliveryTime || ''));
        orders.forEach(order => {
            const statusClass = `status-${order.status.toLowerCase()}`;
            const orderCardHtml = `
                <div class="order-card">
                    <div class="order-details">
                        <h3>Customer: ${order.customerName}</h3>
                        <p><strong>Time:</strong> ${formatTime(order.deliveryTime)}</p>
                        <p><strong>Total:</strong> $${Number(order.totalPrice).toFixed(2)}</p>
                    </div>
                    <div class="order-actions">
                         <p><strong>Status:</strong> <span class="${statusClass}">${order.status}</span></p>
                         <a href="order-details.html?id=${order.orderId}" class="btn-secondary">View Details</a>
                    </div>
                </div>
            `;
            ordersListDiv.insertAdjacentHTML('beforeend', orderCardHtml);
        });
    }

    async function fetchOrderDetails(orderId) {
        const container = document.getElementById('order-details-container');
        try {
            const response = await fetch(`${API_BASE_URL}/order/${orderId}`);
            if (!response.ok) throw new Error('Failed to fetch order details.');
            const items = await response.json();
            console.log('Raw order details response:', items);
            displayOrderDetails(items);
        } catch (error) {
            console.error('Error fetching details:', error);
            container.innerHTML = `<p style="color: red;">Could not load details.</p>`;
        }
    }

    function displayOrderDetails(items) {
        const container = document.getElementById('order-details-container');
        const orderInfo = items.find(item => item.SK.startsWith('ORDER#'));
        const menuItems = items.filter(item => item.SK.startsWith('ITEM#'));
        
        console.log('Order info found:', orderInfo);
        console.log('Menu items found:', menuItems);
        
        if (!orderInfo) {
            container.innerHTML = '<p style="color: red;">Order data is incomplete.</p>';
            return;
        }

        // Calculate fallback discount if missing
        let subtotal = orderInfo.subtotal !== undefined ? Number(orderInfo.subtotal) : null;
        let discountPercent = orderInfo.discountPercent !== undefined ? Number(orderInfo.discountPercent) : null;
        let discountAmount = orderInfo.discountAmount !== undefined ? Number(orderInfo.discountAmount) : null;
        let totalPrice = orderInfo.totalPrice !== undefined ? Number(orderInfo.totalPrice) : null;

        // Debug logging
        console.log('Original orderInfo discount data:', {
            subtotal: orderInfo.subtotal,
            discountPercent: orderInfo.discountPercent,
            discountAmount: orderInfo.discountAmount,
            totalPrice: orderInfo.totalPrice
        });

        // If discount info is missing, try to recalculate from items
        if ((discountPercent === null || isNaN(discountPercent))) {
            // Use orderInfo.items if present, else use menuItems
            let itemsArr = Array.isArray(orderInfo.items) && orderInfo.items.length > 0 ? orderInfo.items : menuItems;
            console.log('Using items array for calculation:', itemsArr);
            if (itemsArr.length > 0) {
                subtotal = itemsArr.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.quantity || 1)), 0);
                totalPrice = Number(orderInfo.totalPrice);
                console.log('Calculated subtotal:', subtotal, 'Total price:', totalPrice);
                // If subtotal > total, discount was applied
                if (subtotal > totalPrice) {
                    discountAmount = subtotal - totalPrice;
                    discountPercent = Math.round((discountAmount / subtotal) * 100);
                    console.log('Discount detected - Amount:', discountAmount, 'Percent:', discountPercent);
                } else {
                    discountAmount = 0;
                    discountPercent = 0;
                    console.log('No discount detected');
                }
            }
        }

        // If subtotal is still missing, fallback to totalPrice
        if (subtotal === null || isNaN(subtotal)) subtotal = totalPrice;
        if (discountAmount === null || isNaN(discountAmount)) discountAmount = 0;
        if (discountPercent === null || isNaN(discountPercent)) discountPercent = 0;

        console.log('Final discount values:', { subtotal, discountPercent, discountAmount, totalPrice });

        // Build items list - group by item name
        let itemsHtml = '';
        if (menuItems.length > 0) {
            // Group items by itemName
            const groupedItems = {};
            menuItems.forEach(item => {
                const itemName = item.itemName || 'Unknown Item';
                if (!groupedItems[itemName]) {
                    groupedItems[itemName] = [];
                }
                groupedItems[itemName].push(item);
            });

            const itemsList = Object.entries(groupedItems).map(([itemName, items]) => {
                // Build display for each variant
                return items.map(item => {
                    const quantity = item.quantity || 0;
                    const sizeName = item.sizeName && item.sizeName !== 'N/A' ? item.sizeName : '';
                    const spiceLevel = item.spiceLevel && item.spiceLevel !== 'N/A' ? item.spiceLevel : '';

                    // Build details string
                    let detailsArr = [];
                    if (sizeName) {
                        // Pluralize tray/trays based on quantity
                        const sizeDisplay = quantity > 1 ? sizeName.replace(/Tray$/, 'Trays') : sizeName;
                        detailsArr.push(`${quantity} ${sizeDisplay}`);
                    } else {
                        detailsArr.push(`${quantity}`);
                    }
                    if (spiceLevel) detailsArr.push(spiceLevel);
                    
                    let variantStr = detailsArr.join(', ');
                    
                    // Build the main line
                    let itemLine = `<li><b>${itemName}</b> (${variantStr})`;
                    
                    // Add instructions on a new line if present
                    if (item.instructions) {
                        itemLine += `<br><small style="color: #666;">📝 ${item.instructions}</small>`;
                    }
                    
                    itemLine += `</li>`;
                    return itemLine;
                }).join('');
            }).join('');
            itemsHtml = `<ul class="details-item-list">${itemsList}</ul>`;
        } else {
            itemsHtml = '<p>No menu items found for this order.</p>';
        }

        const detailsHtml = `
            <div class="order-details-pricing-block">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #ddd;">
                    <h2 style="margin: 0;">Order #${orderInfo.orderId}</h2>
                    <div class="order-details-price" style="font-size: 32px; font-weight: bold; color: #28a745;">$${totalPrice.toFixed(2)}</div>
                </div>

                <!-- PRICE SECTION -->
                <div class="order-details-pricing" style="background: #fffbf0; padding: 15px; border-radius: 8px; border-left: 4px solid #f09819; margin-bottom: 25px;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">💰 Pricing</h3>
                    ${(() => {
                        // Show discount details if discount is detected OR if calculated subtotal > total price
                        const calculatedSubtotal = menuItems.reduce((sum, item) => sum + ((parseFloat(item.price) || 0) * (item.quantity || 1)), 0);
                        const shouldShowDiscount = (discountPercent > 0 && subtotal > 0) || (calculatedSubtotal > totalPrice && calculatedSubtotal > 0);
                        console.log('Pricing section condition check:', 'discountPercent:', discountPercent, 'subtotal:', subtotal, 'calculatedSubtotal:', calculatedSubtotal, 'totalPrice:', totalPrice, 'shouldShowDiscount:', shouldShowDiscount);
                        return shouldShowDiscount;
                    })() ? `
                        <p class="order-details-total" style="margin: 8px 0;"><strong>Subtotal:</strong> <span style="font-size: 18px; color: #666;">$${subtotal.toFixed(2)}</span></p>
                        <p class="order-details-cashdiscount" style="margin: 8px 0;"><strong>Cash Discount (${discountPercent}%):</strong> <span style="font-size: 18px; color: #ff6a3d; font-weight: 600;">-$${discountAmount.toFixed(2)}</span></p>
                        <p class="order-details-total" style="margin: 8px 0; padding-top: 10px; border-top: 2px dashed #ddd;"><strong>Total Amount:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">$${totalPrice.toFixed(2)}</span></p>
                    ` : `
                        <p class="order-details-total" style="margin: 8px 0;"><strong>Total Amount:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">$${totalPrice.toFixed(2)}</span></p>
                    `}
                </div>
            </div>

            <!-- CUSTOMER DETAILS SECTION -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 25px;">
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #4a90e2;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">👤 Customer Details</h3>
                    <p style="margin: 8px 0;"><strong>Name:</strong> ${orderInfo.customerName}</p>
                    <p style="margin: 8px 0;"><strong>Phone:</strong> ${orderInfo.customerPhone || 'N/A'}</p>
                    <p style="margin: 8px 0;"><strong>Email:</strong> ${orderInfo.customerEmail || 'N/A'}</p>
                    <p style="margin: 8px 0;"><strong>Status:</strong> <span style="background: #e7f3ff; padding: 3px 8px; border-radius: 4px; color: #0066cc;">${orderInfo.status}</span></p>
                </div>

                <!-- DELIVERY DETAILS SECTION -->
                <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border-left: 4px solid #50e3c2;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">🚚 Delivery Details</h3>
                    <p style="margin: 8px 0;"><strong>Delivery Date:</strong> ${orderInfo.deliveryDate}</p>
                    <p style="margin: 8px 0;"><strong>Delivery Time:</strong> ${formatTime(orderInfo.deliveryTime)}</p>
                    <p style="margin: 8px 0;"><strong>Type:</strong> ${orderInfo.deliveryType || 'Pickup'}</p>
                    ${orderInfo.deliveryType === 'Delivery' && orderInfo.deliveryAddress ? `<p style="margin: 8px 0;"><strong>Address:</strong><br><span style="font-size: 14px; color: #555;">${orderInfo.deliveryAddress}</span></p>` : ''}
                </div>
            </div>

            <!-- ITEMS SECTION -->
            <div style="background: #fff5f7; padding: 15px; border-radius: 8px; border-left: 4px solid #dc3545; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">🍽️ Order Items (${menuItems.length})</h3>
                ${itemsHtml}
            </div>

            <!-- INSTRUCTIONS SECTION -->
            <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #6c757d;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">📝 Special Instructions & Allergies</h3>
                <p style="margin: 0; color: #555; line-height: 1.6;">${orderInfo.customerSpecifications || '<em style="color: #999;">None provided.</em>'}</p>
            </div>
        `;
        container.innerHTML = detailsHtml;
    }

    function formatTime(timeString) {
        if (!timeString) return 'No time set';
        const [hourString, minute] = timeString.split(':');
        const hour = +hourString;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minute} ${ampm}`;
    }

    // Force cart display update on page load (for Take Order screen)
    if (document.getElementById('cart-display-section')) {
        window.updateCartDisplay();
    }
});