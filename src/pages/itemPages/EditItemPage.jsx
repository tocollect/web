// src/pages/itemPages/EditItemPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditItemForm from "../../components/item/EditItemForm";

const EditItemPage = () => {
    const { itemId, catalogId } = useParams();
    const navigate = useNavigate();

    const handleItemUpdated = (updatedItem) => {
        // Redirigir a la lista de ítems del catálogo después de actualizar el ítem
        setTimeout(() => {
            navigate(`/items/catalog/${catalogId}`);
        }, 1500);
    };

    return (
        <div className="edit-item-page">
            <EditItemForm
                itemId={itemId}
                catalogId={catalogId}
                onItemUpdated={handleItemUpdated}
                onCancel={() => navigate(`/items/catalog/${catalogId}`)}
            />
        </div>
    );
};

export default EditItemPage;