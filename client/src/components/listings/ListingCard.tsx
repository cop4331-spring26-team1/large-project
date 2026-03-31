import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { listingsApi } from '../../api'
import type { Listing } from '../../types'

interface Props {
  listing: Listing
  onFavoriteChange?: (id: string, isFavorited: boolean, count: number) => void
}

const STATUS_LABELS: Record<string, string> = {
  active:    'Active',
  pending:   'In Talks',
  offMarket: 'Off Market',
}

export default function ListingCard({ listing, onFavoriteChange }: Props) {
  const { user, isAuthenticated, updateUser } = useAuth()
  const [isFavorited, setIsFavorited] = useState(listing.isFavorited ?? false)
  const [favCount, setFavCount]       = useState(listing.favoriteCount)
  const [heartLoading, setHeartLoading] = useState(false)

  const isOwn   = listing.isOwnListing || String(listing.owner?._id) === String(user?._id)
  const isBoosted = listing.isBoosted || (listing.boostedUntil && new Date(listing.boostedUntil) > new Date())

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthenticated) { window.location.href = '/login'; return }
    if (isOwn || heartLoading) return

    setHeartLoading(true)
    try {
      const res  = await listingsApi.toggleFavorite(listing._id)
      const data = res.data.data
      setIsFavorited(data.isFavorited)
      setFavCount(data.favoriteCount)
      onFavoriteChange?.(listing._id, data.isFavorited, data.favoriteCount)

      // Update favorites array in user context for navbar count
      if (user) {
        const favs = data.isFavorited
          ? [...user.favorites, listing._id]
          : user.favorites.filter((id) => id !== listing._id)
        updateUser({ ...user, favorites: favs })
      }
    } catch (err) {
      console.error('Favorite failed', err)
    } finally {
      setHeartLoading(false)
    }
  }

  const statusClass =
    listing.status === 'active'    ? 'badge-active'
    : listing.status === 'pending' ? 'badge-pending'
    : 'badge-offmarket'

  return (
    <Link to={`/listings/${listing._id}`} style={{ textDecoration: 'none' }}>
      <div style={styles.card}>
        {/* Image */}
        <div style={styles.imageWrap}>
          <img
            src={listing.images[0] || '/placeholder.jpg'}
            alt={listing.title}
            style={styles.image}
            loading="lazy"
          />

          {/* Boosted ribbon */}
          {isBoosted && (
            <div style={styles.boostedRibbon}>⚡ Featured</div>
          )}

          {/* Status badge */}
          <div style={styles.statusBadge}>
            <span className={`badge ${statusClass}`}>
              {STATUS_LABELS[listing.status]}
            </span>
          </div>

          {/* Heart button — top right */}
          <button
            style={{
              ...styles.heartBtn,
              ...(isOwn ? styles.heartDisabled : {}),
            }}
            onClick={handleFavorite}
            disabled={isOwn || heartLoading}
            title={isOwn ? 'Your listing' : isFavorited ? 'Remove from favorites' : 'Save'}
            aria-label="Toggle favorite"
          >
            {isOwn ? (
              // Owner sees their favorite count instead
              <div style={styles.ownerFavCount}>
                <span style={{ color: '#FF6B6B', fontSize: 14 }}>♥</span>
                <span style={styles.ownerCount}>{favCount}</span>
              </div>
            ) : (
              <span style={{
                fontSize:   20,
                color:      isFavorited ? '#FF6B6B' : 'rgba(255,255,255,0.7)',
                transition: 'color 0.15s, transform 0.15s',
                display:    'block',
                transform:  heartLoading ? 'scale(0.85)' : isFavorited ? 'scale(1.1)' : 'scale(1)',
              }}>
                {isFavorited ? '♥' : '♡'}
              </span>
            )}
          </button>

          {/* Verified student badge */}
          {listing.owner?.isVerifiedStudent && (
            <div style={styles.verifiedBadge}>✓ Student</div>
          )}
        </div>

        {/* Info */}
        <div style={styles.info}>
          <div style={styles.priceRow}>
            <span style={styles.price}>${listing.price.toLocaleString()}</span>
            <span style={styles.priceSub}>/mo</span>
          </div>
          <h3 style={styles.title}>{listing.title}</h3>
          <p style={styles.location}>
            {listing.city}, {listing.state} · {listing.university}
          </p>
          <div style={styles.tags}>
            <span style={styles.tag}>
              {listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bed`}
            </span>
            {listing.utilitiesIncluded && (
              <span style={styles.tag}>Utilities incl.</span>
            )}
            {listing.petsAllowed && (
              <span style={styles.tag}>🐾 Pets ok</span>
            )}
            {listing.distanceToCampus != null && (
              <span style={styles.tag}>📍 {listing.distanceToCampus} mi</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background:    '#1E2340',
    border:        '1px solid rgba(255,255,255,0.07)',
    borderRadius:  18,
    overflow:      'hidden',
    transition:    'transform 0.2s, box-shadow 0.2s',
    cursor:        'pointer',
    height:        '100%',
    display:       'flex',
    flexDirection: 'column',
  },
  imageWrap: {
    position:   'relative',
    height:     200,
    overflow:   'hidden',
    background: '#252A4A',
    flexShrink: 0,
  },
  image: {
    width:      '100%',
    height:     '100%',
    objectFit:  'cover',
    transition: 'transform 0.3s',
  },
  boostedRibbon: {
    position:   'absolute',
    top:        12,
    left:       12,
    background: 'rgba(255,230,109,0.9)',
    color:      '#1B1F3B',
    fontSize:   11,
    fontWeight: 700,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    padding:    '3px 10px',
    borderRadius: 20,
  },
  statusBadge: {
    position: 'absolute',
    bottom:   12,
    left:     12,
  },
  heartBtn: {
    position:        'absolute',
    top:             10,
    right:           10,
    width:           38,
    height:          38,
    borderRadius:    '50%',
    background:      'rgba(27,31,59,0.75)',
    backdropFilter:  'blur(8px)',
    border:          '1px solid rgba(255,255,255,0.12)',
    cursor:          'pointer',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    transition:      'background 0.15s',
  },
  heartDisabled: {
    cursor: 'default',
    width:  'auto',
    height: 'auto',
    padding: '4px 10px',
    borderRadius: 20,
  },
  ownerFavCount: {
    display:    'flex',
    alignItems: 'center',
    gap:        4,
  },
  ownerCount: {
    fontSize:   12,
    fontWeight: 700,
    color:      '#F0F2FF',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  verifiedBadge: {
    position:   'absolute',
    bottom:     12,
    right:      12,
    fontSize:   11,
    fontWeight: 600,
    color:      '#4ECDC4',
    background: 'rgba(27,31,59,0.8)',
    padding:    '3px 8px',
    borderRadius: 20,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  },
  info: {
    padding: '16px',
    flex:    1,
    display: 'flex',
    flexDirection: 'column',
    gap:     6,
  },
  priceRow: {
    display:    'flex',
    alignItems: 'baseline',
    gap:        3,
  },
  price: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontWeight: 800,
    fontSize:   22,
    color:      '#4ECDC4',
  },
  priceSub: {
    fontSize: 13,
    color:    '#9BA3C7',
  },
  title: {
    fontSize:     15,
    fontWeight:   600,
    color:        '#F0F2FF',
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
    lineHeight:   1.3,
    overflow:     'hidden',
    display:      '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  location: {
    fontSize: 12,
    color:    '#9BA3C7',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  tags: {
    display:   'flex',
    flexWrap:  'wrap',
    gap:       6,
    marginTop: 4,
  },
  tag: {
    fontSize:     11,
    fontWeight:   500,
    color:        '#9BA3C7',
    background:   'rgba(255,255,255,0.06)',
    borderRadius: 6,
    padding:      '3px 8px',
  },
}
