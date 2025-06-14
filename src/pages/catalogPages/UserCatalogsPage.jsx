import React, { useEffect, useState, useContext, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getCatalogsByUserId, deleteCatalog, getImageCatalog, searchCatalogByUser } from "../../services/catalogService.js";
import toCollectImage from '../../assets/to_collect.png';
import '../../styles/UserCatalogsPage.css';
import { AuthContext } from "../../context/AuthContext.jsx";
import ConfirmationModal from "../../components/ConfirmationModal.jsx";
import SearchBar from "../../components/SearchBar.jsx";
import { FaEdit } from "react-icons/fa";
import Pagination from 'react-bootstrap/Pagination';

const UserCatalogsPage = () => {
  const navigate = useNavigate();
  const { userId: urlUserId } = useParams();
  const { user } = useContext(AuthContext);

  const [userId, setUserId] = useState(null);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(6);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [catalogToDelete, setCatalogToDelete] = useState(null);

  const [imageUrls, setImageUrls] = useState({});
  const [loadingImages, setLoadingImages] = useState({});

  useEffect(() => {
    const determineUserId = () => {
      if (urlUserId) {
        setUserId(parseInt(urlUserId));
      } else if (user && user.id) {
        setUserId(user.id);
      } else {
        navigate('/auth/login');
      }
    };
    determineUserId();
  }, [urlUserId, user, navigate]);

  const fetchCatalogs = useCallback(async (pageToFetch, queryToFetch) => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    const isCurrentlySearching = queryToFetch.trim() !== '';
    setIsSearching(isCurrentlySearching);

    try {
      let response;
      if (isCurrentlySearching) {
        response = await searchCatalogByUser(queryToFetch.trim(), userId, pageToFetch, pageSize);
      } else {
        response = await getCatalogsByUserId(userId, pageToFetch, pageSize);
      }

      setCatalogs(response.content || []);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.number !== undefined ? response.number : 0);

    } catch (err) {
      console.error("Error al cargar o buscar catálogos:", err);
      setError(isCurrentlySearching ? 'Error al buscar catálogos.' : 'Error al cargar los catálogos.');
      setCatalogs([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [userId, pageSize]);

  useEffect(() => {
    if (userId) {
      fetchCatalogs(currentPage, searchQuery);
    }
  }, [userId, currentPage, searchQuery, fetchCatalogs]);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setCurrentPage(0); // Reinicia a la primera página para la nueva búsqueda
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setCurrentPage(0);
  }, []);

  const loadCatalogImage = useCallback(async (catalogId) => {
    if (imageUrls[catalogId] || loadingImages[catalogId]) {
      return;
    }
    setLoadingImages(prev => ({ ...prev, [catalogId]: true }));
    try {
      const imageUrl = await getImageCatalog(catalogId, "CATALOG");
      setImageUrls(prev => ({ ...prev, [catalogId]: imageUrl || toCollectImage }));
    } catch (error) {
      console.error(`Error al cargar imagen del catálogo ${catalogId}:`, error.message);
      setImageUrls(prev => ({ ...prev, [catalogId]: toCollectImage }));
    } finally {
      setLoadingImages(prev => ({ ...prev, [catalogId]: false }));
    }
  }, [imageUrls, loadingImages]);

  useEffect(() => {
    if (catalogs && catalogs.length > 0) {
      catalogs.forEach(catalog => {
        loadCatalogImage(catalog.id);
      });
    }
  }, [catalogs, loadCatalogImage]);

  // Limpieza de Object URLs
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

  const handleImageError = (catalogId) => {
    setImageUrls(prev => ({ ...prev, [catalogId]: toCollectImage }));
  };

  const handleDeleteClick = (e, catalogId) => {
    e.stopPropagation();
    setCatalogToDelete(catalogId);
    setModalOpen(true);
  };

  const handleEditClick = (e, catalogId) => {
    e.stopPropagation();
    navigate(`/catalogs/edit/${catalogId}`);
  };

  const confirmDelete = async () => {
    if (!catalogToDelete) return;
    try {
      await deleteCatalog(catalogToDelete);
      setModalOpen(false);

      if (imageUrls[catalogToDelete] && imageUrls[catalogToDelete].startsWith('blob:')) {
        URL.revokeObjectURL(imageUrls[catalogToDelete]);
        setImageUrls(prev => {
          const newUrls = { ...prev };
          delete newUrls[catalogToDelete];
          return newUrls;
        });
      }
      setCatalogToDelete(null);

      if (catalogs.length === 1 && currentPage > 0) {
        setCurrentPage(prevCurrentPage => prevCurrentPage - 1);
      } else {
        fetchCatalogs(currentPage, searchQuery);
      }

    } catch (err) {
      console.error("Error al eliminar el catálogo:", err);
      setError("No se pudo eliminar el catálogo. Inténtalo nuevamente.");
      setModalOpen(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderCatalogContent = () => {
    if (loading && catalogs.length === 0) return <p className="loading-message">Cargando catálogos del usuario...</p>;

    if (error) return <p className="error-message">Error: {error}</p>;

    if (!catalogs || catalogs.length === 0) {
      if (isSearching && searchQuery) {
        return <p className="catalog-list-empty">No se encontraron catálogos para la búsqueda: "{searchQuery}".</p>;
      }
      return <p className="catalog-list-empty">No hay catálogos disponibles para este usuario.</p>;
    }

    return (
        <div className="catalog-grid">
          {catalogs.map((catalog) => (
              <div
                  key={catalog.id}
                  className="catalog-card"
                  onClick={() => navigate(`/items/catalog/${catalog.id}`)}
              >
                {user && userId === user.id && (
                    <div className="catalog-card-actions">
                      <Link
                          to={`/catalogs/edit/${catalog.id}`}
                          onClick={(e) => handleEditClick(e, catalog.id)}
                          className="edit-item-button"
                      >
                        <FaEdit />
                      </Link>
                      <button
                          className="delete-button"
                          onClick={(e) => handleDeleteClick(e, catalog.id)}
                          title="Eliminar catálogo"
                      >
                        ×
                      </button>
                    </div>
                )}
                <div className="catalog-image-container">
                  {loadingImages[catalog.id] && <div className="image-loading-overlay">Cargando...</div>}
                  <img
                      src={imageUrls[catalog.id] || toCollectImage}
                      alt={catalog.name || "Imagen predeterminada"}
                      className="catalog-card-image"
                      style={{ opacity: loadingImages[catalog.id] ? 0.5 : 1, transition: 'opacity 0.3s ease' }}
                      onError={() => handleImageError(catalog.id)}
                  />
                </div>
                <div className="catalog-details">
                  <h3 className="catalog-name">{catalog.name}</h3>
                  <p className="catalog-description">{catalog.description}</p>
                </div>
              </div>
          ))}
        </div>
    );
  };

  const getPageTitle = () => {
    if (user && urlUserId && user.id === parseInt(urlUserId)) return "Mis Catálogos";
    if (urlUserId) return "Catálogos del Usuario";
    return "Mis Catálogos";
  };

  if (!userId && loading) {
    return <div className="catalog-list-page"><p className="loading-message">Cargando información del usuario...</p></div>;
  }

  const canCreateCatalog = user && userId === user.id;

  return (
      <div className="catalog-list-page">
        <div className="page-header">
          <h2 className="catalog-list-title">{getPageTitle()}</h2>
          {canCreateCatalog && (
              <div className="button-container">
                <Link to="/catalogs/new" className="expandable-add-button">
                  <div className="plus-icon">+</div>
                  <div className="button-text">Crear nuevo catálogo</div>
                </Link>
              </div>
          )}
        </div>

        <div className="search-section">
          <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              placeholder="Buscar catálogos por nombre o descripción..."
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

        <div className="catalog-content">
          {renderCatalogContent()}
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
          <button className="back-button" style={{marginTop:"3rem"}} onClick={() => navigate('/dashboard')}>
            <span className="arrow">←</span>
            <span>Volver</span>
          </button>
        </div>

        <ConfirmationModal
            isOpen={modalOpen}
            onClose={() => { setModalOpen(false); setCatalogToDelete(null); }}
            onConfirm={confirmDelete}
            title="Eliminar Catálogo"
            message="¿Estás seguro de que deseas eliminar este catálogo? Esta acción no se puede deshacer."
        />
      </div>
  );
};

export default UserCatalogsPage;