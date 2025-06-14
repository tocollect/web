import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import chatService from '../../services/chatService';
import Message from './Message';
import { createConversation } from '../../services/conversationService';
import '../../styles/ChatPage.temp.css';
import { AuthContext } from "../../context/AuthContext.jsx";

const Chat = ({ conversationData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const [typingIndicator, setTypingIndicator] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Desconectado');

  const messagesEndRef = useRef(null);
  const processedMessagesRef = useRef(new Set());

  // Referencias para controlar el typing
  const typingTimeoutRef = useRef(null);
  const receiverTypingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    const data = conversationData || location.state;

    if (!data) {
      console.error('Chat: No se recibió estado al entrar al chat');
      navigate('/conversations');
      return;
    }

    const currentReceiverId = data.receiver;
    const currentConversationId = data.conversationId || null;

    setReceiverId(currentReceiverId);
    setConversationId(currentConversationId);

    const fetchAndSetupConversation = async () => {
      try {
        let actualConversationId = currentConversationId;
        let msgs = [];

        if (actualConversationId) {
          console.log('Chat: Cargando mensajes para conversación existente:', actualConversationId);
          msgs = await chatService.loadMessages(actualConversationId);
          setMessages(msgs);
        } else if (user?.id && currentReceiverId) {
          console.log('Chat: No conversationId, intentando cargar conversación entre', currentReceiverId, 'y', user.id);
          const conversation = await chatService.loadConversationBetweenUsers(currentReceiverId, user.id);
          if (conversation) {
            setConversationId(conversation.id);
            actualConversationId = conversation.id;
            console.log('Chat: Conversación existente encontrada:', conversation.id);
            msgs = await chatService.loadMessages(conversation.id);
            setMessages(msgs);
          } else {
            console.log('Chat: No se encontró conversación existente. Se creará al primer mensaje.');
          }
        }

        if (actualConversationId && msgs.length > 0 && user?.id) {
          const unreadMessages = msgs.filter(msg =>
              !msg.isRead &&
              msg.senderId !== user.id &&
              msg.id
          );

          if (unreadMessages.length > 0) {
            console.log('Chat: Mensajes no leídos encontrados, enviando recibos de lectura:', unreadMessages.map(m => m.id));
            unreadMessages.forEach(msg => {
              setTimeout(() => chatService.sendReadReceipt(msg.id), 100);
            });
          }

          console.log('Chat: Uniendo sala de chat:', actualConversationId, 'con receiver:', currentReceiverId);
        }

      } catch (error) {
        console.error('Chat: Error cargando conversación:', error);
      }
    };

    if (user?.id && currentReceiverId) {
      fetchAndSetupConversation();
    }
  }, [conversationData, location.state, navigate, user?.id]);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Efecto que se ejecuta cuando cambian los mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Efecto específico para el typing indicator - se ejecuta cuando aparece o desaparece
  useEffect(() => {
    if (typingIndicator) {
      setTimeout(scrollToBottom, 50);
    }
  }, [typingIndicator, scrollToBottom]);

  const handleMessage = useCallback((msg) => {
    console.log('Chat: Mensaje recibido (handleMessage):', msg);

    if (!msg.id || processedMessagesRef.current.has(msg.id)) {
      console.log('Chat: Mensaje duplicado o sin ID, ignorando:', msg.id);
      return;
    }
    processedMessagesRef.current.add(msg.id);

    if (String(msg.senderId) === String(receiverId)) {
      console.log('Chat: Mensaje recibido del usuario que estaba escribiendo, limpiando typing indicator');
      setTypingIndicator('');
      if (receiverTypingTimeoutRef.current) {
        clearTimeout(receiverTypingTimeoutRef.current);
        receiverTypingTimeoutRef.current = null;
      }
    }

    setMessages(prev => {
      if (prev.some(existingMsg => existingMsg.id === msg.id)) {
        return prev;
      }
      return [...prev, msg];
    });

    if (msg.senderId !== user?.id && msg.id && !msg.isRead) {
      setTimeout(() => {
        console.log('Chat: Enviando recibo de lectura para mensaje:', msg.id);
        chatService.sendReadReceipt(msg.id);
      }, 500);
    }
  }, [user?.id, receiverId]);

  const handleTyping = useCallback((typing) => {
    console.log('Chat: Typing recibido (handleTyping):', typing);

    if (typing?.senderId === user?.id) {
      console.log('Chat: Typing recibido de nosotros mismos, ignorando.');
      return;
    }

    if (String(typing?.senderId) !== String(receiverId)) {
      console.log('Chat: Typing recibido de usuario diferente al actual, ignorando.');
      return;
    }

    setTypingIndicator(`Usuario ${typing.senderId} está escribiendo...`);

    if (receiverTypingTimeoutRef.current) {
      clearTimeout(receiverTypingTimeoutRef.current);
    }

    // Limpiar el indicador después de 3 segundos sin nuevo typing
    receiverTypingTimeoutRef.current = setTimeout(() => {
      console.log('Chat: Timeout de typing en el receptor expirado, limpiando indicador.');
      setTypingIndicator('');
      receiverTypingTimeoutRef.current = null;
    }, 3000);
  }, [user?.id, receiverId]);

  const handleRead = useCallback((readData) => {
    console.log('Chat: Read receipt recibido (handleRead):', readData);
    setMessages((prev) =>
        prev.map((msg) =>
            msg.id === readData.messageId ? { ...msg, isRead: true } : msg
        )
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    const connectAndSetupChat = async () => {
      try {
        console.log('Chat: Intentando conectar al servicio de chat...');
        await chatService.connect();
        if (!mounted) return;

        setConnectionStatus('Conectado');
        console.log('Chat: WebSocket conectado.');

        const unsubscribers = [
          chatService.onMessage(handleMessage),
          chatService.onTyping(handleTyping),
          chatService.onReadReceipt(handleRead),
          chatService.onConnectionStateChange(({ isConnected, error }) => {
            if (mounted) {
              setConnectionStatus(isConnected ? 'Conectado' : (error ? `Error: ${error.message}` : 'Desconectado'));
              console.log('Chat: Connection status changed:', isConnected ? 'Conectado' : (error ? `Error: ${error.message}` : 'Desconectado'));
            }
          })
        ];

        return () => {
          console.log('Chat: Desconectando y desuscribiendo...');
          unsubscribers.forEach(unsubscribe => unsubscribe());
        };
      } catch (error) {
        console.error('Chat: Error al conectar:', error);
        if (mounted) {
          setConnectionStatus(`Error: ${error.message}`);
          if (error.message.includes('token')) {
            navigate('/login');
          }
        }
      }
    };

    if (receiverId && user?.id) {
      connectAndSetupChat();
    } else {
      console.log('Chat: No conectando. Falta receiverId o user ID:', { receiverId, userId: user?.id });
    }

    return () => {
      mounted = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (receiverTypingTimeoutRef.current) {
        clearTimeout(receiverTypingTimeoutRef.current);
        receiverTypingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      chatService.disconnect();
      console.log('Chat: Limpieza de efecto - chatService desconectado.');
    };
  }, [receiverId, user?.id, navigate, handleMessage, handleTyping, handleRead]);

  const sendMessage = async (e) => {
    e.preventDefault();

    if (!messageContent.trim()) {
      console.log('Chat: No hay contenido de mensaje, regresando.');
      return;
    }

    try {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;

      if (!user?.id) {
        console.error('Chat: Usuario no autenticado.');
        return;
      }

      if (!receiverId) {
        throw new Error('Chat: ID del destinatario no especificado');
      }

      if (parseInt(receiverId, 10) === parseInt(user.id, 10)) {
        throw new Error('Chat: No puedes enviar un mensaje a ti mismo');
      }

      let currentConversationId = conversationId;
      if (!currentConversationId) {
        console.log('Chat: No hay ID de conversación, creando nueva conversación con receiver:', receiverId);
        const newConversation = await createConversation(receiverId);
        setConversationId(newConversation.id);
        currentConversationId = newConversation.id;
        console.log('Chat: Nueva conversación creada:', newConversation.id, ', uniendo chat.');
      }

      console.log('Chat: Creando mensaje con payload:', {
        conversationId: currentConversationId,
        senderId: user.id,
        receiverId: parseInt(receiverId, 10),
        text: messageContent.trim()
      });

      const createdMessage = await chatService.createMessage({
        conversationId: currentConversationId,
        senderId: user.id,
        receiverId: parseInt(receiverId, 10),
        text: messageContent.trim()
      });

      const newMessage = {
        id: createdMessage.id,
        senderId: createdMessage.senderId,
        receiverId: createdMessage.receiverId,
        text: createdMessage.text,
        content: createdMessage.text,
        isRead: false,
        createdAt: createdMessage.createdAt
      };

      console.log('Chat: Mensaje enviado exitosamente, añadiendo al estado local:', newMessage);
      setMessages(prevMessages => [...prevMessages, newMessage]);
      setMessageContent('');

    } catch (error) {
      console.error('Chat: Error al enviar mensaje:', error.message);
      setConnectionStatus(`Error al enviar mensaje: ${error.message}`);
    }
  };

  const handleTypingIndicator = useCallback((inputValue) => {
    if (!conversationId || !receiverId) {
      console.log('Chat: No se puede enviar indicador de typing, falta información:', { conversationId, receiverId });
      return;
    }

    if (inputValue.trim().length === 0) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      isTypingRef.current = false;
      return;
    }

    if (isTypingRef.current) {
      return;
    }

    isTypingRef.current = true;
    console.log('Chat: Enviando señal de typing...');
    chatService.sendTyping(conversationId, receiverId);

    typingTimeoutRef.current = setTimeout(() => {
      console.log('Chat: Timeout de typing expirado, dejando de enviar señales.');
      typingTimeoutRef.current = null;
      isTypingRef.current = false;
    }, 2000);
  }, [conversationId, receiverId]);

  return (
      <div className="chat-container">
        <div className="chat-header">
          <div className="connection-status">Estado: {connectionStatus}</div>
        </div>

        <div className="messages-container">
          {messages.map((msg, index) => (
              <Message
                  key={msg.id || index}
                  message={msg}
                  type={msg.senderId === user?.id ? 'sent' : 'received'}
              />
          ))}
          {typingIndicator && (
              <div className="typing-indicator" style={{
                padding: '8px 15px',
                fontStyle: 'italic',
                color: '#666',
                backgroundColor: '#f8f9fa',
                borderRadius: '18px',
                margin: '8px 0',
                maxWidth: '200px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                animation: 'fadeIn 0.3s ease-in'
              }}>
                {typingIndicator}
              </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="message-input-container">
          <input
              type="text"
              value={messageContent}
              onChange={(e) => {
                const newValue = e.target.value;
                setMessageContent(newValue);
                handleTypingIndicator(newValue);
              }}
              onBlur={() => {
                console.log('Chat: Input blurred, limpiando typing.');
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                isTypingRef.current = false;
              }}
              placeholder="Escribe un mensaje..."
              className="message-input"
          />
          <button type="submit" className="send-button">
            Enviar
          </button>
        </form>

        <style jsx>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </div>
  );
};

export default Chat;