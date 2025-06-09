import React, { useState } from 'react';
import { updateComment } from '../../services/commentService';
import { FaEdit } from 'react-icons/fa';
import '../../styles/CommentModals.css';

const EditCommentModal = ({ comment, onClose, onCommentUpdated }) => {
    const [editedText, setEditedText] = useState(comment.text);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!editedText.trim()) return;

        setSaving(true);
        try {
            const updatedComment = await updateComment(comment.id, {
                text: editedText.trim()
            });
            onCommentUpdated(updatedComment);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al actualizar el comentario');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-content edit-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header edit">
                    <FaEdit className="edit-icon" />
                    <h3>Editar comentario</h3>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {error && <div className="modal-error">{error}</div>}
                    
                    <div className="modal-body">
                        <p className="edit-message">
                            Estás editando tu comentario:
                        </p>
                        <textarea
                            value={editedText}
                            onChange={(e) => setEditedText(e.target.value)}
                            placeholder="Escribe tu comentario..."
                            rows={4}
                            className="edit-textarea"
                        />
                    </div>
                    
                    <div className="modal-footer">
                        <button 
                            type="button" 
                            className="cancel-button"
                            onClick={onClose}
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="save-button"
                            disabled={saving || !editedText.trim()}
                        >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCommentModal;