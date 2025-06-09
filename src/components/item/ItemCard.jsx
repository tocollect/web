// src/components/item/ItemCard.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Cambiamos useNavigate por Link
import { FaEdit, FaTrash } from 'react-icons/fa';
import defaultImage from '../../assets/to_collect.png';

const ItemCard = ({ item, onEdit, onDelete, isOwner }) => {
    // En lugar de usar navigate, usamos Link que es más directo
    return (
        <Link
            to={`/items/${item.id}`}
            className="item-card-link"
            style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
        >
            <div className="item-card">
                <div className="item-image-container">
                    <img
                        src={item.imageUrl || defaultImage}
                        alt={item.name || "Imagen predeterminada"}
                        className="item-image"
                    />
                    {isOwner && (
                        <div className="item-actions">
                            <button
                                className="edit-button"
                                onClick={(e) => {
                                    e.preventDefault(); // Evitar la navegación por defecto del Link
                                    e.stopPropagation();
                                    onEdit(item.id);
                                }}
                            >
                                <FaEdit />
                            </button>
                            <button
                                className="delete-button"
                                onClick={(e) => {
                                    e.preventDefault(); // Evitar la navegación por defecto del Link
                                    e.stopPropagation();
                                    onDelete(item.id);
                                }}
                            >
                                <FaTrash />
                            </button>
                        </div>
                    )}
                </div>
                <div className="item-info">
                    <h3>{item.name}</h3>
                </div>
            </div>
        </Link>
    );
};

export default ItemCard;