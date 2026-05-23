import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Terms of Service</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>1. Acceptance of Terms</h2>
            <p>By creating an account or using ANOW ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the platform. The Platform reserves the right to modify these terms at any time. Continued use constitutes acceptance.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>2. Escrow Rules</h2>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>The buyer must fund the escrow before any transaction begins. Unfunded escrows will expire.</li>
              <li>The seller must deliver as described in the transaction agreement.</li>
              <li>The buyer must release funds promptly upon satisfactory delivery.</li>
              <li>Funds held in escrow are not accessible to either party until delivery is confirmed or a dispute is resolved.</li>
              <li>Platform escrow fees are non-refundable once a transaction is funded.</li>
              <li>Transactions may not be cancelled once funded without mutual agreement or admin intervention.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>3. User Responsibilities</h2>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Users are responsible for keeping their login credentials and recovery phrase secure.</li>
              <li>Users must provide accurate transaction descriptions. Misrepresentation is a violation.</li>
              <li>Users are responsible for verifying counterparty identity before creating escrows.</li>
              <li>Users must use accurate cryptocurrency wallet addresses for withdrawals. The Platform is not responsible for funds sent to incorrect addresses.</li>
              <li>Users must comply with all applicable laws and regulations in their jurisdiction.</li>
              <li>Account credentials must not be shared with or transferred to third parties.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>4. Prohibited Activities</h2>
            <div className="alert alert-danger">
              <div>
                <p style={{ fontWeight: 600, marginBottom: '0.625rem' }}>The following are strictly prohibited:</p>
                <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem' }}>
                  <li>Money laundering, terrorist financing, or other illegal financial activities</li>
                  <li>Fraud, scamming, or intentional misrepresentation</li>
                  <li>Creating multiple accounts to circumvent restrictions</li>
                  <li>Using the platform for illegal goods or services</li>
                  <li>Attempting to hack, exploit, or damage the Platform</li>
                  <li>Phishing or social engineering attacks against other users</li>
                  <li>Manipulating exchange rates or platform functions</li>
                  <li>Using automated bots to abuse the platform</li>
                </ul>
              </div>
            </div>
            <p style={{ marginTop: '0.875rem' }}>Violation of these prohibitions may result in immediate account suspension and forfeiture of funds, in addition to legal action where applicable.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>5. Dispute Procedures</h2>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Either party may open a dispute during an active escrow transaction.</li>
              <li>Disputes must be opened within the escrow period.</li>
              <li>All parties must submit evidence and cooperate with the review process.</li>
              <li>Admin decisions are final and binding. No appeals process exists.</li>
              <li>The Platform reserves the right to distribute escrow funds at its discretion in extreme cases of unresolvable disputes.</li>
              <li>Abuse of the dispute system may result in account suspension.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>6. Withdrawal Policy</h2>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Withdrawals are processed manually within 4 hours of submission.</li>
              <li>Funds are immediately held in a pending state upon withdrawal request.</li>
              <li>The Platform may reject withdrawals that appear suspicious or potentially fraudulent.</li>
              <li>Users are responsible for providing correct withdrawal addresses. Funds sent to incorrect addresses cannot be recovered.</li>
              <li>Minimum withdrawal amounts apply. Requests below minimums will be rejected.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>7. Fraud Prevention</h2>
            <p>The Platform employs anti-fraud measures including transaction monitoring, IP analysis, and behavioral patterns. Suspicious accounts may be temporarily frozen pending review. Users who engage in fraudulent behavior will be permanently banned and relevant authorities may be notified.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>8. Limitation of Liability</h2>
            <p style={{ marginBottom: '0.875rem' }}>The Platform provides escrow services on an "as is" basis. To the maximum extent permitted by law:</p>
            <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>The Platform is not liable for losses resulting from user error, including incorrect withdrawal addresses.</li>
              <li>The Platform is not liable for losses due to market volatility in cryptocurrency values.</li>
              <li>The Platform is not liable for blockchain network delays or failures.</li>
              <li>The Platform is not liable for losses resulting from compromised user credentials.</li>
              <li>Total liability is limited to the amount of funds held in the relevant escrow transaction.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>9. Account Termination</h2>
            <p>The Platform reserves the right to suspend or terminate accounts that violate these terms, without prior notice. Suspended accounts may have funds frozen pending investigation. Users may request account deletion by contacting support, subject to completion of all pending transactions.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.875rem' }}>10. Governing Law</h2>
            <p>These terms are governed by applicable international law. Users are responsible for compliance with the laws of their own jurisdiction. By using this platform, you acknowledge that cryptocurrency transactions may be regulated differently in your country.</p>
          </section>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Home</Link>
          <Link to="/faq" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>FAQ</Link>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
