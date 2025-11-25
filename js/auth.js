class AuthManager {
    constructor() {
        this.currentUser = null;
        this.initAuthListeners();
    }

    initAuthListeners() {
        // Listen for auth state changes
        auth.onAuthStateChanged((user) => {
            console.log('Auth state changed:', user ? 'User logged in' : 'No user');
            if (user) {
                this.currentUser = user;
                this.showContacts();
                if (window.contactsManager) {
                    window.contactsManager.setCurrentUser(user);
                    window.contactsManager.loadUsers();
                }
            } else {
                this.currentUser = null;
                this.showAuth();
            }
        });

        // Login form
        document.getElementById('login-btn').addEventListener('click', () => this.login());
        
        // Signup form
        document.getElementById('signup-btn').addEventListener('click', () => this.signup());
        
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
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('Login successful:', userCredential.user);
            this.clearAuthForms();
        } catch (error) {
            console.error('Login error:', error);
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
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            console.log('Signup successful:', userCredential.user);
            
            // Update user profile
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Create user document in Firestore
            await db.collection('users').doc(userCredential.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.clearAuthForms();
        } catch (error) {
            console.error('Signup error:', error);
            this.showError(this.getAuthErrorMessage(error));
        }
    }

    async logout() {
        try {
            await auth.signOut();
            console.log('Logout successful');
        } catch (error) {
            console.error('Logout error:', error);
            this.showError('Logout failed');
        }
    }

    showAuth() {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('contacts-container').classList.add('hidden');
        document.getElementById('chat-container').classList.add('hidden');
    }

    showContacts() {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('contacts-container').classList.remove('hidden');
        document.getElementById('chat-container').classList.add('hidden');
    }

    showLoginForm() {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    }

    showSignupForm() {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
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
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled. Please contact support.';
            default:
                return error.message || 'An error occurred during authentication';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for Firebase to initialize
    setTimeout(() => {
        window.authManager = new AuthManager();
    }, 100);
});
