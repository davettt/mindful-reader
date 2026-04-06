import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Read', icon: '○' },
  { to: '/feeds', label: 'Feeds', icon: '◇' },
  { to: '/insights', label: 'Insights', icon: '△' },
];

export default function Nav() {
  return (
    <nav className="fixed right-0 bottom-0 left-0 border-t border-stone-200 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl justify-around py-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-xs transition-colors ${
                isActive ? 'text-stone-800' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            <span className="text-lg">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
