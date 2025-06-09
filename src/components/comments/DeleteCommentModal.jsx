import React, { useState } from 'react';
import { deleteComment } from '../../services/commentService';
import { FaExclamationTriangle } from 'react-icons/fa';
import '../../styles/CommentModals.css';

const DeleteCommentModal = ({ comment, onClose, onCommentDeleted }) => {
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteComment(comment.id);
            onCommentDeleted(comment.id);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al eliminar el comentario');
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content delete-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header delete">
                    <FaExclamationTriangle className="warning-icon" />
                    <h3>Eliminar comentario</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <div className="modal-body">
                    {error && <div className="modal-error">{error}</div>}
                    <p className="confirmation-message">
                        ¿Estás seguro de que deseas eliminar este comentario?
                    </p>
                    <div className="comment-preview">
                        "{comment.text}"
                    </div>
                    <p className="warning-text">
                        <FaExclamationTriangle /> Esta acción no se puede deshacer
                    </p>
                </div>
                
                <div className="modal-footer">
                    <button 
                        className="cancel-button"
                        onClick={onClose}
                        disabled={deleting}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="accept-button"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? 'Eliminando...' : 'Aceptar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteCommentModal;