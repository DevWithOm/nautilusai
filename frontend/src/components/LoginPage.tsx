import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', marginBottom: '14px',
  background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(131,197,190,0.25)',
  borderRadius: '10px', color: '#F8F9FA', fontSize: '13px',
  fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box'
}

export const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [form, setForm] = useState({
    email: '', password: '', name: '', organisation: '', role: 'analyst' as const
  })
  const [error, setError] = useState('')
  const login = useAuthStore(state => state.login)

  // Simple client-side user storage (no backend needed for demo)
  const DEMO_USERS = [
    { email: 'analyst@nautilus.ai', password: 'ocean2026', name: 'Aryan Sharma', role: 'analyst' as const, organisation: 'INCOIS' },
    { email: 'observer@nautilus.ai', password: 'watch2026', name: 'Guest Observer', role: 'observer' as const, organisation: 'Guest' },
  ]

  const handleLogin = () => {
    const found = DEMO_USERS.find(u => u.email === form.email && u.password === form.password)
    if (found) {
      login({ ...found, token: btoa(found.email + Date.now()) })
      onLogin()
    } else {
      setError('Invalid credentials. Use analyst@nautilus.ai / ocean2026')
    }
  }

  const handleSignup = () => {
    if (!form.email || !form.password || !form.name || !form.organisation) {
      setError('All fields required')
      return
    }
    // Store new user (demo — localStorage only)
    const newUser = { email: form.email, name: form.name, role: form.role, organisation: form.organisation, token: btoa(form.email + Date.now()) }
    login(newUser)
    onLogin()
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(135deg, #004B49 0%, #006D77 50%, #004B49 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'inherit'
    }}>
      <div style={{
        background: 'rgba(0,30,40,0.85)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(131,197,190,0.3)', borderRadius: '20px',
        padding: '48px', width: '440px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>🐚</div>
          <div style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '4px', color: '#F8F9FA' }}>
            NAUTILUS<span style={{ color: '#00E5FF' }}>AI</span>
          </div>
          <div style={{ fontSize: '11px', color: '#83C5BE', letterSpacing: '2px', marginTop: '4px' }}>
            OCEAN INTELLIGENCE PLATFORM
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '4px', marginBottom: '28px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }}
              style={{
                flex: 1, padding: '8px', border: 'none', borderRadius: '8px',
                background: mode === m ? 'rgba(0,109,119,0.8)' : 'transparent',
                color: mode === m ? '#00E5FF' : '#6B8CAE',
                fontWeight: '700', fontSize: '12px', letterSpacing: '1px',
                cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit'
              }}>
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Fields */}
        {mode === 'signup' && (
          <>
            <input placeholder="Full Name" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}/>
            <input placeholder="Organisation (e.g. INCOIS, Gujarat Fisheries)" value={form.organisation}
              onChange={e => setForm(f => ({ ...f, organisation: e.target.value }))}
              style={inputStyle}/>
            <select value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="analyst">Marine Analyst (Can validate threats)</option>
              <option value="observer">Observer (Read-only access)</option>
            </select>
          </>
        )}

        <input placeholder="Email address" type="email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          style={inputStyle}/>
        <input placeholder="Password" type="password" value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleSignup())}
          style={inputStyle}/>

        {error && <p style={{ color: '#FF4D4D', fontSize: '12px', margin: '-8px 0 12px', fontFamily: 'monospace' }}>{error}</p>}

        <button
          onClick={mode === 'login' ? handleLogin : handleSignup}
          style={{
            width: '100%', padding: '14px', background: '#006D77',
            border: '1px solid rgba(0,229,255,0.4)', borderRadius: '10px',
            color: '#00E5FF', fontWeight: '800', fontSize: '13px',
            letterSpacing: '2px', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.2s', marginBottom: '16px'
          }}>
          {mode === 'login' ? '[ ENTER COMMAND CENTER ]' : '[ REQUEST ACCESS ]'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#3D5A7A', fontFamily: 'monospace' }}>
          Demo: analyst@nautilus.ai / ocean2026
        </p>
      </div>
    </div>
  )
}
