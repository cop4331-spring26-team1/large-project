import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth }  from './context/AuthContext'
import { SocketProvider }         from './context/SocketContext'
import Navbar                     from './components/layout/Navbar'
import Footer                     from './components/layout/Footer'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

// Lazy-load all pages — reduces initial bundle size
const HomePage           = lazy(() => import('./pages/HomePage'))
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const VerifyEmailPage    = lazy(() => import('./pages/VerifyEmailPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))
const ListingDetailPage  = lazy(() => import('./pages/ListingDetailPage'))
const CreateListingPage  = lazy(() => import('./pages/CreateListingPage'))
const EditListingPage    = lazy(() => import('./pages/EditListingPage'))
const MyListingsPage     = lazy(() => import('./pages/MyListingsPage'))
const FavoritesPage      = lazy(() => import('./pages/FavoritesPage'))
const ChatPage           = lazy(() => import('./pages/ChatPage'))
const AdminPage          = lazy(() => import('./pages/AdminPage'))
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'))

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
      <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
        <Routes>
          {/* Public */}
          <Route path="/"                         element={<HomePage />} />
          <Route path="/listings/:id"             element={<ListingDetailPage />} />
          <Route path="/verify-email/:token"      element={<VerifyEmailPage />} />
          <Route path="/reset-password/:token"    element={<ResetPasswordPage />} />

          {/* Guest only */}
          <Route path="/login"           element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path="/register"        element={<GuestRoute><RegisterPage /></GuestRoute>} />
          <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />

          {/* Protected */}
          <Route path="/listings/create"   element={<PrivateRoute><CreateListingPage /></PrivateRoute>} />
          <Route path="/listings/:id/edit" element={<PrivateRoute><EditListingPage /></PrivateRoute>} />
          <Route path="/my-listings"       element={<PrivateRoute><MyListingsPage /></PrivateRoute>} />
          <Route path="/favorites"         element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
          <Route path="/chat"              element={<PrivateRoute><ChatPage /></PrivateRoute>} />
          <Route path="/chat/:threadId"    element={<PrivateRoute><ChatPage /></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
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
