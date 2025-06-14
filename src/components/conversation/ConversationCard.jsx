import React, { useState, useRef, useEffect } from 'react';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
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
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const optionsMenuRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

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
            setShowOptionsMenu(false);
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
            setShowOptionsMenu(false);
        }
    };

    const handleCardClick = async (e) => {
        if (e.target.closest('.conversation-actions') || e.target.closest('.modal')) {
            return;
        }

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

        const otherUserId = user.id.toString() === conversation.senderId.toString()
            ? conversation.receiverId
            : conversation.senderId;

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

                <div className="conversation-actions" ref={optionsMenuRef}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowOptionsMenu(!showOptionsMenu);
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