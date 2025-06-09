// src/components/conversation/AddConversationButton.jsx
import React from 'react';
import { createConversation } from '../../services/conversationService'; // Asegúrate de que la ruta sea correcta
// import { useNavigate } from 'react-router-dom'; // Si quieres redirigir automáticamente

const AddConversationButton = ({ receiverId, onConversationCreated }) => {
    // const navigate = useNavigate(); // Descomenta si usas useNavigate

    // Validar que receiverId es un valor válido
    if (!receiverId) {
        console.error('AddConversationButton: receiverId es necesario para crear una conversación.');
        return null; // No renderiza el botón si no hay un ID de receptor válido
    }

    const handleCreateConversation = async () => {
        try {
            const newConversation = await createConversation({ receiverId: receiverId });
            
            alert('¡Conversación iniciada con éxito!'); // Puedes reemplazar esto por un Toast o una notificación más elegante

            if (onConversationCreated) {
                onConversationCreated(newConversation); // Llama al callback pasando la nueva conversación
            }
            // Opcional: Redirigir al usuario a la nueva conversación
            // if (newConversation && newConversation.id) {
            //     navigate(`/chat/${newConversation.id}`); // Ajusta esta ruta a tu página de chat
            // }

        } catch (error) {
            console.error('Error al crear la conversación:', error);
            // Mejora el mensaje de error para el usuario
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