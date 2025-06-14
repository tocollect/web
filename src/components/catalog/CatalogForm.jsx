import React, { useState, useRef } from "react";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { addCatalog } from "../../services/catalogService.js";
import { convertImageToBase64 } from '../../utils/imageUtils.jsx';
import "../../styles/CatalogForm.css";

const CatalogForm = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        rating: 0,
        imageUrl: "",
        enabled: true,
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [previewImage, setPreviewImage] = useState("");

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (type === "number" ? parseFloat(value) || 0 : value),
        }));
    };

    // Manejar selección de imagen y convertir a base64
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setError("");
                const base64Image = await convertImageToBase64(file);
                
                setFormData(prev => ({
                    ...prev,
                    imageUrl: base64Image
                }));
                
                // Mostrar vista previa
                setPreviewImage(base64Image);
            } catch (error) {
                setError('Error al procesar la imagen.');
                console.error('Error:', error);
            }
        }
    };

    // Eliminar imagen seleccionada
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            imageUrl: ""
        }));
        setPreviewImage("");
        // Limpiar el input file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const catalogData = {
            ...formData,
        };

        try {
            await addCatalog(catalogData);
            navigate("/dashboard");
        } catch (err) {
            console.error("Error al crear el catálogo:", err);
            setError("No se pudo crear el catálogo. Inténtalo nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="catalog-form-container">
            <h2 className="catalog-form-title">Agregar Nuevo Catálogo</h2>

            {error && <p className="error-message">{error}</p>}

            <form className="catalog-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Nombre:</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Descripción:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="imageUrl">Imagen (opcional):</label>
                    {previewImage ? (
                        <div className="image-preview">
                            <img src={previewImage} alt="Vista previa" />
                            <button
                                type="button"
                                className="cancel-button"
                                onClick={handleRemoveImage}
                                style={{ marginTop: '0.5rem' }}
                            >
                                Eliminar imagen
                            </button>
                        </div>
                    ) : (
                        <>
                            <input
                                id="imageUrl"
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                            />
                        </>
                    )}
                </div>

                <div className="checkbox-group">
                    <input
                        id="enabled"
                        type="checkbox"
                        name="enabled"
                        checked={formData.enabled}
                        onChange={handleChange}
                    />
                    <label htmlFor="enabled">Habilitado</label>
                </div>

                <button
                    className="submit-button"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Guardando..." : "Guardar Catálogo"}
                </button>
            </form>
        </div>
    );
};

export default CatalogForm;