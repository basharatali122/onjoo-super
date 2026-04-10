// import { useState } from 'react';
// import { Link, useNavigate, useLocation } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import {
//   LayoutDashboard, Bot, Settings, LogOut, ChevronRight,
//   Wifi, WifiOff, Menu, X
// } from 'lucide-react';
// import { useSocket } from '../hooks/useSocket';

// const PROFILES = ['Profile_1', 'Profile_2', 'Profile_3', 'Profile_4'];

// export default function Layout({ children, title }) {
//   const { user, logout } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { connected } = useSocket();
//   const [sidebarOpen, setSidebarOpen] = useState(true);

//   const handleLogout = async () => { await logout(); navigate('/login'); };

//   const navItems = [
//     { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
//     ...PROFILES.map(p => ({
//       icon: Bot, label: p, path: `/profile/${p}`,
//       active: location.pathname === `/profile/${p}`
//     })),
//   ];

//   return (
//     <div style={{ display: 'flex', minHeight: '100vh' }}>
//       {/* Sidebar */}
//       <aside style={{
//         width: sidebarOpen ? 220 : 0,
//         minWidth: sidebarOpen ? 220 : 0,
//         background: 'var(--bg-surface)',
//         borderRight: '1px solid var(--border)',
//         display: 'flex', flexDirection: 'column',
//         transition: 'all 0.2s ease',
//         overflow: 'hidden',
//         position: 'fixed', top: 0, left: 0, bottom: 0,
//         zIndex: 50,
//       }}>
//         {/* Logo */}
//         <div style={{
//           padding: '18px 20px', borderBottom: '1px solid var(--border)',
//           display: 'flex', alignItems: 'center', gap: 10,
//         }}>
//           <div style={{
//             width: 28, height: 28, borderRadius: 6,
//             background: 'var(--accent)', display: 'flex',
//             alignItems: 'center', justifyContent: 'center',
//             fontSize: 14, fontWeight: 800, color: '#050508', flexShrink: 0,
//           }}>M</div>
//           <div>
//             <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>
//               Milkyway<span style={{ color: 'var(--accent)' }}>.</span>
//             </div>
//             <div style={{
//               fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
//               letterSpacing: 1, textTransform: 'uppercase',
//             }}>SuperRoulette</div>
//           </div>
//         </div>

//         {/* Nav */}
//         <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
//           <div style={{
//             fontSize: 9, fontWeight: 700, letterSpacing: 2,
//             color: 'var(--text-muted)', textTransform: 'uppercase',
//             padding: '8px 12px 4px',
//           }}>Navigation</div>

//           {navItems.map((item) => {
//             const isActive = item.active || location.pathname === item.path;
//             return (
//               <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
//                 <div style={{
//                   display: 'flex', alignItems: 'center', gap: 10,
//                   padding: '8px 12px', borderRadius: 'var(--radius-sm)',
//                   marginBottom: 2,
//                   background: isActive ? 'var(--accent-glow)' : 'transparent',
//                   border: `1px solid ${isActive ? 'rgba(0,255,136,0.2)' : 'transparent'}`,
//                   color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
//                   fontSize: 13, fontWeight: isActive ? 700 : 400,
//                   transition: 'all 0.12s',
//                   cursor: 'pointer',
//                 }}>
//                   <item.icon size={14} />
//                   <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
//                     {item.label}
//                   </span>
//                   {isActive && <ChevronRight size={12} />}
//                 </div>
//               </Link>
//             );
//           })}
//         </nav>

//         {/* Footer */}
//         <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
//           {/* Connection status */}
//           <div style={{
//             display: 'flex', alignItems: 'center', gap: 8,
//             padding: '6px 12px', marginBottom: 4,
//             fontFamily: 'var(--font-mono)', fontSize: 10,
//             color: connected ? 'var(--accent)' : 'var(--text-muted)',
//           }}>
//             {connected
//               ? <><Wifi size={12} /> CONNECTED</>
//               : <><WifiOff size={12} /> OFFLINE</>
//             }
//           </div>

//           {/* User */}
//           <div style={{
//             display: 'flex', alignItems: 'center', gap: 8,
//             padding: '6px 12px',
//           }}>
//             <div style={{
//               width: 26, height: 26, borderRadius: '50%',
//               background: 'var(--bg-raised)', border: '1px solid var(--border-lit)',
//               display: 'flex', alignItems: 'center', justifyContent: 'center',
//               fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
//             }}>
//               {user?.email?.[0]?.toUpperCase() || 'U'}
//             </div>
//             <div style={{ flex: 1, minWidth: 0 }}>
//               <div style={{
//                 fontSize: 11, color: 'var(--text-primary)', fontWeight: 600,
//                 whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
//               }}>
//                 {user?.email?.split('@')[0]}
//               </div>
//             </div>
//             <button onClick={handleLogout} style={{
//               background: 'none', border: 'none', cursor: 'pointer',
//               color: 'var(--text-muted)', padding: 4,
//               display: 'flex', borderRadius: 4,
//               transition: 'color 0.12s',
//             }}
//               onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
//               onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
//             >
//               <LogOut size={14} />
//             </button>
//           </div>
//         </div>
//       </aside>

//       {/* Main content */}
//       <div style={{
//         flex: 1, display: 'flex', flexDirection: 'column',
//         marginLeft: sidebarOpen ? 220 : 0,
//         transition: 'margin-left 0.2s ease',
//         minWidth: 0,
//       }}>
//         {/* Topbar */}
//         <header style={{
//           height: 52, padding: '0 24px',
//           display: 'flex', alignItems: 'center', justifyContent: 'space-between',
//           borderBottom: '1px solid var(--border)',
//           background: 'var(--bg-surface)',
//           position: 'sticky', top: 0, zIndex: 40,
//         }}>
//           <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
//             <button onClick={() => setSidebarOpen(v => !v)} style={{
//               background: 'none', border: 'none', cursor: 'pointer',
//               color: 'var(--text-secondary)', padding: 4, display: 'flex',
//             }}>
//               {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
//             </button>
//             <h1 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>
//               {title}
//             </h1>
//           </div>
//           <div style={{
//             fontFamily: 'var(--font-mono)', fontSize: 10,
//             color: 'var(--text-muted)', letterSpacing: 1,
//           }}>
//             {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
//           </div>
//         </header>

//         {/* Page content */}
//         <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }



import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, Bot, LogOut, ChevronRight, Wifi, WifiOff, Menu, X, ChevronDown } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { USER_PROFILE } from '../App';
import { useGame } from '../hooks/useGame';

// Helper: convert hex color to "r,g,b" for rgba() usage
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `${r},${g},${b}`;
}

/**
 * Layout — sidebar nav for single-profile mode.
 *
 * Removed: hardcoded PROFILES array listing all 4 profiles.
 * Added: single nav item pointing to this user's own profile.
 *
 * 200 users simultaneously logged in each see their own email and their own
 * profile link. No user can navigate to another user's profile — the backend
 * enforces ownership via userId in every route.
 */
export default function Layout({ children, title }) {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const location          = useLocation();
  const { connected }     = useSocket();
  const { game, games, setGame } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',        path: '/' },
    { icon: Bot,             label: USER_PROFILE.replace('_', ' '), path: `/profile/${USER_PROFILE}` },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 220 : 0,
        minWidth: sidebarOpen ? 220 : 0,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 50,
      }}>
        {/* Logo */}
        <div style={{
          padding: '18px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--accent)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 800, color: '#050508', flexShrink: 0,
          }}>M</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>
              Milkyway<span style={{ color: 'var(--accent)' }}>.</span>
            </div>
            <div style={{
              fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              letterSpacing: 1, textTransform: 'uppercase',
            }}>SuperRoulette</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            padding: '8px 12px 4px',
          }}>Navigation</div>

          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                  marginBottom: 2,
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(0,255,136,0.2)' : 'transparent'}`,
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 13, fontWeight: isActive ? 700 : 400,
                  transition: 'all 0.12s', cursor: 'pointer',
                }}>
                  <item.icon size={14} />
                  <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                  {isActive && <ChevronRight size={12} />}
                </div>
              </Link>
            );
          })}

          {/* ── Game Server Selector ─────────────────────────────────── */}
          <div style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 2,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            padding: '14px 12px 4px',
          }}>Game Server</div>

          {/* Dropdown trigger */}
          <div
            onClick={() => setGameDropdownOpen(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 'var(--radius-sm)',
              border: `1px solid rgba(${hexToRgb(game.color)},0.35)`,
              background: `rgba(${hexToRgb(game.color)},0.08)`,
              cursor: 'pointer', transition: 'all 0.12s', marginBottom: 2,
            }}
            onMouseEnter={e => e.currentTarget.style.background = `rgba(${hexToRgb(game.color)},0.14)`}
            onMouseLeave={e => e.currentTarget.style.background = `rgba(${hexToRgb(game.color)},0.08)`}
          >
            {/* Color dot */}
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: game.color, boxShadow: `0 0 6px ${game.color}80`,
            }} />
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {game.label}
            </span>
            <ChevronDown size={12} style={{
              color: 'var(--text-muted)',
              transform: gameDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              flexShrink: 0,
            }} />
          </div>

          {/* Dropdown list */}
          {gameDropdownOpen && (
            <div style={{
              margin: '2px 0 6px 0',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              overflow: 'hidden',
              background: 'var(--bg-raised)',
            }}>
              {games.map(g => (
                <div
                  key={g.id}
                  onClick={() => { setGame(g.id); setGameDropdownOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px', cursor: 'pointer',
                    background: g.id === game.id ? `rgba(${hexToRgb(g.color)},0.12)` : 'transparent',
                    borderLeft: g.id === game.id ? `2px solid ${g.color}` : '2px solid transparent',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (g.id !== game.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { if (g.id !== game.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: g.color,
                    opacity: g.id === game.id ? 1 : 0.5,
                  }} />
                  <span style={{
                    fontSize: 12, color: g.id === game.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: g.id === game.id ? 700 : 400,
                  }}>
                    {g.label}
                  </span>
                  {g.id === game.id && (
                    <span style={{ marginLeft: 'auto', fontSize: 9, fontFamily: 'var(--font-mono)', color: g.color, letterSpacing: 1 }}>
                      ACTIVE
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', marginBottom: 4,
            fontFamily: 'var(--font-mono)', fontSize: 10,
            color: connected ? 'var(--accent)' : 'var(--text-muted)',
          }}>
            {connected ? <><Wifi size={12} /> CONNECTED</> : <><WifiOff size={12} /> OFFLINE</>}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px' }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--bg-raised)', border: '1px solid var(--border-lit)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
            }}>
              {user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 11, color: 'var(--text-primary)', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {user?.email?.split('@')[0]}
              </div>
            </div>
            <button onClick={handleLogout} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', padding: 4,
              display: 'flex', borderRadius: 4, transition: 'color 0.12s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        marginLeft: sidebarOpen ? 220 : 0,
        transition: 'margin-left 0.2s ease', minWidth: 0,
      }}>
        <header style={{
          height: 52, padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          position: 'sticky', top: 0, zIndex: 40,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', padding: 4, display: 'flex',
            }}>
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <h1 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px' }}>
              {title}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Active game badge in topbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 4,
              border: `1px solid rgba(${hexToRgb(game.color)},0.3)`,
              background: `rgba(${hexToRgb(game.color)},0.08)`,
              fontSize: 10, fontFamily: 'var(--font-mono)',
              color: game.color, letterSpacing: 1,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%',
                background: game.color, display: 'inline-block',
              }} />
              {game.shortLabel}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 10,
              color: 'var(--text-muted)', letterSpacing: 1,
            }}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
