import React from 'react';
import '../styles/Footer.css';
import logo_seta from '../../src/assets/logo_header.png';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="app-footer">
            <div className="footer-content">
                <p className="footer-text">
                    Hecho por To Collect <img src={logo_seta} style={{maxHeight:'2rem',}} className="footer-icon-heart" />
                </p>
                <p className="footer-copyright">&copy; {currentYear} To Collect. Todos los derechos reservados.</p>
            </div>
        </footer>
    );
};

export default Footer;