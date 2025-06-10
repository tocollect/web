import './styles/App.css';
import {BrowserRouter as Router, Navigate, Route, Routes} from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.css';
import {AuthProvider, AuthContext} from './context/AuthContext';
import {useContext} from 'react';
import Login from './pages/authPages/LoginPages.jsx';
import Register from './pages/authPages/RegisterPages.jsx';
import DashboardPages from './pages/DashboardPages';
import CatalogListPages from './pages/catalogPages/CatalogListPages.jsx';
import ItemListByCatalogPages from './pages/itemPages/ItemListByCatalogPages.jsx'
import Layout from './components/Layout';
import ForgotPasswordPage from './pages/authPages/ForgetPasswordPage.jsx';
import UserCatalogsPage from './pages/catalogPages/UserCatalogsPage.jsx';
import CatalogForm from "./components/catalog/CatalogForm.jsx";
import ResetPassword from "./components/ResetPassword.jsx";
import EditCatalogForm from "./components/catalog/EditCatalogForm.jsx";
import AddItemPage from "./components/item/AddItemPage.jsx";
import EditItemPage from "./pages/itemPages/EditItemPage.jsx";
import ItemDetail from "./components/item/ItemDetail.jsx";
import ProfilePage from "./pages/authPages/ProfilePage.jsx";
import ConversationListPage from "./pages/conversationPages/ConversationListPage.jsx";
import ChatWithSidebar from "./pages/conversationPages/ChatWithSidebar.jsx";
import JuegoTuberia from './components/JuegoTuberia.jsx';
import LoginPage from './pages/authPages/LoginPages.jsx';

// Componente protegido que verifica si el usuario está autenticado
const ProtectedRoute = ({children}) => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        return <Navigate to="/auth/login" replace/>;
    }
    return children;
};

// Componente Layout para páginas de autenticación (sin footer)
const AuthLayout = ({children}) => {
    return <div className="auth-layout">{children}</div>;
};

function App() {
    return (
        <Router basename='/web'>
            <div className="app-container">
                <AuthProvider>
                    <NotificationDisplay/>
                    <Routes>
                        {/* Rutas de autenticación */}
                        <Route
                            path="/auth/login"
                            element={<AuthLayout><Login/></AuthLayout>}
                        />
                        <Route
                            path="/auth/register"
                            element={<AuthLayout><Register/></AuthLayout>}
                        />
                        <Route
                            path="/auth/forgot-password"
                            element={<AuthLayout><ForgotPasswordPage/></AuthLayout>}
                        />
                        <Route

                            path="/reset-password"
                            element={<AuthLayout><ResetPassword/></AuthLayout>}
                        />

                        <Route
                            path="/dashboard/catalogList"
                            element={<Layout><CatalogListPages/></Layout>}
                        />
                        <Route
                            path="/items/catalog/:id"
                            element={<Layout><ItemListByCatalogPages/></Layout>}
                        />
                        <Route
                            path="/items/detail/:itemId"
                            element={<Layout><ItemDetail/></Layout>}
                        />

                        {/* Rutas protegidas con Layout */}
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Layout><DashboardPages/></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/user-catalogs/:userId?"
                            element={
                                <ProtectedRoute>
                                    <Layout><UserCatalogsPage/></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/catalogs/new"
                            element={
                                <ProtectedRoute>
                                    <Layout><CatalogForm/></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/catalogs/edit/:id"
                            element={
                                <ProtectedRoute>
                                    <Layout><EditCatalogForm/></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/items/new/:catalogId"
                            element={
                                <ProtectedRoute>
                                    <Layout><AddItemPage/></Layout>
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/items/edit/:itemId/:catalogId"
                            element={
                                <ProtectedRoute>
                                    <Layout><EditItemPage/></Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/conversations"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ConversationListPage/>
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/perfil"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ProfilePage/>
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="/chat"
                            element={
                                <ProtectedRoute>
                                    <Layout>
                                        <ChatWithSidebar/>
                                    </Layout>
                                </ProtectedRoute>
                            }
                        />

                        <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                        <Route path="*" element={<LoginPage/>}/>
                    </Routes>
                </AuthProvider>
            </div>
        </Router>
    );
}

// Componente para mostrar notificaciones
const NotificationDisplay = () => {
    const {notification} = useContext(AuthContext);

    if (!notification) return null;

    return (
        <div className={`notification ${notification.type}`}>
            {notification.message}
        </div>
    );
};

export default App;