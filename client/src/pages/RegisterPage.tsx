import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../api'

export default function RegisterPage() {
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const isEdu = form.email.toLowerCase().endsWith('.edu')

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(form)
      setSuccess('Account created! Check your email to verify your account before logging in.')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 12 }}>Check your inbox</h2>
            <p style={{ color: '#9BA3C7', lineHeight: 1.7, marginBottom: 24 }}>{success}</p>
            <Link to="/login" className="btn btn-primary">Go to Sign In</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.icon}>🏠</div>
          <h1 style={styles.title}>Join LetsMovNow</h1>
          <p style={styles.sub}>Find or list student rentals near campus</p>
        </div>

        {/* .edu callout */}
        <div style={{ ...styles.eduNote, ...(isEdu ? styles.eduNoteActive : {}) }}>
          {isEdu ? (
            <>✓ <strong style={{ color: '#4ECDC4' }}>Verified Student badge</strong> will be added to your profile and listings — builds trust with other students.</>
          ) : (
            <>💡 Use your <strong>.edu email</strong> to get a <strong style={{ color: '#4ECDC4' }}>Verified Student badge</strong> on your account and listings.</>
          )}
        </div>

        <form onSubmit={submit} style={styles.form}>
          {error && <div style={styles.error}>{error}</div>}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" name="name" type="text" placeholder="Alex Johnson" value={form.name} onChange={handle} required autoFocus />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" placeholder="you@university.edu" value={form.email} onChange={handle} required />
            <span className="form-hint">Use your .edu email for a Verified Student badge</span>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" name="password" type="password" placeholder="Min. 8 characters, at least 1 number" value={form.password} onChange={handle} required minLength={8} />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4ECDC4', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page:   { minHeight: 'calc(100vh - 130px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 16px' },
  card:   { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '40px 36px', width: '100%', maxWidth: 460, boxShadow: '0 8px 40px rgba(0,0,0,0.4)' },
  header: { textAlign: 'center', marginBottom: 24 },
  icon:   { fontSize: 40, marginBottom: 12 },
  title:  { fontSize: 28, fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 6 },
  sub:    { fontSize: 15, color: '#9BA3C7' },
  eduNote: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9BA3C7', lineHeight: 1.6, marginBottom: 20, transition: 'all 0.2s' },
  eduNoteActive: { background: 'rgba(78,205,196,0.08)', borderColor: 'rgba(78,205,196,0.3)', color: '#cde8e6' },
  form:   { display: 'flex', flexDirection: 'column', gap: 18 },
  error:  { background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#FF6B6B' },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 14, color: '#9BA3C7' },
}
