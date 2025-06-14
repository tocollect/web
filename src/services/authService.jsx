import {api} from "../api/api.js";

export const fetchUserByEmail = async (email) => {
    try {
        const response = await api.get(`/users/email/${email}`);
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al actualizar el catalogo");

    }
};

const handleApiError = (error, defaultMessage) => {
    if (error.response) {
        // Error de respuesta del servidor (como 401, 403, 404, etc.)
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