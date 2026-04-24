document.addEventListener('DOMContentLoaded', () => {
    // 1. Toast Notification Setup
    const setupToast = () => {
        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: var(--primary-color, #10b981);
            color: var(--white, #ffffff);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            z-index: 1000;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        toast.innerHTML = `<span style="font-size: 1.2rem;">🛒</span> Item added to cart!`;
        document.body.appendChild(toast);
        return toast;
    };

    const toastElement = setupToast();
    let toastTimeout;

    window.showToast = (msg) => {
        if(msg) toastElement.innerHTML = `<span style="font-size: 1.2rem;">✅</span> ${msg}`;
        else toastElement.innerHTML = `<span style="font-size: 1.2rem;">🛒</span> Item added to cart!`;
        
        clearTimeout(toastTimeout);
        toastElement.style.transform = 'translateY(0)';
        toastElement.style.opacity = '1';
        toastTimeout = setTimeout(() => {
            toastElement.style.transform = 'translateY(100px)';
            toastElement.style.opacity = '0';
        }, 3000);
    };

    // 2. Real Dynamic Cart Logic
    const cartCountElement = document.getElementById('cart-count');
    let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    
    if(cartCountElement) {
        cartCountElement.textContent = cartItems.length;
    }

    window.realAddToCart = (phoneObj) => {
        cartItems.push(phoneObj);
        localStorage.setItem('cartItems', JSON.stringify(cartItems));
        
        if(cartCountElement) {
            cartCountElement.textContent = cartItems.length;
            cartCountElement.parentElement.style.transform = 'scale(1.1)';
            setTimeout(() => {
                cartCountElement.parentElement.style.transform = 'scale(1)';
            }, 200);
        }
        window.showToast();
    };

    // 3. Checkout Form Validation
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const errorMsg = document.getElementById('form-error');
            
            if (checkoutForm.checkValidity()) {
                if(errorMsg) errorMsg.style.display = 'none';
                
                const submitBtn = checkoutForm.querySelector('button[type="submit"]');
                submitBtn.textContent = 'Processing...';
                submitBtn.disabled = true;
                submitBtn.style.opacity = '0.7';

                submitCheckoutOrder(e);
            } else {
                if(errorMsg) errorMsg.style.display = 'block';
                checkoutForm.reportValidity();
            }
        });
    }

    // 4. Mobile Hamburger Menu Toggle
    const header = document.querySelector('header');
    if (header && !document.querySelector('.menu-toggle')) {
        const hamburger = document.createElement('button');
        hamburger.className = 'menu-toggle';
        hamburger.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
        hamburger.style.cssText = `
            background: none;
            border: none;
            cursor: pointer;
            display: none;
            color: var(--text-main, #f8fafc);
            padding: 0.5rem;
        `;
        const logo = header.querySelector('.logo');
        if(logo) logo.after(hamburger);
        else header.insertBefore(hamburger, header.firstChild);
        
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .menu-toggle { display: block !important; order: 2; margin-left: auto; }
                .nav-links, .auth-buttons { 
                    display: none; flex-direction: column; width: 100%; text-align: center; padding: 1rem 0; order: 3;
                }
                header { flex-wrap: wrap; position: relative; }
                .nav-links.active { display: flex; border-top: 1px solid var(--border-color); margin-top: 1rem; }
                .auth-buttons.active { display: flex; padding-top: 0; }
                .auth-buttons.active a { margin-bottom: 0.5rem; width: 100%; box-sizing: border-box; }
            }
        `;
        document.head.appendChild(style);

        hamburger.addEventListener('click', () => {
            const nav = header.querySelector('.nav-links');
            const auth = header.querySelector('.auth-buttons');
            if(nav && auth) {
                nav.classList.toggle('active');
                auth.classList.toggle('active');
                hamburger.innerHTML = nav.classList.contains('active') 
                    ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                    : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
            }
        });
    }

    if (document.getElementById('dynamic-product-grid')) {
        fetchAndDisplayPhones();
    }
    
    // Auth setup: Show user menu if logged in
    const token = localStorage.getItem('token');
    const authButtons = document.querySelector('.auth-buttons');
    if (token && authButtons) {
        const user = JSON.parse(localStorage.getItem('user'));
        authButtons.innerHTML = `
            <span style="color: var(--text-muted); align-self: center; margin-right: 15px;">Hi, ${user.name}</span>
            <a href="#" onclick="logout()" class="btn btn-outline">Logout</a>
            ${user.isAdmin ? '<a href="admin.html" class="btn btn-primary">Admin Panel</a>' : ''}
        `;
    }
});

const API_URL = 'http://localhost:5000/api';

window.logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};

// Real Dynamic Products Fetch
async function fetchAndDisplayPhones() {
    const grid = document.getElementById('dynamic-product-grid');
    if (!grid) return;

    try {
        const response = await fetch(`${API_URL}/phones`);
        const phones = await response.json();

        grid.innerHTML = ''; 

        phones.forEach(phone => {
            const conditionClass = phone.condition.toLowerCase().replace(' ', '-');
            const formattedPrice = phone.price.toLocaleString('en-IN');
            
            // Note: We stringify the entire phone object to pass it into realAddToCart
            const safePhoneObj = JSON.stringify(phone).replace(/"/g, '&quot;');

            const html = `
            <div class="product-card">
                <span class="condition-badge ${conditionClass}">${phone.condition}</span>
                <img src="${phone.imageUrl}" alt="${phone.name}">
                <h3>${phone.brand}</h3>
                <h2>${phone.name} ${phone.storage}</h2>
                <div class="price">₹${formattedPrice}</div>
                <a href="product-details.html?id=${phone._id}" class="btn btn-outline" style="width: 100%; margin-bottom: 10px;">Details</a>
                <button class="btn btn-primary" style="width: 100%;" onclick="realAddToCart(${safePhoneObj})">Add to Cart</button>
            </div>
            `;
            grid.innerHTML += html;
        });
    } catch (error) {
        console.error('Error fetching phones:', error);
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">Failed to load products.</p>';
    }
}

// User Auth Functions
async function registerUser(name, email, password) {
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            alert('Registration Success! Please login.');
            window.location.href = 'login.html';
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            if(data.user.isAdmin) {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            alert(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Network Error:', error);
    }
}

// Checkout Form Submission (Now Real)
async function submitCheckoutOrder(event) {
    const paymentElement = document.querySelector('input[name="payment"]:checked');
    const paymentMethod = paymentElement ? paymentElement.value : 'credit';

    // Get real cart array
    const cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
    if(cartItems.length === 0) {
        alert("Your cart is empty!");
        window.location.href = 'store.html';
        return;
    }

    const calculatedTotal = cartItems.reduce((sum, item) => sum + item.price, 0);

    const orderDetails = {
        customerDetails: {
            firstName: document.getElementById('fname') ? document.getElementById('fname').value : 'Guest',
            lastName: document.getElementById('lname') ? document.getElementById('lname').value : 'User',
            address: document.getElementById('address') ? document.getElementById('address').value : '123 Main',
            city: document.getElementById('city') ? document.getElementById('city').value : 'City',
            zip: document.getElementById('zip') ? document.getElementById('zip').value : '10001'
        },
        items: cartItems.map(item => ({ name: item.name, quantity: 1, price: item.price })),
        totalPrice: calculatedTotal, 
        paymentMethod: paymentMethod
    };

    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderDetails)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('cartItems', '[]'); // clear cart
            window.location.href = 'order-success.html';
        } else {
            alert('Failed to place order.');
            document.querySelector('button[type="submit"]').textContent = 'Place Order';
            document.querySelector('button[type="submit"]').disabled = false;
        }
    } catch (error) {
        console.error('Network Error:', error);
        alert('Could not connect to the server.');
        document.querySelector('button[type="submit"]').textContent = 'Place Order';
        document.querySelector('button[type="submit"]').disabled = false;
    }
}

async function submitTradeInRequest(brand, model, scratches) {
    try {
        const response = await fetch(`${API_URL}/trade-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ brand, model, scratches })
        });

        const data = await response.json();
        if (response.ok) {
            alert('Trade-in evaluation submitted successfully!');
            window.location.href = 'index.html';
        } else {
            console.error('Submission failed:', data.error);
        }
    } catch (error) {
        console.error('Server error:', error);
    }
}

// Admin Fetch Logic
async function fetchAdminData() {
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Not Authenticated!");
        window.location.href = 'login.html';
        return;
    }

    try {
        // Fetch Orders
        const orderRes = await fetch(`${API_URL}/admin/orders`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if(!orderRes.ok) throw new Error("Not Authorized");
        const orders = await orderRes.json();

        const orderTable = document.getElementById('admin-orders-body');
        if(orderTable) {
            orderTable.innerHTML = '';
            orders.forEach(order => {
                orderTable.innerHTML += `
                    <tr>
                        <td>${order._id.substring(0,8)}</td>
                        <td>${order.customerDetails.firstName} ${order.customerDetails.lastName}</td>
                        <td>${order.items.length} Items</td>
                        <td>₹${order.totalPrice.toLocaleString('en-IN')}</td>
                        <td>${new Date(order.createdAt).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }

        // Fetch Trade-Ins
        const tradeRes = await fetch(`${API_URL}/admin/trade-ins`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tradeIns = await tradeRes.json();
        
        const tradeTable = document.getElementById('admin-tradeins-body');
        if(tradeTable) {
            tradeTable.innerHTML = '';
            tradeIns.forEach(trade => {
                tradeTable.innerHTML += `
                    <tr>
                        <td>${trade._id.substring(0,8)}</td>
                        <td>${trade.brand}</td>
                        <td>${trade.model}</td>
                        <td>${trade.scratches}</td>
                        <td>${new Date(trade.createdAt).toLocaleDateString()}</td>
                    </tr>
                `;
            });
        }

    } catch (error) {
        console.error(error);
        alert("Session Expired or Unauthorized Access");
        window.location.href = 'login.html';
    }
}
