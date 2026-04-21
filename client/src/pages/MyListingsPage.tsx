import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listingsApi } from '../api'
import type { Listing } from '../types'

const STATUS_COLOR: Record<string, string> = {
  active: '#34C759', pending: '#FFCC00', offMarket: '#FF3B30',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Available', pending: 'In Talks', offMarket: 'Off Market',
}

export default function MyListingsPage() {
  const navigate = useNavigate()
  const [listings, setListings]         = useState<Listing[]>([])
  const [loading, setLoading]           = useState(true)
  const [statusSheet, setStatusSheet]   = useState<Listing | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    listingsApi.getMine()
      .then((res) => setListings(res.data.data.listings))
      .finally(() => setLoading(false))
  }, [])

  // Lock body scroll when any bottom sheet is open
  useEffect(() => {
    const open = !!(statusSheet || deleteTarget)
    if (open) {
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
  }, [statusSheet, deleteTarget])

  const changeStatus = async (id: string, status: string) => {
    const previous = listings.find((l) => l._id === id)?.status
    setStatusSheet(null)
    // Update UI immediately — don't wait for the API
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: status as any } : l))
    try {
      await listingsApi.updateStatus(id, status as any)
    } catch {
      // Revert if API fails
      if (previous) setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: previous as any } : l))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const id = deleteTarget
    setDeleteTarget(null)
    try {
      await listingsApi.delete(id)
      setListings((prev) => prev.filter((l) => l._id !== id))
    } catch {}
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>My Listings</h1>
          <p style={{ color: '#9BA3C7', fontSize: 13, marginTop: 2 }}>{listings.length} listing{listings.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={s.addBtn} aria-label="Create new listing" onClick={() => navigate('/listings/create')}>+</button>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>🏠</div>
          <h3 style={{ marginTop: 16 }}>No listings yet</h3>
          <p>Tap + to add your first listing</p>
          <Link to="/listings/create" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>List Your Place</Link>
        </div>
      ) : (
        <div style={s.list}>
          {listings.map((l) => {
            const color = STATUS_COLOR[l.status] ?? '#9BA3C7'
            return (
              <div key={l._id} style={s.card}>
                {/* Top row — image + info */}
                <div style={s.topRow} onClick={() => navigate(`/listings/${l._id}`)}>
                  <img
                    src={l.images[0] || ''}
                    alt={l.title}
                    style={s.thumb}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div style={s.info}>
                    <div style={s.listingTitle}>{l.title}</div>
                    <div style={s.meta}>${l.price.toLocaleString()}/mo · {l.city}, {l.state}</div>
                    {/* Status pill — tappable */}
                    <button
                      style={{ ...s.statusPill, color, background: `${color}1F`, border: `1px solid ${color}66` }}
                      aria-label={`Change status: ${STATUS_LABEL[l.status]}`}
                      onClick={(e) => { e.stopPropagation(); setStatusSheet(l) }}
                    >
                      <span style={{ ...s.statusDot, background: color }} />
                      {STATUS_LABEL[l.status]}
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div style={s.divider} />

                {/* Bottom actions */}
                <div style={s.actions}>
                  <Link
                    to={`/listings/${l._id}/edit`}
                    style={s.actionBtn}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ✏ Edit
                  </Link>
                  <div style={s.actionDivider} />
                  <button
                    style={{ ...s.actionBtn, color: '#FF3B30' }}
                    aria-label={`Delete listing: ${l.title}`}
                    onClick={() => setDeleteTarget(l._id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Status bottom sheet */}
      {statusSheet && (
        <>
          <div style={s.overlay} onClick={() => setStatusSheet(null)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={s.sheetTitle}>Change Status</div>
            {(['active', 'pending', 'offMarket'] as const).map((status) => {
              const c = STATUS_COLOR[status]
              const selected = statusSheet.status === status
              return (
                <button
                  key={status}
                  style={{ ...s.sheetItem, ...(selected ? { background: `${c}18` } : {}) }}
                  onClick={() => changeStatus(statusSheet._id, status)}
                >
                  <span style={{ ...s.statusDot, background: c, width: 10, height: 10 }} />
                  <span style={{ flex: 1, textAlign: 'left' as const, color: selected ? c : '#F0F2FF' }}>
                    {STATUS_LABEL[status]}
                  </span>
                  {selected && <span style={{ color: c, fontSize: 16 }}>✓</span>}
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* Delete confirmation sheet */}
      {deleteTarget && (
        <>
          <div style={s.overlay} onClick={() => setDeleteTarget(null)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 16px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,59,48,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, marginBottom: 12 }}>🗑</div>
              <div style={s.sheetTitle}>Delete Listing?</div>
              <p style={{ color: '#9BA3C7', fontSize: 14, textAlign: 'center', marginTop: 4 }}>This will permanently delete your listing. This cannot be undone.</p>
            </div>
            <button style={{ ...s.sheetItem, background: 'rgba(255,59,48,0.1)', color: '#FF3B30', justifyContent: 'center', fontWeight: 700 }} onClick={confirmDelete}>Delete</button>
            <button style={{ ...s.sheetItem, justifyContent: 'center', color: '#9BA3C7', marginTop: 8 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
          </div>
        </>
      )}
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:         { padding: '0 0 100px' },
  header:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 16px 12px', background: '#1E2340', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  title:        { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 22, color: '#F0F2FF' },
  addBtn:       { width: 36, height: 36, borderRadius: '50%', background: '#4ECDC4', border: 'none', color: '#1B1F3B', fontSize: 22, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  list:         { display: 'flex', flexDirection: 'column', gap: 12, padding: '16px' },
  card:         { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' },
  topRow:       { display: 'flex', gap: 0, cursor: 'pointer' },
  thumb:        { width: 90, height: 80, objectFit: 'cover', flexShrink: 0, borderRadius: '16px 0 0 0' },
  info:         { flex: 1, padding: '10px 12px', minWidth: 0 },
  listingTitle: { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: '#F0F2FF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meta:         { fontSize: 12, color: '#9BA3C7', marginTop: 2 },
  statusPill:   { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, cursor: 'pointer', marginTop: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", background: 'none' },
  statusDot:    { width: 6, height: 6, borderRadius: '50%', flexShrink: 0, display: 'inline-block' },
  divider:      { height: 1, background: 'rgba(255,255,255,0.07)' },
  actions:      { display: 'flex', alignItems: 'stretch' },
  actionBtn:    { flex: 1, background: 'none', border: 'none', color: '#9BA3C7', fontSize: 13, fontWeight: 600, padding: '10px', cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  actionDivider:{ width: 1, background: 'rgba(255,255,255,0.07)', flexShrink: 0 },
  overlay:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, backdropFilter: 'blur(2px)' },
  sheet:        { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1101, background: '#1E2340', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)', padding: '0 16px calc(env(safe-area-inset-bottom) + 24px)' },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '12px auto 8px' },
  sheetTitle:   { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: '#F0F2FF', padding: '8px 0 16px' },
  sheetItem:    { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '14px 12px', background: 'none', border: 'none', borderRadius: 12, cursor: 'pointer', fontSize: 15, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif" },
}
