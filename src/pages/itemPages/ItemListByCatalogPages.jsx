import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getItemsByCatalogIdPaginated, seachItemsByCatalog } from '../../services/itemService';
import { getCatalogById } from '../../services/catalogService';
import ItemListByCatalog from '../../components/item/ItemListByCatalog';
import SearchBar from '../../components/SearchBar';
import Pagination from 'react-bootstrap/Pagination';
import '../../styles/ItemListByCatalog.css';

const ItemListByCatalogPages = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Estados principales
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(6); // Ajusta según necesites

  // Estados de búsqueda
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user')) || {};
  const isOwner = catalog && catalog.userId === currentUser.id;

  // Cargar información del catálogo una vez
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const catalogData = await getCatalogById(id);
        setCatalog(catalogData);
      } catch (err) {
        console.error('Error al cargar catálogo:', err);
        setError('No se pudo cargar la información del catálogo.');
      }
    };

    if (id) {
      fetchCatalog();
    }
  }, [id]);

  // --- Función principal para cargar y/o buscar items con paginación ---
  const fetchItems = useCallback(async (pageToFetch, queryToFetch) => {
    if (!id) return;

    setLoading(true);
    setError('');
    const isCurrentlySearching = queryToFetch.trim() !== '';
    setIsSearching(isCurrentlySearching);

    try {
      let response;
      if (isCurrentlySearching) {
        // Para búsqueda, usar el endpoint sin paginación (como en tu código original)
        const searchResults = await seachItemsByCatalog(queryToFetch.trim(), id);
        // Simular estructura de página para consistencia
        response = {
          content: searchResults,
          totalPages: 1,
          number: 0
        };
      } else {
        // Para carga normal, usar paginación
        response = await getItemsByCatalogIdPaginated(id, pageToFetch, pageSize);
      }

      setItems(response.content || []);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.number !== undefined ? response.number : 0);

    } catch (err) {
      console.error("Error al cargar o buscar items:", err);
      setError(isCurrentlySearching ? 'Error al buscar items.' : 'No se pudieron cargar los ítems. Por favor, intente nuevamente.');
      setItems([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [id, pageSize]);

  // --- Efecto para la carga inicial y cambios de paginación/búsqueda ---
  useEffect(() => {
    if (id) {
      fetchItems(currentPage, searchQuery);
    }
  }, [id, currentPage, searchQuery, fetchItems]);

  // --- Manejadores de la barra de búsqueda ---
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reinicia a la primera página para la nueva búsqueda
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(0);
  }, []);

  // --- Manejador para cambio de página ---
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Función para manejar la navegación de vuelta
  const handleBackNavigation = () => {
    if (isOwner) {
      // Si es el propietario, ir a "Mis Catálogos"
      navigate(`/user-catalogs/${catalog.userId}`);
    } else {
      // Si no es propietario, ir a los catálogos del usuario específico
      navigate('/dashboard/catalogList');
    }
  };

  // --- Renderizado del contenido de items ---
  const renderItemContent = () => {
    if (loading && items.length === 0) {
      return <div className="loading-container">Cargando ítems...</div>;
    }

    if (error) {
      return <div className="error-container">{error}</div>;
    }

    if (!items || items.length === 0) {
      if (isSearching && searchQuery) {
        return <p className="items-list-empty">No se encontraron ítems para la búsqueda: "{searchQuery}".</p>;
      }
      return <p className="items-list-empty">No hay ítems disponibles en este catálogo.</p>;
    }

    return (
        <ItemListByCatalog
            items={items}
            catalogId={id}
            isOwner={isOwner}
        />
    );
  };

  return (
      <div className="item-list-by-catalog-page page-list-container">
        <div className="main-content-card">
          {catalog && (
              <div className="page-header">
                <h2 className="page-title">Catálogo: <em>{catalog.name}</em></h2>

                {isOwner && (
                    <div className="button-container">
                      <Link to={`/items/new/${id}`} className="expandable-add-button">
                        <div className="plus-icon">+</div>
                        <div className="button-text">Agregar nuevo ítem</div>
                      </Link>
                    </div>
                )}
              </div>
          )}

          {/* Barra de búsqueda */}
          <div className="search-section">
            <SearchBar
                onSearch={handleSearch}
                onClear={handleClearSearch}
                placeholder="Buscar ítems en este catálogo..."
                className="items-search-bar"
                defaultValue={searchQuery}
            />
            {isSearching && searchQuery && (
                <div className="search-info">
                  <span>Mostrando resultados para: "{searchQuery}"</span>
                  <button onClick={handleClearSearch} className="clear-search-btn">
                    Limpiar búsqueda
                  </button>
                </div>
            )}
          </div>

          {/* Mostrar indicador de búsqueda */}
          {isSearching && loading && (
              <div className="search-status">
                <span>Buscando ítems...</span>
              </div>
          )}

          {/* Contenido de items */}
          <div className="items-content">
            {renderItemContent()}
          </div>
        </div>

        {/* Contenedor para paginación y botón de volver */}
        <div className="pagination-and-back-container">
          {/* Paginación (solo mostrar si no estamos buscando y hay más de una página) */}
          {!isSearching && totalPages > 1 && (
              <Pagination className="mt-4">
                <Pagination.Prev
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 0))}
                    disabled={currentPage === 0}
                />

                {/* Mostrar páginas con lógica para evitar demasiados números */}
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

                  // Última página si no está visible
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

          {/* Botón volver */}
          <button className="back-button" style={{marginTop:"3rem"}} onClick={handleBackNavigation}>
            <span className="arrow">←</span> Volver a Catálogos
          </button>
        </div>
      </div>
  );
};

export default ItemListByCatalogPages;