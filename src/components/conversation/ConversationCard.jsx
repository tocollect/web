import React, { useState, useRef, useEffect } from 'react'; // Importa useRef y useEffect
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi'; // Importa FiMoreVertical
import { updateConversation, deleteConversation } from '../../services/conversationService';
import EditConversationModal from './EditConversationModal';
import DeleteConversationModal from './DeleteConversationModal';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import chatService from "../../services/chatService.js";
import '../../styles/Conversation.css';

const ConversationCard = ({ conversation, onStatusUpdate }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false); // Nuevo estado para el menú
    const optionsMenuRef = useRef(null); // Ref para el menú
    const navigate = useNavigate();
    const { user } = useAuth();

    // Manejar clics fuera del menú para cerrarlo
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setShowOptionsMenu(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleEditConfirm = async (id) => {
        setLoading(true);
        try {
            const newStatus = conversation.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
            await updateConversation(id, {
                status: newStatus.toLowerCase()
            });
            onStatusUpdate();
        } catch (error) {
            console.error('Error updating conversation:', error);
        } finally {
            setLoading(false);
            setShowEditModal(false);
            setShowOptionsMenu(false); // Cierra el menú después de la acción
        }
    };

    const handleDeleteConfirm = async (id) => {
        setLoading(true);
        try {
            await deleteConversation(id);
            onStatusUpdate();
        } catch (error) {
            console.error('Error deleting conversation:', error);
        } finally {
            setLoading(false);
            setShowDeleteModal(false);
            setShowOptionsMenu(false); // Cierra el menú después de la acción
        }
    };

    const handleCardClick = async (e) => {
        // No navegar si se hizo clic en los botones del menú o los modales
        if (e.target.closest('.conversation-actions') || e.target.closest('.modal')) {
            return;
        }

        // Verificar que los campos necesarios existen
        if (!conversation.id || !conversation.senderId || !conversation.receiverId) {
            console.error('Datos de conversación incompletos:', conversation);
            return;
        }

        try {
            // Obtener información del usuario autenticado
            const authenticatedUser = await chatService.fetchUserInfo();
            if (!authenticatedUser) {
                console.error('Usuario no autenticado');
                return;
            }

            // Determinar quién es el emisor y quién es el receptor
            const senderId = authenticatedUser.id.toString();
            const receiverId = authenticatedUser.id.toString() === conversation.senderId.toString()
                ? conversation.receiverId.toString()
                : conversation.senderId.toString();

            // Validar que el usuario no intente hablar consigo mismo
            if (senderId === receiverId) {
                console.error('No puedes iniciar una conversación contigo mismo');
                return;
            }

            // Navegar al chat con el ID de la conversación y el ID del otro usuario
            navigate('/chat', {
                state: {
                    sender: senderId,
                    receiver: receiverId,
                    conversationId: conversation.id.toString()
                }
            });
        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            alert('Error al cargar datos del usuario. Por favor, inténtalo de nuevo.');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Determinar el otro usuario en la conversación para mostrar
    const getOtherUserName = () => {
        if (!user || !user.id) {
            return 'Usuario desconocido';
        }

        // Suponiendo que conversation.senderId y conversation.receiverId son los IDs de los usuarios
        // y user.id es el ID del usuario actual.
        // Aquí podrías necesitar una lógica más robusta si los nombres de usuario no están directamente en la conversación.
        const otherUserId = user.id.toString() === conversation.senderId.toString()
            ? conversation.receiverId
            : conversation.senderId;

        // Idealmente, aquí buscarías el nombre del usuario con 'otherUserId'
        // Por ahora, solo mostramos el ID
        return `Usuario ${otherUserId}`;
    };

    return (
        <>
            <div
                className="conversation-card"
                onClick={handleCardClick}
                style={{ cursor: 'pointer' }}
            >
                <div className="conversation-info">
                    <div className="conversation-header">
                        <h3>Chat con {getOtherUserName()}</h3>
                        <span className={`status ${conversation.status?.toLowerCase()}`}>
                            {conversation.status === 'ACTIVE' ? 'Activa' :
                                conversation.status === 'DELETED' ? 'Borrado' : 'Archivada'}
                        </span>
                    </div>
                    <div className="conversation-details">
                        <span className="conversation-id">Conversación #{conversation.id}</span>
                        {conversation.createdAt && (
                            <span className="timestamp">
                                Creado: {formatDate(conversation.createdAt)}
                            </span>
                        )}
                        {conversation.lastMessageDatetime && (
                            <span className="timestamp">
                                Último mensaje: {formatDate(conversation.lastMessageDatetime)}
                            </span>
                        )}
                    </div>
                </div>

                <div className="conversation-actions" ref={optionsMenuRef}> {/* Añade la ref aquí */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation(); // Evitar que el click se propague al card
                            setShowOptionsMenu(!showOptionsMenu); // Alternar visibilidad del menú
                        }}
                        className="options-button"
                        title="Opciones de conversación"
                    >
                        <FiMoreVertical />
                    </button>

                    {showOptionsMenu && (
                        <div className="options-menu">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowEditModal(true);
                                }}
                                className="menu-item"
                            >
                                <FiEdit2 />
                                <span>
                                    {conversation.status === 'ACTIVE' ? 'Archivar' : 'Activar'}
                                </span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDeleteModal(true);
                                }}
                                className="menu-item delete"
                            >
                                <FiTrash2 />
                                <span>Eliminar</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {showEditModal && (
                <EditConversationModal
                    conversation={conversation}
                    onClose={() => setShowEditModal(false)}
                    onConfirm={handleEditConfirm}
                    loading={loading}
                />
            )}

            {showDeleteModal && (
                <DeleteConversationModal
                    conversation={conversation}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDeleteConfirm}
                    loading={loading}
                />
            )}
        </>
    );
};

export default ConversationCard;