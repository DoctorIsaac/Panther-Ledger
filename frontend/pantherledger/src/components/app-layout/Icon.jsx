const Icon = ({ name, size = 18 }) => {
  const s = { width: size, height: size }
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'grid':          return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    case 'dollar':        return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
    case 'users':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
    case 'card':          return <svg style={s} viewBox="0 0 24 24" {...base}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    case 'activity':      return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
    case 'bell':          return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'search':        return <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    case 'send':          return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
    case 'box':           return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
    case 'heart':         return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    case 'bag':           return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    case 'trending':      return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
    case 'arrow-right':   return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    case 'chat':          return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'logout':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    case 'upload':        return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
    case 'file':          return <svg style={s} viewBox="0 0 24 24" {...base}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg>
    case 'trash':         return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
    case 'check':         return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="20 6 9 17 4 12"/></svg>
    case 'plus':          return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
    case 'chevron-down':  return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="6 9 12 15 18 9"/></svg>
    case 'chevron-left':  return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="15 18 9 12 15 6"/></svg>
    case 'chevron-right': return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="9 18 15 12 9 6"/></svg>
    case 'x':             return <svg style={s} viewBox="0 0 24 24" {...base}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    case 'repeat':        return <svg style={s} viewBox="0 0 24 24" {...base}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
    default:              return null
  }
}

export default Icon
