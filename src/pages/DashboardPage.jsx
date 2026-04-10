// import { useEffect, useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { processingAPI, statsAPI } from '../services/api';
// import Layout from '../components/Layout';
// import { Bot, Zap, Target, TrendingUp, ArrowRight, Play, Square } from 'lucide-react';

// const PROFILES = ['Profile_1', 'Profile_2', 'Profile_3', 'Profile_4'];

// export default function DashboardPage() {
//   const navigate = useNavigate();
//   const [profiles, setProfiles] = useState([]);
//   const [loading, setLoading] = useState(true);

//   const loadProfiles = useCallback(async () => {
//     // Fetch all 4 profiles in parallel — they are fully independent
//     const results = await Promise.allSettled(
//       PROFILES.map(async (p) => {
//         const [status, stats] = await Promise.allSettled([
//           processingAPI.status(p),
//           statsAPI.get(p),
//         ]);
//         return {
//           name: p,
//           status: status.status === 'fulfilled' ? status.value.data : { running: false },
//           stats:  stats.status  === 'fulfilled' ? stats.value.data   : null,
//         };
//       })
//     );
//     setProfiles(results.map(r => r.status === 'fulfilled' ? r.value : { name: '?', status: { running: false }, stats: null }));
//     setLoading(false);
//   }, []);

//   useEffect(() => {
//     loadProfiles();
//     const interval = setInterval(loadProfiles, 10000);
//     return () => clearInterval(interval);
//   }, [loadProfiles]);

//   const totalRunning    = profiles.filter(p => p.status?.running).length;
//   const totalWins       = profiles.reduce((acc, p) => acc + (p.stats?.totals?.totalWins || 0), 0);
//   const totalProcessed  = profiles.reduce((acc, p) => acc + (p.stats?.totals?.totalProcessed || 0), 0);
//   const winRate         = totalProcessed > 0 ? ((totalWins / totalProcessed) * 100).toFixed(1) : null;

//   return (
//     <Layout title="Dashboard">
//       <div style={{ maxWidth: 1100 }}>

//         {/* Overview stats */}
//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
//           {[
//             { label: 'Active Bots',     value: `${totalRunning}/${PROFILES.length}`, sub: 'profiles running', accent: totalRunning > 0, icon: Bot },
//             { label: 'Total Processed', value: totalProcessed.toLocaleString(), sub: 'all time', icon: Target },
//             { label: 'Total Wins',      value: totalWins.toLocaleString(), sub: 'all time', accent: true, icon: TrendingUp },
//             { label: 'Win Rate',        value: winRate ? `${winRate}%` : '—', sub: 'avg across profiles', icon: Zap },
//           ].map(stat => (
//             <div key={stat.label} className="stat-card">
//               <div className="stat-label">{stat.label}</div>
//               <div className={`stat-value${stat.accent ? ' accent' : ''}`}>{stat.value}</div>
//               <div className="stat-sub">{stat.sub}</div>
//             </div>
//           ))}
//         </div>

//         {/* Profile cards */}
//         <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: 2,
//           color: 'var(--text-muted)', textTransform: 'uppercase' }}>
//           Profiles — all run independently
//         </div>

//         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
//           {loading
//             ? PROFILES.map(p => (
//                 <div key={p} className="card" style={{ opacity: 0.4, minHeight: 100 }} />
//               ))
//             : profiles.map((profile) => {
//                 const running = profile.status?.running;
//                 const proc    = profile.stats?.totals?.totalProcessed || 0;
//                 const wins    = profile.stats?.totals?.totalWins || 0;
//                 const wr      = proc > 0 ? `${((wins / proc) * 100).toFixed(0)}%` : '—';

//                 return (
//                   <div key={profile.name}
//                     onClick={() => navigate(`/profile/${profile.name}`)}
//                     style={{
//                       background: 'var(--bg-surface)',
//                       border: `1px solid ${running ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
//                       borderRadius: 'var(--radius-lg)', padding: '16px 20px', cursor: 'pointer',
//                       transition: 'all 0.15s',
//                       boxShadow: running ? '0 0 20px rgba(0,255,136,0.06)' : 'none',
//                     }}
//                     onMouseEnter={e => e.currentTarget.style.borderColor = running ? 'rgba(0,255,136,0.5)' : 'var(--border-lit)'}
//                     onMouseLeave={e => e.currentTarget.style.borderColor = running ? 'rgba(0,255,136,0.3)' : 'var(--border)'}
//                   >
//                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
//                         <span className={`dot ${running ? 'dot-green dot-pulse' : 'dot-grey'}`} />
//                         <span style={{ fontWeight: 700, fontSize: 14 }}>{profile.name.replace('_', ' ')}</span>
//                       </div>
//                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//                         <span className={`badge ${running ? 'badge-success' : 'badge-muted'}`}>
//                           {running ? '● RUNNING' : '○ IDLE'}
//                         </span>
//                         <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
//                       </div>
//                     </div>

//                     <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
//                       {[
//                         { label: 'Processed', value: proc.toLocaleString() },
//                         { label: 'Wins',      value: wins.toLocaleString() },
//                         { label: 'Win Rate',  value: wr },
//                       ].map(s => (
//                         <div key={s.label} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '8px 10px' }}>
//                           <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 }}>
//                             {s.label}
//                           </div>
//                           <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>
//                             {s.value}
//                           </div>
//                         </div>
//                       ))}
//                     </div>

//                     {running && (
//                       <div style={{ marginTop: 10 }}>
//                         <div style={{ display: 'flex', justifyContent: 'space-between',
//                           fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
//                           <span>Cycle {profile.status.currentCycle}/{profile.status.totalCycles}</span>
//                           <span>Bet: {profile.status.currentBet}</span>
//                         </div>
//                         <div className="progress-bar">
//                           <div className="progress-fill" style={{
//                             width: `${((profile.status.currentCycle || 0) / Math.max(profile.status.totalCycles || 1, 1)) * 100}%`
//                           }} />
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//         </div>
//       </div>
//     </Layout>
//   );
// }


import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { processingAPI, statsAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useGame } from '../hooks/useGame';
import Layout from '../components/Layout';
import { USER_PROFILE } from '../App';
import { Bot, Zap, Target, TrendingUp, ArrowRight, Activity } from 'lucide-react';

/**
 * DashboardPage — single profile per user.
 *
 * Each user sees only their own profile. 200 users logged in simultaneously
 * each see their own independent view — no shared state, no cross-user data.
 *
 * The profile name is always USER_PROFILE ("Profile_1") but it's namespaced
 * by userId on the backend so two users never touch each other's data.
 */
export default function DashboardPage() {
  const navigate      = useNavigate();
  const { user }      = useAuth();
  const { game }      = useGame();
  const [status, setStatus] = useState({ running: false });
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [statusRes, statsRes] = await Promise.allSettled([
      processingAPI.status(USER_PROFILE),
      statsAPI.get(USER_PROFILE),
    ]);
    if (statusRes.status === 'fulfilled') setStatus(statusRes.value.data || { running: false });
    if (statsRes.status  === 'fulfilled') setStats(statsRes.value.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    // Poll every 8s to keep dashboard fresh without hammering the server
    // 200 users × 1 poll/8s = 25 req/s to /processing/status — very manageable
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [load]);

  const running   = status.running;
  const processed = stats?.totals?.totalProcessed || 0;
  const wins      = stats?.totals?.totalWins      || 0;
  const bet       = stats?.totals?.totalBet        || 0;
  const winRate   = processed > 0 ? ((wins / processed) * 100).toFixed(1) : null;

  const statCards = [
    { label: 'Status',     value: running ? 'ACTIVE' : 'IDLE',          sub: 'bot state',         accent: running, icon: Bot },
    { label: 'Processed',  value: processed.toLocaleString(),            sub: 'accounts all time',  icon: Target },
    { label: 'Total Wins', value: wins.toLocaleString(),                 sub: 'confirmed + assumed', accent: true, icon: TrendingUp },
    { label: 'Win Rate',   value: winRate ? `${winRate}%` : '—',         sub: 'success rate',       icon: Zap },
  ];

  return (
    <Layout title="Dashboard">
      <div style={{ maxWidth: 900 }}>

        {/* User + game context banner */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto',
          gap: 10, marginBottom: 20,
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontSize: 12, color: 'var(--text-secondary)',
          }}>
            <Activity size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
            <span>Your session: <strong style={{ color: 'var(--text-primary)' }}>{user?.email}</strong></span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
              {running ? '● bot running' : '○ bot idle'}
            </span>
          </div>

          {/* Active game pill */}
          <div style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${game.color}40`,
            borderRadius: 'var(--radius-md)', padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: game.color,
              boxShadow: `0 0 8px ${game.color}80`,
            }} />
            <span style={{ color: 'var(--text-secondary)' }}>Game:</span>
            <strong style={{ color: game.color }}>{game.label}</strong>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {statCards.map(card => (
            <div key={card.label} className="stat-card">
              <div className="stat-label">{card.label}</div>
              <div className={`stat-value${card.accent ? ' accent' : ''}`} style={{ fontSize: 20 }}>
                {loading ? '—' : card.value}
              </div>
              <div className="stat-sub">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Single profile card */}
        <div style={{ marginBottom: 8, fontSize: 10, fontWeight: 700, letterSpacing: 2,
          color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Your Profile
        </div>

        <div
          onClick={() => navigate(`/profile/${USER_PROFILE}`)}
          style={{
            background: 'var(--bg-surface)',
            border: `1px solid ${running ? 'rgba(0,255,136,0.3)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-lg)', padding: '20px 24px',
            cursor: 'pointer', transition: 'all 0.15s',
            boxShadow: running ? '0 0 20px rgba(0,255,136,0.06)' : 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = running ? 'rgba(0,255,136,0.5)' : 'var(--border-lit)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = running ? 'rgba(0,255,136,0.3)' : 'var(--border)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className={`dot ${running ? 'dot-green dot-pulse' : 'dot-grey'}`} />
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {USER_PROFILE.replace('_', ' ')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`badge ${running ? 'badge-success' : 'badge-muted'}`}>
                {running ? '● RUNNING' : '○ IDLE'}
              </span>
              <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: 'Processed', value: processed.toLocaleString() },
              { label: 'Wins',      value: wins.toLocaleString() },
              { label: 'Win Rate',  value: winRate ? `${winRate}%` : '—' },
              { label: 'Total Bet', value: bet.toLocaleString() },
            ].map(s => (
              <div key={s.label} style={{
                background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '10px 12px',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  {s.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                  {loading ? '—' : s.value}
                </div>
              </div>
            ))}
          </div>

          {running && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 5 }}>
                <span>Cycle {status.currentCycle || 0} / {status.totalCycles || 0}</span>
                <span>Bet: {status.currentBet || '—'}</span>
                {status.adaptiveStagger && <span>Stagger: {status.adaptiveStagger}ms</span>}
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${((status.currentCycle || 0) / Math.max(status.totalCycles || 1, 1)) * 100}%`
                }} />
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, fontSize: 11, color: 'var(--text-muted)' }}>
            Click to open bot controls, manage accounts, and configure proxy →
          </div>
        </div>
      </div>
    </Layout>
  );
}
