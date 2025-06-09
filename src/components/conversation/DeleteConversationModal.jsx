import React from 'react';
import {FiAlertTriangle} from 'react-icons/fi';
import Modal from '../Modal';
import '../../styles/Conversation.css';

const DeleteConversationModal = ({ conversation, onClose, onConfirm, loading }) => {
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
                    <FiAlertTriangle className="modal-icon" />
                    <span>Editar Conversación</span>
                </div>
            }
            footer={footer}
        >
            <div className="modal-content">
                <p className="modal-message">
                    ¿Deseas borrar la conversación?
                </p>
                <div className="status-preview">
                    <span className={`status-badge ${conversation.status.toLowerCase()}`}>
                        {conversation.status === 'ACTIVE' ? 'Activa' :
                            conversation.status === 'DELETED' ? 'Borrado' : 'Archivada'}
                    </span>
                    <span className={`status-badge ${conversation.status === 'ACTIVE' ? 'deleted' : 'active'}`}>
                        {conversation.status === 'DELETED'}
                    </span>
                </div>
            </div>
        </Modal>
    );
};

export default DeleteConversationModal;