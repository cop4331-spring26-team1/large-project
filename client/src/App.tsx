import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth }  from './context/AuthContext'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}
import { SocketProvider }         from './context/SocketContext'
import Navbar                     from './components/layout/Navbar'
import Footer                     from './components/layout/Footer'

// Pages
import HomePage           from './pages/HomePage'
import LoginPage          from './pages/LoginPage'
import RegisterPage       from './pages/RegisterPage'
import VerifyEmailPage    from './pages/VerifyEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage  from './pages/ResetPasswordPage'
import ListingDetailPage  from './pages/ListingDetailPage'
import CreateListingPage  from './pages/CreateListingPage'
import EditListingPage    from './pages/EditListingPage'
import MyListingsPage     from './pages/MyListingsPage'
import FavoritesPage      from './pages/FavoritesPage'
import ChatPage           from './pages/ChatPage'
import AdminPage          from './pages/AdminPage'
import NotFoundPage       from './pages/NotFoundPage'

// Route guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, isLoading } = useAuth()
  if (isLoading) return null
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />
}

const GuestRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />
}

const AppRoutes = () => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'var(--app-height, 100dvh)' }}>
    <ScrollToTop />
    <Navbar />
    <main style={{ flex: 1 }}>
      <Routes>
        {/* Public */}
        <Route path="/"                         element={<HomePage />} />
        <Route path="/listings/:id"             element={<ListingDetailPage />} />
        <Route path="/verify-email/:token"      element={<VerifyEmailPage />} />
        <Route path="/reset-password/:token"    element={<ResetPasswordPage />} />

        {/* Guest only */}
        <Route path="/login"          element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register"       element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

        {/* Protected */}
        <Route path="/listings/create" element={<PrivateRoute><CreateListingPage /></PrivateRoute>} />
        <Route path="/listings/:id/edit" element={<PrivateRoute><EditListingPage /></PrivateRoute>} />
        <Route path="/my-listings"     element={<PrivateRoute><MyListingsPage /></PrivateRoute>} />
        <Route path="/favorites"       element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
        <Route path="/chat"            element={<PrivateRoute><ChatPage /></PrivateRoute>} />
        <Route path="/chat/:threadId"  element={<PrivateRoute><ChatPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </main>
    <Footer />
  </div>
)

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
