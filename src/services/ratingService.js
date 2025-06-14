import { api } from "../api/api";

export const getItemAverageRating = async (itemId) => {
  try {
    const response = await api.get(`/ratings/item/${itemId}/average`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener la calificación media:', error);
    throw new Error('No se pudo obtener la calificación media del item');
  }
};

export const rateItem = async (itemId, rating) => {
  try {
    const response = await api.post('/ratings', {
      itemId: itemId,
      rating: rating
    });
    return response.data;
  } catch (error) {
    console.error('Error al calificar el item:', error);
    throw new Error('No se pudo calificar el item');
  }
};

export const handleApiError = (error, defaultMessage) => {
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