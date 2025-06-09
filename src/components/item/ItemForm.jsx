import React, { useState, useRef } from "react"; // Import useRef
import { addItem } from "../../services/itemService";
import { convertImageToBase64 } from '../../utils/imageUtils.jsx'; // Import the utility function
import "../../styles/ItemForm.css";

const ItemForm = ({ catalogId, onItemAdded, onCancel }) => {
    const fileInputRef = useRef(null); // Create a ref for the file input

    const [formData, setFormData] = useState({
        catalogId: catalogId || 0,
        name: "",
        description: "",
        imageUrl: "" // This will store the Base64 string
    });

    const [previewImage, setPreviewImage] = useState(""); // This will also be Base64 for display
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [enabled, setEnabled] = useState(true);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleCheckboxChange = (e) => {
        setEnabled(e.target.checked);
    };

    // Modified handleImageChange to convert to Base64
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

                // Set preview image for display
                setPreviewImage(base64Image);
            } catch (error) {
                setError('Error al procesar la imagen. Intenta con otra.');
                console.error('Error converting image to Base64:', error);
            }
        }
    };

    // New function to remove the selected image
    const handleRemoveImage = () => {
        setFormData(prev => ({
            ...prev,
            imageUrl: ""
        }));
        setPreviewImage("");
        // Clear the file input visually
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccessMessage(""); // Clear previous success messages

        // Basic validation
        if (!formData.name.trim()) {
            setError("El nombre del ítem es obligatorio.");
            setLoading(false);
            return;
        }

        if (!formData.description.trim()) {
            setError("La descripción del ítem es obligatoria.");
            setLoading(false);
            return;
        }

        const dataToSend = {
            catalogId: Number(formData.catalogId),
            name: formData.name.trim(),
            description: formData.description.trim(),
            imageUrl: formData.imageUrl, // This will now be the Base64 string or empty
            enabled: enabled
        };

        console.log("Datos a enviar:", dataToSend);

        try {
            const result = await addItem(dataToSend);
            setSuccessMessage("¡Item agregado con éxito!");

            setTimeout(() => {
                if (onItemAdded) {
                    onItemAdded(result);
                }
            }, 1500);
        } catch (err) {
            console.error("Error al crear el ítem:", err);
            setError(err.message || "Error al crear el ítem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="item-form-container">
            <h2 className="item-form-title">Agregar Nuevo Item</h2>

            {error && <p className="error-message">{error}</p>}
            {successMessage && <p className="success-message">{successMessage}</p>}

            <form className="item-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Nombre:</label>
                    <input
                        id="name"
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        maxLength={20}
                    />
                    <small className="input-help">Máximo 20 caracteres</small>
                </div>

                <div className="form-group">
                    <label htmlFor="description">Descripción:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        required
                        maxLength={1000}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="imageUrl">Imagen (opcional):</label>
                    {/* Conditional rendering for image input/preview */}
                    {previewImage ? (
                        <div className="image-preview">
                            <img src={previewImage} alt="Vista previa" />
                            <button
                                type="button"
                                className="cancel-button" // Reuse a clear button style
                                onClick={handleRemoveImage}
                                style={{ marginTop: '0.5rem' }}
                            >
                                Eliminar imagen
                            </button>
                        </div>
                    ) : (
                        <input
                            id="imageUrl"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            ref={fileInputRef} // Attach the ref here
                        />
                    )}
                </div>

                <div className="form-group checkbox-group">
                    <label htmlFor="enabled" className="checkbox-label">
                        <input
                            id="enabled"
                            type="checkbox"
                            checked={enabled}
                            onChange={handleCheckboxChange}
                        />
                        <span>Habilitar ítem</span>
                    </label>
                    <p className="checkbox-help">
                        Los ítems habilitados son visibles para todos los usuarios
                    </p>
                </div>

                <div className="form-buttons">
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="submit-button"
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Item"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ItemForm;