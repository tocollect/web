import {api} from "../api/api";

export const getConversationsActiveByUserId = async (userId) => {
    try {
        const response = await api.get(`/conversations/active/${userId}`);
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al obtener las conversaciones activas");
    }
}

export const getConversationsArchivedByUserId = async (userId) => {
    try {
        const response = await api.get(`/conversations/archived/${userId}`);
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al obtener las conversaciones archivadas");
    }
}

export const createConversation = async (receiverId) => {
    try {
        const response = await api.post("/conversations", {
            receiver_id: parseInt(receiverId, 10),
            status: 'ACTIVE'
        });
        if (response.status !== 201) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error completo:", error);
        handleApiError(error, "Error al crear la conversación");
    }
}

export const updateConversation = async (conversationId, conversationData) => {
    try {
        const response = await api.patch(`/conversations/${conversationId}`, {
            ...conversationData,
            status: conversationData.status?.toUpperCase()
        });
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error completo:", error);
        handleApiError(error, "Error al actualizar la conversación");
    }
}

export const deleteConversation = async (conversationId) => {
    try {
        const response = await api.patch(`/conversations/${conversationId}`, {
            status: "DELETED"
        });

        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }

        return response.data;

    } catch (error) {
        console.error("Error completo:", error);
        handleApiError(error, "Error al borrar la conversación");
    }
};

const handleApiError = (error, defaultMessage) => {
    if (error.response) {
        const status = error.response.status;
        if (status === 401) {
            throw new Error("Sesión expirada. Por favor, inicia sesión nuevamente.");
        } else if (status === 403) {
            throw new Error("No tienes permiso para realizar esta acción.");
        } else if (status === 404) {
            throw new Error("Recurso no encontrado.");
        } else {
            throw new Error(error.response.data?.message || `${defaultMessage} (Código: ${status})`);
        }
    } else if (error.request) {
        throw new Error("No se pudo conectar al servidor. Verifica tu conexión.");
    } else {
        throw new Error(defaultMessage);
    }
};