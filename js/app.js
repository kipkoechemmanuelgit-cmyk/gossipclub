class ChatManager {
    constructor() {
        this.messages = [];
        this.unsubscribe = null;
        this.currentChatUser = null;
        this.initChatListeners();
    }

    initChatListeners() {
        document.getElementById('send-btn').addEventListener('click', () => this.sendMessage());
        
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
    }

    startChatWithUser(user) {
        this.currentChatUser = user;
        this.stopListening();
        this.startListening();
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (!content || !window.authManager?.currentUser || !this.currentChatUser) {
            return;
        }

        try {
            // Generate a unique conversation ID (sorted user IDs to ensure consistency)
            const conversationId = this.generateConversationId(
                window.authManager.currentUser.uid, 
                this.currentChatUser.id
            );

            await db.collection('messages').add({
                content: content,
                senderId: window.authManager.currentUser.uid,
                senderName: window.authManager.currentUser.displayName || window.authManager.currentUser.email,
                receiverId: this.currentChatUser.id,
                receiverName: this.currentChatUser.name || this.currentChatUser.email,
                conversationId: conversationId,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
            this.showError('Failed to send message');
        }
    }

    generateConversationId(userId1, userId2) {
        // Sort user IDs to ensure consistent conversation ID regardless of who starts the chat
        return [userId1, userId2].sort().join('_');
    }

    startListening() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        if (!window.authManager?.currentUser || !this.currentChatUser) {
            return;
        }

        const conversationId = this.generateConversationId(
            window.authManager.currentUser.uid,
            this.currentChatUser.id
        );

        console.log('Starting to listen for messages in conversation:', conversationId);

        // Clear messages container
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.innerHTML = '';

        this.unsubscribe = db.collection('messages')
            .where('conversationId', '==', conversationId)
            .orderBy('timestamp', 'asc')
            .onSnapshot((snapshot) => {
                // Clear existing messages
                messagesContainer.innerHTML = '';
                this.messages = [];

                if (snapshot.empty) {
                    messagesContainer.innerHTML = '<div class="welcome-message"><p>No messages yet. Start the conversation!</p></div>';
                    return;
                }

                snapshot.forEach((doc) => {
                    this.addMessageToUI(doc.data(), doc.id);
                });
            }, (error) => {
                console.error('Error listening to messages:', error);
            });
    }

    addMessageToUI(messageData, messageId) {
        if (this.messages.includes(messageId)) return;
        this.messages.push(messageId);

        const messagesContainer = document.getElementById('messages-container');
        const isCurrentUser = messageData.senderId === window.authManager?.currentUser?.uid;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${isCurrentUser ? 'sent' : 'received'}`;

        const timestamp = messageData.timestamp?.toDate() || new Date();
        const timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageElement.innerHTML = `
            ${!isCurrentUser ? <div class="message-sender">${this.escapeHtml(messageData.senderName)}</div> : ''}
            <div class="message-content">${this.escapeHtml(messageData.content)}</div>
            <div class="message-info">
                <span>${timeString}</span>
            </div>
        `;

        messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messages-container');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showError(message) {
        const messagesContainer = document.getElementById('messages-container');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        messagesContainer.appendChild(errorDiv);

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
        }
        this.messages = [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatManager = new ChatManager();
});
