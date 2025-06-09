import { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import "../styles/Header.css";
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiMessageCircle, FiGrid, FiHome, FiLogOut, FiChevronDown } from 'react-icons/fi';
import setaImage from '../../src/assets/seta.png';
import logo_seta from '../../src/assets/logo_header.png';

const Header = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null);

    const handleToggleMenu = () => {
        setIsOpen(!isOpen);
    };

    const handleLogout = () => {
        logout();
        navigate('/auth/login');
        setIsOpen(false);
    };

    const closeMenu = () => {
        setIsOpen(false);
    };

    // Cerrar menú al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Determinar si una ruta está activa
    const isActiveRoute = (path) => {
        return location.pathname === path;
    };

    // Verificar si estamos en el dashboard
    const isDashboard = location.pathname === '/dashboard';

    return (
        <header className="app-header">
            <div className="header-content">
                {/* Logo y marca */}
                <Link to="/dashboard" className="header-brand" onClick={closeMenu}>
                    <div className="brand-container">
                        <div className="logo-wrapper">
                            <img
                                src={logo_seta}
                                alt="Logo"
                                className="header-logo"
                            />
                        </div>
                        <div className="brand-text">
                            <h1 className="brand-title">To Collect</h1>
                            <span className="brand-subtitle">Encuentra lo que buscas</span>
                        </div>
                    </div>
                </Link>

                {/* Navegación desktop - Solo mostrar si NO estamos en dashboard */}
                {!isDashboard && (
                    <nav className="desktop-nav">
                        <Link
                            to="/dashboard"
                            className={`nav-link ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                        >
                            <FiHome className="nav-icon" />
                            <span>Inicio</span>
                        </Link>
                        <Link
                            to={`/user-catalogs/${user?.id}`}
                            className={`nav-link ${isActiveRoute(`/user-catalogs/${user?.id}`) ? 'active' : ''}`}
                        >
                            <FiGrid className="nav-icon" />
                            <span>Mis Catálogos</span>
                        </Link>
                        <Link
                            to="/chat"
                            className={`nav-link ${isActiveRoute('/chat') ? 'active' : ''}`}
                        >
                            <FiMessageCircle className="nav-icon" />
                            <span>Mensajes</span>
                        </Link>
                    </nav>
                )}

                {/* Menu de usuario */}
                <div className="user-menu" ref={dropdownRef}>
                    <button
                        className={`user-menu-trigger ${isOpen ? 'active' : ''}`}
                        onClick={handleToggleMenu}
                        aria-expanded={isOpen}
                        aria-haspopup="true"
                    >
                        <div className="user-avatar">
                            <img
                                src={setaImage}
                                alt="Avatar de usuario"
                                className="avatar-image"
                            />
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'Usuario'}</span>
                            <span className="user-email">{user?.email}</span>
                        </div>
                        <FiChevronDown className={`chevron-icon ${isOpen ? 'rotated' : ''}`} />
                    </button>

                    {/* Dropdown menu */}
                    <div className={`user-dropdown ${isOpen ? 'show' : ''}`}>
                        <div className="dropdown-header">
                            <div className="dropdown-avatar">
                                <img src={setaImage} alt="Avatar" />
                            </div>
                            <div className="dropdown-user-info">
                                <div className="dropdown-name">{user?.name || 'Usuario'}</div>
                                <div className="dropdown-email">{user?.email}</div>
                            </div>
                        </div>

                        <div className="dropdown-divider"></div>

                        <nav className="dropdown-nav">
                            <Link
                                to="/perfil"
                                className={`dropdown-item ${isActiveRoute('/perfil') ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <FiUser className="dropdown-icon" />
                                <span>Mi Perfil</span>
                            </Link>
                            <Link
                                to="/dashboard"
                                className={`dropdown-item mobile-only ${isActiveRoute('/dashboard') ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <FiHome className="dropdown-icon" />
                                <span>Inicio</span>
                            </Link>
                            <Link
                                to={`/user-catalogs/${user?.id}`}
                                className={`dropdown-item mobile-only ${isActiveRoute(`/user-catalogs/${user?.id}`) ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <FiGrid className="dropdown-icon" />
                                <span>Mis Catálogos</span>
                            </Link>
                            <Link
                                to="/chat"
                                className={`dropdown-item mobile-only ${isActiveRoute('/chat') ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <FiMessageCircle className="dropdown-icon" />
                                <span>Mensajes</span>
                            </Link>
                        </nav>

                        <div className="dropdown-divider"></div>

                        <button className="dropdown-item logout-item" onClick={handleLogout}>
                            <FiLogOut className="dropdown-icon" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;