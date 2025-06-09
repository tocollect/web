import React, { useState } from 'react';
import ConversationList from '../../components/conversation/ConversationList';
import AddConversationButton from '../../components/conversation/AddConversationButton';
import '../../styles/Conversation.css';

const ConversationListPage = () => {
    const [activeTab, setActiveTab] = useState('ACTIVE');
    const [refreshKey, setRefreshKey] = useState(0);

    const handleConversationAdded = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="conversation-list-page">
            <div className="conversation-header">
                <h1>Mis Conversaciones</h1>
                <AddConversationButton onConversationAdded={handleConversationAdded} />
            </div>

            <div className="conversation-tabs">
                <button 
                    className={`tab ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ACTIVE')}
                >
                    Activas
                </button>
                <button 
                    className={`tab ${activeTab === 'ARCHIVED' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ARCHIVED')}
                >
                    Archivadas
                </button>
            </div>

            <ConversationList 
                key={refreshKey}
                status={activeTab}
            />
        </div>
    );
};

export default ConversationListPage;