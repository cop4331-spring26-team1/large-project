import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { listingsApi, chatApi } from '../api'
import { useAuth } from '../context/AuthContext'
import type { Listing } from '../types'

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active:    { label: 'Active',      color: '#4ECDC4' },
  pending:   { label: 'In Talks',    color: '#FFE66D' },
  offMarket: { label: 'Off Market',  color: '#FF6B6B' },
}

export default function ListingDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const { user, isAuthenticated, updateUser } = useAuth()
  const navigate     = useNavigate()

  const [listing, setListing]     = useState<Listing | null>(null)
  const [loading, setLoading]     = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [isFavorited, setFav]     = useState(false)
  const [favCount, setFavCount]   = useState(0)
  const [contacting, setContacting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    listingsApi.getById(id)
      .then((res) => {
        const l = res.data.data
        setListing(l)
        setFav(l.isFavorited ?? false)
        setFavCount(l.favoriteCount)
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFavorite = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (listing?.isOwnListing) return
    try {
      const res  = await listingsApi.toggleFavorite(listing!._id)
      const data = res.data.data
      setFav(data.isFavorited)
      setFavCount(data.favoriteCount)
      if (user) {
        const favs = data.isFavorited
          ? [...user.favorites, listing!._id]
          : user.favorites.filter((f) => f !== listing!._id)
        updateUser({ ...user, favorites: favs })
      }
    } catch {}
  }

  const handleContact = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setContacting(true)
    try {
      const res = await chatApi.createThread(listing!._id)
      navigate(`/chat/${res.data.data.thread._id}`)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Could not start conversation')
    } finally { setContacting(false) }
  }

  const handleStatusChange = async (status: string) => {
    setStatusLoading(true)
    try {
      await listingsApi.updateStatus(listing!._id, status as any)
      setListing((prev) => prev ? { ...prev, status: status as any } : prev)
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status')
    } finally { setStatusLoading(false) }
  }

  if (loading) return <div className="loading-center"><div className="spinner" /></div>
  if (!listing) return null

  const statusInfo = STATUS_MAP[listing.status]
  const isOwn = listing.isOwnListing

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 960 }}>
        {/* Breadcrumb */}
        <div style={styles.crumb}>
          <Link to="/" style={{ color: '#9BA3C7' }}>Browse</Link>
          <span style={{ color: '#5C6490' }}> / </span>
          <span style={{ color: '#F0F2FF' }}>{listing.title}</span>
        </div>

        <div style={styles.layout}>
          {/* Left — images + info */}
          <div style={styles.left}>
            {/* Main image */}
            <div style={styles.mainImgWrap}>
              <img src={listing.images[activeImg]} alt={listing.title} style={styles.mainImg} />
              {/* Status banner for off market */}
              {listing.status === 'offMarket' && (
                <div style={styles.offMarketBanner}>
                  🔴 This listing is no longer available
                </div>
              )}
              {listing.status === 'pending' && (
                <div style={styles.pendingBanner}>
                  ⏳ Lister is currently in talks with someone
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {listing.images.length > 1 && (
              <div style={styles.thumbs}>
                {listing.images.map((img, i) => (
                  <button
                    key={i}
                    style={{ ...styles.thumb, ...(i === activeImg ? styles.thumbActive : {}) }}
                    onClick={() => setActiveImg(i)}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}

            {/* Details */}
            <div style={styles.section}>
              <div style={styles.priceRow}>
                <span style={styles.price}>${listing.price.toLocaleString()}</span>
                <span style={{ color: '#9BA3C7', fontSize: 16 }}>/month</span>
                <span style={{ ...styles.statusPill, background: `${statusInfo.color}22`, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              </div>
              <h1 style={styles.title}>{listing.title}</h1>
              <p style={styles.location}>
                📍 {listing.address}, {listing.city}, {listing.state}
              </p>
              <p style={{ color: '#9BA3C7', fontSize: 14 }}>
                🏫 {listing.university}
                {listing.distanceToCampus != null && ` · ${listing.distanceToCampus} miles to campus`}
              </p>
            </div>

            <hr className="divider" />

            {/* Tags */}
            <div style={styles.tagsRow}>
              <div style={styles.tagItem}>
                <span style={styles.tagIcon}>🛏</span>
                <div>
                  <div style={styles.tagLabel}>Bedrooms</div>
                  <div style={styles.tagVal}>{listing.bedrooms === 0 ? 'Studio' : listing.bedrooms}</div>
                </div>
              </div>
              <div style={styles.tagItem}>
                <span style={styles.tagIcon}>{listing.utilitiesIncluded ? '✅' : '❌'}</span>
                <div>
                  <div style={styles.tagLabel}>Utilities</div>
                  <div style={styles.tagVal}>{listing.utilitiesIncluded ? 'Included' : 'Not included'}</div>
                </div>
              </div>
              <div style={styles.tagItem}>
                <span style={styles.tagIcon}>{listing.petsAllowed ? '🐾' : '🚫'}</span>
                <div>
                  <div style={styles.tagLabel}>Pets</div>
                  <div style={styles.tagVal}>{listing.petsAllowed ? 'Allowed' : 'Not allowed'}</div>
                </div>
              </div>
            </div>

            <hr className="divider" />

            {/* Description */}
            {listing.description && (
              <div style={styles.section}>
                <h3 style={styles.sectionTitle}>About this place</h3>
                <p style={{ color: '#9BA3C7', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                  {listing.description}
                </p>
              </div>
            )}
          </div>

          {/* Right — sidebar */}
          <div style={styles.sidebar}>
            {/* Lister info */}
            <div style={styles.sideCard}>
              <div style={styles.sideCardTitle}>Listed by</div>
              <div style={styles.listerRow}>
                <div style={styles.avatar}>
                  {listing.owner.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: '#F0F2FF' }}>{listing.owner.name}</div>
                  {listing.owner.isVerifiedStudent && (
                    <div style={{ fontSize: 12, color: '#4ECDC4' }}>✓ Verified Student</div>
                  )}
                </div>
              </div>

              {/* Favorite count visible to owner */}
              {isOwn && (
                <div style={styles.ownerFavRow}>
                  <span style={{ color: '#FF6B6B' }}>♥</span>
                  <span style={{ color: '#9BA3C7', fontSize: 14 }}>{favCount} people saved this</span>
                </div>
              )}

              {/* Actions */}
              {!isOwn && listing.status !== 'offMarket' && (
                <>
                  <button
                    style={{
                      ...styles.heartSideBtn,
                      background: isFavorited ? 'rgba(255,107,107,0.15)' : 'rgba(255,255,255,0.05)',
                      borderColor: isFavorited ? 'rgba(255,107,107,0.4)' : 'rgba(255,255,255,0.1)',
                      color: isFavorited ? '#FF6B6B' : '#9BA3C7',
                    }}
                    onClick={handleFavorite}
                  >
                    {isFavorited ? '♥ Saved' : '♡ Save'} · {favCount}
                  </button>
                  <button
                    className="btn btn-primary btn-full"
                    onClick={handleContact}
                    disabled={contacting}
                    style={{ marginTop: 10 }}
                  >
                    {contacting ? 'Opening chat...' : '💬 Contact Lister'}
                  </button>
                </>
              )}

              {/* Owner controls */}
              {isOwn && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  <Link to={`/listings/${listing._id}/edit`} className="btn btn-outline btn-full">
                    ✏️ Edit Listing
                  </Link>
                  {listing.status === 'active' && (
                    <button
                      className="btn btn-ghost btn-full"
                      onClick={() => handleStatusChange('pending')}
                      disabled={statusLoading}
                    >
                      ⏳ Mark as Pending
                    </button>
                  )}
                  {listing.status === 'pending' && (
                    <button
                      className="btn btn-ghost btn-full"
                      onClick={() => handleStatusChange('active')}
                      disabled={statusLoading}
                    >
                      ✅ Mark as Active
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Expiry info */}
            <div style={styles.expiryCard}>
              <div style={{ fontSize: 12, color: '#5C6490' }}>
                Listed {new Date(listing.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 12, color: '#5C6490', marginTop: 2 }}>
                Expires {new Date(listing.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  crumb:          { fontSize: 14, marginBottom: 20, color: '#9BA3C7' },
  layout:         { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' },
  left:           {},
  mainImgWrap:    { position: 'relative', borderRadius: 18, overflow: 'hidden', height: 420, background: '#1E2340' },
  mainImg:        { width: '100%', height: '100%', objectFit: 'cover' },
  offMarketBanner:{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,107,107,0.9)', color: '#fff', textAlign: 'center', padding: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
  pendingBanner:  { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(255,230,109,0.9)', color: '#1B1F3B', textAlign: 'center', padding: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
  thumbs:         { display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' },
  thumb:          { width: 72, height: 54, borderRadius: 8, overflow: 'hidden', border: '2px solid transparent', cursor: 'pointer', padding: 0 },
  thumbActive:    { borderColor: '#4ECDC4' },
  section:        { padding: '20px 0' },
  priceRow:       { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  price:          { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 32, color: '#4ECDC4' },
  statusPill:     { fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, fontFamily: "'Plus Jakarta Sans', sans-serif" },
  title:          { fontSize: 24, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, marginBottom: 8 },
  location:       { color: '#9BA3C7', fontSize: 15, marginBottom: 4 },
  tagsRow:        { display: 'flex', gap: 24, padding: '8px 0' },
  tagItem:        { display: 'flex', alignItems: 'center', gap: 10 },
  tagIcon:        { fontSize: 24 },
  tagLabel:       { fontSize: 11, color: '#9BA3C7', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tagVal:         { fontSize: 15, fontWeight: 600, color: '#F0F2FF', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  sectionTitle:   { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, marginBottom: 12 },
  sidebar:        { display: 'flex', flexDirection: 'column', gap: 12, position: 'sticky', top: 80 },
  sideCard:       { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20 },
  sideCardTitle:  { fontSize: 12, color: '#9BA3C7', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 },
  listerRow:      { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar:         { width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#4ECDC4,#2C3E6B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", flexShrink: 0 },
  ownerFavRow:    { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 14 },
  heartSideBtn:   { width: '100%', padding: '10px', borderRadius: 10, border: '1px solid', cursor: 'pointer', fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, transition: 'all 0.15s' },
  expiryCard:     { background: '#1E2340', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 16px' },
}
