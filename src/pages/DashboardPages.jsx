// src/pages/DashboardPages.jsx
import React, { useContext} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import mis_catalogos from '../assets/mis_catalogos.png';
import explorar_catalogos from '../assets/explorar_catalogos.png';
import mis_mensajes from '../assets/mis_mensajes.png';
import '../styles/DashboardPages.css';

const DashboardPages = () => {
  const navigate = useNavigate();
  const {user} = useContext(AuthContext);

  const handleExploreClick = () => {
    navigate("/dashboard/catalogList");
  };

  return (
    <div className="dashboard-container">
      {/* Contenido principal */}
      <main className="dashboard-content">
        <div
            className="card"
            onClick={handleExploreClick}
        >
          <img src={explorar_catalogos} alt="Explorar catálogos"/>
          <h3>Explorar catálogos</h3>
          <p>Haz clic aquí para ver los catálogos disponibles.</p>
        </div>
        <div
            className="card"
            onClick={() => navigate(`/user-catalogs/${user.id}`)}
        >
          <img src={mis_catalogos} alt="Mis catálogos"/>
          <h3>Mis catálogos</h3>
          <p>Haz clic aquí para ver tus catálogos creados.</p>
        </div>
        <div
            className="card"
            onClick={() => navigate('/chat')}
        >
          <img src={mis_mensajes} alt="Mis conversaciones"/>
          <h3>Mis conversaciones</h3>
          <p>Haz clic aquí para gestionar tus conversaciones.</p>
        </div>
      </main>
    </div>
  );
};

export default DashboardPages;