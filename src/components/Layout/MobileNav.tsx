import { LayoutGrid, Map as MapIcon, List, BarChart2, Info } from 'lucide-react';

const ITEMS = [
  { href: '#overview', label: 'Overview', Icon: LayoutGrid },
  { href: '#live-map', label: 'Map', Icon: MapIcon },
  { href: '#earthquakes', label: 'Quakes', Icon: List },
  { href: '#analytics', label: 'Stats', Icon: BarChart2 },
  { href: '#about', label: 'About', Icon: Info },
];

/** Thumb-friendly bottom navigation for phones. Labels always accompany icons. */
export default function MobileNav() {
  return (
    <nav className="bottom-nav" aria-label="Section navigation" style={{ gap: 4 }}>
      {ITEMS.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            color: 'var(--mica)', textDecoration: 'none',
            fontSize: 'var(--text-xs)', fontWeight: 600, padding: '8px 4px',
            borderRadius: 'var(--radius-instrument)',
            transition: 'color 0.12s ease, background 0.12s ease',
          }}
        >
          <Icon size={18} aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
