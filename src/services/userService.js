import { api } from "../api/api";

export const getUserById = async (userId) => {
    try {
        const response = await api.get(`/users/id/${userId}`);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Error al buscar usuario");
    }
};

export const getCountCatalogAndItemByUser = async (userId) => {
    try {
        const response = await api.get(`/users/${userId}/catalog-item-count`);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Error al buscar usuario");
    }
}

export const updateUser = async (userId, userData) => {
    try {
        const response = await api.patch(`/users/${userId}`, userData);
        return response.data;
    } catch (error) {
        throw handleApiError(error, "Error al actualizar usuario");
    }
};

export const getImageProfile = async (userId, type) => {
    try {
        type="user"; 
        const response = await api.get(`/images/profile/${type}/${userId}/raw`, {
            responseType: 'blob', // Importante para recibir binario
        });

        if (!response.data || response.data.size === 0) {
            throw new Error("No hay imagen disponible");
        }

        const imageUrl = URL.createObjectURL(response.data);
        return imageUrl;
    } catch (error) {
        if (error.response?.status === 404) {
            return null; // No hay imagen
        }
        throw handleApiError(error, "Error al mostrar imagen del usuario");
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