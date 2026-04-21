import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }   from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { chatApi }   from '../../api'

const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconPlus   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconChat   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
const IconHeart  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { unreadCount, setUnreadCount } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen]   = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Lock body scroll when profile sheet is open
  useEffect(() => {
    if (sheetOpen) {
      const y = window.scrollY
      document.body.classList.add('modal-open')
      document.body.style.top = `-${y}px`
    } else {
      const y = Math.abs(parseInt(document.body.style.top || '0'))
      document.body.classList.remove('modal-open')
      document.body.style.top = ''
      window.scrollTo(0, y)
    }
    return () => {
      document.body.classList.remove('modal-open')
      document.body.style.top = ''
    }
  }, [sheetOpen])

  useEffect(() => {
    if (!isAuthenticated) return
    chatApi.getUnreadCount()
      .then((res) => setUnreadCount(res.data.data.unreadCount))
      .catch(() => {})
  }, [isAuthenticated])

  const favoriteCount = user?.favorites?.length ?? 0
  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
    setSheetOpen(false)
  }

  return (
    <>
      {/* ── Desktop navbar — hidden on mobile via CSS ── */}
      <nav className="desktop-nav">
        <div style={d.inner}>
          <Link to="/" style={d.logo}>
            <span style={{ fontSize: 22 }}>🏠</span>
            <span style={d.logoText}>LetsMovNow</span>
          </Link>
          <div style={d.links}>
            <Link to="/" style={{ ...d.link, ...(isActive('/') ? d.linkActive : {}) }}>Browse</Link>
            {isAuthenticated && <Link to="/listings/create" style={{ ...d.link, ...(isActive('/listings/create') ? d.linkActive : {}) }}>List a Room</Link>}
            {isAuthenticated && <Link to="/my-listings" style={{ ...d.link, ...(isActive('/my-listings') ? d.linkActive : {}) }}>My Listings</Link>}
            {isAdmin && <Link to="/admin" style={{ ...d.link, color: '#FFE66D' }}>Admin</Link>}
          </div>
          <div style={d.right}>
            {isAuthenticated ? (
              <>
                <Link to="/favorites" style={d.iconBtn}>
                  <span style={d.iconWrap}>♥{favoriteCount > 0 && <span style={{ ...d.badge, background: '#FF6B6B' }}>{favoriteCount > 99 ? '99+' : favoriteCount}</span>}</span>
                </Link>
                <Link to="/chat" style={d.iconBtn}>
                  <span style={d.iconWrap}>💬{unreadCount > 0 && <span style={{ ...d.badge, background: '#4ECDC4', color: '#1B1F3B' }}>{unreadCount > 99 ? '99+' : unreadCount}</span>}</span>
                </Link>
                <div style={{ position: 'relative' }}>
                  <button style={d.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                    <span style={d.avatar}>{user!.name.charAt(0).toUpperCase()}</span>
                    <span style={d.userName}>{user!.name.split(' ')[0]}</span>
                    {user!.isVerifiedStudent && <span style={d.verifiedDot}>✓</span>}
                    <span style={{ color: '#9BA3C7', fontSize: 12 }}>▾</span>
                  </button>
                  {menuOpen && (
                    <div style={d.dropdown}>
                      <div style={d.dropdownHeader}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{user!.name}</div>
                        <div style={{ fontSize: 11, color: '#9BA3C7' }}>{user!.email}</div>
                        {user!.isVerifiedStudent && <div style={{ fontSize: 11, color: '#4ECDC4', marginTop: 2 }}>✓ Verified Student</div>}
                      </div>
                      <div style={d.dropdownDivider} />
                      <Link to="/my-listings" style={d.dropdownItem} onClick={() => setMenuOpen(false)}>My Listings</Link>
                      <Link to="/favorites" style={d.dropdownItem} onClick={() => setMenuOpen(false)}>Saved Homes</Link>
                      {isAdmin && <Link to="/admin" style={{ ...d.dropdownItem, color: '#FFE66D' }} onClick={() => setMenuOpen(false)}>Admin Panel</Link>}
                      <div style={d.dropdownDivider} />
                      <button style={{ ...d.dropdownItem, color: '#FF6B6B', width: '100%', textAlign: 'left' }} onClick={handleLogout}>Sign Out</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/login" style={d.signInBtn}>Sign In</Link>
                <Link to="/register" style={d.registerBtn}>Register</Link>
              </div>
            )}
          </div>
        </div>
        {menuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenuOpen(false)} />}
      </nav>

      {/* ── Mobile bottom tab bar — hidden on desktop via CSS ── */}
      <nav className="mobile-tab-bar">
        <Link to="/" className={`tab${isActive('/') ? ' tab-active' : ''}`}>
          <span className="tab-icon"><IconSearch /></span>
          <span className="tab-label">Explore</span>
        </Link>
        {isAuthenticated ? (
          <>
            <Link to="/favorites" className={`tab${isActive('/favorites') ? ' tab-active' : ''}`}>
              <span className="tab-icon" style={{ position: 'relative' }}>
                <IconHeart />
                {favoriteCount > 0 && <span className="tab-badge" style={{ background: '#FF6B6B' }}>{favoriteCount > 9 ? '9+' : favoriteCount}</span>}
              </span>
              <span className="tab-label">Saved</span>
            </Link>
            <Link to="/listings/create" className="tab">
              <span className="tab-create"><IconPlus /></span>
              <span className="tab-label" style={{ opacity: 0 }}>+</span>
            </Link>
            <Link to="/chat" className={`tab${isActive('/chat') ? ' tab-active' : ''}`}>
              <span className="tab-icon" style={{ position: 'relative' }}>
                <IconChat />
                {unreadCount > 0 && <span className="tab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </span>
              <span className="tab-label">Messages</span>
            </Link>
            <button className={`tab${sheetOpen ? ' tab-active' : ''}`} onClick={() => setSheetOpen(true)}>
              <span className="tab-avatar">{user!.name.charAt(0).toUpperCase()}</span>
              <span className="tab-label">Profile</span>
            </button>
          </>
        ) : (
          <>
            <span style={{ flex: 1 }} />
            <Link to="/login" className="tab"><span className="tab-label" style={{ fontSize: 13 }}>Sign In</span></Link>
            <Link to="/register" className="tab"><span className="tab-label" style={{ fontSize: 13, color: '#4ECDC4' }}>Register</span></Link>
          </>
        )}
      </nav>

      {/* Profile sheet */}
      {sheetOpen && isAuthenticated && (
        <>
          <div className="sheet-overlay" onClick={() => setSheetOpen(false)} />
          <div className="bottom-sheet">
            <div className="sheet-handle" />
            <div className="sheet-header">
              <div className="sheet-avatar-lg">{user!.name.charAt(0).toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{user!.name}</div>
                <div style={{ fontSize: 13, color: '#9BA3C7', marginTop: 2 }}>{user!.email}</div>
                {user!.isVerifiedStudent && <div style={{ fontSize: 12, color: '#4ECDC4', marginTop: 4 }}>✓ Verified Student</div>}
              </div>
            </div>
            <div className="sheet-divider" />
            <Link to="/my-listings" className="sheet-item" onClick={() => setSheetOpen(false)}><span className="sheet-item-icon">🏠</span> My Listings</Link>
            <Link to="/favorites" className="sheet-item" onClick={() => setSheetOpen(false)}><span className="sheet-item-icon">♥</span> Saved Homes</Link>
            {isAdmin && <Link to="/admin" className="sheet-item" style={{ color: '#FFE66D' }} onClick={() => setSheetOpen(false)}><span className="sheet-item-icon">⚙️</span> Admin Panel</Link>}
            <div className="sheet-divider" />
            <button className="sheet-item" style={{ color: '#FF6B6B', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }} onClick={handleLogout}><span className="sheet-item-icon">↩</span> Sign Out</button>
          </div>
        </>
      )}
    </>
  )
}

// Desktop-only inline styles
const d: Record<string, React.CSSProperties> = {
  inner:          { maxWidth: 1280, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 },
  logo:           { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 },
  logoText:       { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#F0F2FF' },
  links:          { display: 'flex', alignItems: 'center', gap: 4, flex: 1 },
  link:           { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: '#9BA3C7', padding: '6px 12px', borderRadius: 8, textDecoration: 'none' },
  linkActive:     { color: '#4ECDC4', background: 'rgba(78,205,196,0.1)' },
  right:          { display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  iconBtn:        { display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 18, position: 'relative', textDecoration: 'none' },
  iconWrap:       { position: 'relative', display: 'flex' },
  badge:          { position: 'absolute', top: -8, right: -8, minWidth: 18, height: 18, borderRadius: 10, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  userBtn:        { display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', position: 'relative', zIndex: 100 },
  avatar:         { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #4ECDC4, #2C3E6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff' },
  userName:       { fontSize: 14, fontWeight: 600, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  verifiedDot:    { fontSize: 11, color: '#4ECDC4', background: 'rgba(78,205,196,0.15)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  dropdown:       { position: 'absolute', top: 'calc(100% + 8px)', right: 0, minWidth: 220, background: '#252A4A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', zIndex: 101, overflow: 'hidden' },
  dropdownHeader: { padding: '14px 16px', background: 'rgba(255,255,255,0.03)' },
  dropdownDivider:{ height: 1, background: 'rgba(255,255,255,0.07)' },
  dropdownItem:   { display: 'block', padding: '10px 16px', fontSize: 14, color: '#9BA3C7', textDecoration: 'none', cursor: 'pointer', background: 'none', border: 'none', fontFamily: "'DM Sans', sans-serif" },
  signInBtn:      { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: '#9BA3C7', padding: '8px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', textDecoration: 'none' },
  registerBtn:    { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: '#1B1F3B', padding: '8px 18px', borderRadius: 10, background: '#4ECDC4', textDecoration: 'none' },
}
