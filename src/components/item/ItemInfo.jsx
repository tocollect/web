import React from 'react';
import defaultImage from '../../assets/to_collect.png';

const ItemInfo = ({ item }) => {
    return (
        <div className="item-detail-content">
            <div className="item-detail-image-container">
                <img
                    src={item.imageUrl || defaultImage}
                    alt={item.name}
                    className="item-detail-image"
                />
            </div>

            <div className="item-detail-info">
                <div className="item-description">
                    <h3>Descripción:</h3>
                    <p>{item.description || "Sin descripción disponible"}</p>
                </div>
            </div>
        </div>
    );
};

export default ItemInfo;