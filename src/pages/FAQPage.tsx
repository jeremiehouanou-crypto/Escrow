import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Shield } from 'lucide-react';
import Navbar from '../components/Navbar';

const categories = [
  {
    title: 'General',
    items: [
      { q: 'What is ANOW?', a: 'ANOW is an anonymous escrow service for cryptocurrency transactions. It acts as a neutral third party, holding buyer funds securely until delivery is confirmed by the buyer.' },
      { q: 'Who can use this platform?', a: 'Anyone with a cryptocurrency wallet can use the platform. No personal identification is required — only a username and password.' },
      { q: 'Is identity verification required?', a: 'No. The platform does not require any personal information. There is no email verification, phone number, real name, address, or KYC document required.' },
      { q: 'Can I stay anonymous?', a: 'Yes. Your only identity on the platform is your username. We do not collect or store any personal identifying information.' },
    ],
  },
  {
    title: 'Escrow',
    items: [
      { q: 'What is escrow?', a: 'Escrow protects both buyers and sellers by holding funds in a neutral account until delivery is confirmed. This prevents fraud and ensures both parties fulfill their obligations before money changes hands.' },
      { q: 'How do I create an escrow?', a: 'Go to your dashboard and click "New Escrow". Enter the seller\'s username, the amount in your preferred fiat currency, and a description of what you\'re purchasing. The system automatically calculates the crypto equivalent.' },
      { q: 'What happens after I create an escrow?', a: 'Funds are immediately locked from your wallet balance into escrow. The seller is notified and can see the transaction in their dashboard. Once the seller delivers, you confirm and funds are released.' },
      { q: 'Who can release escrow funds?', a: 'Only the buyer can release funds by confirming delivery. Funds can also be released by an admin in case of dispute resolution.' },
      { q: 'What are the escrow statuses?', a: 'Awaiting Funding → Funded → In Progress → Delivered → Completed. A transaction can also become Disputed, Refunded, or Cancelled depending on circumstances.' },
    ],
  },
  {
    title: 'Deposits & Withdrawals',
    items: [
      { q: 'How do deposits work?', a: 'Each user has a unique deposit address for each cryptocurrency. Send crypto directly to your deposit address from any external wallet. Funds appear in your balance after the required number of blockchain confirmations (3 for BTC, 12 for USDT).' },
      { q: 'How do withdrawals work?', a: 'Submit a withdrawal request specifying the amount, currency, and your destination wallet address. Funds are immediately moved to a pending hold and processed within 4 hours.' },
      { q: 'How long do withdrawals take?', a: 'Withdrawals are processed manually by our team within 4 hours of submission. You will receive a notification when your withdrawal has been sent.' },
      { q: 'What is the minimum withdrawal?', a: 'Minimum withdrawal amounts vary by currency. BTC minimum is 0.0001 BTC, USDT minimum is 10 USDT.' },
      { q: 'Are there withdrawal fees?', a: 'Network transaction fees may apply. These are deducted from the withdrawal amount. No additional platform fees are charged for withdrawals.' },
    ],
  },
  {
    title: 'Disputes',
    items: [
      { q: 'How do disputes work?', a: 'Either the buyer or seller can open a dispute if they cannot reach an agreement. An administrator reviews all submitted messages, attachments, and evidence, then makes a final binding decision.' },
      { q: 'Who resolves disputes?', a: 'An independent admin reviews the case and all evidence. Their decision is final and binding on both parties.' },
      { q: 'What evidence should I submit in a dispute?', a: 'Submit any relevant proof: screenshots, photos, messages, tracking numbers, or any documentation that supports your claim. The more evidence, the better the admin can evaluate the case.' },
      { q: 'How long does dispute resolution take?', a: 'We aim to resolve all disputes within 24-48 hours. Complex cases may take longer. You will be notified once a decision is made.' },
    ],
  },
  {
    title: 'Security',
    items: [
      { q: 'Is my crypto safe?', a: 'Yes. Escrow funds are held securely and only released when delivery is confirmed or a dispute is resolved. Passwords are securely hashed and never stored in plain text.' },
      { q: 'What happens if I forget my password?', a: 'You can recover your account using your recovery phrase, which is generated during registration. If you lose both your password and recovery phrase, your account cannot be recovered.' },
      { q: 'What is the recovery phrase?', a: 'A recovery phrase is a sequence of 7 random words generated when you register. Store it safely offline — it is the only way to recover your account if you forget your password.' },
      { q: 'What if the platform gets hacked?', a: 'We implement industry-standard security practices including encrypted data, SQL injection protection, XSS protection, and CSRF tokens. Funds in active escrow are tracked in the database and can be restored.' },
    ],
  },
];

export default function FAQPage() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem' }}>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem' }}>Everything you need to know about ANOW</p>
        </div>

        {categories.map(cat => (
          <div key={cat.title} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--accent)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {cat.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {cat.items.map((item, i) => {
                const key = `${cat.title}-${i}`;
                const isOpen = openItem === key;
                return (
                  <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <button
                      onClick={() => setOpenItem(isOpen ? null : key)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.125rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{item.q}</span>
                      <ChevronDown size={18} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                    </button>
                    {isOpen && (
                      <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="card" style={{ textAlign: 'center', background: 'var(--accent-dim)', borderColor: 'var(--accent)' }}>
          <Shield size={32} color="var(--accent)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Still have questions?</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Open a dispute or contact us through the platform messaging system.
          </p>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </div>
      </div>

      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Home</Link>
          <Link to="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
}
