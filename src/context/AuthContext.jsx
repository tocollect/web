import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserByEmail } from "../services/authService";
import { api } from "../api/api";

export const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Función para verificar autenticación
export const fetchAuthenticatedUser = async (token) => {
    try {
        const response = await api.get(`/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status !== 200) {
            throw new Error(`Respuesta inesperada del servidor al verificar sesión: ${response.status}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error al verificar la sesión actual:", error);
        throw error;
    }
};

export const AuthProvider = ({ children }) => {
    const [jwtToken, setJwtToken] = useState(null);
    const [user, setUser] = useState(null);
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Limpiar almacenamiento solo en logout
    const clearAllStorage = useCallback(() => {
        localStorage.clear();
    }, []);

    // Configurar header Authorization globalmente
    const setAuthToken = useCallback((token) => {
        if (token) {
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common['Authorization'];
        }
    }, []);

    // Cerrar sesión
    const logout = useCallback(() => {
        setUser(null);
        setJwtToken(null);
        clearAllStorage();
        setAuthToken(null);
        navigate("/auth/login");
    }, [navigate, setAuthToken, clearAllStorage]);

    // Verificar si el token es válido
    const verifyToken = useCallback(async (token) => {
        if (!token) {
            logout();
            return null;
        }

        try {
            const userData = await fetchAuthenticatedUser(token);
            return userData;
        } catch (error) {
            console.error("Token inválido o expirado:", error);
            logout();
            return null;
        }
    }, [logout]);

    // Cargar sesión guardada al iniciar
    useEffect(() => {
        const initializeAuth = async () => {
            const storedToken = localStorage.getItem("jwtToken");
            const storedUser = localStorage.getItem("user");

            if (storedToken && storedUser) {
                try {
                    const parsedUser = JSON.parse(storedUser);
                    setAuthToken(storedToken);
                    setJwtToken(storedToken);

                    // Verificar si el token sigue siendo válido
                    const verifiedUser = await verifyToken(storedToken);

                    if (verifiedUser) {
                        setUser(parsedUser);
                    }
                    // Si verifyToken falla, logout() ya habrá sido llamado
                } catch (error) {
                    console.error("Error al restaurar el estado de autenticación:", error);
                    logout();
                }
            }

            setLoading(false);
        };

        initializeAuth();
    }, [setAuthToken, verifyToken, logout]);

    // Iniciar sesión
    const login = useCallback(async (userData, token) => {
        setAuthToken(token);
        setJwtToken(token);

        try {
            const completeUser = await fetchUserByEmail(userData.email);
            setUser(completeUser);
            localStorage.setItem("jwtToken", token);
            localStorage.setItem("user", JSON.stringify(completeUser));
            navigate("/dashboard");
        } catch (error) {
            console.error("No se pudo obtener el perfil completo del usuario:", error);
            showNotification("Error al cargar los datos del usuario", "error");
            logout();
        }
    }, [navigate, setAuthToken, logout]);

    // Mostrar notificaciones temporales
    const showNotification = useCallback((message, type = "info", duration = 3000) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), duration);
    }, []);

    // Interceptor para manejar respuestas 401/403 automáticamente
    useEffect(() => {
        const responseInterceptor = api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    console.error("Token expirado o no autorizado, cerrando sesión...");
                    showNotification("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.", "warning");
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(responseInterceptor);
        };
    }, [logout, showNotification]);

    const contextValue = {
        user,
        jwtToken,
        login,
        logout,
        notification,
        showNotification,
        loading,
        verifyToken
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {!loading ? children : <div>Cargando autenticación...</div>}
        </AuthContext.Provider>
    );
};