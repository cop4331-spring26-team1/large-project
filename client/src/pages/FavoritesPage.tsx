import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { listingsApi } from '../api'
import { useAuth } from '../context/AuthContext'
import ListingCard from '../components/listings/ListingCard'
import type { Listing } from '../types'

export default function FavoritesPage() {
  const { user } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!user?.favorites?.length) { setLoading(false); return }
    // Fetch each favorited listing
    Promise.all(user.favorites.map((id) => listingsApi.getById(id).then((r) => r.data.data).catch(() => null)))
      .then((results) => setListings(results.filter(Boolean) as Listing[]))
      .finally(() => setLoading(false))
  }, [])

  const handleFavoriteChange = (id: string, isFav: boolean) => {
    if (!isFav) setListings((prev) => prev.filter((l) => l._id !== id))
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>

  return (
    <div className="page">
      <div className="container">
        <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, marginBottom: 8 }}>Saved Homes</h1>
        <p style={{ color: '#9BA3C7', marginBottom: 32 }}>
          {listings.length} saved listing{listings.length !== 1 ? 's' : ''}
        </p>
        {listings.length === 0 ? (
          <div className="empty-state">
            <h3>No saved listings</h3>
            <p>Heart any listing to save it here for later.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 20 }}>Browse Listings</Link>
          </div>
        ) : (
          <div className="listings-grid">
            {listings.map((l) => (
              <ListingCard
                key={l._id}
                listing={{ ...l, isFavorited: true }}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
