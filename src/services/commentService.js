import { api } from "../api/api";


export const getCommentsByItemIdOrdered = async (itemId) => {
  try {
    const response = await api.get(`/comments/item/${itemId}/ordered`);
    if (response.status !== 200) {
      throw new Error(`Respuesta inesperada: ${response.status}`);
    }
    return response.data;
  } catch (error) {
    handleApiError(error, "Error al obtener los comentarios del ítem");
  }
}

export const addComment = async (commentData) => {
  try {
    console.log('Enviando comentario:', commentData);
    const response = await api.post("/comments", commentData);
    if (response.status !== 201) {
      throw new Error(`Respuesta inesperada: ${response.status}`);
    }
    // Asegurarse de que el comentario tenga la estructura correcta antes de devolverlo
    const comment = response.data;
    return {
      ...comment,
      text: comment.text || comment.content, // Manejar ambos campos por compatibilidad
      userName: comment.userName || 'Usuario'
    };
  } catch (error) {
    console.error("Error completo:", error);
    if (error.response && error.response.status === 401) {
      throw new Error("Tu sesión puede haber expirado. Los datos se guardaron pero necesitarás recargar la página.");
    } else {
      handleApiError(error, "Error al crear el comentario");
    }
  }
}

export const updateComment = async (commentId, commentData) => {
  try {
    const response = await api.patch(`/comments/${commentId}`, commentData);
    return response.data;
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error al actualizar el comentario';
    console.error('Error en updateComment:', errorMessage);
    handleApiError(error, "Error al crear el comentario");
}
}
export const deleteComment = async (commentId) => {
    try {
        const response = await api.delete(`/comments/${commentId}`);
        return response.data;
    }   catch (error) { 
        const errorMessage = error.response?.data?.message || 'Error al eliminar el comentario';
        console.error('Error en deleteComment:', errorMessage);
        handleApiError(error, "Error al crear el comentario");
    }   
}

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