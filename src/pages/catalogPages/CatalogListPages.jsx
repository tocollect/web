import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllCatalog, searchCatalog } from '../../services/catalogService';
import CatalogList from '../../components/catalog/CatalogList.jsx';
import Pagination from 'react-bootstrap/Pagination';
import SearchBar from '../../components/SearchBar.jsx';
import '../../styles/CatalogListPage.css';

const CatalogListPages = () => {
  const [catalogs, setCatalogs] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();

  // Función para cargar catálogos (búsqueda o todos)
  const fetchCatalogs = async (page = currentPage, query = searchQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      let response;
      
      if (query && query.trim()) {
        // Si hay término de búsqueda, usar búsqueda paginada
        response = await searchCatalog(query.trim(), page, pageSize);
        setIsSearching(true);
      } else {
        // Si no hay término, obtener todos los catálogos
        response = await getAllCatalog(page, pageSize);
        setIsSearching(false);
      }
      
      setCatalogs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setLoading(false);
    } catch (err) {
      console.error('Error al cargar catálogos:', err);
      setError(isSearching ? 'Error al buscar catálogos' : 'Error al cargar los catálogos');
      setLoading(false);
    }
  };

  // Cargar catálogos cuando cambie la página actual o el término de búsqueda
  useEffect(() => {
    fetchCatalogs(currentPage, searchQuery);
  }, [currentPage, pageSize]);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    setCurrentPage(0);
    
    await fetchCatalogs(0, query);
  };

  // Manejador para cambio de página
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(0);
    fetchCatalogs(0, '');
  };

  if (loading) return <div className="loading-container">Cargando catálogos...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="catalog-list-page">
      <div className="page-header">
        <h2 className="catalog-list-title">Catálogos Disponibles</h2>
        <div className="button-container">
          <Link to="/catalogs/new" className="expandable-add-button">
            <div className="plus-icon">+</div>
            <span className="button-text">Crear nuevo catálogo</span>
          </Link>
        </div>
      </div>

      <div className="search-section">
        <SearchBar 
          onSearch={handleSearch} 
          placeholder="Buscar catálogos..." 
          defaultValue={searchQuery}
        />
        {isSearching && (
          <div className="search-info">
            <span>Mostrando resultados para: "{searchQuery}"</span>
            <button onClick={clearSearch} className="back-button">
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>

      <div className="catalog-grid">
        {catalogs.length === 0 ? (
          <p>
            {isSearching 
              ? `No se encontraron catálogos que coincidan con "${searchQuery}"`
              : "No hay catálogos disponibles."
            }
          </p>
        ) : (
          <CatalogList catalogs={catalogs} isOwner={true} />
        )}
      </div>

      <div className="pagination-and-back-container">
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <Pagination.Prev
              onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
              disabled={currentPage === 0}
            />

            {(() => {
              const pages = [];
              const maxVisiblePages = 5;
              const startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
              const endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);

              // Primera página si no está visible
              if (startPage > 0) {
                pages.push(
                  <Pagination.Item key={0} onClick={() => handlePageChange(0)}>
                    1
                  </Pagination.Item>
                );
                if (startPage > 1) {
                  pages.push(<Pagination.Ellipsis key="start-ellipsis" />);
                }
              }

              // Páginas visibles
              for (let i = startPage; i <= endPage; i++) {
                pages.push(
                  <Pagination.Item
                    key={i}
                    active={i === currentPage}
                    onClick={() => handlePageChange(i)}
                  >
                    {i + 1}
                  </Pagination.Item>
                );
              }

              if (endPage < totalPages - 1) {
                if (endPage < totalPages - 2) {
                  pages.push(<Pagination.Ellipsis key="end-ellipsis" />);
                }
                pages.push(
                  <Pagination.Item 
                    key={totalPages - 1} 
                    onClick={() => handlePageChange(totalPages - 1)}
                  >
                    {totalPages}
                  </Pagination.Item>
                );
              }

              return pages;
            })()}

            <Pagination.Next
          
              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages - 1))}
              disabled={currentPage === totalPages - 1}
            />
          </Pagination>
        )}

        <button className="back-button" style={{marginTop:"3rem"}} onClick={() => navigate('/dashboard')}>
          <span className="arrow">←</span>
          <span>Volver</span>
        </button>
      </div>
    </div>
  );
};

export default CatalogListPages;