import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEdit } from 'react-icons/fa';
import defaultImage from '../../assets/to_collect.png';
import { AuthContext } from '../../context/AuthContext.jsx';
import { getImageCatalog } from '../../services/catalogService';

const CatalogList = ({ catalogs }) => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [imageUrls, setImageUrls] = useState({});
    const [loadingImages, setLoadingImages] = useState({});

    // Cargar imagen para cada catálogo
    const loadCatalogImage = async (catalogId, userId) => {
        // Marcar como cargando
        setLoadingImages(prev => ({
            ...prev,
            [catalogId]: true
        }));

        try {
            const imageUrl = await getImageCatalog(catalogId, "CATALOG");
            setImageUrls((prev) => ({
                ...prev,
                [catalogId]: imageUrl || defaultImage,
            }));
            console.log(imageUrls)
        } catch (error) {
            console.error(`Error al cargar imagen del catálogo ${catalogId}:`, error.message);
            setImageUrls((prev) => ({
                ...prev,
                [catalogId]: defaultImage,
            }));
        } finally {
            // Marcar como terminado de cargar
            setLoadingImages(prev => ({
                ...prev,
                [catalogId]: false
            }));
        }
    };

    // Cargar todas las imágenes cuando se monte el componente o cambien los catálogos
    useEffect(() => {
        if (catalogs && catalogs.length > 0) {
            // Limpiar URLs anteriores si es necesario
            const catalogIds = catalogs.map(catalog => catalog.id);
            setImageUrls(prev => {
                const filtered = {};
                catalogIds.forEach(id => {
                    if (prev[id]) filtered[id] = prev[id];
                });
                return filtered;
            });

            // Cargar imágenes para cada catálogo
            catalogs.forEach(catalog => {
                if (!imageUrls[catalog.id]) {
                    loadCatalogImage(catalog.id, catalog.userId);
                }
            });
        }
    }, [catalogs]);

    // Limpiar URLs de objetos cuando el componente se desmonte
    useEffect(() => {
        return () => {
            Object.values(imageUrls).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, []);

    const handleImageError = (catalogId) => {
        console.log(`Error al mostrar imagen del catálogo ${catalogId}, usando imagen por defecto`);
        setImageUrls(prev => ({
            ...prev,
            [catalogId]: defaultImage
        }));
    };

    return (
        <>
            {catalogs.map((catalog) => (
                <div
                    key={catalog.id}
                    className="catalog-card"
                    onClick={() => navigate(`/items/catalog/${catalog.id}`)}
                    style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s',
                        cursor: 'pointer',
                        maxWidth: '300px',
                        margin: '1rem',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {/* Contenedor de imagen */}
                    <div className="catalog-image-container" style={{ position: 'relative' }}>
                        {loadingImages[catalog.id] && (
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
                            src={imageUrls[catalog.id] || defaultImage}
                            alt={catalog.name || "Imagen de catálogo"}
                            style={{
                                width: '100%',
                                height: '200px',
                                objectFit: 'cover',
                                opacity: loadingImages[catalog.id] ? 0.5 : 1,
                                transition: 'opacity 0.3s ease'
                            }}
                            onError={() => handleImageError(catalog.id)}
                            onLoad={() => {
                                // Asegurar que se quite el estado de carga cuando la imagen se carga
                                setLoadingImages(prev => ({
                                    ...prev,
                                    [catalog.id]: false
                                }));
                            }}
                        />

                        {user && user.id === catalog.userId && (
                            <Link
                                to={`/catalogs/edit/${catalog.id}`}
                                className="edit-item-button"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <FaEdit />
                            </Link>
                        )}

                        {/* Badge de deshabilitado si no está activo */}
                        {!catalog.enabled && (
                            <span
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    left: '10px',
                                    background: '#dc3545',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}
                            >
                                Deshabilitado
                            </span>
                        )}
                    </div>

                    {/* Información del catálogo */}
                    <div className="catalog-info" style={{ padding: '1rem' }}>
                        <h3 style={{
                            fontSize: '1.2rem',
                            marginBottom: '0.5rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {catalog.name}
                        </h3>
                        <p style={{
                            color: '#666',
                            fontSize: '0.9rem',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                        }}>
                            {catalog.description || 'Sin descripción'}
                        </p>
                    </div>
                </div>
            ))}
        </>
    );
};

export default CatalogList;