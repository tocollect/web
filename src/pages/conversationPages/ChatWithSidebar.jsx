import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Chat from '../../components/message/Chat';
import { getConversationsActiveByUserId, getConversationsArchivedByUserId } from '../../services/conversationService';
import ConversationCardSidebar from '../../components/conversation/ConversationCardSidebar';
import chatService from '../../services/chatService';
import '../../styles/ChatWithSidebar.css';

const ChatWithSidebar = () => {
    const location = useLocation();
    const { user } = useAuth();

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [refreshKey, setRefreshKey] = useState(0);
    const [selectedConversation, setSelectedConversation] = useState(null);

    // Memoizar la función de carga de conversaciones
    const loadConversations = useCallback(async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            const data = activeTab === 'ACTIVE'
                ? await getConversationsActiveByUserId(user.id)
                : await getConversationsArchivedByUserId(user.id);

            const transformedData = data?.map(conv => ({
                ...conv,
                status: conv.status?.toUpperCase()
            })) || [];

            setConversations(transformedData);
        } catch (error) {
            console.error('Error loading conversations:', error);
            setConversations([]);
        } finally {
            setLoading(false);
        }
    }, [activeTab, user?.id]); // Solo depender de activeTab y user.id

    useEffect(() => {
        loadConversations();
    }, [loadConversations, refreshKey]);

    // Memoizar el handler de selección de conversación
    const handleConversationSelect = useCallback(async (conversation) => {
        if (!conversation.id || !conversation.senderId || !conversation.receiverId) {
            console.error('Datos de conversación incompletos:', conversation);
            return;
        }

        try {
            const authenticatedUser = await chatService.fetchUserInfo();
            if (!authenticatedUser) {
                console.error('Usuario no autenticado');
                return;
            }

            const senderId = authenticatedUser.id.toString();
            const receiverId = authenticatedUser.id.toString() === conversation.senderId.toString()
                ? conversation.receiverId.toString()
                : conversation.senderId.toString();

            if (senderId === receiverId) {
                console.error('No puedes iniciar una conversación contigo mismo');
                return;
            }

            setSelectedConversation({
                sender: senderId,
                receiver: receiverId,
                conversationId: conversation.id.toString()
            });
        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
        }
    }, []);

    useEffect(() => {
        if (location.state && !selectedConversation) {
            setSelectedConversation({
                sender: location.state.sender,
                receiver: location.state.receiver,
                conversationId: location.state.conversationId
            });
        }
    }, [location.state, selectedConversation]);

    // Memoizar el handler de actualización de estado
    const handleStatusUpdate = useCallback(() => {
        setRefreshKey(prevKey => prevKey + 1);
    }, []);

    // Memoizar el cambio de tab
    const handleTabChange = useCallback((tab) => {
        setActiveTab(tab);
    }, []);

    // Memoizar el contenido de las conversaciones
    const conversationsContent = useMemo(() => {
        if (loading) {
            return <div className="loading">Cargando conversaciones...</div>;
        }

        if (conversations.length === 0) {
            return (
                <p className="no-conversations">
                    No hay conversaciones {activeTab === 'ACTIVE' ? 'activas' : 'archivadas'}
                </p>
            );
        }

        return conversations.map((conversation) => (
            <ConversationCardSidebar
                key={conversation.id}
                conversation={conversation}
                loggedInUserId={user?.id}
                onStatusUpdate={handleStatusUpdate}
                onSelect={() => handleConversationSelect(conversation)}
                isSelected={selectedConversation?.conversationId === conversation.id.toString()}
            />
        ));
    }, [
        loading,
        conversations,
        activeTab,
        user?.id,
        handleStatusUpdate,
        handleConversationSelect,
        selectedConversation?.conversationId
    ]);

    return (
        <div className="chat-with-sidebar">
            <div className="conversations-sidebar">
                <div className="sidebar-header">
                    <h2 style={{color:"white"}}>Chats</h2>
                </div>

                <div className="conversation-tabs">
                    <button
                        className={`tab ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                        onClick={() => handleTabChange('ACTIVE')}
                    >
                        Activas
                    </button>
                    <button
                        className={`tab ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
                        onClick={() => handleTabChange('ARCHIVED')}
                    >
                        Archivadas
                    </button>
                </div>

                <div className="conversations-list">
                    {conversationsContent}
                </div>
            </div>

            <div className="chat-area">
                {selectedConversation ? (
                    <Chat
                        key={`${selectedConversation.sender}-${selectedConversation.receiver}-${selectedConversation.conversationId}`}
                        conversationData={selectedConversation}
                    />
                ) : (
                    <div className="no-chat-selected">
                        <div className="no-chat-message">
                            <div className="whatsapp-logo">💬</div>
                            <h2>To Collect Chat</h2>
                            <p>Selecciona un chat para comenzar a conversar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatWithSidebar;