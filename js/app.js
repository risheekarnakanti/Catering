document.addEventListener('DOMContentLoaded', () => {
    // This is your specific API URL.
    const API_BASE_URL = 'https://72thsowis3.execute-api.us-east-1.amazonaws.com/dev';
    
    // Initialize cart
    window.orderCart = [];

    // ===== NOTIFICATION SYSTEM =====
    window.showNotification = function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = message;
        
        // Set styles based on type
        let bgColor, borderColor, icon;
        if (type === 'success') {
            bgColor = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            borderColor = '#20c997';
            icon = '✓';
        } else if (type === 'error') {
            bgColor = 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)';
            borderColor = '#c82333';
            icon = '✕';
        } else {
            bgColor = 'linear-gradient(135deg, #4a90e2 0%, #50e3c2 100%)';
            borderColor = '#50e3c2';
            icon = 'ℹ';
        }
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            background: ${bgColor};
            color: white;
            border-left: 4px solid ${borderColor};
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };

    // Add animations to page
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

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
            radio.addEventListener('change', window.updateDiscountSummary);
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
        window.showNotification(`✓ ${item.itemName} (${item.sizeName}) added to cart!`, 'success');
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
            window.orderCart.forEach((item, index) => {
                const itemPrice = parseFloat(item.price) || 0;
                const itemTotal = (itemPrice * item.quantity).toFixed(2);
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
            console.log(`Item: ${item.itemName}, Price: ${itemPrice}, Qty: ${item.quantity}`);
        });
        
        console.log('Cart subtotal:', subtotal);
        
        // Get selected discount
        let discountPercent = 0;
        discountRadios.forEach(radio => {
            if (radio.checked) {
                discountPercent = parseFloat(radio.value);
                console.log('Selected discount:', discountPercent + '%');
            }
        });
        
        if (discountPercent > 0) {
            const discountAmount = (subtotal * discountPercent / 100);
            const totalAfterDiscount = subtotal - discountAmount;
            
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

                const categoryHtml = `
                    <div class="menu-category">
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
                        window.showNotification('⚠ Please enter a quantity of at least 1', 'error');
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
        if (orderData.items.length === 0) {
            window.showNotification('⚠ Please add items to your cart before saving the order', 'error');
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
            window.showNotification(`✓ Order successfully created! Order ID: ${result.orderId}`, 'success');
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
            window.showNotification('⚠ You must add at least one size and price', 'error');
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
            window.showNotification(`✓ Menu item "${result.itemName}" created successfully!`, 'success');
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
        if (!orderInfo) {
            container.innerHTML = '<p style="color: red;">Order data is incomplete.</p>';
            return;
        }

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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #ddd;">
                <h2 style="margin: 0;">Order #${orderInfo.orderId}</h2>
                <div style="font-size: 32px; font-weight: bold; color: #28a745;">$${Number(orderInfo.totalPrice).toFixed(2)}</div>
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

            <!-- PRICE SECTION -->
            <div style="background: #fffbf0; padding: 15px; border-radius: 8px; border-left: 4px solid #f09819; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #333; font-size: 16px; margin-bottom: 12px;">💰 Pricing</h3>
                ${orderInfo.discountPercent && orderInfo.discountPercent > 0 ? `
                    <p style="margin: 8px 0;"><strong>Subtotal:</strong> <span style="font-size: 18px; color: #666;">$${Number(orderInfo.subtotal).toFixed(2)}</span></p>
                    <p style="margin: 8px 0;"><strong>Cash Discount (${orderInfo.discountPercent}%):</strong> <span style="font-size: 18px; color: #ff6a3d; font-weight: 600;">-$${Number(orderInfo.discountAmount).toFixed(2)}</span></p>
                    <p style="margin: 8px 0; padding-top: 10px; border-top: 2px dashed #ddd;"><strong>Total Amount:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">$${Number(orderInfo.totalPrice).toFixed(2)}</span></p>
                ` : `
                    <p style="margin: 8px 0;"><strong>Total Amount:</strong> <span style="font-size: 24px; color: #28a745; font-weight: bold;">$${Number(orderInfo.totalPrice).toFixed(2)}</span></p>
                `}
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