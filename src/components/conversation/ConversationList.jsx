import React, { useState, useEffect, useCallback } from 'react';
import { getConversationsActiveByUserId, getConversationsArchivedByUserId } from '../../services/conversationService';
import ConversationCard from './ConversationCard';
import { useAuth } from '../../context/AuthContext';

const ConversationList = ({ status }) => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    const loadConversations = useCallback(async () => {
        if (!user?.id) return;
        
        try {
            const data = status === 'ACTIVE' 
                ? await getConversationsActiveByUserId(user.id)
                : await getConversationsArchivedByUserId(user.id);
            // Transform API response to use uppercase status
            console.log('Datos de la API:', data);
            const transformedData = data?.map(conv => ({
                ...conv,
                status: conv.status?.toUpperCase()
            })) || [];
            console.log('Datos transformados:', transformedData);
            setConversations(transformedData);
        } catch (error) {
            console.error('Error loading conversations:', error);
        } finally {
            setLoading(false);
        }
    }, [status, user]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    if (loading) return <div>Cargando conversaciones...</div>;

    return (
        <div className="conversations-grid">
            {conversations.length === 0 ? (
                <p>No hay conversaciones {status === 'ACTIVE' ? 'activas' : 'archivadas'}</p>
            ) : (
                conversations.map((conversation) => (
                    <ConversationCard 
                        key={conversation.id} 
                        conversation={conversation}
                        onStatusUpdate={loadConversations}
                    />
                ))
            )}
        </div>
    );
};

export default ConversationList;