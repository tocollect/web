import { api } from "../api/api";

// Función para obtener ítems por ID de catálogo
export const getItemsByCatalogId = async (id) => {
  try {
    const response = await api.get(`/items/catalog/${id}`);
    if (response.status !== 200) {
      throw new Error(`Respuesta inesperada: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, "Error al obtener los ítems del catálogo");
  }
};

export const getItemsByCatalogIdPaginated = async (catalogId, page = 0, size = 6) => {
  try {
    const response = await api.get(`/items/catalog/${catalogId}`);
    if (response.status !== 200) {
      throw new Error(`Respuesta inesperada: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, "Error al obtener los ítems del catálogo (paginado)");
  }
};


export const addItem = async (itemData) => {
  try {
    const response = await api.post("/items", itemData);
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
      handleApiError(error, "Error al crear el item");
    }
  }
};

export const updateItem = async (itemId, itemData) => {
  try {
    const response = await api.patch(`/items/${itemId}`, itemData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al actualizar el item';
    console.error('Error en updateItem:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getItemById = async (itemId) => {
  try {
    const response = await api.get(`/items/id/${itemId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al obtener el item';
    throw new Error(errorMessage);
  }
}

export const deleteItem = async (itemId) => {
  try {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al eliminar el ítem';
    console.error('Error en deleteItem:', errorMessage);
    throw new Error(errorMessage);
  }
};


export const getImageItem = async (userId, type) => {
  try {
    const response = await api.get(`/images/profile/${type}/${userId}/raw`, {
      responseType: 'blob',
    });
    
    if (!response.data || response.data.size === 0) {
      throw new Error("No hay imagen disponible");
    }
    
    const imageUrl = URL.createObjectURL(response.data);
    return imageUrl;
  } catch (error) {
    // Manejar específicamente el error 404 (no encontrado)
    if (error.response?.status === 404) {
      console.log(`No se encontró imagen para ${type} con ID: ${userId}`);
      return null; // Retornar null cuando no hay imagen, no lanzar error
    }
    
    // Para otros errores, usar el manejador de errores
    console.error(`Error al cargar imagen para ${type} ID ${userId}:`, error);
    throw handleApiError(error, "Error al mostrar imagen del item");
  }
};

export const seachItemsByCatalog = async (query, catalogId) => {
  try {
    const response = await api.get(`/items/catalog/${catalogId}/search?query=${query}`);
    if (response.status !== 200) {
      throw new Error(`Respuesta inesperada: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, "Error al buscar el catalogo");
  }
}

// Función auxiliar para manejar errores
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