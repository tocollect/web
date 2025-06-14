import React from 'react';
import { createConversation } from '../../services/conversationService';

const AddConversationButton = ({ receiverId, onConversationCreated }) => {

    if (!receiverId) {
        console.error('AddConversationButton: receiverId es necesario para crear una conversación.');
        return null;
    }

    const handleCreateConversation = async () => {
        try {
            const newConversation = await createConversation({ receiverId: receiverId });
            
            alert('¡Conversación iniciada con éxito!');

            if (onConversationCreated) {
                onConversationCreated(newConversation);
            }

        } catch (error) {
            console.error('Error al crear la conversación:', error);
            alert('No se pudo iniciar la conversación. Asegúrate de estar logueado e inténtalo de nuevo más tarde.');
        }
    };

    return (
        <button
            onClick={handleCreateConversation}
            className="add-conversation-button" // Asegúrate de definir estilos CSS para esta clase
            title="Haz clic para contactar al vendedor de este ítem"
        >
            Contactar Vendedor
        </button>
    );
};

export default AddConversationButton;