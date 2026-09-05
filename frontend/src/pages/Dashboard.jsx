export default function Dashboard() {
  return (
    <main style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🛰️ Sentinel AI</h1>
        <p style={styles.subtitle}>
          Multi-Agent Disaster Response &amp; Common Operating Picture
        </p>
        <div style={styles.badge}>System Initializing</div>
        <p style={styles.hint}>Backend · Frontend · AI Agents coming soon</p>
      </div>
    </main>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0f1e',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    textAlign: 'center',
    padding: '3rem 4rem',
    borderRadius: '1rem',
    background: '#111827',
    border: '1px solid #1f2937',
    boxShadow: '0 0 40px rgba(59,130,246,0.15)',
  },
  title: { color: '#f9fafb', fontSize: '2.5rem', margin: '0 0 0.5rem' },
  subtitle: { color: '#9ca3af', fontSize: '1rem', margin: '0 0 2rem' },
  badge: {
    display: 'inline-block',
    padding: '0.4rem 1rem',
    borderRadius: '9999px',
    background: '#1d4ed8',
    color: '#bfdbfe',
    fontSize: '0.85rem',
    marginBottom: '1.5rem',
  },
  hint: { color: '#4b5563', fontSize: '0.8rem', margin: 0 },
}
