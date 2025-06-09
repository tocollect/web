import '../../styles/Auth.css';
import { useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { api } from "../../api/api.js";
import { FiEye, FiEyeOff } from 'react-icons/fi';

const RegisterPages = () => {
    const { showNotification } = useContext(AuthContext);
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        // Validación de campos vacíos
        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            const message = "Por favor, completa todos los campos.";
            setError(message);
            showNotification(message, "error", 3000);
            return;
        }

        // Validación formato email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            const message = "Por favor, introduce un correo válido.";
            setError(message);
            showNotification(message, "error", 3000);
            return;
        }

        // Validación longitud contraseña
        if (password.length < 8) {
            const message = "La contraseña debe tener al menos 8 caracteres.";
            setError(message);
            showNotification(message, "error", 3000);
            return;
        }

        // Confirmación de contraseña
        if (password !== confirmPassword) {
            const message = "Las contraseñas no coinciden.";
            setError(message);
            showNotification(message, "error", 3000);
            return;
        }

        try {
            setIsLoading(true);
            const response = await api.post("/auth/register", {
                email,
                password,
            });

            showNotification("Registro exitoso. Ahora puedes iniciar sesión.", "success", 4000);
            navigate("/auth/login");
        } catch (error) {
            let message;

            if (!navigator.onLine) {
                message = "No tienes conexión a internet.";
            } else if (error.response) {
                if (error.response.data?.error === "User with this email already exists") {
                    message = "Este correo ya existe.";
                } else {
                    message = error.response.data?.message || "Ocurrió un error al registrarte.";
                }
            } else {
                message = "No se pudo conectar con el servidor.";
            }

            setError(message);
            showNotification(message, "error", 4000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Registrarse</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Campo de Correo */}
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tocollect@correo.com"
                            aria-invalid={!!error}
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="•••••••••"
                                aria-invalid={!!error}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="toggle-password-btn"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    {/* Confirmar Contraseña */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
                        <div className="password-wrapper">
                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="•••••••••"
                                aria-invalid={!!error}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="toggle-password-btn"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button type="submit" className="btn-submit" disabled={isLoading}>
                        {isLoading ? "Registrando..." : "Registrarse"}
                    </button>
                </form>

                <p>
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/auth/login">Inicia sesión aquí</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPages;   