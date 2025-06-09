import SockJS from 'sockjs-client';
import { Stomp } from '@stomp/stompjs';
import { api } from '../api/api';

const BASE_URL = "http://localhost:8080";
//const BASE_URL = "https://tocollect.ngrok.app";

class ChatService {
    constructor() {
        this.stompClient = null;
        this.connected = false;
        this.messageHandlers = new Set();
        this.connectionStateHandlers = new Set();
        this.typingHandlers = new Set();
        this.readReceiptHandlers = new Set();
        this.joinHandlers = new Set();
        this.conversationSubscriptions = {};
        this.currentUser = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const jwtToken = localStorage.getItem('jwtToken');
            if (!jwtToken) {
                const error = new Error("No se encontró jwtToken en localStorage.");
                this.notifyConnectionState(false, error);
                return reject(error);
            }

            try {
                const socket = new SockJS(`${BASE_URL}/ws?jwtToken=${encodeURIComponent(jwtToken)}`);
                this.stompClient = Stomp.over(socket);
                this.stompClient.debug = () => {};

                this.stompClient.connect({}, async () => {
                    this.connected = true;
                    await this.fetchUserInfo();

                    // Suscripciones principales
                    this.subscribeToPersonalMessages();
                    this.subscribeToReadReceipts();
                    this.subscribeToTyping();
                    this.subscribeToJoinEvents();

                    this.notifyConnectionState(true);
                    resolve();
                }, (error) => {
                    console.error('Error al conectar WebSocket:', error);
                    this.notifyConnectionState(false, error);
                    reject(error);
                });

                socket.onclose = () => {
                    this.connected = false;
                    this.notifyConnectionState(false);
                };
            } catch (error) {
                console.error('Error al crear socket:', error);
                this.notifyConnectionState(false, error);
                reject(error);
            }
        });
    }

    disconnect() {
        if (this.stompClient && this.stompClient.connected) {
            Object.values(this.conversationSubscriptions).forEach(unsubscribe => unsubscribe());
            this.conversationSubscriptions = {};
            this.stompClient.disconnect(() => {
                this.connected = false;
                this.notifyConnectionState(false);
            });
        }
    }

    isConnected() {
        return this.connected && this.stompClient?.connected;
    }

    async fetchUserInfo() {
        try {
            const { data } = await api.get('/auth/me');
            this.currentUser = data.userAC || data.user || null;
            return this.currentUser;
        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            throw error;
        }
    }

    async loadConversationBetweenUsers(userId) {
        try {
            const { data } = await api.get(`/conversations/between/${this.currentUser?.id}/${userId}`);
            return data;
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error('Error al cargar conversación:', error);
            }
            return null;
        }
    }

    async loadMessages(conversationId) {
        try {
            const { data } = await api.get(`/conversations/${conversationId}/messages`);
            return data;
        } catch (error) {
            console.error('Error al cargar mensajes:', error);
            throw new Error('Error al cargar mensajes');
        }
    }

    async createMessage({ conversationId, senderId, receiverId, text }) {
        try {
            if (!receiverId) {
                throw new Error('El ID del destinatario es requerido');
            }

            if (!senderId) {
                // Si no se proporcionó senderId, usar el ID del usuario actual
                if (!this.currentUser) {
                    await this.fetchUserInfo();
                }
                senderId = this.currentUser.id;
            }

            // Verificar que el remitente no es el mismo que el destinatario
            if (parseInt(senderId, 10) === parseInt(receiverId, 10)) {
                throw new Error('No puedes enviar un mensaje a ti mismo');
            }

            const messageDTO = {
                conversationId: parseInt(conversationId, 10),
                senderId: parseInt(senderId, 10),
                receiverId: parseInt(receiverId, 10),
                text
            };

            const { data: createdMessage } = await api.post('/messages', messageDTO);

            const chatMessage = {
                id: createdMessage.id,
                conversationId: createdMessage.conversationId,
                senderId: createdMessage.senderId,
                receiverId: createdMessage.receiverId,
                content: createdMessage.text,
                text: createdMessage.text,
                type: "CHAT",
                isRead: createdMessage.isRead || false,
                createdAt: createdMessage.createdAt
            };

            if (this.isConnected()) {
                this.stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
            }

            return createdMessage;
        } catch (error) {
            console.error('Error al crear mensaje:', error);
            throw error; // Propagar el error para manejo en el componente
        }
    }

    // Función mejorada para sendTyping en ChatService
    sendTyping(conversationId, receiverId) {
        if (!this.isConnected()) {
            console.warn('No conectado, no se puede enviar typing');
            return;
        }

        if (!this.currentUser?.id) {
            console.warn('No hay usuario actual, no se puede enviar typing');
            return;
        }

        const typing = {
            conversationId: parseInt(conversationId, 10),
            receiverId: parseInt(receiverId, 10),
            senderId: this.currentUser.id,
            type: "TYPING"
        };

        console.log('Enviando typing:', typing); // Para debug

        try {
            this.stompClient.send("/app/chat.typing", {}, JSON.stringify(typing));
        } catch (error) {
            console.error('Error enviando typing:', error);
        }
    }

    sendReadReceipt(messageId) {
        if (!this.isConnected()) return;

        const readEvent = {
            messageId: parseInt(messageId),
            readerId: this.currentUser?.id
        };
        this.stompClient.send("/app/chat.read", {}, JSON.stringify(readEvent));
    }

    joinChat(conversationId, receiverId) {
        if (!this.isConnected()) return;

        const join = {
            conversationId,
            receiverId,
            senderId: this.currentUser?.id,
            type: "JOIN"
        };
        this.stompClient.send("/app/chat.join", {}, JSON.stringify(join));
    }

    subscribeToPersonalMessages() {
        if (!this.isConnected()) return;

        this.stompClient.subscribe("/user/queue/messages", (msg) => {
            const message = JSON.parse(msg.body);
            this.messageHandlers.forEach(cb => cb(message));
        });
    }

    subscribeToReadReceipts() {
        if (!this.isConnected()) return;

        this.stompClient.subscribe("/user/queue/read-receipts", (msg) => {
            const read = JSON.parse(msg.body);
            this.readReceiptHandlers.forEach(cb => cb(read));
        });
    }

    subscribeToTyping() {
        if (!this.isConnected()) return;

        this.stompClient.subscribe("/user/queue/typing", (msg) => {
            const typing = JSON.parse(msg.body);
            this.typingHandlers.forEach(cb => cb(typing));
        });
    }

    subscribeToJoinEvents() {
        if (!this.isConnected()) return;

        this.stompClient.subscribe("/user/queue/join", (msg) => {
            const join = JSON.parse(msg.body);
            this.joinHandlers.forEach(cb => cb(join));
        });
    }

    onMessage(cb) {
        this.messageHandlers.add(cb);
        return () => this.messageHandlers.delete(cb);
    }

    onTyping(cb) {
        this.typingHandlers.add(cb);
        return () => this.typingHandlers.delete(cb);
    }

    onReadReceipt(cb) {
        this.readReceiptHandlers.add(cb);
        return () => this.readReceiptHandlers.delete(cb);
    }

    onJoin(cb) {
        this.joinHandlers.add(cb);
        return () => this.joinHandlers.delete(cb);
    }

    onConnectionStateChange(cb) {
        this.connectionStateHandlers.add(cb);
        return () => this.connectionStateHandlers.delete(cb);
    }

    notifyConnectionState(isConnected, error = null) {
        this.connectionStateHandlers.forEach(cb => cb({ isConnected, error }));
    }
}

const chatService = new ChatService();
export default chatService;