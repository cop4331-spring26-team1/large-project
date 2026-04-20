import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listingsApi } from '../api'
import type { Listing } from '../types'

const STATUS_COLORS: Record<string, string> = {
  active: '#4ECDC4', pending: '#FFE66D', offMarket: '#FF6B6B',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Active', pending: 'In Talks', offMarket: 'Off Market',
}

export default function MyListingsPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    listingsApi.getMine()
      .then((res) => setListings(res.data.data.listings))
      .finally(() => setLoading(false))
  }, [])

  const changeStatus = async (id: string, status: string) => {
    try {
      await listingsApi.updateStatus(id, status as any)
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: status as any } : l))
    } catch (err: any) { alert(err.response?.data?.message || 'Failed') }
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Delete this listing? This cannot be undone.')) return
    try {
      await listingsApi.delete(id)
      setListings((prev) => prev.filter((l) => l._id !== id))
    } catch { alert('Failed to delete') }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container">
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>My Listings</h1>
            <p style={{ color: '#9BA3C7', marginTop: 4 }}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/listings/create" className="btn btn-primary">+ New Listing</Link>
        </div>

        {listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings yet</h3>
            <p>Post your first room and start getting inquiries.</p>
            <Link to="/listings/create" className="btn btn-primary" style={{ marginTop: 20 }}>List a Room</Link>
          </div>
        ) : (
          <div style={styles.list}>
            {listings.map((l) => (
              <div key={l._id} style={styles.row}>
                <img src={l.images[0]} alt={l.title} style={styles.thumb} />
                <div style={styles.info}>
                  <div style={styles.rowTop}>
                    <Link to={`/listings/${l._id}`} style={styles.listingTitle}>{l.title}</Link>
                    <span style={{ ...styles.statusPill, color: STATUS_COLORS[l.status], background: `${STATUS_COLORS[l.status]}22` }}>
                      {STATUS_LABELS[l.status]}
                    </span>
                  </div>
                  <div style={styles.meta}>
                    <span style={{ color: '#4ECDC4', fontWeight: 700 }}>${l.price.toLocaleString()}/mo</span>
                    <span>·</span>
                    <span>{l.university}</span>
                    <span>·</span>
                    <span style={{ color: '#FF6B6B' }}>♥ {l.favoriteCount}</span>
                    <span>·</span>
                    <span>Expires {new Date(l.expiresAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={styles.actions}>
                  <Link to={`/listings/${l._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                  {l.status === 'active' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(l._id, 'pending')}>Mark Pending</button>
                  )}
                  {l.status === 'pending' && (
                    <button className="btn btn-ghost btn-sm" onClick={() => changeStatus(l._id, 'active')}>Mark Active</button>
                  )}
                  {l.status === 'offMarket' && (
                    <span style={{ fontSize: 12, color: '#FF6B6B' }}>Admin reactivates</span>
                  )}
                  <button className="btn btn-sm" style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.3)' }} onClick={() => deleteListing(l._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 },
  title:        { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32 },
  list:         { display: 'flex', flexDirection: 'column', gap: 12 },
  row:          { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 16 },
  thumb:        { width: 100, height: 72, objectFit: 'cover', borderRadius: 10, flexShrink: 0 },
  info:         { flex: 1, minWidth: 0 },
  rowTop:       { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  listingTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusPill:   { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  meta:         { display: 'flex', gap: 8, fontSize: 13, color: '#9BA3C7', flexWrap: 'wrap' },
  actions:      { display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' },
}
