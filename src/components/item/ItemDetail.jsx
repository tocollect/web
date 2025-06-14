import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemById, getImageItem } from '../../services/itemService';
import { getItemAverageRating, rateItem } from '../../services/ratingService';
import { getCommentsByItemIdOrdered, addComment } from '../../services/commentService';
import { AuthContext } from '../../context/AuthContext';
import CommentSection from './CommentSection';
import defaultImage from '../../assets/to_collect.png';
import setaImage from '../../assets/seta.png';
import '../../styles/ItemDetail.css';
import { getCatalogById } from '../../services/catalogService';
import chatService from '../../services/chatService';
import '../../styles/ModalMessage.css';

const ItemDetail = () => {
    const { itemId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(AuthContext);
    const [item, setItem] = useState(null);
    const [averageRating, setAverageRating] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comments, setComments] = useState([]);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [itemImageUrls, setItemImageUrls] = useState({});
    const [loadingItemImages, setLoadingItemImages] = useState({});
    const [imageLoadAttempts] = useState(new Set());
    // New state for catalog owner ID
    const [catalogOwnerId, setCatalogOwnerId] = useState(null);
    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initialMessageText, setInitialMessageText] = useState("");
    // NUEVO ESTADO: Guarda el objeto de la conversación si existe, o null
    const [existingConversation, setExistingConversation] = useState(null);

    const defaultItemImage = defaultImage;

    const fetchAverageRating = async () => {
        try {
            const ratingData = await getItemAverageRating(itemId);
            setAverageRating(typeof ratingData === 'number' ? ratingData : ratingData?.average || 0);
        } catch (err) {
            console.error('Error al obtener valoración media:', err);
        }
    };

    const loadItemImage = useCallback(async (id) => {
        if (imageLoadAttempts.has(id) || loadingItemImages[id]) {
            return;
        }
        imageLoadAttempts.add(id); // Añadir al Set para evitar reintentos innecesarios
        setLoadingItemImages(prev => ({
            ...prev,
            [id]: true
        }));
        try {
            const imageUrl = await getImageItem(id, "ITEM");
            setItemImageUrls(prev => ({
                ...prev,
                [id]: imageUrl || defaultItemImage,
            }));
        } catch (error) {
            console.error(`Error al cargar imagen del ítem ${id}:`, error.message);
            setItemImageUrls(prev => ({
                ...prev,
                [id]: defaultItemImage,
            }));
        } finally {
            setLoadingItemImages(prev => ({
                ...prev,
                [id]: false
            }));
        }
    }, [loadingItemImages, imageLoadAttempts, defaultItemImage]); // Dependencias para la useCallback

    useEffect(() => {
        if (item && !imageLoadAttempts.has(item.id)) {
            loadItemImage(item.id);
        }
    }, [item, loadItemImage, imageLoadAttempts]); // Dependencias para el useEffect

    useEffect(() => {
        return () => {
            Object.values(itemImageUrls).forEach(url => {
                if (url && typeof url === 'string' && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [itemImageUrls]);

    const handleItemImageError = useCallback((id) => {
        console.log(`Error al mostrar imagen del ítem ${id}, usando imagen por defecto`);
        setItemImageUrls(prev => ({
            ...prev,
            [id]: defaultItemImage
        }));
        setLoadingItemImages(prev => ({
            ...prev,
            [id]: false
        }));
    }, [defaultItemImage]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [itemData, ratingData, commentsData] = await Promise.all([
                    getItemById(itemId),
                    getItemAverageRating(itemId),
                    getCommentsByItemIdOrdered(itemId)
                ]);
                setItem(itemData);
                setAverageRating(typeof ratingData === 'number' ? ratingData : ratingData?.average || 0);
                setComments(commentsData || []);
                // Fetch catalog owner information
                if (itemData && itemData.catalogId) {
                    const catalog = await getCatalogById(itemData.catalogId);
                    if (catalog && catalog.userId) {
                        setCatalogOwnerId(catalog.userId);

                        if (currentUser && currentUser.id !== catalog.userId) {
                            const conv = await chatService.loadConversationBetweenUsers(currentUser.id, catalog.userId);
                            setExistingConversation(conv); // Almacena el objeto de la conversación (o null si no existe)
                        } else {
                            setExistingConversation(null); // Reinicia si no hay usuario logeado, o es el mismo
                        }
                    } else {
                        setExistingConversation(null); // Reinicia si no hay propietario del catálogo
                    }
                } else {
                    setExistingConversation(null); // Reinicia si no hay datos del ítem o catálogo
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [itemId, currentUser]);

    const handleRating = async (rating) => {
        try {
            setUpdating(true);
            setUserRating(rating);
            await rateItem(itemId, rating);
            await fetchAverageRating();
            setRatingSubmitted(true);
            setTimeout(() => {
                setRatingSubmitted(false);
            }, 3000);
        } catch (err) {
            console.error('Error al calificar el item:', err);
            setError('Error al enviar tu calificación');
        } finally {
            setUpdating(false);
        }
    };

    const handleAddComment = async (text) => {
        try {
            const commentData = {
                text,
                itemId: parseInt(itemId)
            };
            const addedComment = await addComment(commentData);
            setComments(prevComments => [...prevComments, addedComment]);
        } catch (err) {
            console.error('Error al añadir comentario:', err);
            throw err;
        }
    };

    const handleUpdateComment = (updatedComment) => {
        setComments(prevComments =>
            prevComments.map(comment =>
                comment.id === updatedComment.id ? updatedComment : comment
            )
        );
    };

    const handleDeleteComment = (commentId) => {
        setComments(prevComments =>
            prevComments.filter(comment => comment.id !== commentId)
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Función para manejar el inicio/acceso al chat
    const handleStartChat = async () => {
        if (!currentUser) {
            alert('Debes iniciar sesión para chatear.');
            return;
        }
        if (!catalogOwnerId) {
            alert('No se pudo encontrar al propietario del catálogo para iniciar el chat.');
            return;
        }
        if (currentUser.id === catalogOwnerId) {
            alert('No puedes iniciar un chat contigo mismo.');
            return;
        }

        if (existingConversation) {
            // Si la conversación ya existe, navega directamente a ella
            console.log("Conversación existente, navegando directamente.");
            navigate('/chat', {
                state: {
                    sender: currentUser.id.toString(),
                    receiver: catalogOwnerId.toString(),
                    conversationId: existingConversation.id.toString()
                }
            });
        } else {
            // Si no existe, abre el modal para crear el primer mensaje
            setIsModalOpen(true);
        }
    };

    const handleSubmitInitialMessage = async () => {
        if (!initialMessageText.trim()) {
            alert("El mensaje no puede estar vacío.");
            return;
        }

        try {
            setIsModalOpen(false); // Cerrar el modal

            let conversationToUse = existingConversation;

            if (!conversationToUse) {
                // Si aún no tenemos una conversación existente, creamos una nueva con el primer mensaje
                console.log("No existing conversation, attempting to create one with an initial message.");
                const initialMessageResponse = await chatService.createMessage({
                    senderId: currentUser.id,
                    receiverId: catalogOwnerId,
                    text: initialMessageText
                });
                conversationToUse = { id: initialMessageResponse.conversationId }; // Asume que la respuesta tiene conversationId
            } else {

                await chatService.createMessage({ // Asume que createMessage puede tomar conversationId
                    senderId: currentUser.id,
                    receiverId: catalogOwnerId, // Puede que no sea estrictamente necesario si ya tienes conversationId
                    text: initialMessageText,
                    conversationId: conversationToUse.id // Pasa el ID de la conversación existente
                });
            }
            setExistingConversation(conversationToUse);

            navigate('/chat', {
                state: {
                    sender: currentUser.id.toString(),
                    receiver: catalogOwnerId.toString(),
                    conversationId: conversationToUse.id.toString()
                }
            });

        } catch (err) {
            console.error('Error al iniciar el chat o enviar mensaje:', err);
            alert('Error al iniciar el chat. Por favor, inténtalo de nuevo.');
        }
    };

    // Lógica para deshabilitar el botón de contactar
    const isContactButtonDisabled = !currentUser || !catalogOwnerId || currentUser.id === catalogOwnerId || existingConversation !== null;

    // Determinar el texto del botón
    const contactButtonText = (() => {
        if (currentUser?.id === catalogOwnerId) {
            return "Tu catálogo";
        }
        return existingConversation ? "Ver conversación" : "Contactar usuario";
    })();

    const contactButtonTitle = (() => {
        if (!currentUser) return "Debes iniciar sesión para contactar";
        if (!catalogOwnerId) return "No se puede identificar al propietario";
        if (currentUser.id === catalogOwnerId) return "Este es tu catálogo";
        if (existingConversation) return "Ver conversación existente";
        return "Iniciar chat con el usuario";
    })();

    if (loading) return <div className="loading-container">Cargando detalles del item...</div>;
    if (error) return <div className="error-message">Error: {error}</div>;
    if (!item) return <div className="error-message">No se encontró el item</div>;

    return (
        <div className="item-detail-container">
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Escribe tu primer mensaje:</h3>
                        <textarea
                            value={initialMessageText}
                            onChange={(e) => setInitialMessageText(e.target.value)}
                            placeholder="Escribe aquí..."
                            rows="4"
                        />
                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                onClick={handleSubmitInitialMessage}
                                disabled={!initialMessageText.trim()}
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="item-detail-card">
                <div className="item-detail-header">
                    <h2>{item.name}</h2>
                </div>
                <div className="item-detail-content">
                    <div className="item-detail-image-container">
                        <img
                            src={itemImageUrls[item.id] || defaultItemImage}
                            alt={item.name}
                            className="item-image"
                            style={{
                                opacity: loadingItemImages[item.id] ? 0.5 : 1,
                                transition: 'opacity 0.3s ease'
                            }}
                            onError={() => handleItemImageError(item.id)}
                            onLoad={() => {
                                setLoadingItemImages(prev => ({
                                    ...prev,
                                    [item.id]: false
                                }));
                            }}
                        />
                    </div>
                    <div className="item-detail-info">
                        <div className="item-description" style={{overflowY: 'auto',height:'200px'}}>
                            <h3>Descripción:</h3>
                            <p>{item.description || "Sin descripción disponible"}</p>
                        </div>
                    </div>
                    <div className="item-rating-section">
                        <div className="average-rating">
                            <h3>Valoración media:</h3>
                            <div className="rating-display">
                                <span className="rating-number">{averageRating.toFixed(1)}</span>
                                <span className="rating-max">/5</span>
                            </div>
                        </div>
                        <div className="rate-item-section">
                            <h3>¡Valora este item!</h3>
                            <div className="rating-selector">
                                {[1, 2, 3, 4, 5].map(value => (
                                    <button
                                        key={value}
                                        className={`rating-seta ${userRating === value ? 'selected' : ''}`}
                                        onClick={() => handleRating(value)}
                                        disabled={updating}
                                        style={{ color: updating ? '#ccc' : '#000' }}
                                    >
                                        <img
                                            src={setaImage}
                                            alt={`Puntuación ${value}`}
                                            className="seta-image"
                                        />
                                        <span className="rating-value">{value}</span>
                                    </button>
                                ))}
                            </div>
                            {ratingSubmitted && (
                                <div className="rating-success-message">
                                    ¡Gracias por tu valoración!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <CommentSection
                    comments={comments}
                    user={currentUser}
                    itemId={itemId}
                    onAddComment={handleAddComment}
                    onUpdateComment={handleUpdateComment}
                    onDeleteComment={handleDeleteComment}
                    formatDate={formatDate}
                />
                <div className="item-detail-actions">
                    <button
                        className="back-button"
                        style={{marginRight:"2rem"}}
                        onClick={handleStartChat}
                        disabled={isContactButtonDisabled}
                        title={contactButtonTitle}
                    >
                        {contactButtonText}
                    </button>
                    <button
                        className="back-button"
                        onClick={() => navigate(-1)}
                    >
                        <span className="arrow">←</span> Volver
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemDetail;