import React, { useState, useEffect, useRef } from 'react';
import { FaSearch, FaTimes } from 'react-icons/fa';
import '../styles/SearchBar.css';

const SearchBar = ({
                       onSearch,
                       onClear,
                       placeholder = "Buscar catálogos...",
                       debounceMs = 800,
                       className = "",
                       showClearButton = true
                   }) => {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const debounceRef = useRef(null);

    // Ejecutar búsqueda cuando cambie el query
    useEffect(() => {
        // Limpiar timeout anterior
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        // Si el query está vacío, limpiar inmediatamente
        if (!query.trim()) {
            onClear && onClear();
            setIsSearching(false);
            return;
        }

        // Crear nuevo timeout para la búsqueda
        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                await onSearch(query.trim());
            } catch (error) {
                console.error('Error en la búsqueda:', error);
            } finally {
                setIsSearching(false);
            }
        }, debounceMs);

        // Cleanup function
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query, onSearch, onClear, debounceMs]);

    const handleInputChange = (e) => {
        setQuery(e.target.value);
    };

    const handleClear = () => {
        setQuery('');
        setIsSearching(false);
        onClear && onClear();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className={`search-bar-container ${className}`}>
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-input-wrapper">
                    <FaSearch className={`search-icon ${isSearching ? 'searching' : ''}`} />
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        className="search-input"
                        autoComplete="off"
                    />
                    {showClearButton && query && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="clear-button"
                            title="Limpiar búsqueda"
                        >
                            <FaTimes />
                        </button>
                    )}
                </div>
            </form>
            {isSearching && (
                <div className="search-loading">
                    <span>Buscando...</span>
                </div>
            )}
        </div>
    );
};

export default SearchBar;