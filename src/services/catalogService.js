import { api } from "../api/api";

// Recuperar todos los catálogos con paginación
export const getAllCatalog = async (page = 0, size = 10) => {
    try {
        const response = await api.get("/catalogs", {
            params: { page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al recuperar los catálogos");
    }
};

// Recuperar catalogos por "id"
export const getCatalogById = async (id) => {
    try {
        const response = await api.get(`/catalogs/id/${id}`);
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al actualizar el catalogo");
    }
}

//Catalogos por usuario
//Catalogos por usuario (VERSION CORREGIDA)
export const getCatalogsByUserId = async (userId, page = 0, size = 6) => {
    try {
        // CORREGIDO: Ahora SÍ estamos pasando los parámetros de paginación
        const response = await api.get(`/catalogs/user/${userId}`, {
            params: {
                page: page,
                size: size
            },
        });

        console.log("Respuesta del backend:", response.data); // Para debug

        // Verificar que la respuesta tenga la estructura esperada de Spring Page
        if (!response.data || typeof response.data !== 'object') {
            throw new Error("Formato de respuesta inesperado del servidor");
        }

        // La respuesta debería incluir content, totalPages, number, etc.
        return response.data;
    } catch (error) {
        console.error("Error completo al cargar catálogos:", error);
        handleApiError(error, "Error al cargar los catálogos del usuario");
    }
};

export const getImageCatalog = async (catalogId, type) => {
    try {
        const response = await api.get(`/images/profile/${type}/${catalogId}/raw`, {
            responseType: 'blob',
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
//Agregar catalogo
export const addCatalog = async (catalog) => {
    try {
        const response = await api.post("/catalogs", catalog);
        if (response.status !== 201) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error completo:", error);
        
        // Prevenir deslogueo automático en caso de 401
        if (error.response && error.response.status === 401) {
            throw new Error("Tu sesión puede haber expirado. Los datos se guardaron pero necesitarás recargar la página.");
        } else {
            handleApiError(error, "Error al crear el catálogo");
        }
    }
}

// Versión simplificada de editCatalog en catalogService.js
export const editCatalog = async (catalog) => {
    try {
        console.log("Enviando datos para actualizar:", catalog);
        const response = await api.patch(`/catalogs/${catalog.id}`, catalog);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar el catálogo:", error);
        
        if (error.response && error.response.status === 401) {
            throw new Error("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        }
        
        throw new Error(error.response?.data?.message || "Error al actualizar el catálogo");
    }
}

//eliminar catalogo
export const deleteCatalog = async (id) => {
    try {
        const response = await api.delete(`/catalogs/${id}`);
        if (response.status !== 204) {
            throw new Error(`Respuesta inesperada: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al eliminar el catalogo");
    }
}

export const searchCatalog = async (searchTerm, page = 0, size = 10) => {
    try {
        const response = await api.get('/catalogs/search', {
            params: { query: searchTerm, page, size },
        });
        return response.data;
    } catch (error) {
        console.error('Error searching catalogs:', error);
        throw error;
    }
};

export const searchCatalogByUser = async (query, userId, page = 0, size = 6) => {
    try {
        const response = await api.get(`/catalogs/user/${userId}/search`, {
            params: { query, page, size },
        });
        return response.data;
    } catch (error) {
        handleApiError(error, "Error al buscar los catálogos del usuario");
    }
};


// Función auxiliar para manejar errores de API
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
        // Error de red (no se recibió respuesta)
        throw new Error("No se pudo conectar al servidor. Verifica tu conexión.");
    } else {
        // Error en la configuración de la solicitud
        throw new Error(defaultMessage);
    }
};