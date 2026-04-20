import { useState, useEffect } from 'react'
import { adminApi } from '../api'
import type { User, Listing } from '../types'

type Tab = 'users' | 'listings' | 'threads'

export default function AdminPage() {
  const [tab, setTab]           = useState<Tab>('listings')
  const [users, setUsers]       = useState<User[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    setLoading(true)
    if (tab === 'users') {
      adminApi.getUsers({ search, limit: 50 })
        .then((r) => setUsers(r.data.data.users))
        .finally(() => setLoading(false))
    } else if (tab === 'listings') {
      adminApi.getAllListings({ search, status: statusFilter || undefined, limit: 50 })
        .then((r) => setListings(r.data.data.listings))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [tab, search, statusFilter])

  const blockUser = async (id: string, isBlocked: boolean) => {
    await adminApi.updateUser(id, { isBlocked: !isBlocked })
    setUsers((prev) => prev.map((u) => u._id === id ? { ...u, isBlocked: !isBlocked } : u))
  }

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user account?')) return
    await adminApi.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u._id !== id))
  }

  const reactivate = async (id: string) => {
    await adminApi.reactivateListing(id)
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: 'active' } : l))
  }

  const deleteListing = async (id: string) => {
    if (!confirm('Permanently delete this listing?')) return
    await adminApi.deleteListing(id)
    setListings((prev) => prev.filter((l) => l._id !== id))
  }

  const STATUS_COLORS: Record<string, string> = { active: '#4ECDC4', pending: '#FFE66D', offMarket: '#FF6B6B' }

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, marginBottom: 4 }}>Admin Panel</h1>
        <p style={{ color: '#9BA3C7', marginBottom: 28 }}>Full platform control</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(['listings', 'users'] as Tab[]).map((t) => (
            <button key={t} style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Search + filter */}
        <div style={styles.toolbar}>
          <input
            style={styles.search}
            placeholder={`Search ${tab}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {tab === 'listings' && (
            <select style={styles.filter} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="offMarket">Off Market</option>
            </select>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : tab === 'users' ? (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Actions</span>
            </div>
            {users.map((u) => (
              <div key={u._id} style={styles.tableRow}>
                <span style={{ fontWeight: 600, color: '#F0F2FF' }}>
                  {u.name} {u.isVerifiedStudent && <span style={{ fontSize: 11, color: '#4ECDC4' }}>✓</span>}
                </span>
                <span style={{ color: '#9BA3C7', fontSize: 13 }}>{u.email}</span>
                <span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: u.role === 'admin' ? 'rgba(255,230,109,0.15)' : 'rgba(255,255,255,0.06)', color: u.role === 'admin' ? '#FFE66D' : '#9BA3C7' }}>
                    {u.role}
                  </span>
                </span>
                <span>
                  {(u as any).isBlocked
                    ? <span style={{ color: '#FF6B6B', fontSize: 12 }}>Blocked</span>
                    : <span style={{ color: '#4ECDC4', fontSize: 12 }}>Active</span>}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,230,109,0.1)', color: '#FFE66D', border: '1px solid rgba(255,230,109,0.2)' }}
                    onClick={() => blockUser(u._id, (u as any).isBlocked)}
                  >
                    {(u as any).isBlocked ? 'Unblock' : 'Block'}
                  </button>
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.2)' }}
                    onClick={() => deleteUser(u._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.table}>
            <div style={{ ...styles.tableHeader, gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
              <span>Title</span><span>University</span><span>Price</span><span>Status</span><span>Actions</span>
            </div>
            {listings.map((l) => (
              <div key={l._id} style={{ ...styles.tableRow, gridTemplateColumns: '2fr 1fr 1fr 1fr auto' }}>
                <span style={{ fontWeight: 600, color: '#F0F2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.title}</span>
                <span style={{ color: '#9BA3C7', fontSize: 13 }}>{l.university}</span>
                <span style={{ color: '#4ECDC4', fontWeight: 700 }}>${l.price.toLocaleString()}</span>
                <span>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: `${STATUS_COLORS[l.status]}22`, color: STATUS_COLORS[l.status] }}>
                    {l.status}
                  </span>
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {l.status === 'offMarket' && (
                    <button
                      className="btn btn-sm"
                      style={{ background: 'rgba(78,205,196,0.1)', color: '#4ECDC4', border: '1px solid rgba(78,205,196,0.2)' }}
                      onClick={() => reactivate(l._id)}
                    >
                      Reactivate
                    </button>
                  )}
                  <button
                    className="btn btn-sm"
                    style={{ background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', border: '1px solid rgba(255,107,107,0.2)' }}
                    onClick={() => deleteListing(l._id)}
                  >
                    Delete
                  </button>
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
  tabs:        { display: 'flex', gap: 4, background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 20 },
  tab:         { padding: '8px 20px', borderRadius: 9, border: 'none', background: 'transparent', color: '#9BA3C7', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s' },
  tabActive:   { background: '#4ECDC4', color: '#1B1F3B' },
  toolbar:     { display: 'flex', gap: 10, marginBottom: 16 },
  search:      { flex: 1, background: '#1E2340', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: "'DM Sans', sans-serif", maxWidth: 360 },
  filter:      { background: '#1E2340', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 14, padding: '10px 14px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  table:       { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr auto', gap: 12, padding: '12px 16px', background: 'rgba(255,255,255,0.04)', fontSize: 11, fontWeight: 600, color: '#9BA3C7', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  tableRow:    { display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr auto', gap: 12, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', alignItems: 'center', fontSize: 14 },
}
