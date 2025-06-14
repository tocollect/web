import React, { useState, useEffect, useRef } from 'react';
import { getCatalogById, editCatalog, getImageCatalog } from '../../services/catalogService';
import { useNavigate, useParams } from 'react-router-dom';
import { convertImageToBase64 } from '../../utils/imageUtils.jsx';
import defaultImage from '../../assets/to_collect.png';
import '../../styles/CatalogForm.css';

const EditCatalogForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    
    // Estado para la imagen del catálogo cargada desde el servidor
    const [imageUrls, setImageUrls] = useState({});
    const [loadingImages, setLoadingImages] = useState({});

    // Estado para el formulario y la vista previa de la nueva imagen
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        imageUrl: null, // Para la nueva imagen en base64
        enabled: true
    });
    const [previewImage, setPreviewImage] = useState('');

    // --- Lógica para cargar la imagen existente ---
    const loadCatalogImage = async (catalogId) => {
        setLoadingImages(prev => ({ ...prev, [catalogId]: true }));
        try {
            const imageUrl = await getImageCatalog(catalogId, "CATALOG");
            setImageUrls(prev => ({
                ...prev,
                [catalogId]: imageUrl || defaultImage,
            }));
        } catch (error) {
            console.error(`Error al cargar imagen del catálogo ${catalogId}:`, error.message);
            setImageUrls(prev => ({
                ...prev,
                [catalogId]: defaultImage,
            }));
        } finally {
            setLoadingImages(prev => ({ ...prev, [catalogId]: false }));
        }
    };

    // --- Cargar datos del catálogo al montar ---
    useEffect(() => {
        const fetchCatalog = async () => {
            try {
                setLoading(true);
                const catalogData = await getCatalogById(id);
                setFormData({
                    id: catalogData.id,
                    name: catalogData.name || '',
                    description: catalogData.description || '',
                    imageUrl: null, // Empezar con null
                    enabled: catalogData.enabled !== false
                });

                // Cargar la imagen existente después de obtener los datos
                await loadCatalogImage(id);

                setError(null);
            } catch (err) {
                setError(err.message || 'Error al cargar los datos del catálogo');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCatalog();
        }
    }, [id]);
    
    useEffect(() => {
        return () => {
            Object.values(imageUrls).forEach(url => {
                if (url && url.startsWith('blob:')) {
                    URL.revokeObjectURL(url);
                }
            });
        };
    }, [imageUrls]);


    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setError(null);
                const base64Image = await convertImageToBase64(file);
                setFormData(prev => ({ ...prev, imageUrl: base64Image }));
                setPreviewImage(base64Image); // Actualizar vista previa con la nueva imagen
            } catch (error) {
                setError('Error al procesar la imagen.');
                console.error('Error:', error);
            }
        }
    };

    const handleRemoveImage = () => {
        setFormData(prev => ({ ...prev, imageUrl: '' }));
        setPreviewImage('');
        setImageUrls(prev => ({ ...prev, [id]: defaultImage }));
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            const userId = JSON.parse(localStorage.getItem('userData'))?.id || '';
            await editCatalog(formData);

            setSuccessMessage('¡Catálogo actualizado con éxito!');
            setTimeout(() => {
                navigate(`/user-catalogs/${userId}`);
            }, 1500);

        } catch (err) {
            if (err.message && err.message.includes("sesión ha expirado")) {
                setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
                setTimeout(() => navigate("/auth/login"), 2000);
            } else {
                setError(err.message || 'Error al actualizar el catálogo');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading && !formData.name) {
        return <div className="loading-message">Cargando...</div>;
    }

    // Determinar qué imagen mostrar
    const currentImage = previewImage || imageUrls[id] || defaultImage;

    return (
        <div className="catalog-form-container">
            <h2 className="catalog-form-title">Editar Catálogo</h2>

            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <form className="catalog-form" onSubmit={handleSubmit}>
                {/* Campos del formulario (nombre, descripción) */}
                 <div className="form-group">
                     <label htmlFor="name">Nombre:</label>
                     <input
                         id="name" type="text" name="name"
                         value={formData.name} onChange={handleChange} required
                     />
                 </div>
                 <div className="form-group">
                     <label htmlFor="description">Descripción:</label>
                     <textarea
                         id="description" name="description"
                         value={formData.description} onChange={handleChange} required
                     />
                 </div>

                <div className="form-group">
                    <label htmlFor="image">Imagen (opcional):</label>
                    <div className="image-preview">
                        {loadingImages[id] ? (
                            <p>Cargando imagen...</p>
                        ) : (
                            <img src={currentImage} alt="Vista previa del catálogo" />
                        )}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                            <button type="button" className="cancel-button" onClick={handleRemoveImage}>
                                Eliminar imagen
                            </button>
                            <button type="button" className="btn-edit" onClick={() => fileInputRef.current?.click()}>
                                Cambiar imagen
                            </button>
                        </div>
                    </div>
                     <input
                         type="file" accept="image/*" ref={fileInputRef}
                         style={{ display: 'none' }} onChange={handleImageChange}
                     />
                </div>

                <div className="checkbox-group">
                    <input
                        id="enabled" type="checkbox" name="enabled"
                        checked={formData.enabled} onChange={handleChange}
                    />
                    <label htmlFor="enabled">Habilitado</label>
                </div>

                <div className="form-buttons">
                    <button type="button" className="cancel-button"
                        onClick={() => {
                            const userId = JSON.parse(localStorage.getItem('userData'))?.id || '';
                            navigate(`/user-catalogs/${userId}`);
                        }}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button type="submit" className="submit-button" disabled={loading}>
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditCatalogForm;