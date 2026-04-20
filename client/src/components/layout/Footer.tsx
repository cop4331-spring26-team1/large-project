import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={styles.footer}>
      <div style={styles.inner}>
        <div style={styles.brand}>
          <span style={styles.logo}>🏠 LetsMovNow</span>
          <p style={styles.tagline}>Student rentals near every campus.</p>
        </div>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Browse</Link>
          <Link to="/listings/create" style={styles.link}>List a Room</Link>
          <Link to="/register" style={styles.link}>Register</Link>
        </div>
        <div style={styles.copy}>
          © {new Date().getFullYear()} LetsMovNow. Built for students, by students.
        </div>
      </div>
    </footer>
  )
}

const styles: Record<string, React.CSSProperties> = {
  footer: {
    background:  '#151829',
    borderTop:   '1px solid rgba(255,255,255,0.06)',
    marginTop:   'auto',
    padding:     '40px 0 24px',
  },
  inner: {
    maxWidth: 1280,
    margin:   '0 auto',
    padding:  '0 24px',
    display:  'grid',
    gridTemplateColumns: '1fr auto 1fr',
    alignItems: 'center',
    gap:      24,
  },
  brand: {},
  logo: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize:   18,
    color:      '#F0F2FF',
  },
  tagline: {
    fontSize:   13,
    color:      '#5C6490',
    marginTop:  4,
  },
  links: {
    display: 'flex',
    gap:     24,
  },
  link: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 600,
    fontSize:   13,
    color:      '#9BA3C7',
    textDecoration: 'none',
  },
  copy: {
    fontSize:  12,
    color:     '#5C6490',
    textAlign: 'right',
  },
}
