class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListeners();
    }

    initAuthListeners() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            if (user) {
                this.currentUser = user;
                this.showApp();
                this.updateUserDisplay(user);
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        });

        // Login form
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // Signup form
        document.getElementById('signup-btn').addEventListener('click', () => this.signup());
        document.getElementById('signup-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.signup();
        });

        // Form switches
        document.getElementById('show-signup').addEventListener('click', () => this.showSignupForm());
        document.getElementById('show-login').addEventListener('click', () => this.showLoginForm());

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());
    }

    async login() {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        try {
            const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signInWithEmailAndPassword(auth, email, password);
            this.clearAuthForms();
        } catch (error) {
            this.showError(this.getAuthErrorMessage(error));
        }
    }

    async signup() {
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        try {
            const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update user profile
            await updateProfile(userCredential.user, {
                displayName: name
            });

            // Create user document in Firestore
            await setDoc(doc(db, 'users', userCredential.user.uid), {
                name: name,
                email: email,
                createdAt: serverTimestamp()
            });

            this.clearAuthForms();
        } catch (error) {
            this.showError(this.getAuthErrorMessage(error));
        }
    }

    async logout() {
        try {
            const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
            await signOut(auth);
        } catch (error) {
            this.showError(this.getAuthErrorMessage(error));
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('app-container').classList.add('hidden');
    }

    showApp() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    }

    showSignupForm() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    }

    updateUserDisplay(user) {
        const usernameElement = document.getElementById('username');
        const userAvatar = document.getElementById('user-avatar');
        
        usernameElement.textContent = user.displayName || 'User';
        
        if (user.displayName) {
            const initials = user.displayName.split(' ').map(n => n[0]).join('').toUpperCase();
            userAvatar.textContent = initials;
            userAvatar.style.backgroundColor = this.getRandomColor();
        } else {
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            userAvatar.style.backgroundColor = '';
        }
    }

    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    clearAuthForms() {
        document.getElementById('login-email').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('signup-name').value = '';
        document.getElementById('signup-email').value = '';
        document.getElementById('signup-password').value = '';
    }

    showError(message) {
        // Remove any existing error messages
        const existingError = document.querySelector('.error');
        if (existingError) {
            existingError.remove();
        }

        // Create and show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;

        const authBox = document.querySelector('.auth-box');
        authBox.insertBefore(errorDiv, authBox.firstChild);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    getAuthErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'This email is already registered';
            case 'auth/weak-password':
                return 'Password is too weak';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            default:
                return error.message || 'An error occurred';
        }
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be available
    if (typeof auth !== 'undefined') {
        window.authManager = new AuthManager();
    } else {
        // Retry after a short delay if Firebase isn't ready
        setTimeout(() => {
            if (typeof auth !== 'undefined') {
                window.authManager = new AuthManager();
            }
        }, 500);
    }
});