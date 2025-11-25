class App {
    constructor() {
        this.init();
    }

    init() {
        // Listen for auth state changes to start/stop chat
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, start listening to messages
                setTimeout(() => {
                    if (window.chatManager) {
                        window.chatManager.startListening();
                    }
                }, 1000);
                
                // Add welcome message if this is a new user
                this.addWelcomeMessage(user);
            } else {
                // User is signed out, stop listening to messages
                if (window.chatManager) {
                    window.chatManager.stopListening();
                }
            }
        });

        console.log('Mini WhatsApp app initialized');
    }

    async addWelcomeMessage(user) {
        // Check if this is a new user (created in the last 5 seconds)
        const userCreationTime = user.metadata.creationTime;
        const fiveSecondsAgo = new Date(Date.now() - 5000);
        
        if (new Date(userCreationTime) > fiveSecondsAgo) {
            // Add a welcome message for new users
            try {
                const { doc, getDocs, collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                // Check if welcome message already exists
                const messagesSnapshot = await getDocs(collection(db, 'messages'));
                const welcomeMessageExists = messagesSnapshot.docs.some(doc => 
                    doc.data().userId === 'system'
                );

                if (!welcomeMessageExists) {
                    await addDoc(collection(db, 'messages'), {
                        content: `Welcome to Mini WhatsApp, '${user.displayName || 'User'}! Start chatting with your friends.`,
                        userId: 'system',
                        userName: 'System',
                        timestamp: serverTimestamp(),
                        type: 'system'
                    });
                }
            } catch (error) {
                console.error('Error adding welcome message:', error);
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be available
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        window.app = new App();
    } else {
        // Retry after a short delay if Firebase isn't ready
        setTimeout(() => {
            if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
                window.app = new App();
            }
        }, 500);
    }
});