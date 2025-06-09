// src/components/ModalConfirmacion.jsx
import React from "react";
import "../styles/ModalConfirmacion.css";

const ModalConfirmacion = ({ mensaje, onClose }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p>{mensaje}</p>
        <button onClick={onClose}>Aceptar</button>
      </div>
    </div>
  );
};

export default ModalConfirmacion;
