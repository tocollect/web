import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api.js";
import { FiMail } from "react-icons/fi";
import '../../styles/Auth.css';
import ModalConfirmacion from "../../components/ModalConfirmacion.jsx";

const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalMessage, setModalMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!email.trim()) {
            setError("Por favor, ingresa un correo electrónico válido.");
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.post("/password/request", null, { params: { email } });

            const message = response.data.mensaje || "Correo enviado. Por favor, revisa tu bandeja de entrada.";
            setModalMessage(message);
            setShowModal(true); // Muestra el modal
        } catch (error) {
            let message;

            if (!navigator.onLine) {
                message = "No tienes conexión a internet.";
            } else if (error.response) {
                message = error.response.data?.mensaje || "Error al enviar el correo.";
            } else {
                message = "No se pudo conectar con el servidor.";
            }

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Recuperar Contraseña</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico</label>
                        <div className="input-icon">
                            <FiMail />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="tocollect@correo.com"
                                aria-invalid={!!error}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Enviando correo..." : "Enviar correo"}
                    </button>

                    <p>
                        ¿Recordaste tu contraseña? <a href="/auth/login">Iniciar sesión</a>
                    </p>
                </form>
            </div>

            {showModal && (
                <ModalConfirmacion
                    mensaje={modalMessage}
                    onClose={() => {
                        setShowModal(false);
                        navigate("/auth/login");
                    }}
                />
            )}
        </div>
    );
};

export default ForgotPasswordPage;
