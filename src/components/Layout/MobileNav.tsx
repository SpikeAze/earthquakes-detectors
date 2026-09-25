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
    <nav className="bottom-nav" aria-label="Section navigation">
      {ITEMS.map(({ href, label, Icon }) => (
        <a
          key={href}
          href={href}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            color: 'var(--text-secondary)', textDecoration: 'none',
            fontSize: '0.64rem', fontWeight: 700, padding: '6px 2px', borderRadius: 8,
          }}
        >
          <Icon size={17} aria-hidden="true" />
          {label}
        </a>
      ))}
    </nav>
  );
}
