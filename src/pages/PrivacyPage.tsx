import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>1. Our Commitment to Privacy</h2>
            <p>ANOW is designed from the ground up as a privacy-first platform. We believe that users have the right to financial privacy and anonymous transactions. This policy outlines exactly what information we collect, how we use it, and what we never collect.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>2. Information We Collect</h2>
            <p style={{ marginBottom: '0.875rem' }}>We collect only the minimum necessary to operate the escrow service:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li><strong style={{ color: 'var(--text-primary)' }}>Username:</strong> A self-chosen display name. This is your only identity on the platform.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Password Hash:</strong> A cryptographic hash of your password. We never store your plaintext password.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Recovery Phrase Hash:</strong> A hash of your recovery phrase for account recovery purposes.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Wallet Balances:</strong> Cryptocurrency balances held by the platform on your behalf.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Transaction Records:</strong> Records of escrow transactions, deposits, and withdrawals necessary to operate the service.</li>
              <li><strong style={{ color: 'var(--text-primary)' }}>Messages:</strong> Messages sent within escrow transactions and dispute cases.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>3. Information We Do NOT Collect</h2>
            <div className="alert alert-success">
              <div>
                <p style={{ marginBottom: '0.625rem', fontWeight: 600 }}>We explicitly do not collect:</p>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <li>Real name or legal identity</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Government-issued ID or KYC documents</li>
                  <li>Physical address or location data</li>
                  <li>IP addresses (beyond standard server logs)</li>
                  <li>Browser fingerprint or tracking data</li>
                  <li>Social media profiles</li>
                  <li>Financial history outside this platform</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>4. How We Use Your Information</h2>
            <p style={{ marginBottom: '0.875rem' }}>The limited information we collect is used solely to:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Authenticate your account and manage sessions</li>
              <li>Maintain your cryptocurrency wallet balances</li>
              <li>Process and track escrow transactions</li>
              <li>Handle disputes and communicate admin decisions</li>
              <li>Process deposit and withdrawal requests</li>
              <li>Send platform notifications within the system</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>5. Data Sharing</h2>
            <p>We do not sell, trade, rent, or share your data with third parties for marketing or commercial purposes. Your information may only be disclosed:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
              <li>When required by law, court order, or regulatory authority</li>
              <li>To prevent imminent harm or fraud</li>
              <li>To other parties in your escrow transaction (username only, for transaction completion)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>6. Data Security</h2>
            <p>We implement industry-standard security measures including:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
              <li>All passwords are hashed using cryptographic algorithms — never stored in plain text</li>
              <li>Database queries are parameterized to prevent SQL injection</li>
              <li>All platform communications are encrypted via HTTPS/TLS</li>
              <li>CSRF tokens protect all state-changing operations</li>
              <li>Session tokens are rotated regularly</li>
              <li>Admin actions are fully logged for accountability</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.875rem' }}>
              <li>Request deletion of your account and associated data</li>
              <li>Know what data we hold about your username</li>
              <li>Update your preferences at any time from your profile</li>
            </ul>
            <p style={{ marginTop: '0.875rem' }}>To exercise these rights, open a support request from within the platform.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>8. Cookies and Tracking</h2>
            <p>We use only essential functional storage (browser localStorage) to maintain your session and preferences. We do not use tracking cookies, analytics, or advertising pixels.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>9. Changes to This Policy</h2>
            <p>We may update this privacy policy periodically. Continued use of the platform after changes are posted constitutes acceptance of the revised policy.</p>
          </section>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Home</Link>
          <Link to="/faq" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>FAQ</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
