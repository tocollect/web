import React from 'react';
import { FiEdit } from 'react-icons/fi';
import Modal from '../Modal';
import '../../styles/Conversation.css';

const EditConversationModal = ({ conversation, onClose, onConfirm, loading }) => {
    const footer = (
        <>
            <button 
                className="modal-button cancel-button"
                onClick={onClose}
                disabled={loading}
            >
                Cancelar
            </button>
            <button 
                className="modal-button confirm-button"
                onClick={() => onConfirm(conversation.id)}
                disabled={loading}
            >
                {loading ? 'Guardando...' : 'Guardar'}
            </button>
        </>
    );

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={
                <div className="modal-title">
                    <FiEdit className="modal-icon" />
                    <span>Editar Conversación</span>
                </div>
            }
            footer={footer}
        >
            <div className="modal-content">
                <p className="modal-message">
                    ¿Deseas cambiar el estado de esta conversación a {conversation.status === 'ACTIVE' ? 'archivada' : 'activa'}?
                </p>
                <div className="status-preview">
                    <span className={`status-badge ${conversation.status.toLowerCase()}`}>
                        {conversation.status === 'ACTIVE' ? 'Activa' : 'Archivada'}
                    </span>
                    <span className="arrow">→</span>
                    <span className={`status-badge ${conversation.status === 'ACTIVE' ? 'archived' : 'active'}`}>
                        {conversation.status === 'ACTIVE' ? 'Archivada' : 'Activa'}
                    </span>
                </div>
            </div>
        </Modal>
    );
};

export default EditConversationModal;