// src/pages/itemPages/AddItemPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import ItemForm from "../../components/item/ItemForm";

const AddItemPage = () => {
    const { catalogId } = useParams();
    const navigate = useNavigate();

    const handleItemAdded = (newItem) => {
        // Redirigir a la lista de ítems del catálogo después de agregar el ítem
        setTimeout(() => {
            navigate(`/items/catalog/${catalogId}`);
        }, 1500);
    };

    return (
        <div className="add-item-page">
            <ItemForm
                catalogId={catalogId}
                onItemAdded={handleItemAdded}
                onCancel={() => navigate(`/items/catalog/${catalogId}`)}
            />
        </div>
    );
};

export default AddItemPage;