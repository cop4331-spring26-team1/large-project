import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🏠</div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.sub}>Sign in to your LetsMovNow account</p>
        </div>

        <form onSubmit={submit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handle}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
            />
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" style={styles.forgotLink}>Forgot password?</Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#4ECDC4', fontWeight: 600 }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight:       'calc(100vh - 130px)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '40px 16px',
  },
  card: {
    background:    '#1E2340',
    border:        '1px solid rgba(255,255,255,0.08)',
    borderRadius:  24,
    padding:       '40px 36px',
    width:         '100%',
    maxWidth:      440,
    boxShadow:     '0 8px 40px rgba(0,0,0,0.4)',
  },
  header: { textAlign: 'center', marginBottom: 32 },
  icon:   { fontSize: 40, marginBottom: 12 },
  title:  { fontSize: 28, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 6 },
  sub:    { fontSize: 15, color: '#9BA3C7' },
  form:   { display: 'flex', flexDirection: 'column', gap: 18 },
  error: {
    background:   'rgba(255,107,107,0.1)',
    border:       '1px solid rgba(255,107,107,0.3)',
    borderRadius: 10,
    padding:      '10px 14px',
    fontSize:     14,
    color:        '#FF6B6B',
  },
  forgotLink: { fontSize: 13, color: '#9BA3C7' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#9BA3C7' },
}
