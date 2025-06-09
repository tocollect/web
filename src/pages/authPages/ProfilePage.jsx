// src/pages/ProfilePage.jsx

import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { getUserById, updateUser, getImageProfile, getCountCatalogAndItemByUser } from '../../services/userService';
import '../../styles/ProfilePage.css';
import { FiEdit, FiSave, FiCamera, FiUser, FiMail, FiPhone, FiCheck, FiBookOpen, FiBox } from 'react-icons/fi';
import collect_mushroom from '../../assets/collect_mushroom.png';
import { convertImageToBase64 } from '../../utils/imageUtils.jsx';

const ProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [form, setForm] = useState({
        name: '',
        phone: '',
        imageUrl: '',
        email: '',
        password: '',
    });
    const [profileImageUrl, setProfileImageUrl] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [editField, setEditField] = useState(null);
    const [counts, setCounts] = useState({ catalogCount: 0, itemCount: 0 });
    const [loadingCounts, setLoadingCounts] = useState(true);
    const fileInputRef = useRef();

    // Cargar perfil y conteos desde API
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setIsLoading(true);
                const userData = await getUserById(user.id);
                setProfile(userData);
                setForm({
                    name: userData.name || '',
                    phone: userData.phone || '',
                    imageUrl: userData.imageUrl || '',
                    email: userData.email || '',
                    password: '',
                });

                // Cargar imagen de perfil
                try {
                    const imageUrl = await getImageProfile(user.id);
                    setProfileImageUrl(imageUrl);
                } catch (imageError) {
                    console.log('No se pudo cargar la imagen de perfil:', imageError.message);
                    setProfileImageUrl(collect_mushroom);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        const loadCounts = async () => {
            try {
                setLoadingCounts(true);
                const countsData = await getCountCatalogAndItemByUser(user.id);
                setCounts(countsData);
            } catch (err) {
                console.error('Error al cargar conteos:', err.message);
                // No mostrar error al usuario, usar valores por defecto
                setCounts({ catalogCount: 0, itemCount: 0 });
            } finally {
                setLoadingCounts(false);
            }
        };

        if (user?.id) {
            loadProfile();
            loadCounts();
        }
    }, [user?.id]);

    // Manejar cambios en los campos del formulario
    const handleFieldChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Manejar selección de imagen
    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                setSaving(true);
                setError(null);
                setSuccess('');

                const base64Image = await convertImageToBase64(file);
                setForm({ ...form, imageUrl: base64Image });

                const updatePayload = { imageUrl: base64Image };
                await updateUser(profile.id, updatePayload);

                try {
                    const newImageUrl = await getImageProfile(user.id);
                    setProfileImageUrl(newImageUrl || collect_mushroom);
                } catch (imageError) {
                    console.log('Error al recargar imagen:', imageError.message);
                    setProfileImageUrl(collect_mushroom);
                }

                setSuccess('Imagen actualizada correctamente.');
            } catch (error) {
                setError('Error al procesar o guardar la imagen.');
                console.error('Error:', error);
            } finally {
                setSaving(false);
            }
        }
    };

    // Guardar campo editado
    const handleSaveField = async (field) => {
        setSaving(true);
        setError(null);
        setSuccess('');

        try {
            const updatePayload = {};
            updatePayload[field] = form[field];

            if (field === 'phone' && form.phone) {
                const phonePattern = /^[+\d\s\-()]{7,}$/;
                if (!phonePattern.test(form.phone)) {
                    setError('El teléfono no es válido.');
                    setSaving(false);
                    return;
                }
            }

            const updated = await updateUser(profile.id, updatePayload);
            setProfile((prev) => ({ ...prev, [field]: updated[field] }));
            setEditField(null);
            setSuccess('Campo actualizado correctamente.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="profile-container">
                <div className="loading-skeleton">
                    <div className="skeleton-avatar"></div>
                    <div className="skeleton-text"></div>
                    <div className="skeleton-text short"></div>
                </div>
            </div>
        );
    }

    if (error && !editField) {
        return (
            <div className="profile-container">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <h3>Algo ha salido mal</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-wrapper">
            <div className="profile-header">
                <h1>Mi perfil</h1>
                <p>Gestiona tu información personal</p>
            </div>

            <div className="profile-container">
                {/* Notificaciones */}
                {success && (
                    <div className="notification success">
                        <FiCheck className="notification-icon" />
                        <span>{success}</span>
                    </div>
                )}
                {error && (
                    <div className="notification error">
                        <span>{error}</span>
                    </div>
                )}

                {/* Sección de imagen de perfil */}
                <div className="profile-header-card">
                    <div className="profile-image-container">
                        <div className="profile-avatar-wrapper">
                            <img
                                src={profileImageUrl}
                                alt="Foto de perfil"
                                className="profile-avatar"
                                onError={() => setProfileImageUrl(collect_mushroom)}
                            />
                            <button
                                className="avatar-edit-btn"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={saving}
                                title="Cambiar foto"
                            >
                                <FiCamera />
                            </button>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImageChange}
                        />
                    </div>
                    <div className="profile-info">
                        <h2>{profile?.name || 'Usuario'}</h2>
                        <p className="profile-subtitle">Miembro desde {new Date().getFullYear()}</p>
                    </div>
                </div>

                {/* Estadísticas del usuario */}
                <div className="profile-section">
                    <h3 className="section-title">Tus estadísticas</h3>
                    <div className="stats-container">
                        <div className="stat-card">
                            <div className="stat-icon">
                                <FiBookOpen />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">
                                    {loadingCounts ? (
                                        <div className="stat-loading">...</div>
                                    ) : (
                                        counts.catalogCount
                                    )}
                                </div>
                                <div className="stat-label">
                                    {counts.catalogCount === 1 ? 'Catálogo' : 'Catálogos'}
                                </div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">
                                <FiBox />
                            </div>
                            <div className="stat-content">
                                <div className="stat-number">
                                    {loadingCounts ? (
                                        <div className="stat-loading">...</div>
                                    ) : (
                                        counts.itemCount
                                    )}
                                </div>
                                <div className="stat-label">
                                    {counts.itemCount === 1 ? 'Ítem' : 'Ítems'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Información del perfil */}
                <div className="profile-section">
                    <h3 className="section-title">Información personal</h3>

                    {/* Email */}
                    <div className="profile-field">
                        <div className="field-icon">
                            <FiMail />
                        </div>
                        <div className="field-content">
                            <label className="field-label">Email</label>
                            <div className="field-value">{profile?.email}</div>
                            <div className="field-note">Tu email no puede ser modificado</div>
                        </div>
                    </div>

                    {/* Nombre */}
                    <div className="profile-field">
                        <div className="field-icon">
                            <FiUser />
                        </div>
                        <div className="field-content">
                            <label className="field-label">Nombre</label>
                            {editField === 'name' ? (
                                <div className="field-edit">
                                    <input
                                        name="name"
                                        type="text"
                                        value={form.name}
                                        onChange={handleFieldChange}
                                        className="field-input"
                                        placeholder="Ingresa tu nombre"
                                        required
                                    />
                                    <div className="field-actions">
                                        <button
                                            type="button"
                                            className="btn-save"
                                            onClick={() => handleSaveField('name')}
                                            disabled={saving}
                                        >
                                            <FiSave />
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => setEditField(null)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-display">
                                    <div className="field-value">{profile?.name || 'No especificado'}</div>
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => setEditField('name')}
                                    >
                                        <FiEdit />
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teléfono */}
                    <div className="profile-field">
                        <div className="field-icon">
                            <FiPhone />
                        </div>
                        <div className="field-content">
                            <label className="field-label">Teléfono</label>
                            {editField === 'phone' ? (
                                <div className="field-edit">
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={handleFieldChange}
                                        className="field-input"
                                        placeholder="Ej: +34 600 123 456"
                                    />
                                    <div className="field-actions">
                                        <button
                                            type="button"
                                            className="btn-save"
                                            onClick={() => handleSaveField('phone')}
                                            disabled={saving}
                                        >
                                            <FiSave />
                                            {saving ? 'Guardando...' : 'Guardar'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => setEditField(null)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="field-display">
                                    <div className="field-value">{profile?.phone || 'No especificado'}</div>
                                    <button
                                        type="button"
                                        className="btn-edit"
                                        onClick={() => setEditField('phone')}
                                    >
                                        <FiEdit />
                                        Editar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;