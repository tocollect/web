import React, { useState, useEffect, useRef } from "react";
import { updateItem, getItemById, getImageItem } from "../../services/itemService";
import { convertImageToBase64 } from "../../utils/imageUtils";
import defaultItemImage from '../../assets/to_collect.png';
import "../../styles/ItemForm.css";

const EditItemForm = ({ itemId, onItemUpdated, onCancel }) => {
    const [formData, setFormData] = useState({
        catalogId: 0,
        name: "",
        description: "",
        imageUrl: null,
        enabled: true
    });

    const [existingImageUrl, setExistingImageUrl] = useState("");
    const [previewImage, setPreviewImage] = useState("");
    
    const [loading, setLoading] = useState(true);
    const [loadingImage, setLoadingImage] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchItemData = async () => {
            setLoading(true);
            try {
                const itemData = await getItemById(itemId);
                setFormData({
                    catalogId: itemData.catalogId,
                    name: itemData.name || "",
                    description: itemData.description || "",
                    imageUrl: null,
                    enabled: itemData.enabled !== false
                });

                setLoadingImage(true);
                const imageUrl = await getImageItem(itemId, "ITEM");
                setExistingImageUrl(imageUrl || "");
                
            } catch (err) {
                console.error("Error al cargar el ítem:", err);
                setError("No se pudo cargar la información del ítem");
            } finally {
                setLoading(false);
                setLoadingImage(false);
            }
        };
        fetchItemData();
    }, [itemId]);
    
    useEffect(() => {
        return () => {
            if (existingImageUrl && existingImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(existingImageUrl);
            }
        };
    }, [existingImageUrl]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const base64Image = await convertImageToBase64(file);
                setPreviewImage(base64Image);
                setFormData(prev => ({ ...prev, imageUrl: base64Image }));
            } catch (err) {
                setError("Error al procesar la imagen.");
            }
        }
    };

    const handleRemoveImage = () => {
        setPreviewImage("");
        setExistingImageUrl("");
        setFormData(prev => ({ ...prev, imageUrl: "" }));
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const dataToSend = {
                ...formData,
                catalogId: Number(formData.catalogId),
                name: formData.name.trim(),
                description: formData.description.trim(),
            };

            const result = await updateItem(itemId, dataToSend);
            setSuccessMessage("¡Item actualizado con éxito!");

            setTimeout(() => {
                if (onItemUpdated) onItemUpdated(result);
            }, 500);

        } catch (err) {
            console.error("Error al actualizar el ítem:", err);
            setError(err.message || "Error al actualizar el item");
        } finally {
            setLoading(false);
        }
    };
    
    const imageToShow = previewImage || existingImageUrl || defaultItemImage;

    return (
        <div className="item-form-container">
            <h2 className="item-form-title">Editar Item</h2>

            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            {loading ? (
                <p className="loading-message">Cargando...</p>
            ) : (
                <form className="item-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Nombre:</label>
                        <input id="name" type="text" name="name" value={formData.name} onChange={handleChange} required maxLength={20} />
                        <small className="input-help">Máximo 20 caracteres</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descripción:</label>
                        <textarea id="description" name="description" value={formData.description} onChange={handleChange} required maxLength={1000} />
                        <small className="input-help">Máximo 1000 caracteres</small>
                    </div>

                    <div className="form-group">
                        <label>Imagen (opcional):</label>
                        <div className="image-preview-container">
                             {loadingImage ? (
                                <p>Cargando imagen...</p>
                             ) : (
                                <>
                                    <img src={imageToShow} alt="Vista previa" className="image-preview" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                                    <div className="image-buttons">
                                        <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
                                            Cambiar
                                        </button>
                                        {(previewImage || existingImageUrl) && (
                                             <button type="button" className="btn-danger" onClick={handleRemoveImage}>
                                                Eliminar
                                             </button>
                                        )}
                                    </div>
                                </>
                             )}
                        </div>
                        <input id="imageUrl" type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} style={{ display: 'none' }} />
                    </div>

                    <div className="form-group checkbox-group">
                        <label htmlFor="enabled" className="checkbox-label">
                            <input id="enabled" type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} />
                            <span>Habilitar ítem</span>
                        </label>
                        <p className="checkbox-help">Los ítems habilitados son visibles para todos los usuarios.</p>
                    </div>

                    <div className="form-buttons">
                        <button type="button" className="cancel-button" onClick={onCancel} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="submit-button" disabled={loading}>
                            {loading ? "Guardando..." : "Actualizar Item"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EditItemForm;