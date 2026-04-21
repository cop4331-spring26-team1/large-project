import { useState, useEffect } from 'react'
import { adminApi } from '../api'
import type { User, Listing } from '../types'

type Tab = 'overview' | 'listings' | 'users'

const STATUS_COLOR: Record<string, string> = {
  active: '#34C759', pending: '#FFCC00', offMarket: '#FF3B30',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Available', pending: 'In Talks', offMarket: 'Off Market',
}

interface Stats {
  totalUsers: number
  totalListings: number
  activeListings: number
  totalThreads: number
  boostedListings: number
}

export default function AdminPage() {
  const [tab, setTab]             = useState<Tab>('overview')
  const [stats, setStats]         = useState<Stats | null>(null)
  const [users, setUsers]         = useState<User[]>([])
  const [listings, setListings]   = useState<Listing[]>([])
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading]     = useState(false)
  const [actionSheet, setActionSheet] = useState<{ type: 'listing' | 'user'; item: any } | null>(null)
  const [boostDays, setBoostDays] = useState(7)

  useEffect(() => {
    adminApi.getStats().then((r) => setStats(r.data.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (tab === 'overview') return
    setLoading(true)
    if (tab === 'users') {
      adminApi.getUsers({ search, limit: 50 })
        .then((r) => setUsers(r.data.data.users))
        .finally(() => setLoading(false))
    } else {
      adminApi.getAllListings({ search, status: statusFilter || undefined, limit: 50 })
        .then((r) => setListings(r.data.data.listings))
        .finally(() => setLoading(false))
    }
  }, [tab, search, statusFilter])

  const forceStatus = async (id: string, status: string) => {
    await adminApi.forceStatus(id, status)
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: status as any } : l))
    setActionSheet(null)
  }

  const boostListing = async (id: string) => {
    await adminApi.boostListing(id, boostDays)
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, isBoosted: true } as any : l))
    setActionSheet(null)
    setStats((s) => s ? { ...s, boostedListings: s.boostedListings + 1 } : s)
  }

  const unboostListing = async (id: string) => {
    await adminApi.unboostListing(id)
    setListings((prev) => prev.map((l) => l._id === id ? { ...l, isBoosted: false } as any : l))
    setActionSheet(null)
    setStats((s) => s ? { ...s, boostedListings: Math.max(0, s.boostedListings - 1) } : s)
  }

  const deleteListing = async (id: string) => {
    await adminApi.deleteListing(id)
    setListings((prev) => prev.filter((l) => l._id !== id))
    setActionSheet(null)
    setStats((s) => s ? { ...s, totalListings: s.totalListings - 1 } : s)
  }

  const toggleBlock = async (u: any) => {
    await adminApi.updateUser(u._id, { isBlocked: !u.isBlocked })
    setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isBlocked: !u.isBlocked } as any : x))
    setActionSheet(null)
  }

  const toggleAdmin = async (u: any) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    await adminApi.updateUser(u._id, { role: newRole })
    setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, role: newRole } as any : x))
    setActionSheet(null)
  }

  const verifyStudent = async (u: any) => {
    await adminApi.updateUser(u._id, { isVerifiedStudent: !u.isVerifiedStudent })
    setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isVerifiedStudent: !u.isVerifiedStudent } as any : x))
    setActionSheet(null)
  }

  const deleteUser = async (id: string) => {
    await adminApi.deleteUser(id)
    setUsers((prev) => prev.filter((u) => u._id !== id))
    setActionSheet(null)
    setStats((s) => s ? { ...s, totalUsers: s.totalUsers - 1 } : s)
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Admin Panel</h1>
          <p style={{ color: '#9BA3C7', fontSize: 13, marginTop: 2 }}>Full platform control</p>
        </div>
      </div>

      <div style={s.tabBar}>
        {(['overview', 'listings', 'users'] as Tab[]).map((t) => (
          <button key={t} style={{ ...s.tab, ...(tab === t ? s.tabActive : {}) }} onClick={() => setTab(t)}>
            {t === 'overview' ? '📊 Overview' : t === 'listings' ? '🏠 Listings' : '👥 Users'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <div style={s.content}>
          <div style={s.statsGrid}>
            <StatCard label="Total Users"      value={stats?.totalUsers}      color="#4ECDC4" icon="👥" />
            <StatCard label="Total Listings"   value={stats?.totalListings}   color="#4ECDC4" icon="🏠" />
            <StatCard label="Active Listings"  value={stats?.activeListings}  color="#34C759" icon="✅" />
            <StatCard label="Conversations"    value={stats?.totalThreads}    color="#FFCC00" icon="💬" />
            <StatCard label="Boosted"          value={stats?.boostedListings} color="#FF9500" icon="⚡" />
          </div>
          <h3 style={{ ...s.sectionTitle, marginBottom: 12 }}>Quick Actions</h3>
          <div style={s.actionGrid}>
            <button style={s.actionCard} onClick={() => setTab('listings')}>
              <span style={{ fontSize: 28 }}>🏠</span>
              <span style={s.actionLabel}>Manage Listings</span>
              <span style={s.actionSub}>Boost, change status, remove</span>
            </button>
            <button style={s.actionCard} onClick={() => setTab('users')}>
              <span style={{ fontSize: 28 }}>👥</span>
              <span style={s.actionLabel}>Manage Users</span>
              <span style={s.actionSub}>Block, verify, promote to admin</span>
            </button>
            <button style={s.actionCard} onClick={() => { setTab('listings'); }}>
              <span style={{ fontSize: 28 }}>⚡</span>
              <span style={s.actionLabel}>Boost a Listing</span>
              <span style={s.actionSub}>Move to top of results</span>
            </button>
          </div>
        </div>
      )}

      {/* ── LISTINGS ── */}
      {tab === 'listings' && (
        <div style={s.content}>
          <div style={s.toolbar}>
            <input
              style={s.search}
              placeholder="Search title, university, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select style={s.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="active">Available</option>
              <option value="pending">In Talks</option>
              <option value="offMarket">Off Market</option>
            </select>
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div style={s.list}>
              {listings.map((l: any) => {
                const color = STATUS_COLOR[l.status] ?? '#9BA3C7'
                return (
                  <div key={l._id} style={s.card}>
                    <div style={s.cardRow}>
                      <img
                        src={l.images?.[0] || ''}
                        alt={l.title}
                        style={s.thumb}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <div style={s.cardInfo}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                          <span style={s.cardTitle}>{l.title}</span>
                          {l.isBoosted && <span style={s.boostBadge}>⚡ Boosted</span>}
                        </div>
                        <div style={s.cardMeta}>{l.university} · ${l.price?.toLocaleString()}/mo</div>
                        <div style={s.cardMeta}>{l.owner?.name} · {l.owner?.email}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4 }}>
                          <span style={{ ...s.statusDot, background: color }} />
                          <span style={{ fontSize: 11, color, fontWeight: 600 }}>{STATUS_LABEL[l.status]}</span>
                        </div>
                      </div>
                      <button style={s.moreBtn} aria-label={`Actions for ${l.title}`} onClick={() => setActionSheet({ type: 'listing', item: l })}>···</button>
                    </div>
                  </div>
                )
              })}
              {listings.length === 0 && <div className="empty-state"><p>No listings found</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div style={s.content}>
          <div style={s.toolbar}>
            <input
              style={s.search}
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <div style={s.list}>
              {users.map((u: any) => (
                <div key={u._id} style={s.card}>
                  <div style={s.cardRow}>
                    <div style={s.avatar}>{u.name?.charAt(0).toUpperCase()}</div>
                    <div style={s.cardInfo}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
                        <span style={s.cardTitle}>{u.name}</span>
                        {u.role === 'admin'     && <span style={s.adminBadge}>Admin</span>}
                        {u.isVerifiedStudent    && <span style={s.verifiedBadge}>✓ Student</span>}
                        {u.isBlocked            && <span style={s.blockedBadge}>Blocked</span>}
                      </div>
                      <div style={s.cardMeta}>{u.email}</div>
                      <div style={s.cardMeta}>Joined {new Date(u.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button style={s.moreBtn} aria-label={`Actions for ${u.name}`} onClick={() => setActionSheet({ type: 'user', item: u })}>···</button>
                  </div>
                </div>
              ))}
              {users.length === 0 && <div className="empty-state"><p>No users found</p></div>}
            </div>
          )}
        </div>
      )}

      {/* ── ACTION SHEET ── */}
      {actionSheet && (
        <>
          <div style={s.overlay} onClick={() => setActionSheet(null)} />
          <div style={s.sheet}>
            <div style={s.sheetHandle} />

            {actionSheet.type === 'listing' && (() => {
              const l = actionSheet.item
              return (
                <>
                  <div style={s.sheetHeaderRow}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{l.title}</div>
                    <div style={{ fontSize: 13, color: '#9BA3C7', marginTop: 2 }}>{l.university}</div>
                  </div>
                  <div style={s.sheetDivider} />
                  <div style={s.sheetSectionLabel}>Change Status</div>
                  {(['active', 'pending', 'offMarket'] as const).map((st) => (
                    <button
                      key={st}
                      style={{ ...s.sheetItem, ...(l.status === st ? { background: `${STATUS_COLOR[st]}18` } : {}) }}
                      onClick={() => forceStatus(l._id, st)}
                    >
                      <span style={{ ...s.statusDot, background: STATUS_COLOR[st], width: 10, height: 10 }} />
                      <span style={{ flex: 1, textAlign: 'left' as const, color: l.status === st ? STATUS_COLOR[st] : '#F0F2FF' }}>
                        {STATUS_LABEL[st]}
                      </span>
                      {l.status === st && <span style={{ color: STATUS_COLOR[st] }}>✓</span>}
                    </button>
                  ))}
                  <div style={s.sheetDivider} />
                  <div style={s.sheetSectionLabel}>Boost — moves listing to top of results</div>
                  {!l.isBoosted ? (
                    <div style={s.boostRow}>
                      <span style={{ color: '#F0F2FF', fontSize: 14, whiteSpace: 'nowrap' as const }}>⚡ Boost for</span>
                      <select style={s.boostSelect} value={boostDays} onChange={(e) => setBoostDays(Number(e.target.value))}>
                        {[1, 3, 7, 14, 30].map((d) => <option key={d} value={d}>{d} day{d > 1 ? 's' : ''}</option>)}
                      </select>
                      <button style={s.boostBtn} onClick={() => boostListing(l._id)}>Apply</button>
                    </div>
                  ) : (
                    <button style={{ ...s.sheetItem, color: '#FF9500' }} onClick={() => unboostListing(l._id)}>
                      ⚡ Remove Boost
                    </button>
                  )}
                  <div style={s.sheetDivider} />
                  <button style={{ ...s.sheetItem, color: '#FF3B30' }} onClick={() => deleteListing(l._id)}>
                    🗑 Delete Listing
                  </button>
                  <button style={{ ...s.sheetItem, color: '#9BA3C7', justifyContent: 'center' }} onClick={() => setActionSheet(null)}>Cancel</button>
                </>
              )
            })()}

            {actionSheet.type === 'user' && (() => {
              const u = actionSheet.item
              return (
                <>
                  <div style={s.sheetHeaderRow}>
                    <div style={{ fontWeight: 700, fontSize: 16, color: '#F0F2FF' }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: '#9BA3C7', marginTop: 2 }}>{u.email}</div>
                  </div>
                  <div style={s.sheetDivider} />
                  <button style={s.sheetItem} onClick={() => verifyStudent(u)}>
                    {u.isVerifiedStudent ? '✕ Remove Student Verification' : '🎓 Verify as Student'}
                  </button>
                  <button style={s.sheetItem} onClick={() => toggleAdmin(u)}>
                    {u.role === 'admin' ? '⬇ Remove Admin Role' : '⬆ Promote to Admin'}
                  </button>
                  <button style={{ ...s.sheetItem, color: u.isBlocked ? '#34C759' : '#FFCC00' }} onClick={() => toggleBlock(u)}>
                    {u.isBlocked ? '✅ Unblock User' : '🚫 Block User'}
                  </button>
                  <div style={s.sheetDivider} />
                  <button style={{ ...s.sheetItem, color: '#FF3B30' }} onClick={() => deleteUser(u._id)}>
                    🗑 Delete Account
                  </button>
                  <button style={{ ...s.sheetItem, color: '#9BA3C7', justifyContent: 'center' }} onClick={() => setActionSheet(null)}>Cancel</button>
                </>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color, icon }: { label: string; value?: number; color: string; icon: string }) {
  return (
    <div style={{ background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <span style={{ fontSize: 24 }}>{icon}</span>
      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 28, color }}>{value ?? '—'}</span>
      <span style={{ fontSize: 13, color: '#9BA3C7', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{label}</span>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:            { padding: '0 0 100px' },
  header:          { padding: '16px 16px 0' },
  title:           { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 24, color: '#F0F2FF' },
  tabBar:          { display: 'flex', gap: 2, padding: '12px 16px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', overflowX: 'auto' },
  tab:             { padding: '8px 16px', borderRadius: '10px 10px 0 0', border: 'none', background: 'transparent', color: '#9BA3C7', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", whiteSpace: 'nowrap' },
  tabActive:       { background: '#1E2340', color: '#4ECDC4', borderBottom: '2px solid #4ECDC4' },
  content:         { padding: '16px' },
  statsGrid:       { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12, marginBottom: 24 },
  sectionTitle:    { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: '#F0F2FF' },
  actionGrid:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 },
  actionCard:      { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 14px', display: 'flex', flexDirection: 'column', gap: 6, cursor: 'pointer', textAlign: 'left' },
  actionLabel:     { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: '#F0F2FF' },
  actionSub:       { fontSize: 11, color: '#9BA3C7' },
  toolbar:         { display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  search:          { flex: 1, minWidth: 180, background: '#1E2340', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 16, padding: '10px 14px', outline: 'none', fontFamily: "'DM Sans', sans-serif" },
  filterSelect:    { background: '#1E2340', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#F0F2FF', fontSize: 14, padding: '10px 14px', outline: 'none' },
  list:            { display: 'flex', flexDirection: 'column', gap: 10 },
  card:            { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14 },
  cardRow:         { display: 'flex', alignItems: 'center', gap: 12, padding: '12px' },
  thumb:           { width: 68, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0 },
  avatar:          { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4ECDC4,#2C3E6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  cardInfo:        { flex: 1, minWidth: 0 },
  cardTitle:       { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 14, color: '#F0F2FF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  cardMeta:        { fontSize: 12, color: '#9BA3C7', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  statusDot:       { width: 7, height: 7, borderRadius: '50%', display: 'inline-block', flexShrink: 0 },
  boostBadge:      { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,149,0,0.15)', color: '#FF9500', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  adminBadge:      { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,230,109,0.15)', color: '#FFE66D', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  verifiedBadge:   { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(78,205,196,0.15)', color: '#4ECDC4', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  blockedBadge:    { fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(255,59,48,0.15)', color: '#FF3B30', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  moreBtn:         { background: 'none', border: 'none', color: '#9BA3C7', fontSize: 18, cursor: 'pointer', padding: '4px 8px', flexShrink: 0 },
  overlay:         { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1100, backdropFilter: 'blur(2px)' },
  sheet:           { position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1101, background: '#1E2340', borderRadius: '20px 20px 0 0', border: '1px solid rgba(255,255,255,0.1)', padding: '0 16px calc(env(safe-area-inset-bottom) + 24px)', maxHeight: '85vh', overflowY: 'auto', animation: 'slideUp 0.25s cubic-bezier(0.32,0.72,0,1)' },
  sheetHandle:     { width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)', margin: '12px auto 8px' },
  sheetHeaderRow:  { padding: '8px 0 14px' },
  sheetDivider:    { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
  sheetSectionLabel: { fontSize: 11, fontWeight: 700, color: '#9BA3C7', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '10px 0 6px' },
  sheetItem:       { display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 4px', background: 'none', border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 15, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif", textAlign: 'left' },
  boostRow:        { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px' },
  boostSelect:     { background: '#2A3055', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#F0F2FF', fontSize: 14, padding: '6px 10px', outline: 'none' },
  boostBtn:        { background: '#FF9500', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, padding: '7px 16px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif" },
}
