import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useBotEvents } from '../hooks/useSocket';
import { accountsAPI, processingAPI, proxyAPI, statsAPI } from '../services/api';
import { useGame } from '../hooks/useGame';
import {
  Play, Square, Upload, Trash2, RefreshCw, Shield,
  BarChart3, Terminal, Users, Settings, Plus, AlertCircle,
  ChevronDown, ChevronUp, Zap
} from 'lucide-react';

// ─── Terminal ─────────────────────────────────────────────────────────────────
const BotTerminal = memo(function BotTerminal({ logs }) {
  const endRef = useRef(null);
  const containerRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs, autoScroll]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  };

  const typeColor = {
    success: 'terminal-success', error: 'terminal-error',
    warning: 'terminal-warning', debug: 'terminal-debug', info: 'terminal-info',
  };

  return (
    <div className="terminal" ref={containerRef} onScroll={handleScroll}>
      {logs.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          Waiting for bot output...
        </div>
      )}
      {logs.map((log, i) => (
        <div key={i} className="terminal-line">
          <span className="terminal-time">
            {new Date(log.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className={typeColor[log.type] || 'terminal-info'}>
            {log.message}
          </span>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
});

// ─── Proxy Panel ──────────────────────────────────────────────────────────────
function ProxyPanel({ profile }) {
  const [config, setConfig] = useState({ enabled: false, proxyUrl: '', proxyList: [] });
  const [proxyText, setProxyText] = useState('');
  const [status, setStatus] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    proxyAPI.get(profile).then(r => {
      const cfg = r.data.config || {};
      setConfig(cfg);
      setProxyText(Array.isArray(cfg.proxyList) ? cfg.proxyList.join('\n') : (cfg.proxyList || ''));
    }).catch(() => {});
  }, [profile]);

  const convertLine = (line) => {
    line = line.trim();
    if (!line) return null;
    if (line.startsWith('socks5') || line.startsWith('http')) return line;
    const parts = line.split(':');
    if (parts.length >= 4) {
      const [host, port, user, pass] = parts;
      return `socks5h://${user}:${pass}@${host}:${port}`;
    }
    return null;
  };

  const parseList = (text) => text.split('\n').map(convertLine).filter(Boolean);

  const handleConvert = () => {
    const converted = parseList(proxyText);
    setProxyText(converted.join('\n'));
    setStatus(`✅ Converted ${converted.length} proxies`);
  };

  const handleTest = async () => {
    const list = parseList(proxyText);
    const url = config.proxyUrl || list[0];
    if (!url) { setStatus('⚠️ No proxy to test'); return; }
    setTesting(true); setStatus('Testing...');
    try {
      const r = await proxyAPI.test(profile, url);
      setStatus(r.data.message);
    } catch { setStatus('❌ Test failed'); }
    setTesting(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const list = parseList(proxyText);
    try {
      await proxyAPI.save(profile, { ...config, proxyList: list });
      setStatus(`✅ Saved ${list.length} proxies`);
    } catch { setStatus('❌ Save failed'); }
    setSaving(false);
  };

  return (
    <div>
      <label className="checkbox-label" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="checkbox" checked={config.enabled}
          onChange={e => setConfig(c => ({ ...c, enabled: e.target.checked }))} />
        Enable proxy for this profile
      </label>

      {config.enabled && (
        <>
          <div className="form-group">
            <label className="form-label">
              Proxy List
              <span style={{ marginLeft: 6, color: 'var(--text-muted)', fontWeight: 400 }}>
                — socks5h://user:pass@host:port  OR  host:port:user:pass
              </span>
            </label>
            <textarea className="textarea" rows={6}
              placeholder={"Paste proxies here (one per line)\nhost:port:user:pass auto-converts to socks5h://"}
              value={proxyText} onChange={e => setProxyText(e.target.value)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <button className="btn btn-warning btn-sm" onClick={handleConvert}>⇄ Convert</button>
            <button className="btn btn-ghost btn-sm" onClick={handleTest} disabled={testing}>
              {testing ? '...' : '⚡ Test First'}
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? '...' : '↑ Save'}
            </button>
          </div>
          {status && (
            <div style={{
              padding: '6px 10px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-raised)', fontFamily: 'var(--font-mono)', fontSize: 11,
              color: status.startsWith('✅') ? 'var(--accent)' : status.startsWith('❌') ? 'var(--danger)' : 'var(--text-secondary)',
            }}>{status}</div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Accounts Table ───────────────────────────────────────────────────────────
function AccountsTable({ profile }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [showGenerate, setShowGenerate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info'); // 'success'|'error'|'info'

  // Generate accounts form
  const [genUsername, setGenUsername] = useState('');
  const [genStartRange, setGenStartRange] = useState(1);
  const [genEndRange, setGenEndRange] = useState(100);
  const [genPassword, setGenPassword] = useState('');
  const [generating, setGenerating] = useState(false);

  const setMsg = (msg, type = 'info') => { setStatus(msg); setStatusType(type); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await accountsAPI.getAll(profile);
      setAccounts(r.data.accounts || []);
    } catch { setMsg('Failed to load accounts', 'error'); }
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id) => setSelected(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const toggleAll = () => setSelected(s => s.size === accounts.length ? new Set() : new Set(accounts.map(a => a.id)));

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} accounts?`)) return;
    try {
      await accountsAPI.bulkDelete(profile, [...selected]);
      setSelected(new Set());
      setMsg(`✅ Deleted ${selected.size} accounts`, 'success');
      await load();
    } catch { setMsg('❌ Delete failed', 'error'); }
  };

  const handleClearAll = async () => {
    if (!confirm(`Clear ALL ${accounts.length} accounts in ${profile}? This cannot be undone.`)) return;
    try {
      await accountsAPI.clearAll(profile);
      setSelected(new Set());
      setMsg('✅ All accounts cleared', 'success');
      await load();
    } catch { setMsg('❌ Clear failed', 'error'); }
  };

  const handleImport = async () => {
    const lines = importText.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = lines.map(line => {
      const [username, password] = line.split(':');
      return username && password ? { username: username.trim(), password: password.trim() } : null;
    }).filter(Boolean);

    if (parsed.length === 0) { setMsg('⚠️ No valid accounts found (format: user:pass)', 'error'); return; }
    try {
      const r = await accountsAPI.bulkImport(profile, parsed);
      setImportText('');
      setShowImport(false);
      setMsg(`✅ Added ${r.data.added} | Skipped ${r.data.duplicates} duplicates`, 'success');
      await load();
    } catch { setMsg('❌ Import failed', 'error'); }
  };

  const handleGenerate = async () => {
    if (!genUsername.trim()) { setMsg('⚠️ Username is required', 'error'); return; }
    if (genStartRange > genEndRange) { setMsg('⚠️ Start must be ≤ End', 'error'); return; }
    const count = genEndRange - genStartRange + 1;
    if (count > 2000) { setMsg('⚠️ Max 2000 accounts per generation', 'error'); return; }

    setGenerating(true);
    setMsg(`Generating ${count} accounts...`, 'info');
    try {
      const r = await accountsAPI.generate(profile, {
        username: genUsername.trim(),
        startRange: genStartRange,
        endRange: genEndRange,
        password: genPassword.trim() || 'password123',
      });
      setMsg(`✅ Generated ${r.data.generated} | Added ${r.data.added} | Skipped ${r.data.duplicates}`, 'success');
      setShowGenerate(false);
      await load();
    } catch (e) { setMsg(`❌ Generation failed: ${e.message}`, 'error'); }
    setGenerating(false);
  };

  const previewName = genUsername
    ? `${genUsername}${String(genStartRange).padStart(String(genEndRange).length, '0')} … ${genUsername}${genEndRange}`
    : '';

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>
          {accounts.length.toLocaleString()} accounts
          {selected.size > 0 && ` · ${selected.size} selected`}
        </span>
        <div style={{ flex: 1 }} />

        {selected.size > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>
            <Trash2 size={11} /> Delete ({selected.size})
          </button>
        )}
        <button className="btn btn-ghost btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={11} className={loading ? 'spin' : ''} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(v => !v)}>
          <Upload size={11} /> Import
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowGenerate(v => !v)}>
          <Plus size={11} /> Generate
        </button>
        {accounts.length > 0 && (
          <button className="btn btn-danger btn-sm" onClick={handleClearAll} title="Clear all accounts">
            <Trash2 size={11} /> Clear All
          </button>
        )}
      </div>

      {/* Status message */}
      {status && (
        <div style={{
          padding: '6px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 10,
          background: 'var(--bg-raised)', fontFamily: 'var(--font-mono)', fontSize: 11,
          color: statusType === 'success' ? 'var(--accent)' : statusType === 'error' ? 'var(--danger)' : 'var(--text-secondary)',
        }}>{status}</div>
      )}

      {/* Generate panel */}
      {showGenerate && (
        <div style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border-lit)',
          borderRadius: 'var(--radius)', padding: 16, marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase' }}>
            ⚡ Generate Accounts
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Username Base *</label>
              <input className="input" placeholder="e.g. player, user, bot"
                value={genUsername} onChange={e => setGenUsername(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Password</label>
              <input className="input" placeholder="password123 (default)"
                value={genPassword} onChange={e => setGenPassword(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Start Range</label>
              <input className="input" type="number" min={1}
                value={genStartRange} onChange={e => setGenStartRange(parseInt(e.target.value) || 1)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">End Range</label>
              <input className="input" type="number" min={genStartRange}
                value={genEndRange} onChange={e => setGenEndRange(parseInt(e.target.value) || 100)} />
            </div>
          </div>

          {/* Live preview */}
          {genUsername && (
            <div style={{
              padding: '6px 10px', background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)',
              borderRadius: 'var(--radius-sm)', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11,
            }}>
              <span style={{ color: 'var(--text-muted)' }}>Preview: </span>
              <span style={{ color: 'var(--accent)' }}>{previewName}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>
                ({Math.max(0, genEndRange - genStartRange + 1).toLocaleString()} accounts)
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Generating...' : `⚡ Generate ${(genEndRange - genStartRange + 1).toLocaleString()} Accounts`}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowGenerate(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Import panel */}
      {showImport && (
        <div style={{
          background: 'var(--bg-raised)', border: '1px solid var(--border-lit)',
          borderRadius: 'var(--radius)', padding: 16, marginBottom: 12,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-primary)', marginBottom: 10, textTransform: 'uppercase' }}>
            Bulk Import
          </div>
          <label className="form-label">Format: username:password (one per line)</label>
          <textarea className="textarea" rows={5}
            placeholder={"player001:pass123\nplayer002:pass456\n..."}
            value={importText} onChange={e => setImportText(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary btn-sm" onClick={handleImport}>↑ Import</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Accounts table */}
      <div className="table-wrap" style={{ maxHeight: 340, overflowY: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" onChange={toggleAll}
                  checked={selected.size === accounts.length && accounts.length > 0} />
              </th>
              <th>Username</th>
              <th>Score</th>
              <th>Last Processed</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>Loading...</td></tr>
            ) : accounts.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                No accounts yet — use Generate or Import
              </td></tr>
            ) : accounts.slice(0, 200).map(a => (
              <tr key={a.id} style={{ background: selected.has(a.id) ? 'rgba(0,255,136,0.04)' : undefined }}>
                <td><input type="checkbox" checked={selected.has(a.id)} onChange={() => toggleSelect(a.id)} /></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{a.username}</td>
                <td style={{ color: 'var(--accent)' }}>{a.score || 0}</td>
                <td style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                  {a.last_processed ? new Date(a.last_processed).toLocaleString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {accounts.length > 200 && (
          <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
            Showing first 200 of {accounts.length.toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Stats Panel ──────────────────────────────────────────────────────────────
function StatsPanel({ profile, liveStats }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetch = () => statsAPI.get(profile).then(r => setStats(r.data)).catch(() => {});
    fetch();
    const iv = setInterval(fetch, 15000);
    return () => clearInterval(iv);
  }, [profile]);

  const t = stats?.totals || {};
  const live = liveStats || {};

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Processed', value: (t.totalProcessed || 0).toLocaleString() },
          { label: 'Total Wins', value: (t.totalWins || 0).toLocaleString(), accent: true },
          { label: 'Total Bet', value: t.totalBet ? `$${t.totalBet.toLocaleString()}` : '—' },
          { label: 'Total Win Amount', value: t.totalWin ? `$${t.totalWin.toLocaleString()}` : '—', accent: true },
          { label: 'Win Rate', value: t.totalProcessed > 0 ? `${((t.totalWins / t.totalProcessed) * 100).toFixed(1)}%` : '—' },
          { label: 'Sessions', value: (t.totalSessions || 0).toString() },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
            <div className="stat-label" style={{ fontSize: 9 }}>{s.label}</div>
            <div className="stat-value" style={{ fontSize: 20, color: s.accent ? 'var(--accent)' : 'var(--text-primary)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {live.isRunning && (
        <div style={{
          padding: 12, background: 'var(--accent-glow)',
          border: '1px solid rgba(0,255,136,0.2)', borderRadius: 'var(--radius)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase' }}>
            ● Live Session
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {[
              { label: 'Success', value: live.successCount || 0 },
              { label: 'Failed', value: live.failCount || 0 },
              { label: 'Current Bet', value: live.currentBet || '—' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ProfilePage ─────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { profileName } = useParams();
  const { game }        = useGame();
  const [tab, setTab] = useState('terminal');
  const [logs, setLogs] = useState([]);
  const [botStatus, setBotStatus] = useState({ running: false });
  const [betAmount, setBetAmount] = useState(20);
  const [repetitions, setRepetitions] = useState(1);
  const [starting, setStarting] = useState(false);
  const [liveStats, setLiveStats] = useState(null);

  // Stable event handler — won't re-subscribe on each render
  const handleEvent = useCallback((event, data) => {
    if (event === 'bot:terminal') {
      setLogs(prev => [...prev.slice(-500), data]);
    } else if (event === 'bot:status') {
      setBotStatus(data);
      if (data.running) setLiveStats(data);
    } else if (event === 'bot:completed') {
      setBotStatus(s => ({ ...s, running: false }));
      setLiveStats(null);
    } else if (event === 'bot:betUpdate') {
      setBotStatus(s => ({ ...s, currentBet: data.currentBet }));
    }
  }, []);

  useBotEvents(profileName, handleEvent);

  // Poll status (less aggressively — socket handles real-time)
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await processingAPI.status(profileName);
        setBotStatus(r.data);
      } catch (_) {}
    };
    poll();
    const iv = setInterval(poll, 10000);
    return () => clearInterval(iv);
  }, [profileName]);

  const handleStart = async () => {
    setStarting(true);
    try {
      // Pass the selected game's WS URLs to the backend so the processor
      // connects to the correct game server
      const gameConfig = {
        LOGIN_WS_URL:          game.LOGIN_WS_URL,
        SUPER_ROULETTE_WS_URL: game.SUPER_ROULETTE_WS_URL,
        GAME_VERSION:          game.GAME_VERSION,
      };
      await processingAPI.start(profileName, { repetitions, betAmount, gameConfig });
      setBotStatus(s => ({ ...s, running: true }));
      setLogs([]);
      setTab('terminal');
    } catch (e) {
      setLogs(prev => [...prev, {
        type: 'error',
        message: `Failed to start: ${e.response?.data?.error || e.message}`,
        timestamp: new Date().toISOString(),
      }]);
    }
    setStarting(false);
  };

  const handleStop = async () => {
    try {
      await processingAPI.stop(profileName);
      setBotStatus(s => ({ ...s, running: false }));
    } catch (_) {}
  };

  const TABS = [
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'accounts', label: 'Accounts', icon: Users },
    { id: 'stats',    label: 'Stats',    icon: BarChart3 },
    { id: 'proxy',    label: 'Proxy',    icon: Shield },
  ];

  return (
    <Layout title={profileName}>
      <div style={{ maxWidth: 1000 }}>

        {/* Control bar */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`dot ${botStatus.running ? 'dot-green dot-pulse' : 'dot-grey'}`} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700,
                color: botStatus.running ? 'var(--accent)' : 'var(--text-secondary)' }}>
                {botStatus.running ? 'RUNNING' : 'IDLE'}
              </span>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--border)' }} />

            {/* Bet amount */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>BET</span>
              <input type="number" value={betAmount}
                onChange={e => setBetAmount(parseInt(e.target.value) || 20)}
                style={{ width: 70, padding: '5px 8px', background: 'var(--bg-raised)',
                  border: '1px solid var(--border)', borderRadius: 4,
                  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </div>

            {/* Cycles */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>CYCLES</span>
              <input type="number" value={repetitions} min={1} max={50}
                onChange={e => setRepetitions(parseInt(e.target.value) || 1)}
                style={{ width: 60, padding: '5px 8px', background: 'var(--bg-raised)',
                  border: '1px solid var(--border)', borderRadius: 4,
                  color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
            </div>

            <div style={{ flex: 1 }} />

            {botStatus.proxyEnabled && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)',
                borderRadius: 20, padding: '3px 10px' }}>
                <Shield size={10} style={{ color: 'var(--accent)' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>PROXY ON</span>
              </div>
            )}

            {/* Active game badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: `${game.color}15`,
              border: `1px solid ${game.color}50`,
              borderRadius: 20, padding: '3px 10px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: game.color, display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: game.color }}>
                {game.label.toUpperCase()}
              </span>
            </div>

            {!botStatus.running ? (
              <button className="btn btn-primary" onClick={handleStart} disabled={starting} style={{ gap: 8 }}>
                <Play size={13} />
                {starting ? 'STARTING...' : 'START BOT'}
              </button>
            ) : (
              <button className="btn btn-danger" onClick={handleStop}>
                <Square size={13} />
                STOP BOT
              </button>
            )}
          </div>

          {botStatus.running && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                <span>Cycle {botStatus.currentCycle || 0}/{botStatus.totalCycles || repetitions}</span>
                <span>Stagger: {botStatus.adaptiveStagger || '—'}ms</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${((botStatus.currentCycle || 0) / Math.max(botStatus.totalCycles || repetitions, 1)) * 100}%`
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tab-nav">
          {TABS.map(t => (
            <button key={t.id} className={`tab-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <t.icon size={11} style={{ display: 'inline', marginRight: 5, verticalAlign: 'middle' }} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card">
          {tab === 'terminal' && (
            <div>
              <div className="card-header">
                <span className="card-title">Live Output</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setLogs([])}>Clear</button>
              </div>
              <BotTerminal logs={logs} />
            </div>
          )}
          {tab === 'accounts' && <AccountsTable profile={profileName} />}
          {tab === 'stats'    && <StatsPanel profile={profileName} liveStats={liveStats} />}
          {tab === 'proxy'    && <ProxyPanel profile={profileName} />}
        </div>
      </div>
    </Layout>
  );
}
