import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/api.js";
import { clearToken, setToken } from "../api/auth.js";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { AuthContext } from "../context/AuthContext"; // Importamos el contexto de autenticación

const Login = () => {
    const { login, showNotification } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (!email.trim() || !password.trim()) {
            setError('Por favor, completa todos los campos');
            setIsLoading(false);
            return;
        }

        try {
            console.log("Intentando iniciar sesión con:", { email });
            console.log("URL base:", api.defaults.baseURL);
            
            const response = await api.post('/auth/login', {
                email: email.trim(),
                password: password.trim()
            });
            
            console.log("Respuesta del servidor:", response.data);
            
            if (!response.data || !response.data.jwtToken) {
                throw new Error("La respuesta del servidor no incluye un token válido");
            }
            
            const token = response.data.jwtToken;
            login({ email }, token);
            showNotification("Inicio de sesión exitoso", "success");
            navigate('/dashboard');
        } catch (err) {
            console.error("Error durante el login:", err);
            console.error("Detalles del error:", {
                status: err.response?.status,
                data: err.response?.data,
                headers: err.response?.headers
            });
            clearToken();
            
            let errorMessage = 'Credenciales no válidas';
            
            if (err.response) {
                const status = err.response.status;
                
                if (status === 401) {
                    errorMessage = 'Usuario o contraseña incorrectos';
                } else if (status === 404) {
                    errorMessage = 'El servicio de autenticación no está disponible';
                } else if (err.response.data && err.response.data.message) {
                    errorMessage = err.response.data.message;
                }
            } else if (err.request) {
                errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
            }
            
            setError(errorMessage);
            showNotification(errorMessage, "error");
        } finally {
            setIsLoading(false);
        }
    }

    return(
        <div className="auth-container">
            <div className="auth-card">
                <h2>Iniciar Sesión</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Correo Electrónico:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tocollect@correo.com"
                            aria-invalid={!!error}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <div className="password-wrapper">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                aria-invalid={!!error}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={togglePasswordVisibility}
                                className="toggle-password-btn"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                disabled={isLoading}
                            >
                                {showPassword ? <FiEyeOff /> : <FiEye />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-submit"
                        disabled={isLoading}
                    >
                        {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </button>
                </form>

                <p>
                    ¿No tienes cuenta? <Link to="/auth/register">Regístrate aquí</Link>
                </p>
                <p>
                    ¿Has olvidado la contraseña? <Link to="/auth/forgot-password">Recupera aquí</Link>
                </p>
            </div>
        </div>
    )
}

export default Login;