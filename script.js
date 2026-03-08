// Base URL sesuai dengan panduan Postman
const BASE_URL = 'http://localhost:8000/api';

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
});

async function fetchProducts() {
    const container = document.getElementById('product-list-container');
    if (!container) return; // BERHENTI jika elemen tidak ada di halaman ini

    try {
        container.innerHTML = '<p class="text-center text-muted">Memuat produk...</p>';
        const response = await fetch(`${BASE_URL}/products`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) throw new Error('Network response was not ok');

        const result = await response.json();
        
        // Asumsi data produk ada di result.data (sesuaikan jika struktur JSON backend berbeda)
        const products = result.data || result; 
        
        renderProducts(products, container);
    } catch (error) {
        console.error('Gagal memuat produk:', error);
        container.innerHTML = '<p class="text-center text-danger">Gagal memuat daftar produk.</p>';
    }
}

// Gantikan fungsi initRegisterPage yang lama dengan ini
// Perbaikan initRegisterPage sesuai Database Anda
function initRegisterPage() {
    const form = document.getElementById('registerForm');
    if (!form) return; // BERHENTI jika bukan di halaman Register

    const fullNameInput = document.getElementById('regFullName'); // Sesuai kolom 'name' di DB
    const emailInput = document.getElementById('regEmail');
    const passwordInput = document.getElementById('regPassword');
    const submitBtn = document.getElementById('registerBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.classList.add('loading');

        try {
            const response = await fetch('http://localhost:8000/api/register', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: fullNameInput.value.trim(), // Kolom name di DB
                    email: emailInput.value,
                    password: passwordInput.value
                })
            });

            const result = await response.json();
            if (response.ok) {
                Toast.success('Berhasil!', 'Akun terdaftar, silakan login.');
                setTimeout(() => window.location.href = 'login.html', 1500);
            } else {
                Toast.error('Gagal', result.message || 'Cek kembali data Anda.');
            }
        } catch (error) {
            Toast.error('Error', 'Server tidak terjangkau.');
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
}

// Gantikan fungsi initLoginPage yang lama dengan ini
function initLoginPage() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const submitBtn = document.getElementById('loginBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.classList.add('loading');

        try {
            const response = await fetch('http://localhost:8000/api/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passwordInput.value,
                    device_name: 'web_browser' // Opsional sesuai API doc
                })
            });

            const result = await response.json();

            if (response.ok) {
                // SIMPAN TOKEN KE LOCAL STORAGE
                localStorage.setItem('auth_token', result.token); // Sesuaikan 'result.token' dengan respon JSON API Anda
                
                Toast.success('Berhasil!', 'Login sukses.');
                setTimeout(() => window.location.href = 'index.html', 1000); // Arahkan ke homepage
            } else {
                Toast.error('Gagal Masuk', result.message || 'Email atau password salah.');
                form.style.animation = 'shake 0.4s ease';
                setTimeout(() => { form.style.animation = ''; }, 400);
            }
        } catch (error) {
            Toast.error('Error', 'Gagal terhubung ke server.');
        } finally {
            submitBtn.classList.remove('loading');
        }
    });
}

function renderProducts(products, container) {
    container.innerHTML = ''; // Kosongkan tulisan "Memuat produk..."

    if (products.length === 0) {
        container.innerHTML = '<p class="text-center">Belum ada produk yang tersedia.</p>';
        return;
    }

    products.forEach((product) => {
        // Format harga ke Rupiah
        const harga = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(product.price);
        
        // Render card produk (Sederhana, tanpa carousel per item agar lebih ringan)
        const productHTML = `
            <div class="col-sm-3 mb-3">
                <div class="card border-0">
                    <a href="detail.html?id=${product.id}">
                        <img src="${product.image || '/assets/kmjputih.jpg'}" class="card-img-top d-block w-100" alt="${product.name}" style="object-fit: cover; aspect-ratio: 3/4;">
                    </a>
                    
                    <div class="card-body text-center font-b612">
                        <a href="detail.html?id=${product.id}" class="text-decoration-none text-dark">
                            <p class="card-text mb-2 text-uppercase teks-judul">${product.name}</p>
                        </a>
                        <p class="card-text text-uppercase teks-harga">${harga}</p>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

function isiPencarian(kataKunci) {
    var kotakInput = document.getElementById('inputPencarian');
    if (kotakInput) {
        kotakInput.value = kataKunci;
        kotakInput.focus();
    }
}

// ===== Storage Keys =====
const STORAGE_KEYS = {
    USERS: 'ambatysm_users',
    CURRENT_USER: 'ambatysm_current_user',
    SESSION: 'ambatysm_session'
};

// ===== User Database (localStorage) =====
class UserDB {
    static getUsers() {
        const data = localStorage.getItem(STORAGE_KEYS.USERS);
        return data ? JSON.parse(data) : [];
    }

    static saveUsers(users) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }

    static findByEmail(email) {
        const users = this.getUsers();
        return users.find(u => u.email.toLowerCase() === email.toLowerCase());
    }

    static createUser(name, email, password) {
        const users = this.getUsers();

        if (this.findByEmail(email)) {
            return { success: false, message: 'Email sudah terdaftar. Silakan gunakan email lain.' };
        }

        const newUser = {
            id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: this.hashPassword(password),
            provider: 'email',
            photoURL: null,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        users.push(newUser);
        this.saveUsers(users);

        return { success: true, user: newUser, message: 'Registrasi berhasil! Silakan masuk.' };
    }

    // Create or update user from Google Sign-In
    static createOrUpdateGoogleUser(googleUser) {
        const users = this.getUsers();
        const existingIdx = users.findIndex(u => u.email.toLowerCase() === googleUser.email.toLowerCase());

        if (existingIdx >= 0) {
            // Update existing user with Google info
            users[existingIdx].name = googleUser.displayName || users[existingIdx].name;
            users[existingIdx].photoURL = googleUser.photoURL || users[existingIdx].photoURL;
            users[existingIdx].provider = 'google';
            users[existingIdx].googleUid = googleUser.uid;
            users[existingIdx].lastLogin = new Date().toISOString();
            this.saveUsers(users);
            return users[existingIdx];
        } else {
            // Create new user from Google
            const newUser = {
                id: 'google_' + googleUser.uid,
                name: googleUser.displayName || 'Google User',
                email: googleUser.email.toLowerCase(),
                password: null,
                provider: 'google',
                googleUid: googleUser.uid,
                photoURL: googleUser.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString()
            };
            users.push(newUser);
            this.saveUsers(users);
            return newUser;
        }
    }

    static authenticate(email, password) {
        const user = this.findByEmail(email);

        if (!user) {
            return { success: false, message: 'Email tidak ditemukan. Silakan daftar terlebih dahulu.' };
        }

        if (user.provider === 'google' && !user.password) {
            return { success: false, message: 'Akun ini terdaftar melalui Google. Silakan masuk dengan Google.' };
        }

        if (user.password !== this.hashPassword(password)) {
            return { success: false, message: 'Kata sandi salah. Silakan coba lagi.' };
        }

        const users = this.getUsers();
        const idx = users.findIndex(u => u.id === user.id);
        users[idx].lastLogin = new Date().toISOString();
        this.saveUsers(users);

        return { success: true, user: users[idx], message: 'Login berhasil!' };
    }

    static hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
    }

    static setSession(user) {
        const session = {
            userId: user.id,
            name: user.name,
            email: user.email,
            provider: user.provider || 'email',
            photoURL: user.photoURL || null,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(session));
        localStorage.setItem(STORAGE_KEYS.SESSION, 'active');
    }

    static getSession() {
        const session = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        const status = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (session && status === 'active') {
            return JSON.parse(session);
        }
        return null;
    }

    static clearSession() {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        localStorage.removeItem(STORAGE_KEYS.SESSION);
    }

    static isLoggedIn() {
        return this.getSession() !== null;
    }
}

// ===== Firebase Google Sign-In =====
class FirebaseGoogleAuth {

    static isConfigured() {
        try {
            // Check if firebase is loaded and configured
            if (typeof firebase === 'undefined') return false;
            const app = firebase.app();
            const config = app.options;
            return config.apiKey && config.apiKey !== 'YOUR_API_KEY';
        } catch (e) {
            return false;
        }
    }

    static async signInWithGoogle() {
        if (!this.isConfigured()) {
            Toast.error(
                'Firebase Belum Dikonfigurasi',
                'Silakan isi konfigurasi Firebase di file firebase-config.js terlebih dahulu.'
            );
            return { success: false };
        }

        try {
            const result = await auth.signInWithPopup(googleProvider);
            const firebaseUser = result.user;

            // Save/update user in local DB
            const localUser = UserDB.createOrUpdateGoogleUser({
                uid: firebaseUser.uid,
                displayName: firebaseUser.displayName,
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL
            });

            // Set local session
            UserDB.setSession(localUser);

            return {
                success: true,
                user: localUser,
                message: `Selamat datang, ${localUser.name}!`
            };
        } catch (error) {
            console.error('Google Sign-In Error:', error);

            let message = 'Terjadi kesalahan saat masuk dengan Google.';

            switch (error.code) {
                case 'auth/popup-closed-by-user':
                    message = 'Popup login ditutup. Silakan coba lagi.';
                    break;
                case 'auth/popup-blocked':
                    message = 'Popup diblokir oleh browser. Izinkan popup untuk situs ini.';
                    break;
                case 'auth/cancelled-popup-request':
                    message = 'Permintaan login dibatalkan.';
                    break;
                case 'auth/network-request-failed':
                    message = 'Gagal terhubung ke jaringan. Periksa koneksi internet Anda.';
                    break;
                case 'auth/unauthorized-domain':
                    message = 'Domain ini belum diizinkan di Firebase. Tambahkan domain di Firebase Console > Authentication > Settings > Authorized domains.';
                    break;
                case 'auth/internal-error':
                    message = 'Terjadi kesalahan internal. Pastikan konfigurasi Firebase sudah benar.';
                    break;
                default:
                    message = `Error: ${error.message}`;
            }

            return { success: false, message };
        }
    }

    static async signOut() {
        try {
            if (this.isConfigured()) {
                await auth.signOut();
            }
        } catch (e) {
            console.error('Firebase sign out error:', e);
        }
    }
}

// ===== Toast Notification System =====
class Toast {
    static container = null;

    static init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    }

    static show(type, title, message, duration = 4000) {
        this.init();

        const icons = {
            success: '✅',
            error: '❌',
            info: 'ℹ️'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.innerHTML = `
      <span class="toast__icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast__content">
        <div class="toast__title">${title}</div>
        <div class="toast__message">${message}</div>
      </div>
      <button class="toast__close" onclick="Toast.dismiss(this.parentElement)">✕</button>
    `;

        this.container.appendChild(toast);

        setTimeout(() => {
            if (toast.parentElement) {
                this.dismiss(toast);
            }
        }, duration);
    }

    static dismiss(toastEl) {
        toastEl.classList.add('removing');
        setTimeout(() => {
            if (toastEl.parentElement) {
                toastEl.parentElement.removeChild(toastEl);
            }
        }, 300);
    }

    static success(title, message) { this.show('success', title, message); }
    static error(title, message) { this.show('error', title, message); }
    static info(title, message) { this.show('info', title, message); }
}

// ===== Form Validation =====
class Validator {
    static isValidEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    static isValidPassword(password) {
        return password.length >= 6;
    }

    static isValidName(name) {
        return name.trim().length >= 2;
    }

    static validateField(input, validationFn, errorMsg) {
        const errorEl = input.parentElement.querySelector('.form-error') ||
            input.closest('.form-group').querySelector('.form-error');

        if (!validationFn(input.value)) {
            input.classList.add('error');
            input.classList.remove('success');
            if (errorEl) {
                errorEl.textContent = errorMsg;
                errorEl.classList.add('visible');
            }
            return false;
        } else {
            input.classList.remove('error');
            input.classList.add('success');
            if (errorEl) {
                errorEl.classList.remove('visible');
            }
            return true;
        }
    }
}

// ===== Google Sign-In Handler (shared across pages) =====
async function handleGoogleSignIn() {
    const result = await FirebaseGoogleAuth.signInWithGoogle();

    if (result.success) {
        Toast.success('Login Google Berhasil!', result.message);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    } else if (result.message) {
        Toast.error('Gagal Login Google', result.message);
    }
}

// ===== Login Page =====

// ===== Register Page =====

// ===== Dashboard Page =====
function initDashboard() {
    const session = UserDB.getSession();

    if (!session) {
        window.location.href = 'index.html';
        return;
    }

    const avatarEl = document.getElementById('dashAvatar');
    const nameEl = document.getElementById('dashName');
    const emailEl = document.getElementById('dashEmail');
    const joinDateEl = document.getElementById('dashJoinDate');
    const lastLoginEl = document.getElementById('dashLastLogin');
    const providerEl = document.getElementById('dashProvider');
    const photoEl = document.getElementById('dashPhoto');

    const user = UserDB.findByEmail(session.email);

    // Avatar - use Google photo if available, otherwise initial
    if (session.photoURL && photoEl) {
        photoEl.src = session.photoURL;
        photoEl.style.display = 'block';
        if (avatarEl) avatarEl.style.display = 'none';
    } else if (avatarEl) {
        avatarEl.textContent = session.name.charAt(0).toUpperCase();
    }

    if (nameEl) nameEl.textContent = 'Selamat Datang, ' + session.name + '!';
    if (emailEl) emailEl.textContent = session.email;

    if (joinDateEl && user) {
        joinDateEl.textContent = new Date(user.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    if (lastLoginEl && user && user.lastLogin) {
        lastLoginEl.textContent = new Date(user.lastLogin).toLocaleString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    if (providerEl) {
        const provider = session.provider || 'email';
        if (provider === 'google') {
            providerEl.innerHTML = '<span style="color: #4285F4;">● Google</span>';
        } else {
            providerEl.innerHTML = '<span style="color: #00cc66;">● Email</span>';
        }
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // Sign out from Firebase too
            await FirebaseGoogleAuth.signOut();
            UserDB.clearSession();
            Toast.info('Keluar', 'Anda telah berhasil keluar.');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 800);
        });
    }
}

// ===== Password Toggle =====
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const btn = input.parentElement.querySelector('.password-toggle');

    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁️';
    }
}

// ===== Update Google button status =====
function updateGoogleButtonStatus() {
    const googleBtns = document.querySelectorAll('.btn-social--google');
    googleBtns.forEach(btn => {
        if (FirebaseGoogleAuth.isConfigured()) {
            btn.classList.add('configured');
            btn.classList.remove('not-configured');
        } else {
            btn.classList.add('not-configured');
        }
    });
}

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    }
});

// ===== Mobile Menu Toggle =====
function toggleMobileMenu() {
    const navLinks = document.querySelector('.navbar__links');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

// ===== Format Rupiah Helper =====
function formatRupiah(num) {
    return 'Rp ' + num.toLocaleString('id-ID');
}

// ===== Cart Data (Sample) =====
function getDefaultCartItems() {
    return [
        { id: 1, name: 'Kemeja Putih', size: 'L', price: 199000, qty: 2, store: 'Micel Store', image: 'assets/kmjputih.jpg', checked: true },
        { id: 2, name: 'Kemeja Putih', size: 'M', price: 199000, qty: 1, store: 'Aurel Store', image: 'assets/kmjputih.jpg', checked: false },
        { id: 3, name: 'Kemeja Putih', size: 'L', price: 199000, qty: 2, store: 'el Store', image: 'assets/kmjputih.jpg', checked: true },
        { id: 4, name: 'Kemeja Putih', size: 'XL', price: 199000, qty: 5, store: 'Dan Store', image: 'assets/kmjputih.jpg', checked: true },
        { id: 5, name: 'Kemeja Putih', size: 'L', price: 199000, qty: 3, store: 'Ika Store', image: 'assets/kmjputih.jpg', checked: false },
    ];
}

function getCartItems() {
    const saved = localStorage.getItem('ambatysm_cart');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const defaults = getDefaultCartItems();
    localStorage.setItem('ambatysm_cart', JSON.stringify(defaults));
    return defaults;
}

function saveCartItems(items) {
    localStorage.setItem('ambatysm_cart', JSON.stringify(items));
}

// ===== CART PAGE =====
function initCartPage() {
    const container = document.getElementById('cartItemsContainer');
    const emptyState = document.getElementById('cartEmpty');
    const bottomBar = document.getElementById('cartBottom');
    if (!container) return;

    let cartItems = getCartItems();

    function render() {
        if (cartItems.length === 0) {
            container.style.display = 'none';
            bottomBar.style.display = 'none';
            emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        bottomBar.style.display = 'flex';
        emptyState.style.display = 'none';

        container.innerHTML = cartItems.map((item, i) => `
            <div class="cart-item" data-index="${i}">
                <div class="cart-item__checkbox">
                    <input type="checkbox" id="cartCheck${i}" ${item.checked ? 'checked' : ''} onchange="toggleCartItem(${i})">
                </div>
                <div class="cart-item__image">
                    <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item__details">
                    <p class="cart-item__name">${item.name}</p>
                    <p class="cart-item__size">SIZE : ${item.size}</p>
                    <p class="cart-item__price">${formatRupiah(item.price)}</p>
                    <div class="cart-item__store">
                        <span class="cart-item__store-dot"></span>
                        <span>${item.store}</span>
                    </div>
                </div>
                <div class="cart-item__right">
                    <div class="cart-item__qty">
                        <button class="cart-item__qty-btn" onclick="changeQty(${i}, -1)">−</button>
                        <span class="cart-item__qty-value">${item.qty}</span>
                        <button class="cart-item__qty-btn" onclick="changeQty(${i}, 1)">+</button>
                    </div>
                    <span class="cart-item__subtotal">${formatRupiah(item.price * item.qty)}</span>
                </div>
            </div>
        `).join('');

        updateCartTotal();
    }

    function updateCartTotal() {
        const total = cartItems
            .filter(item => item.checked)
            .reduce((sum, item) => sum + (item.price * item.qty), 0);
        document.getElementById('cartTotalPrice').textContent = formatRupiah(total);
    }

    // Expose globally
    window.toggleCartItem = function(index) {
        cartItems[index].checked = !cartItems[index].checked;
        saveCartItems(cartItems);
        updateCartTotal();
    };

    window.changeQty = function(index, delta) {
        cartItems[index].qty = Math.max(1, cartItems[index].qty + delta);
        saveCartItems(cartItems);
        render();
    };

    render();
}

function goToCheckout() {
    const cartItems = getCartItems();
    const selected = cartItems.filter(item => item.checked);
    if (selected.length === 0) {
        Toast.error('Oops!', 'Pilih minimal 1 item untuk checkout.');
        return;
    }
    localStorage.setItem('ambatysm_checkout', JSON.stringify(selected));
    window.location.href = 'checkout.html';
}

// ===== CHECKOUT PAGE =====
function initCheckoutPage() {
    const container = document.getElementById('checkoutItems');
    if (!container) return;

    const saved = localStorage.getItem('ambatysm_checkout');
    let checkoutItems = [];
    if (saved) {
        try { checkoutItems = JSON.parse(saved); } catch (e) { /* ignore */ }
    }

    if (checkoutItems.length === 0) {
        checkoutItems = getCartItems().filter(item => item.checked);
    }

    // Group by store
    const storeGroups = {};
    checkoutItems.forEach(item => {
        if (!storeGroups[item.store]) storeGroups[item.store] = [];
        storeGroups[item.store].push(item);
    });

    // Render store groups
    let storeHTML = '';
    Object.keys(storeGroups).forEach(storeName => {
        const items = storeGroups[storeName];
        storeHTML += `
            <div class="checkout-store-group">
                <div class="checkout-store-header">
                    <span class="checkout-store-header__dot"></span>
                    <span class="checkout-store-header__name">${storeName}</span>
                </div>
                ${items.map(item => `
                    <div class="checkout-product">
                        <div class="checkout-product__image">
                            <img src="${item.image}" alt="${item.name}">
                        </div>
                        <div class="checkout-product__info">
                            <p class="checkout-product__name">${item.name}</p>
                            <p class="checkout-product__size">SIZE : ${item.size}</p>
                            <p class="checkout-product__price">${formatRupiah(item.price)}</p>
                        </div>
                        <div class="checkout-product__right">
                            <span class="checkout-product__qty">x${item.qty}</span>
                            <span class="checkout-product__subtotal">${formatRupiah(item.price * item.qty)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    });
    container.innerHTML = storeHTML;

    // Calculate subtotal
    const subtotal = checkoutItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    function updateTotals() {
        const shippingRadio = document.querySelector('input[name="shipping"]:checked');
        const shippingCost = shippingRadio ? parseInt(shippingRadio.value) : 49000;
        const total = subtotal + shippingCost;

        document.getElementById('checkoutSubtotal').textContent = formatRupiah(subtotal);
        document.getElementById('checkoutShipping').textContent = formatRupiah(shippingCost);
        document.getElementById('checkoutTotal').textContent = formatRupiah(total);
        document.getElementById('checkoutBottomTotal').textContent = formatRupiah(total);

        // Save for payment page
        localStorage.setItem('ambatysm_payment_total', total.toString());
    }

    // Shipping option listeners
    document.querySelectorAll('input[name="shipping"]').forEach(radio => {
        radio.addEventListener('change', () => {
            // Update card active states
            document.querySelectorAll('.checkout-shipping__card').forEach(card => {
                card.classList.remove('checkout-shipping__card--active');
            });
            radio.nextElementSibling.classList.add('checkout-shipping__card--active');
            updateTotals();
        });
    });

    // Payment method — save selection
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', () => {
            localStorage.setItem('ambatysm_payment_method', radio.value);
        });
    });

    updateTotals();
}

function goToPayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (paymentMethod) {
        localStorage.setItem('ambatysm_payment_method', paymentMethod.value);
    }
    window.location.href = 'payment.html';
}

// ===== PAYMENT PAGE =====
function initPaymentPage() {
    const timerMinutes = document.getElementById('timerMinutes');
    const timerSeconds = document.getElementById('timerSeconds');
    const timerProgress = document.getElementById('timerProgress');
    if (!timerMinutes) return;

    // Set total
    const totalStr = localStorage.getItem('ambatysm_payment_total');
    if (totalStr) {
        const total = parseInt(totalStr);
        const el = document.getElementById('paymentTotal');
        if (el) el.textContent = formatRupiah(total);
    }

    // Set payment method badge
    const method = localStorage.getItem('ambatysm_payment_method') || 'QRIS';
    const badge = document.getElementById('paymentMethodBadge');
    if (badge) {
        const icons = {
            'QRIS': 'bi-qr-code',
            'COD': 'bi-cash-coin',
            'Transfer Bank': 'bi-bank',
            'E-Wallet': 'bi-wallet2'
        };
        badge.innerHTML = `<i class="bi ${icons[method] || 'bi-qr-code'}"></i><span>${method}</span>`;
    }

    // Countdown — 10 minutes
    let totalSeconds = 10 * 60;
    const maxSeconds = totalSeconds;

    function updateTimer() {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        timerMinutes.textContent = String(mins).padStart(2, '0');
        timerSeconds.textContent = String(secs).padStart(2, '0');

        const pct = (totalSeconds / maxSeconds) * 100;
        timerProgress.style.width = pct + '%';

        if (totalSeconds <= 0) {
            clearInterval(timerInterval);
            timerMinutes.textContent = '00';
            timerSeconds.textContent = '00';
            Toast.error('Waktu Habis', 'Silakan buat pesanan ulang.');
        }

        totalSeconds--;
    }

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

function confirmPayment() {
    // Generate order number
    const now = new Date();
    const orderNum = 'AMB-' + now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') + '-' +
        String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');

    localStorage.setItem('ambatysm_order_number', orderNum);
    window.location.href = 'payment-success.html';
}

// ===== PAYMENT SUCCESS PAGE =====
function initPaymentSuccessPage() {
    // Fill in order details
    const orderNum = localStorage.getItem('ambatysm_order_number') || 'AMB-00000000-000';
    const total = localStorage.getItem('ambatysm_payment_total') || '0';
    const method = localStorage.getItem('ambatysm_payment_method') || 'QRIS';

    const orderEl = document.getElementById('orderNumber');
    const totalEl = document.getElementById('successTotal');
    const methodEl = document.getElementById('successMethod');

    if (orderEl) orderEl.textContent = orderNum;
    if (totalEl) totalEl.textContent = formatRupiah(parseInt(total));
    if (methodEl) methodEl.textContent = method;

    // Trigger confetti
    launchConfetti();

    // Clean up localStorage (optional)
    // localStorage.removeItem('ambatysm_checkout');
    // localStorage.removeItem('ambatysm_payment_total');
    // localStorage.removeItem('ambatysm_payment_method');
}

// ===== Confetti Animation =====
function launchConfetti() {
    const canvas = document.getElementById('confettiCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#e67e22', '#222222'];
    const particles = [];
    const particleCount = 120;

    for (let i = 0; i < particleCount; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 6 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            vx: (Math.random() - 0.5) * 4,
            vy: Math.random() * 3 + 2,
            rotate: Math.random() * 360,
            rotateSpeed: (Math.random() - 0.5) * 10,
            opacity: 1
        });
    }

    let frame = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    function animate() {
        frame++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05; // gravity
            p.rotate += p.rotateSpeed;

            if (frame > maxFrames - 60) {
                p.opacity = Math.max(0, p.opacity - 0.02);
            }

            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotate * Math.PI) / 180);
            ctx.globalAlpha = p.opacity;
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });

        if (frame < maxFrames) {
            requestAnimationFrame(animate);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    animate();

    // Handle resize
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}