import { useState, useEffect, useRef } from 'react'
import { universitiesApi } from '../../api'
import type { ListingFilters, University } from '../../types'

const IconSchool  = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
const IconTune    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
const IconClose   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>


interface Props {
  filters: ListingFilters
  onChange: (f: ListingFilters) => void
}

export default function SearchBar({ filters, onChange }: Props) {
  const [uniQuery, setUniQuery]       = useState(filters.university || '')
  const [uniSuggestions, setSuggestions] = useState<University[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile]       = useState(window.innerWidth < 768)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

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

  const activeFilterCount = [
    filters.bedrooms, filters.minPrice, filters.maxPrice,
    filters.petsAllowed, filters.utilitiesIncluded, filters.state, filters.sortBy && filters.sortBy !== 'newest' ? filters.sortBy : undefined
  ].filter(Boolean).length

  if (isMobile) {
    return (
      <div style={mobStyles.wrap}>
        {/* University search row */}
        <div style={mobStyles.row}>
          <div style={mobStyles.searchBox}>
            <span style={{ color: '#9BA3C7', display: 'flex', flexShrink: 0 }}><IconSchool /></span>
            <input
              style={mobStyles.searchInput}
              placeholder="Search by university..."
              value={uniQuery}
              onChange={(e) => setUniQuery(e.target.value)}
              onFocus={() => uniSuggestions.length > 0 && setShowSuggestions(true)}
            />
            {uniQuery && (
              <button
                style={mobStyles.clearX}
                aria-label="Clear search"
                onPointerDown={(e) => { e.preventDefault(); setUniQuery(''); setSuggestions([]); clearAll(); }}
              >
                <IconClose />
              </button>
            )}
          </div>
          <button
            style={{ ...mobStyles.filterBtn, ...(showFilters || activeFilterCount > 0 ? mobStyles.filterBtnActive : {}) }}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
            onClick={() => setShowFilters(!showFilters)}
          >
            <IconTune />
            {activeFilterCount > 0 && (
              <span style={mobStyles.filterCount}>{activeFilterCount}</span>
            )}
          </button>
        </div>

        {/* University suggestions */}
        {showSuggestions && uniSuggestions.length > 0 && (
          <div style={mobStyles.suggestions}>
            {uniSuggestions.map((uni) => (
              <button key={uni._id} style={mobStyles.suggestion} onClick={() => selectUniversity(uni)}>
                <span style={{ color: '#4ECDC4', display: 'flex', flexShrink: 0 }}><IconSchool /></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, color: '#F0F2FF', fontSize: 14 }}>{uni.name}</span>
                  <span style={{ fontSize: 12, color: '#9BA3C7' }}>{uni.city}, {uni.state}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected university chip */}
        {filters.university && !showSuggestions && (
          <div style={mobStyles.chip}>
            <span style={{ fontSize: 12 }}>📍</span>
            <span style={mobStyles.chipText}>{filters.city}, {filters.state}</span>
          </div>
        )}

        {/* Filter panel */}
        {showFilters && (
          <div style={mobStyles.filterPanel}>
            <div style={mobStyles.filterGrid}>
              <div style={mobStyles.filterGroup}>
                <label style={mobStyles.filterLabel}>Bedrooms</label>
                <select style={mobStyles.filterSelect} value={filters.bedrooms || ''} onChange={(e) => handleChange('bedrooms', e.target.value)}>
                  <option value="">Any</option>
                  <option value="0">Studio</option>
                  <option value="1">1 bed</option>
                  <option value="2">2 beds</option>
                  <option value="3">3+ beds</option>
                </select>
              </div>
              <div style={mobStyles.filterGroup}>
                <label style={mobStyles.filterLabel}>Min Price</label>
                <input style={mobStyles.filterSelect} type="number" placeholder="$0" value={filters.minPrice || ''} onChange={(e) => handleChange('minPrice', e.target.value)} />
              </div>
              <div style={mobStyles.filterGroup}>
                <label style={mobStyles.filterLabel}>Max Price</label>
                <input style={mobStyles.filterSelect} type="number" placeholder="No limit" value={filters.maxPrice || ''} onChange={(e) => handleChange('maxPrice', e.target.value)} />
              </div>
              <div style={mobStyles.filterGroup}>
                <label style={mobStyles.filterLabel}>Pets</label>
                <select style={mobStyles.filterSelect} value={filters.petsAllowed || ''} onChange={(e) => handleChange('petsAllowed', e.target.value)}>
                  <option value="">Any</option>
                  <option value="true">Allowed</option>
                  <option value="false">No pets</option>
                </select>
              </div>
              <div style={mobStyles.filterGroup}>
                <label style={mobStyles.filterLabel}>Utilities</label>
                <select style={mobStyles.filterSelect} value={filters.utilitiesIncluded || ''} onChange={(e) => handleChange('utilitiesIncluded', e.target.value)}>
                  <option value="">Any</option>
                  <option value="true">Included</option>
                  <option value="false">Not incl.</option>
                </select>
              </div>
            </div>
            {hasFilters && (
              <button style={mobStyles.clearAllBtn} onClick={clearAll}>Clear all filters</button>
            )}
          </div>
        )}

        {showSuggestions && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9 }} onClick={() => setShowSuggestions(false)} />
        )}
      </div>
    )
  }

  return (
    <div style={styles.wrap}>
      {/* Main search row */}
      <div style={styles.mainRow}>
        {/* University autocomplete */}
        <div style={{ position: 'relative', flex: 2, display: 'flex', alignItems: 'center' }}>
          <input
            style={{ ...styles.input, width: '100%', paddingRight: uniQuery ? 32 : 14 }}
            placeholder="Search university..."
            value={uniQuery}
            onChange={(e) => setUniQuery(e.target.value)}
            onFocus={() => uniSuggestions.length > 0 && setShowSuggestions(true)}
          />
          {uniQuery && (
            <button
              style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#9BA3C7', display: 'flex', alignItems: 'center', padding: 0 }}
              aria-label="Clear search"
              onPointerDown={(e) => { e.preventDefault(); setUniQuery(''); setSuggestions([]); clearAll(); }}
            >
              <IconClose />
            </button>
          )}
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

        {/* Filter toggle */}
        <button
          style={{ ...styles.filterToggle, ...(showFilters ? styles.filterToggleActive : {}) }}
          aria-label={showFilters ? 'Hide filters' : 'Show filters'}
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

// ── Mobile styles ─────────────────────────────────────────────────────────────
const mobStyles: Record<string, React.CSSProperties> = {
  wrap:         { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 },
  row:          { display: 'flex', gap: 8, alignItems: 'center', position: 'relative', zIndex: 11 },
  searchBox:    { flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: '#2A3055', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '0 12px', height: 44 },
  searchInput:  { flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F0F2FF', fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  clearX:       { background: 'none', border: 'none', cursor: 'pointer', color: '#9BA3C7', display: 'flex', alignItems: 'center', padding: 0, flexShrink: 0 },
  filterBtn:    { width: 44, height: 44, borderRadius: 12, background: '#2A3055', border: '1.5px solid rgba(255,255,255,0.08)', color: '#9BA3C7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' },
  filterBtnActive: { borderColor: 'rgba(78,205,196,0.5)', color: '#4ECDC4', background: 'rgba(78,205,196,0.08)' },
  filterCount:  { position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#4ECDC4', color: '#1B1F3B', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  suggestions:  { background: '#252A4A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, overflow: 'hidden', zIndex: 10 },
  suggestion:   { display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '12px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif" },
  chip:         { display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(78,205,196,0.12)', border: '1px solid rgba(78,205,196,0.3)', borderRadius: 20, padding: '4px 10px', alignSelf: 'flex-start' },
  chipText:     { fontSize: 12, fontWeight: 600, color: '#4ECDC4', fontFamily: "'Plus Jakarta Sans', sans-serif" },
  filterPanel:  { background: '#1E2340', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 12 },
  filterGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  filterGroup:  { display: 'flex', flexDirection: 'column', gap: 4 },
  filterLabel:  { fontSize: 11, fontWeight: 600, color: '#9BA3C7', fontFamily: "'Plus Jakarta Sans', sans-serif", textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  filterSelect: { background: '#2A3055', border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#F0F2FF', fontSize: 13, padding: '8px 10px', outline: 'none', fontFamily: "'DM Sans', sans-serif", appearance: 'none' as const },
  clearAllBtn:  { background: 'none', border: '1px solid rgba(255,107,107,0.3)', borderRadius: 8, color: '#FF6B6B', fontSize: 13, padding: '8px', cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 },
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
