import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/Message.css';

const Message = ({ message, type }) => {

    const formatTimestamp = (date) => {
        if (!date) return '';
        return new Date(date).toLocaleString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getReadStatus = () => {
        if (type !== 'sent') {
            return null;
        }


        // Verificar el estado de lectura con más detalle
        if (message.isRead === true) {
            return {
                icon: '✓✓',
                color: '#4CAF50',
                title: 'Mensaje leído'
            };
        } else if (message.isRead === false) {
            return {
                icon: '✓',
                color: '#9E9E9E',
                title: 'Mensaje enviado'
            };
        } else if (message.isRead === null) {
            return {
                icon: '✓',
                color: '#9E9E9E',
                title: 'Mensaje enviado'
            };
        } else if (message.isRead === undefined) {
            return {
                icon: '✓',
                color: '#9E9E9E',
                title: 'Mensaje enviado'
            };
        } else {
            return {
                icon: '✓',
                color: '#9E9E9E',
                title: 'Mensaje enviado'
            };
        }
    };

    const readStatus = getReadStatus();

    console.log('🔍 MESSAGE DEBUG - Estado final:', readStatus);

    return (
        <div className={`message ${type}`}>
            <div className="message-content">
                <strong>
                    {type === 'sent' ? 'Tú' : message.senderName || `Usuario ${message.senderId}`}:
                </strong>
                {' '}
                {message.text || message.content}
            </div>
            <div className="message-footer">
                <span className="timestamp">
                    {formatTimestamp(message.createdAt || message.dateTime)}
                </span>
                {readStatus && (
                    <span
                        className={`read-status ${message.isRead ? 'read' : 'sent'}`}
                        style={{
                            color: readStatus.color,
                            marginLeft: '8px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            userSelect: 'none'
                        }}
                        title={readStatus.title}
                    >
                        {readStatus.icon}
                    </span>
                )}
            </div>
        </div>
    );
};

Message.propTypes = {
    message: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        senderId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        senderName: PropTypes.string,
        content: PropTypes.string,
        text: PropTypes.string,
        createdAt: PropTypes.string,
        dateTime: PropTypes.string,
        isRead: PropTypes.bool
    }).isRequired,
    type: PropTypes.oneOf(['sent', 'received', 'info']).isRequired
};

export default Message;