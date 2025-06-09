import React, { useState, useRef, useEffect } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import EditCommentModal from '../comments/EditCommentModal';
import DeleteCommentModal from '../comments/DeleteCommentModal';
import '../../styles/ItemDetail.css';

const CommentSection = ({ 
    comments, 
    user, 
    onAddComment, 
    onUpdateComment, 
    onDeleteComment,
    formatDate 
}) => {
    const [newComment, setNewComment] = useState('');
    const [sendingComment, setSendingComment] = useState(false);
    const [editingComment, setEditingComment] = useState(null);
    const [deletingComment, setDeletingComment] = useState(null);
    const commentsListRef = useRef(null);

    useEffect(() => {
        if (comments.length > 3 && commentsListRef.current) {
            commentsListRef.current.scrollTop = commentsListRef.current.scrollHeight;
        }
    }, [comments]);

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user) return;

        setSendingComment(true);
        try {
            await onAddComment(newComment.trim());
            setNewComment('');
        } finally {
            setSendingComment(false);
        }
    };

    return (
        <div className="comments-section">
            <div className="comments-header">
                <h3>Comentarios ({comments.length})</h3>
            </div>

            <div className="comments-list" ref={commentsListRef}>
                {comments.map(comment => (
                    <div 
                        key={comment.id} 
                        className={`comment-bubble ${comment.userId === user?.id ? 'comment-own' : 'comment-other'}`}
                    >
                        <div className="comment-header">
                            <span className="comment-author">
                                {comment.userId === user?.id ? 'Tú' : comment.userName || 'Usuario'}
                            </span>
                            <div className="comment-actions">
                                <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                {comment.userId === user?.id && (
                                    <>
                                        <button
                                            className="action-button"
                                            onClick={() => setEditingComment(comment)}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="action-button delete"
                                            onClick={() => setDeletingComment(comment)}
                                        >
                                            <FaTrash />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="comment-content">
                            {comment.text}
                        </div>
                    </div>
                ))}
            </div>

            {user ? (
                <form className="comment-form" onSubmit={handleSubmitComment}>
                    <input
                        type="text"
                        className="comment-input"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escribe un comentario..."
                        disabled={sendingComment}
                    />
                    <button 
                        type="submit" 
                        className="send-comment-button"
                        disabled={sendingComment || !newComment.trim()}
                    >
                        {sendingComment ? 'Enviando...' : 'Enviar'}
                    </button>
                </form>
            ) : (
                <p className="login-prompt">Inicia sesión para comentar</p>
            )}

            {editingComment && (
                <EditCommentModal
                    comment={editingComment}
                    onClose={() => setEditingComment(null)}
                    onCommentUpdated={(updatedComment) => {
                        onUpdateComment(updatedComment);
                        setEditingComment(null);
                    }}
                />
            )}

            {deletingComment && (
                <DeleteCommentModal
                    comment={deletingComment}
                    onClose={() => setDeletingComment(null)}
                    onCommentDeleted={(commentId) => {
                        onDeleteComment(commentId);
                        setDeletingComment(null);
                    }}
                />
            )}
        </div>
    );
};

export default CommentSection;