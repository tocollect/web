// ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiLock } from 'react-icons/fi';
import '../styles/Auth.css';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [token, setToken] = useState('');
    const [isValid, setIsValid] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        // Extraer el token de la URL
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');

        if (!tokenParam) {
            setError('No se proporcionó un token');
            setIsLoading(false);
            return;
        }

        setToken(tokenParam);

        // Validar el token
        axios.get(`https://tocollect.ngrok.app/api/password/validate?token=${tokenParam}`)
            .then(() => {
                setIsValid(true);
                setIsLoading(false);
            })
            .catch(() => {
                setError('El token no es válido o ha expirado');
                setIsLoading(false);
            });
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        try {
            await axios.post(' https://tocollect.ngrok.app/api/password/change', null, {
                params: {
                    token,
                    newPassword
                }
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (error) {
            console.error(error);
            setError('Error al cambiar la contraseña');
        }
    };

    if (isLoading) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="loading-message">Verificando token...</div>
                </div>
            </div>
        );
    }

    if (error && !isValid) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="error-message">{error}</div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="success-message">
                        Contraseña cambiada con éxito. Redirigiendo al inicio de sesión...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h2>Crear nueva contraseña</h2>
                {error && <div className="error-message">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="newPassword">Nueva contraseña</label>
                        <div className="input-icon">
                            <FiLock />
                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{color: error ? 'red' : 'black'}}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmar contraseña</label>
                        <div className="input-icon">
                            <FiLock />
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{color: error ? 'red' : 'black'}}

                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">
                        Cambiar contraseña
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
