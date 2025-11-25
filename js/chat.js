class ChatManager {
    constructor() {
        this.messages = [];
        this.unsubscribe = null;
        this.initChatListeners();
    }

    initChatListeners() {
        // Send message on button click
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-scroll to bottom when new messages arrive
        this.observeNewMessages();
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (!content || !window.authManager?.currentUser) return;

        try {
            const { doc, addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            await addDoc(collection(db, 'messages'), {
                content: content,
                userId: window.authManager.currentUser.uid,
                userName: window.authManager.currentUser.displayName || 'Anonymous',
                timestamp: serverTimestamp(),
                type: 'text'
            });

            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message. Please try again.');
        }
    }

    startListening() {
        // Stop previous listener if exists
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        // Show loading indicator
        this.showLoading();

        try {
            const { collection, query, orderBy, onSnapshot } = requireFirestore();
            
            // Listen for new messages
            const messagesQuery = query(
                collection(db, 'messages'),
                orderBy('timestamp', 'asc')
            );

            this.unsubscribe = onSnapshot(messagesQuery, 
                (snapshot) => {
                    this.hideLoading();
                    snapshot.docChanges().forEach((change) => {
                        if (change.type === 'added') {
                            this.addMessageToUI(change.doc.data(), change.doc.id);
                        }
                    });
                },
                (error) => {
                    console.error('Error listening to messages:', error);
                    this.showError('Failed to load messages');
                }
            );
        } catch (error) {
            console.error('Error setting up message listener:', error);
        }
    }

    addMessageToUI(messageData, messageId) {
        // Check if message already exists
        if (this.messages.includes(messageId)) return;
        this.messages.push(messageId);

        const chatContainer = document.getElementById('chat-container');
        const isCurrentUser = messageData.userId === window.authManager?.currentUser?.uid;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;
        messageElement.dataset.messageId = messageId;

        const timestamp = messageData.timestamp?.toDate() || new Date();
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            ${!isCurrentUser ? <div class="message-sender">${this.escapeHtml(messageData.userName)}</div> : ''}
            <div class="message-content">${this.escapeHtml(messageData.content)}</div>
            <div class="message-info">
                <span>${timeString}</span>
            </div>
        `;

        chatContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const chatContainer = document.getElementById('chat-container');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    observeNewMessages() {
        const chatContainer = document.getElementById('chat-container');
        const observer = new MutationObserver(() => {
            this.scrollToBottom();
        });

        observer.observe(chatContainer, {
            childList: true,
            subtree: true
        });
    }

    showLoading() {
        const chatContainer = document.getElementById('chat-container');
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading';
        loadingDiv.id = 'loading-messages';
        loadingDiv.textContent = 'Loading messages...';
        chatContainer.appendChild(loadingDiv);
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading-messages');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    showError(message) {
        const chatContainer = document.getElementById('chat-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        chatContainer.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    stopListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.messages = [];
        document.getElementById('chat-container').innerHTML = '';
    }
}

// Helper function to dynamically import Firestore functions
async function requireFirestore() {
    const { collection, query, orderBy, onSnapshot } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    return { collection, query, orderBy, onSnapshot };
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be available
    if (typeof db !== 'undefined') {
        window.chatManager = new ChatManager();
    } else {
        // Retry after a short delay if Firebase isn't ready
        setTimeout(() => {
            if (typeof db !== 'undefined') {
                window.chatManager = new ChatManager();
            }
        }, 500);
    }
});