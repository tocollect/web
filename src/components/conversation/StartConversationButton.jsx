import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createConversation } from '../../services/conversationService';

const StartConversationButton = ({ userId, userName }) => {
    const navigate = useNavigate();

    const handleStartChat = async () => {
        try {
            const conversation = await createConversation(userId);
            navigate('/chat', {
                state: {
                    conversationId: conversation.id.toString(),
                    receiverId: userId.toString()
                }
            });
        } catch (error) {
            console.error('Error al iniciar chat:', error);
            // Aquí podrías mostrar un mensaje de error al usuario
        }
    };

    return (
        <button 
            onClick={handleStartChat}
            className="back-button"
            title={`Iniciar chat con ${userName}`}
        >
            <i className="fas fa-comment"></i>
            <span>Chat</span>
        </button>
    );
};

export default StartConversationButton;
