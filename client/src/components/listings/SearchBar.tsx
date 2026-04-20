import { useState, useEffect, useRef } from 'react'
import { universitiesApi } from '../../api'
import type { ListingFilters, University } from '../../types'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY',
]

interface Props {
  filters: ListingFilters
  onChange: (f: ListingFilters) => void
}

export default function SearchBar({ filters, onChange }: Props) {
  const [uniQuery, setUniQuery]       = useState(filters.university || '')
  const [uniSuggestions, setSuggestions] = useState<University[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced university autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (uniQuery.length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await universitiesApi.search(uniQuery, filters.state)
        setSuggestions(res.data.data.universities)
        setShowSuggestions(true)
      } catch { setSuggestions([]) }
    }, 300)
  }, [uniQuery, filters.state])

  const selectUniversity = (uni: University) => {
    setUniQuery(uni.name)
    setSuggestions([])
    setShowSuggestions(false)
    onChange({ ...filters, university: uni.name, city: uni.city, state: uni.state })
  }

  const handleChange = (key: keyof ListingFilters, value: string) => {
    onChange({ ...filters, [key]: value || undefined, page: 1 })
  }

  const clearAll = () => {
    setUniQuery('')
    onChange({ page: 1 })
  }

  const hasFilters = Object.keys(filters).some(
    (k) => k !== 'page' && filters[k as keyof ListingFilters]
  )

  return (
    <div style={styles.wrap}>
      {/* Main search row */}
      <div style={styles.mainRow}>
        {/* University autocomplete */}
        <div style={{ position: 'relative', flex: 2 }}>
          <input
            style={styles.input}
            placeholder="Search university..."
            value={uniQuery}
            onChange={(e) => setUniQuery(e.target.value)}
            onFocus={() => uniSuggestions.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && uniSuggestions.length > 0 && (
            <div style={styles.suggestions}>
              {uniSuggestions.map((uni) => (
                <button
                  key={uni._id}
                  style={styles.suggestion}
                  onClick={() => selectUniversity(uni)}
                >
                  <span style={{ fontWeight: 600, color: '#F0F2FF' }}>{uni.name}</span>
                  <span style={{ fontSize: 12, color: '#9BA3C7' }}>{uni.city}, {uni.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* State */}
        <select
          style={{ ...styles.input, flex: 1 }}
          value={filters.state || ''}
          onChange={(e) => handleChange('state', e.target.value)}
        >
          <option value="">All States</option>
          {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Sort */}
        <select
          style={{ ...styles.input, flex: 1 }}
          value={filters.sortBy || 'newest'}
          onChange={(e) => handleChange('sortBy', e.target.value)}
        >
          <option value="newest">Newest first</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
          <option value="distance_asc">Closest to campus</option>
        </select>

        {/* Filter toggle */}
        <button
          style={{ ...styles.filterToggle, ...(showFilters ? styles.filterToggleActive : {}) }}
          onClick={() => setShowFilters(!showFilters)}
        >
          ⚙ Filters {hasFilters && <span style={styles.filterDot} />}
        </button>

        {hasFilters && (
          <button style={styles.clearBtn} onClick={clearAll}>✕ Clear</button>
        )}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div style={styles.filtersRow}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Bedrooms</label>
            <select style={styles.filterSelect} value={filters.bedrooms || ''} onChange={(e) => handleChange('bedrooms', e.target.value)}>
              <option value="">Any</option>
              <option value="0">Studio</option>
              <option value="1">1 bed</option>
              <option value="2">2 beds</option>
              <option value="3">3+ beds</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Min Price</label>
            <input style={styles.filterSelect} type="number" placeholder="$0" value={filters.minPrice || ''} onChange={(e) => handleChange('minPrice', e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Max Price</label>
            <input style={styles.filterSelect} type="number" placeholder="No limit" value={filters.maxPrice || ''} onChange={(e) => handleChange('maxPrice', e.target.value)} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Pets</label>
            <select style={styles.filterSelect} value={filters.petsAllowed || ''} onChange={(e) => handleChange('petsAllowed', e.target.value)}>
              <option value="">Any</option>
              <option value="true">Pets allowed</option>
              <option value="false">No pets</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Utilities</label>
            <select style={styles.filterSelect} value={filters.utilitiesIncluded || ''} onChange={(e) => handleChange('utilitiesIncluded', e.target.value)}>
              <option value="">Any</option>
              <option value="true">Included</option>
              <option value="false">Not included</option>
            </select>
          </div>
        </div>
      )}

      {/* Click outside to close suggestions */}
      {showSuggestions && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowSuggestions(false)} />
      )}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    background:   '#1E2340',
    border:       '1px solid rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding:      '16px',
    marginBottom: 24,
    display:      'flex',
    flexDirection: 'column',
    gap:          12,
  },
  mainRow: {
    display:    'flex',
    gap:        10,
    alignItems: 'center',
    flexWrap:   'wrap',
  },
  input: {
    background:   '#2A3055',
    border:       '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color:        '#F0F2FF',
    fontSize:     14,
    padding:      '10px 14px',
    outline:      'none',
    fontFamily:   "'DM Sans', sans-serif",
    minWidth:     140,
    appearance:   'none' as const,
  },
  suggestions: {
    position:      'absolute',
    top:           'calc(100% + 4px)',
    left:          0,
    right:         0,
    background:    '#252A4A',
    border:        '1px solid rgba(255,255,255,0.1)',
    borderRadius:  12,
    boxShadow:     '0 8px 24px rgba(0,0,0,0.4)',
    zIndex:        10,
    overflow:      'hidden',
    maxHeight:     260,
    overflowY:     'auto',
  },
  suggestion: {
    display:       'flex',
    flexDirection: 'column',
    gap:           2,
    width:         '100%',
    padding:       '10px 14px',
    background:    'none',
    border:        'none',
    cursor:        'pointer',
    textAlign:     'left',
    transition:    'background 0.12s',
    fontSize:      14,
    fontFamily:    "'DM Sans', sans-serif",
    borderBottom:  '1px solid rgba(255,255,255,0.05)',
  },
  filterToggle: {
    display:      'flex',
    alignItems:   'center',
    gap:          6,
    background:   'rgba(255,255,255,0.05)',
    border:       '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    color:        '#9BA3C7',
    fontSize:     14,
    fontFamily:   "'Plus Jakarta Sans', sans-serif",
    fontWeight:   600,
    padding:      '10px 16px',
    cursor:       'pointer',
    position:     'relative',
    whiteSpace:   'nowrap',
  },
  filterToggleActive: {
    borderColor: 'rgba(78,205,196,0.4)',
    color:       '#4ECDC4',
    background:  'rgba(78,205,196,0.08)',
  },
  filterDot: {
    width:        7,
    height:       7,
    borderRadius: '50%',
    background:   '#4ECDC4',
    display:      'inline-block',
  },
  clearBtn: {
    background:   'transparent',
    border:       'none',
    color:        '#9BA3C7',
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   "'DM Sans', sans-serif",
    padding:      '4px 8px',
    whiteSpace:   'nowrap',
  },
  filtersRow: {
    display:    'flex',
    gap:        12,
    flexWrap:   'wrap',
    paddingTop: 8,
    borderTop:  '1px solid rgba(255,255,255,0.06)',
  },
  filterGroup: {
    display:       'flex',
    flexDirection: 'column',
    gap:           4,
    minWidth:      120,
  },
  filterLabel: {
    fontSize:   11,
    fontWeight: 600,
    color:      '#9BA3C7',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  filterSelect: {
    background:   '#2A3055',
    border:       '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
    color:        '#F0F2FF',
    fontSize:     13,
    padding:      '7px 10px',
    outline:      'none',
    fontFamily:   "'DM Sans', sans-serif",
  },
}
