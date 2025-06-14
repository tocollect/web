import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit, FaTimes } from 'react-icons/fa';
import { deleteItem, getImageItem } from '../../services/itemService';
import '../../styles/ItemListByCatalog.css';
import defaultItemImage from '../../assets/to_collect.png';

const ItemListByCatalog = ({ items, catalogId, isOwner }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [itemImageUrls, setItemImageUrls] = useState({});
  const [loadingItemImages, setLoadingItemImages] = useState({});
  const [imageLoadAttempts, setImageLoadAttempts] = useState(new Set());

  // Función memoizada para cargar imagen de un ítem
  const loadItemImage = useCallback(async (itemId) => {
    // Evitar cargas duplicadas
    if (imageLoadAttempts.has(itemId) || loadingItemImages[itemId]) {
      return;
    }

    // Marcar como intentado y en carga
    setImageLoadAttempts(prev => new Set(prev).add(itemId));
    setLoadingItemImages(prev => ({
      ...prev,
      [itemId]: true
    }));

    try {
      const imageUrl = await getImageItem(itemId, "ITEM");
      setItemImageUrls(prev => ({
        ...prev,
        [itemId]: imageUrl || defaultItemImage, // Si imageUrl es null, usar imagen por defecto
      }));
    } catch (error) {
      // Solo loggear errores reales, no 404s
      console.error(`Error al cargar imagen del ítem ${itemId}:`, error.message);
      setItemImageUrls(prev => ({
        ...prev,
        [itemId]: defaultItemImage,
      }));
    } finally {
      setLoadingItemImages(prev => ({
        ...prev,
        [itemId]: false
      }));
    }
  }, [loadingItemImages, imageLoadAttempts]);

  // Efecto para cargar las imágenes de los ítems - SOLO cuando cambian los items
  useEffect(() => {
    if (items && items.length > 0) {
      items.forEach(item => {
        if (!imageLoadAttempts.has(item.id)) {
          loadItemImage(item.id);
        }
      });
    }
  }, [items, loadItemImage]);

  // Limpiar URLs de objetos blob al desmontar el componente
  useEffect(() => {
    return () => {
      Object.values(itemImageUrls).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  // Cerrar modal con tecla Escape
  useEffect(() => {
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape' && showModal) {
        handleCloseModal();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [showModal]);

  // Evitar scroll cuando el modal está abierto
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [showModal]);

  // Función para manejar el clic en el botón de eliminar
  const handleDeleteClick = (item, e) => {
    e.stopPropagation();
    setSelectedItem(item);
    setShowModal(true);
  };

  // Función para confirmar la eliminación
  const confirmDelete = async () => {
    if (!selectedItem) return;
    
    setLoading(true);
    setError('');
    
    try {
      await deleteItem(selectedItem.id);
      window.location.reload();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el ítem. Inténtalo de nuevo.');
      setLoading(false);
    }
  };
  
  // Función para cerrar el modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setError('');
  };

  // Cerrar al hacer clic en el fondo
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleItemClick = (itemId) => {
    navigate(`/items/detail/${itemId}`);
  };

  const handleItemImageError = useCallback((itemId) => {
    console.log(`Error al mostrar imagen del ítem ${itemId}, usando imagen por defecto`);
    setItemImageUrls(prev => ({
      ...prev,
      [itemId]: defaultItemImage
    }));
  }, []);

  if (items.length === 0) {
    return (
      <div className="no-items-message">
        No hay ítems disponibles en este catálogo.
      </div>
    );
  }

  return (
    <div className="item-list-container">
      <div className="items-grid">
        {items.map((item) => (
          <div 
            key={item.id} 
            className="item-card"
            onClick={() => handleItemClick(item.id)}
          >
            <div className="item-image-container">
              {loadingItemImages[item.id] && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 2,
                  background: 'rgba(255,255,255,0.8)',
                  padding: '10px',
                  borderRadius: '4px',
                  fontSize: '12px'
                }}>
                  Cargando...
                </div>
              )}
              
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
              
              {!item.enabled && (
                <div className="disabled-badge">Deshabilitado</div>
              )}
              
              {isOwner && (
                <>
                  <Link 
                    to={`/items/edit/${item.id}/${catalogId}`} 
                    className="edit-item-button" 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FaEdit />
                  </Link>
                  
                  <button
                    className="delete-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(item, e);
                    }}
                  >
                    <FaTimes />
                  </button>
                </>
              )}
            </div>
            
            <div className="item-details">
              <h3 className="item-name">{item.name}</h3>
              <p className="item-description">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {showModal && (
        <div className="custom-modal-backdrop" onClick={handleBackdropClick}>
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h3>Confirmar eliminación</h3>
              <button 
                className="close-modal-button" 
                onClick={handleCloseModal}
                aria-label="Cerrar"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="custom-modal-body">
              {error && (
                <div className="error-message-modal">
                  {error}
                </div>
              )}
              <p>¿Estás seguro de que deseas eliminar el ítem "{selectedItem?.name}"?</p>
              <p className="danger-text">Esta acción no se puede deshacer.</p>
            </div>
            
            <div className="custom-modal-footer">
              <button 
                className="cancel-button" 
                onClick={handleCloseModal} 
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="confirm-delete-button" 
                onClick={confirmDelete} 
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemListByCatalog;