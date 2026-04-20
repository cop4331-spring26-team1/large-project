import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { listingsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/listings/ListingCard'
import SearchBar   from '../components/listings/SearchBar'
import MapView     from '../components/map/MapView'
import type { Listing, ListingFilters } from '../types'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const [listings, setListings]   = useState<Listing[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'grid' | 'map'>('grid')
  const [filters, setFilters]     = useState<ListingFilters>({ page: 1 })
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, page: 1 })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await listingsApi.getAll(filters)
      const data = res.data.data
      setListings(data.listings)
      setPagination(data.pagination)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchListings() }, [fetchListings])

  const handleFavoriteChange = (id: string, isFavorited: boolean, count: number) => {
    setListings((prev) =>
      prev.map((l) => l._id === id ? { ...l, isFavorited, favoriteCount: count } : l)
    )
  }

  const handleFilterChange = (f: ListingFilters) => {
    setFilters({ ...f, page: 1 })
  }

  const handlePage = (p: number) => {
    setFilters((prev) => ({ ...prev, page: p }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="page">
      <div className="container">
        {/* Hero */}
        <div style={styles.hero}>
          <h1 style={styles.heroTitle}>
            Find your perfect<br />
            <span style={{ color: '#4ECDC4' }}>campus home</span>
          </h1>
          <p style={styles.heroSub}>
            Student rentals near every university — browse, save, and connect with listers directly.
          </p>
          {!isAuthenticated && (
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
              <Link to="/login" className="btn btn-ghost btn-lg">Sign In</Link>
            </div>
          )}
        </div>

        {/* Search */}
        <SearchBar filters={filters} onChange={handleFilterChange} />

        {/* View toggle + count */}
        <div style={styles.toolbar}>
          <p style={styles.resultCount}>
            {loading ? 'Searching...' : `${pagination.total} listings found`}
          </p>
          <div style={styles.viewToggle}>
            <button
              style={{ ...styles.toggleBtn, ...(view === 'grid' ? styles.toggleActive : {}) }}
              onClick={() => setView('grid')}
            >
              ☰ List
            </button>
            <button
              style={{ ...styles.toggleBtn, ...(view === 'map' ? styles.toggleActive : {}) }}
              onClick={() => setView('map')}
            >
              🗺 Map
            </button>
          </div>
        </div>

        {/* Content */}
        {view === 'map' ? (
          <MapView filters={filters} />
        ) : loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : listings.length === 0 ? (
          <div className="empty-state">
            <h3>No listings found</h3>
            <p>Try adjusting your filters or search for a different university.</p>
          </div>
        ) : (
          <>
            <div className="listings-grid">
              {listings.map((listing) => (
                <ListingCard
                  key={listing._id}
                  listing={listing}
                  onFavoriteChange={handleFavoriteChange}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={styles.pagination}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    style={{
                      ...styles.pageBtn,
                      ...(p === pagination.page ? styles.pageBtnActive : {}),
                    }}
                    onClick={() => handlePage(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  hero: {
    textAlign: 'center',
    padding:   '48px 0 40px',
  },
  heroTitle: {
    fontSize:   48,
    fontWeight: 800,
    lineHeight: 1.15,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  heroSub: {
    fontSize:  18,
    color:     '#9BA3C7',
    marginTop: 14,
    maxWidth:  520,
    margin:    '14px auto 0',
  },
  toolbar: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   20,
  },
  resultCount: {
    fontSize: 14,
    color:    '#9BA3C7',
  },
  viewToggle: {
    display:      'flex',
    background:   '#1E2340',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding:      3,
    gap:          2,
  },
  toggleBtn: {
    background:   'transparent',
    border:       'none',
    borderRadius: 8,
    padding:      '7px 16px',
    fontSize:     13,
    fontWeight:   600,
    color:        '#9BA3C7',
    cursor:       'pointer',
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
    transition:   'all 0.15s',
  },
  toggleActive: {
    background: '#4ECDC4',
    color:      '#1B1F3B',
  },
  pagination: {
    display:        'flex',
    justifyContent: 'center',
    gap:            8,
    marginTop:      40,
  },
  pageBtn: {
    width:        38,
    height:       38,
    borderRadius: 10,
    border:       '1px solid rgba(255,255,255,0.1)',
    background:   'transparent',
    color:        '#9BA3C7',
    fontSize:     14,
    fontWeight:   600,
    cursor:       'pointer',
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
  },
  pageBtnActive: {
    background:  '#4ECDC4',
    borderColor: '#4ECDC4',
    color:       '#1B1F3B',
  },
}
