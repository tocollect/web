import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { FiEdit2, FiTrash2, FiMoreVertical } from 'react-icons/fi';
import { updateConversation, deleteConversation } from '../../services/conversationService';
import EditConversationModal from './EditConversationModal';
import DeleteConversationModal from './DeleteConversationModal';
import { getUserById } from '../../services/userService';
import '../../styles/Conversation.css';

const ConversationCardSidebar = ({
                                     conversation,
                                     loggedInUserId,
                                     onStatusUpdate,
                                     onSelect,
                                     isSelected
                                 }) => {
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [otherUserName, setOtherUserName] = useState('');
    const optionsMenuRef = useRef(null);

    // Memoizar el ID del otro usuario para evitar cálculos innecesarios
    const otherUserId = useMemo(() => {
        if (!loggedInUserId || !conversation) return null;

        return loggedInUserId.toString() === conversation.senderId.toString()
            ? conversation.receiverId
            : conversation.senderId;
    }, [loggedInUserId, conversation]);

    // Cargar el nombre del otro usuario
    useEffect(() => {
        if (!otherUserId) return;

        let mounted = true;

        const loadUserName = async () => {
            try {
                const userData = await getUserById(otherUserId);
                if (mounted) {
                    setOtherUserName(userData.name || userData.username || `Usuario ${otherUserId}`);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                if (mounted) {
                    setOtherUserName(`Usuario ${otherUserId}`);
                }
            }
        };

        loadUserName();

        return () => {
            mounted = false;
        };
    }, [otherUserId]);

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

    // Memoizar handlers para evitar re-creaciones
    const handleEditConfirm = useCallback(async (id) => {
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
    }, [conversation.status, onStatusUpdate]);

    const handleDeleteConfirm = useCallback(async (id) => {
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
    }, [onStatusUpdate]);

    const handleCardClick = useCallback((e) => {
        // No navegar si se hizo clic en los botones del menú o los modales
        if (e.target.closest('.conversation-actions') || e.target.closest('.modal')) {
            return;
        }
        onSelect();
    }, [onSelect]);

    const handleOptionsClick = useCallback((e) => {
        e.stopPropagation();
        setShowOptionsMenu(!showOptionsMenu);
    }, [showOptionsMenu]);

    const handleEditClick = useCallback((e) => {
        e.stopPropagation();
        setShowEditModal(true);
        setShowOptionsMenu(false);
    }, []);

    const handleDeleteClick = useCallback((e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
        setShowOptionsMenu(false);
    }, []);

    // Memoizar la función de formateo de fecha
    const formatDate = useCallback((dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Hoy';
        } else if (diffDays === 2) {
            return 'Ayer';
        } else if (diffDays <= 7) {
            return date.toLocaleDateString('es-ES', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short'
            });
        }
    }, []);

    const cardContent = useMemo(() => (
        <div
            className={`conversation-card-sidebar ${isSelected ? 'selected' : ''}`}
            onClick={handleCardClick}
        >
            <div className="conversation-info">
                <div className="conversation-header">
                    <h3 className="conversation-name">
                        {otherUserName || `Usuario ${otherUserId}`}
                    </h3>
                    <span className={`status ${conversation.status?.toLowerCase()}`}>
                {conversation.status === 'ACTIVE' ? 'Activa' :
                conversation.status === 'DELETED' ? 'Borrado' : 'Archivada'}
          </span>
                </div>
                <div className="conversation-meta">
                    {conversation.lastMessageDatetime && (
                        <span className="timestamp">
              {formatDate(conversation.lastMessageDatetime)}
            </span>
                    )}
                </div>
            </div>

            <div className="conversation-actions" ref={optionsMenuRef}>
                <button
                    onClick={handleOptionsClick}
                    style={{background:'transparent',maxHeight:'3px',maxWidth:'3px',border:'none'}}
                    title="Opciones de conversación"
                >
                    <FiMoreVertical  style={{color:'black'}}/>
                </button>

                {showOptionsMenu && (
                    <div className="options-menu">
                        <button
                            onClick={handleEditClick}
                            className="menu-item"
                        >
                            <FiEdit2 />
                            <span>
                {conversation.status === 'ACTIVE' ? 'Archivar' : 'Activar'}
              </span>
                        </button>
                        <button
                            onClick={handleDeleteClick}
                            className="menu-item delete"
                        >
                            <FiTrash2 />
                            <span>Eliminar</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    ), [
        isSelected,
        handleCardClick,
        otherUserName,
        otherUserId,
        conversation.status,
        conversation.id,
        conversation.lastMessageDatetime,
        formatDate,
        showOptionsMenu,
        handleOptionsClick,
        handleEditClick,
        handleDeleteClick
    ]);

    return (
        <>
            {cardContent}

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

export default React.memo(ConversationCardSidebar);