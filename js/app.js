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
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (!content || !window.authManager?.currentUser) {
            console.log('Cannot send message: no content or user not logged in');
            return;
        }

        try {
            await db.collection('messages').add({
                content: content,
                userId: window.authManager.currentUser.uid,
                userName: window.authManager.currentUser.displayName || 'Anonymous',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
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

        console.log('Starting to listen for messages...');

        // Listen for new messages
        this.unsubscribe = db.collection('messages')
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                this.hideLoading();
                snapshot.docChanges().forEach((change) => {
                    if (change.type === 'added') {
                        this.addMessageToUI(change.doc.data(), change.doc.id);
                    }
                });
            }, (error) => {
                console.error('Error listening to messages:', error);
                this.showError('Failed to load messages. Please refresh the page.');
            });
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

    showLoading() {
        // Loading element is already in the HTML
        document.getElementById('loading-messages').style.display = 'block';
    }

    hideLoading() {
        const loadingDiv = document.getElementById('loading-messages');
        if (loadingDiv) {
            loadingDiv.style.display = 'none';
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
        const chatContainer = document.getElementById('chat-container');
        chatContainer.innerHTML = '<div class="loading" id="loading-messages">Loading messages...</div>';
    }
}

// Initialize chat manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});
