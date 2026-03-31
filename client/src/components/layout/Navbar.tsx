import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth }   from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { chatApi }   from '../../api'

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const { unreadCount } = useSocket()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [realUnread, setRealUnread] = useState(0)

  // Fetch unread count on mount and whenever socket signals a change
  useEffect(() => {
    if (!isAuthenticated) return
    chatApi.getUnreadCount()
      .then((res) => setRealUnread(res.data.data.unreadCount))
      .catch(() => {})
  }, [isAuthenticated, unreadCount])


  const favoriteCount = user?.favorites?.length ?? 0

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/" style={styles.logo}>
          <span style={styles.logoIcon}>🏠</span>
          <span style={styles.logoText}>LetsMovNow</span>
        </Link>

        {/* Desktop nav links */}
        <div style={styles.links}>
          <Link to="/" style={{ ...styles.link, ...(isActive('/') ? styles.linkActive : {}) }}>
            Browse
          </Link>
          {isAuthenticated && (
            <Link
              to="/listings/create"
              style={{ ...styles.link, ...(isActive('/listings/create') ? styles.linkActive : {}) }}
            >
              List a Room
            </Link>
          )}
          {isAuthenticated && (
            <Link
              to="/my-listings"
              style={{ ...styles.link, ...(isActive('/my-listings') ? styles.linkActive : {}) }}
            >
              My Listings
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" style={{ ...styles.link, color: '#FFE66D' }}>
              Admin
            </Link>
          )}
        </div>

        {/* Right side icons + auth */}
        <div style={styles.right}>
          {isAuthenticated ? (
            <>
              {/* Favorites heart */}
              <Link to="/favorites" style={styles.iconBtn} title="Favorites">
                <span style={styles.iconWrap}>
                  ♥
                  {favoriteCount > 0 && (
                    <span style={{ ...styles.badge, background: '#FF6B6B' }}>
                      {favoriteCount > 99 ? '99+' : favoriteCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* Chat */}
              <Link to="/chat" style={styles.iconBtn} title="Messages">
                <span style={styles.iconWrap}>
                  💬
                  {realUnread > 0 && (
                    <span style={{ ...styles.badge, background: '#4ECDC4', color: '#1B1F3B' }}>
                      {realUnread > 99 ? '99+' : realUnread}
                    </span>
                  )}
                </span>
              </Link>

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button
                  style={styles.userBtn}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <span style={styles.avatar}>
                    {user!.name.charAt(0).toUpperCase()}
                  </span>
                  <span style={styles.userName}>{user!.name.split(' ')[0]}</span>
                  {user!.isVerifiedStudent && (
                    <span style={styles.verifiedDot} title="Verified Student">✓</span>
                  )}
                  <span style={{ color: '#9BA3C7', fontSize: 12 }}>▾</span>
                </button>

                {menuOpen && (
                  <div style={styles.dropdown}>
                    <div style={styles.dropdownHeader}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{user!.name}</div>
                      <div style={{ fontSize: 11, color: '#9BA3C7' }}>{user!.email}</div>
                      {user!.isVerifiedStudent && (
                        <div style={{ fontSize: 11, color: '#4ECDC4', marginTop: 2 }}>
                          ✓ Verified Student
                        </div>
                      )}
                    </div>
                    <div style={styles.dropdownDivider} />
                    <Link to="/my-listings" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      My Listings
                    </Link>
                    <Link to="/favorites" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                      Saved Homes
                    </Link>
                    {isAdmin && (
                      <Link to="/admin" style={{ ...styles.dropdownItem, color: '#FFE66D' }} onClick={() => setMenuOpen(false)}>
                        Admin Panel
                      </Link>
                    )}
                    <div style={styles.dropdownDivider} />
                    <button style={{ ...styles.dropdownItem, color: '#FF6B6B', width: '100%', textAlign: 'left' }} onClick={handleLogout}>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 10 }}>
              <Link to="/login" style={styles.signInBtn}>Sign In</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {menuOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </nav>
  )
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    background:   'rgba(27,31,59,0.95)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    position:     'sticky',
    top:          0,
    zIndex:       1000,
  },
  inner: {
    maxWidth:   1280,
    margin:     '0 auto',
    padding:    '0 24px',
    height:     64,
    display:    'flex',
    alignItems: 'center',
    gap:        32,
  },
  logo: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    textDecoration: 'none',
    flexShrink: 0,
  },
  logoIcon: { fontSize: 22 },
  logoText: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize:   20,
    color:      '#F0F2FF',
  },
  logoAccent: { color: '#4ECDC4' },
  links: {
    display:    'flex',
    alignItems: 'center',
    gap:        4,
    flex:       1,
  },
  link: {
    fontFamily:  "'Plus Jakarta Sans', sans-serif",
    fontWeight:  600,
    fontSize:    14,
    color:       '#9BA3C7',
    padding:     '6px 12px',
    borderRadius: 8,
    transition:  'color 0.15s, background 0.15s',
    textDecoration: 'none',
  },
  linkActive: {
    color:      '#4ECDC4',
    background: 'rgba(78,205,196,0.1)',
  },
  right: {
    display:    'flex',
    alignItems: 'center',
    gap:        8,
    marginLeft: 'auto',
  },
  iconBtn: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          40,
    height:         40,
    borderRadius:   10,
    background:     'rgba(255,255,255,0.05)',
    border:         '1px solid rgba(255,255,255,0.08)',
    fontSize:       18,
    position:       'relative',
    textDecoration: 'none',
    transition:     'background 0.15s',
  },
  iconWrap: { position: 'relative', display: 'flex' },
  badge: {
    position:   'absolute',
    top:        -8,
    right:      -8,
    minWidth:   18,
    height:     18,
    borderRadius: 10,
    fontSize:   10,
    fontWeight: 700,
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding:    '0 4px',
    color:      '#fff',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  userBtn: {
    display:       'flex',
    alignItems:    'center',
    gap:           8,
    background:    'rgba(255,255,255,0.05)',
    border:        '1px solid rgba(255,255,255,0.08)',
    borderRadius:  10,
    padding:       '6px 12px',
    cursor:        'pointer',
    transition:    'background 0.15s',
    position:      'relative',
    zIndex:        100,
  },
  avatar: {
    width:          30,
    height:         30,
    borderRadius:   '50%',
    background:     'linear-gradient(135deg, #4ECDC4, #2C3E6B)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       14,
    fontWeight:     700,
    color:          '#fff',
    fontFamily:     "'Plus Jakarta Sans', sans-serif",
  },
  userName: {
    fontSize:   14,
    fontWeight: 600,
    color:      '#F0F2FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  verifiedDot: {
    fontSize:        11,
    color:           '#4ECDC4',
    background:      'rgba(78,205,196,0.15)',
    borderRadius:    '50%',
    width:           18,
    height:          18,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
  },
  dropdown: {
    position:      'absolute',
    top:           'calc(100% + 8px)',
    right:         0,
    minWidth:      220,
    background:    '#252A4A',
    border:        '1px solid rgba(255,255,255,0.1)',
    borderRadius:  14,
    boxShadow:     '0 8px 32px rgba(0,0,0,0.4)',
    zIndex:        101,
    overflow:      'hidden',
  },
  dropdownHeader: {
    padding:    '14px 16px',
    background: 'rgba(255,255,255,0.03)',
  },
  dropdownDivider: {
    height:     1,
    background: 'rgba(255,255,255,0.07)',
  },
  dropdownItem: {
    display:        'block',
    padding:        '10px 16px',
    fontSize:       14,
    color:          '#9BA3C7',
    textDecoration: 'none',
    transition:     'background 0.12s, color 0.12s',
    cursor:         'pointer',
    background:     'none',
    border:         'none',
    fontFamily:     "'DM Sans', sans-serif",
  },
  signInBtn: {
    fontFamily:  "'Plus Jakarta Sans', sans-serif",
    fontWeight:  600,
    fontSize:    14,
    color:       '#9BA3C7',
    padding:     '8px 16px',
    borderRadius: 10,
    border:      '1px solid rgba(255,255,255,0.1)',
    background:  'transparent',
    textDecoration: 'none',
    transition:  'all 0.15s',
  },
  registerBtn: {
    fontFamily:  "'Plus Jakarta Sans', sans-serif",
    fontWeight:  700,
    fontSize:    14,
    color:       '#1B1F3B',
    padding:     '8px 18px',
    borderRadius: 10,
    background:  '#4ECDC4',
    textDecoration: 'none',
    transition:  'all 0.15s',
  },
}
