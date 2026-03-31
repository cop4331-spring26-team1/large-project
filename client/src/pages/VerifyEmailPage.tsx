import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { useAuth } from '../context/AuthContext'

// ── Verify Email ──────────────────────────────────────────────────────────────
export function VerifyEmailPage() {
  const { token }      = useParams<{ token: string }>()
  const { updateUser } = useAuth()
  const navigate       = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) return
    authApi.verifyEmail(token)
      .then((res) => {
        const { token: jwt, user } = res.data.data
        localStorage.setItem('cn_token', jwt)
        localStorage.setItem('cn_user', JSON.stringify(user))
        updateUser(user)
        setStatus('success')
        setTimeout(() => navigate('/'), 2000)
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        {status === 'loading' && (
          <><div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: '#9BA3C7' }}>Verifying your email...</p></>
        )}
        {status === 'success' && (
          <><div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Email verified!</h2>
          <p style={{ color: '#9BA3C7' }}>Redirecting you to LetsMovNow...</p></>
        )}
        {status === 'error' && (
          <><div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Link invalid or expired</h2>
          <p style={{ color: '#9BA3C7', marginBottom: 20 }}>Request a new verification email from the login page.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link></>
        )}
      </div>
    </div>
  )
}

// ── Forgot Password ───────────────────────────────────────────────────────────
export function ForgotPasswordPage() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await authApi.forgotPassword(email) } catch {}
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        {sent ? (
          <><div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Check your email</h2>
          <p style={{ color: '#9BA3C7', marginBottom: 20 }}>If an account exists for {email}, a reset link has been sent.</p>
          <Link to="/login" className="btn btn-ghost">Back to login</Link></>
        ) : (
          <>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Forgot password?</h2>
          <p style={{ color: '#9BA3C7', marginBottom: 24 }}>Enter your email and we'll send you a reset link.</p>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <input className="form-input" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <Link to="/login" style={{ textAlign: 'center', fontSize: 14, color: '#9BA3C7' }}>Back to login</Link>
          </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Reset Password ────────────────────────────────────────────────────────────
export function ResetPasswordPage() {
  const { token }   = useParams<{ token: string }>()
  const navigate    = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token!, password)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Reset failed')
    } finally { setLoading(false) }
  }

  return (
    <div style={centerStyle}>
      <div style={cardStyle}>
        <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginBottom: 8 }}>Set new password</h2>
        <p style={{ color: '#9BA3C7', marginBottom: 24 }}>Choose a strong password for your account.</p>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ color: '#FF6B6B', fontSize: 14 }}>{error}</div>}
          <input className="form-input" type="password" placeholder="New password (min 8 chars, 1 number)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} autoFocus />
          <input className="form-input" type="password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

// Shared styles
const centerStyle: React.CSSProperties = { minHeight: 'calc(100vh - 130px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }
const cardStyle:  React.CSSProperties  = { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: '48px 36px', width: '100%', maxWidth: 420, textAlign: 'center' }

export default VerifyEmailPage
