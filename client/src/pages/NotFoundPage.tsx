import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{ minHeight: 'calc(100vh - 130px)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24 }}>
      <div>
        <div style={{ fontSize: 72, marginBottom: 16 }}>🏚</div>
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 48, color: '#4ECDC4', marginBottom: 8 }}>404</h1>
        <p style={{ color: '#9BA3C7', fontSize: 18, marginBottom: 28 }}>This page has moved out.</p>
        <Link to="/" className="btn btn-primary btn-lg">Back to Browse</Link>
      </div>
    </div>
  )
}
