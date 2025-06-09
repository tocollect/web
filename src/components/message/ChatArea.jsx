import React, { useEffect, useState, useRef, useCallback } from 'react';
import chatService from '../../services/chatService';
import Message from './Message';
import { createConversation } from '../../services/conversationService';

const ChatArea = ({ conversationData, receiverName }) => {
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState('');
    const [typingIndicator, setTypingIndicator] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Desconectado');
    const [loading, setLoading] = useState(false);

    // Referencias
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const processedMessagesRef = useRef(new Set());

    // Extraer datos de la conversación
    const { sender, receiver, conversationId } = conversationData;

    // Función para desplazarse al final de los mensajes
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    // Desplazamiento automático cuando llegan nuevos mensajes
    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Manejo de mensajes recibidos
    const handleMessage = useCallback((msg) => {
        // Verificar si el mensaje es válido y no ha sido procesado
        if (!msg.id || processedMessagesRef.current.has(msg.id)) {
            return;
        }

        // Verificar si el mensaje pertenece a esta conversación
        if (conversationId && msg.conversationId &&
            msg.conversationId.toString() !== conversationId.toString()) {
            return;
        }

        // Añadir el ID del mensaje al conjunto de procesados
        processedMessagesRef.current.add(msg.id);

        const addMessage = () => {
            setMessages(prev => {
                // Verificar si el mensaje ya existe en el array de mensajes
                if (prev.some(existingMsg => existingMsg.id === msg.id)) {
                    return prev;
                }
                return [...prev, msg];
            });

            // Marcar como leído si es necesario
            if (!msg.isRead && msg.senderId !== chatService.currentUser?.id && msg.id) {
                setTimeout(() => chatService.sendReadReceipt(msg.id), 300);
            }
        };

        if (typingIndicator && msg.senderId !== chatService.currentUser?.id) {
            setTimeout(addMessage, 1000);
        } else {
            addMessage();
        }
    }, [typingIndicator, conversationId]);

    // Manejo de indicadores de escritura
    const handleTyping = useCallback((typing) => {
        if (typing?.senderId === chatService.currentUser?.id) return;
        if (conversationId && typing.conversationId &&
            typing.conversationId.toString() !== conversationId.toString()) {
            return;
        }

        setTypingIndicator(`${receiverName} está escribiendo...`);
        setTimeout(() => {
            setTypingIndicator('');
        }, 3000);
    }, [conversationId, receiverName]);

    // Manejo de confirmaciones de lectura
    const handleRead = useCallback((readData) => {
        setMessages((prev) =>
            prev.map((msg) =>
                msg.id === readData.messageId ? { ...msg, isRead: true } : msg
            )
        );
    }, []);

    // Conexión WebSocket y carga inicial
    useEffect(() => {
        let mounted = true;

        // Limpiar mensajes procesados cuando cambia la conversación
        processedMessagesRef.current.clear();
        setMessages([]);
        setTypingIndicator('');

        const connectAndSetupChat = async () => {
            try {
                setLoading(true);

                // Asegurar conexión
                if (!chatService.isConnected()) {
                    await chatService.connect();
                }

                if (!mounted) return;

                setConnectionStatus('Conectado');

                // Configurar listeners
                const unsubscribers = [
                    chatService.onMessage(handleMessage),
                    chatService.onTyping(handleTyping),
                    chatService.onReadReceipt(handleRead),
                    chatService.onConnectionStateChange(({ isConnected, error }) => {
                        if (mounted) {
                            setConnectionStatus(isConnected ? 'Conectado' : (error ? `Error: ${error.message}` : 'Desconectado'));
                        }
                    })
                ];

                // Cargar mensajes existentes si hay conversationId
                if (conversationId) {
                    const msgs = await chatService.loadMessages(conversationId);
                    if (mounted) {
                        setMessages(msgs);
                        // Marcar como leídos los mensajes no leídos que son para nosotros
                        msgs.forEach(msg => {
                            if (!msg.isRead && msg.senderId !== chatService.currentUser?.id && msg.id) {
                                chatService.sendReadReceipt(msg.id);
                            }
                        });
                        chatService.joinChat(conversationId, receiver);
                    }
                }

                return () => unsubscribers.forEach(unsubscribe => unsubscribe());
            } catch (error) {
                console.error('Error al conectar:', error);
                if (mounted) {
                    setConnectionStatus(`Error: ${error.message}`);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        if (receiver) {
            connectAndSetupChat();
        }

        return () => {
            mounted = false;
        };
    }, [conversationId, receiver, handleMessage, handleTyping, handleRead]);

    // Envío de mensajes
    const sendMessage = async (e) => {
        e.preventDefault();

        if (!messageContent.trim()) return;

        try {
            // Limpiar el indicador de escritura
            setTypingIndicator('');
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            // Asegurar que tenemos el currentUser
            if (!chatService.currentUser) {
                await chatService.fetchUserInfo();
            }

            // Validaciones
            if (!receiver) {
                throw new Error('ID del destinatario no especificado');
            }

            if (receiver === chatService.currentUser?.id?.toString()) {
                throw new Error('No puedes enviar un mensaje a ti mismo');
            }

            let currentConversationId = conversationId;

            // Crear conversación si no existe
            if (!currentConversationId) {
                const newConversation = await createConversation(receiver);
                currentConversationId = newConversation.id;
                chatService.joinChat(currentConversationId, receiver);
            }

            // Enviar el mensaje
            const createdMessage = await chatService.createMessage({
                conversationId: currentConversationId,
                senderId: chatService.currentUser.id,
                receiverId: parseInt(receiver, 10),
                text: messageContent.trim()
            });

            // Actualizar el estado local
            const newMessage = {
                id: createdMessage.id,
                senderId: createdMessage.senderId,
                receiverId: createdMessage.receiverId,
                text: createdMessage.text,
                content: createdMessage.text,
                isRead: createdMessage.isRead || false,
                createdAt: createdMessage.createdAt
            };

            setMessages(prevMessages => [...prevMessages, newMessage]);
            setMessageContent('');
        } catch (error) {
            console.error('Error al enviar mensaje:', error.message);
            setConnectionStatus(`Error al enviar mensaje: ${error.message}`);
        }
    };

    // Indicador de escritura
    const handleTypingIndicator = () => {
        if (!conversationId || !receiver) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        chatService.sendTyping(conversationId, receiver);
        typingTimeoutRef.current = setTimeout(() => {
            typingTimeoutRef.current = null;
            setTypingIndicator('');
        }, 2000);
    };

    if (loading) {
        return (
            <div className="chat-area-loading">
                <div className="loading-message">Cargando chat...</div>
            </div>
        );
    }

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div className="chat-with">
                    <strong>{receiverName}</strong>
                </div>
                <div className="connection-status">
                    <span className={connectionStatus === 'Conectado' ? 'connected' : 'disconnected'}>
                        {connectionStatus}
                    </span>
                </div>
            </div>

            <div className="messages-container">
                {messages.map((msg, index) => (
                    <Message
                        key={msg.id || index}
                        message={msg}
                        type={msg.senderId === chatService.currentUser?.id ? 'sent' : 'received'}
                    />
                ))}
                {typingIndicator && (
                    <div className="typing-indicator">{typingIndicator}</div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="message-input-container">
                <input
                    type="text"
                    value={messageContent}
                    onChange={(e) => {
                        setMessageContent(e.target.value);
                        handleTypingIndicator();
                    }}
                    placeholder="Escribe un mensaje..."
                    className="message-input"
                />
                <button type="submit" className="send-button">
                    Enviar
                </button>
            </form>
        </div>
    );
};

export default ChatArea;