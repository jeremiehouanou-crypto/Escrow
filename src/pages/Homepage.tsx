import { Link } from 'react-router-dom';
import {
  Shield, Lock, Zap, Globe, CheckCircle, ArrowRight,
  Bitcoin, TrendingUp, MessageSquare, AlertCircle, ChevronDown
} from 'lucide-react';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

const steps = [
  { n: 1, title: 'Create Account', desc: 'Register with just a username and password. No personal info required.' },
  { n: 2, title: 'Deposit Crypto', desc: 'Deposit BTC or USDT to your secure wallet balance.' },
  { n: 3, title: 'Create Escrow', desc: 'Enter seller username, amount, and description. Funds are locked instantly.' },
  { n: 4, title: 'Receive & Confirm', desc: 'Once satisfied, confirm delivery and funds release to the seller automatically.' },
];

const features = [
  { icon: Lock, title: 'Fully Anonymous', desc: 'No email, phone, or ID required. Just a username and password.' },
  { icon: Shield, title: 'Funds Protected', desc: 'Crypto stays locked in escrow until you confirm delivery.' },
  { icon: Zap, title: 'Instant Release', desc: 'Payment released to seller within seconds of confirmation.' },
  { icon: MessageSquare, title: 'Built-in Messaging', desc: 'Secure messages between buyer and seller inside each trade.' },
  { icon: AlertCircle, title: 'Dispute Resolution', desc: 'Admin mediation if parties cannot agree. Fair outcomes guaranteed.' },
  { icon: Globe, title: 'Multi-Currency', desc: 'BTC, USDT TRC20, USDT ERC20 — choose what works for you.' },
];

const faqs = [
  { q: 'What is escrow?', a: 'Escrow is a neutral holding service. Buyer funds are locked until delivery is confirmed, protecting both parties from fraud.' },
  { q: 'Is identity verification required?', a: 'No. ANOW requires only a username and password. No email, phone, ID, or KYC is ever required.' },
  { q: 'How do deposits work?', a: 'After registering, go to your Wallet to find your deposit address. Send BTC or USDT to that address. Funds appear after blockchain confirmations.' },
  { q: 'How long do withdrawals take?', a: 'Withdrawals are processed manually within 4 hours of submission. Funds are held in pending status immediately upon request.' },
  { q: 'What happens if there is a dispute?', a: 'Either party can open a dispute. An administrator reviews the submitted evidence and messages, then makes a binding decision.' },
  { q: 'Which cryptocurrencies are supported?', a: 'Bitcoin (BTC), Tether on TRON (USDT TRC20), and Tether on Ethereum (USDT ERC20).' },
];

const testimonials = [
  { user: 'merchant_99', text: 'Finally a platform where I can trade without giving away my identity. The escrow system is solid and payments release instantly.' },
  { user: 'crypto_hawk', text: 'Used this for multiple trades. The dispute resolution was fair and the admin responded quickly. Highly recommended.' },
  { user: 'anon_trader', text: 'Simple, clean, and anonymous. The multi-currency support is exactly what I needed for my business.' },
];

export default function Homepage() {
  const [rates, setRates] = useState<{ base: string; quote: string; rate: number }[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    supabase.from('exchange_rates').select('*').then(({ data }) => {
      if (data) setRates(data.map((r: { base_currency: string; quote_currency: string; rate: number }) => ({ base: r.base_currency, quote: r.quote_currency, rate: r.rate })));
    });
  }, []);

  const fiatSymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      {/* Live rates ticker */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: '0.5rem 0', overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: '2rem', padding: '0 2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {rates.map(r => (
            <div key={`${r.base}-${r.quote}`} style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', fontSize: '0.8rem' }}>
              <span style={{ color: r.base === 'BTC' ? '#f7931a' : '#26a17b', fontWeight: 700 }}>{r.base}/{r.quote}</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>
                {fiatSymbols[r.quote]}{Number(r.rate).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero-gradient" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-dim)', border: '1px solid var(--accent)', borderRadius: 999, padding: '0.375rem 1rem', marginBottom: '1.5rem' }}>
            <Shield size={14} color="var(--accent)" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent)' }}>Secure · Anonymous · Decentralized</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '1.25rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Trusted Crypto Escrow<br />
            <span className="gradient-text">No Identity Required</span>
          </h1>

          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            Lock funds securely between buyer and seller using Bitcoin, USDT TRC20, or USDT ERC20.
            Anonymous. No KYC. No email.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free <ArrowRight size={18} />
            </Link>
            <Link to="/faq" className="btn btn-ghost btn-lg">
              Learn More
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem', flexWrap: 'wrap' }}>
            {[
              { label: 'No KYC', icon: '✓' },
              { label: 'No Email', icon: '✓' },
              { label: 'Instant Release', icon: '✓' },
              { label: 'Dispute Protection', icon: '✓' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>How It Works</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Trade securely in 4 simple steps</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {steps.map(step => (
              <div key={step.n} className="glass-card" style={{ textAlign: 'center' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
                  {step.n}
                </div>
                <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{step.title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported currencies */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Supported Cryptocurrencies</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[
              { symbol: 'B', name: 'Bitcoin', abbr: 'BTC', color: '#f7931a', bg: 'rgba(247,147,26,0.1)', desc: 'The original cryptocurrency. Accepted globally with highest liquidity.' },
              { symbol: 'T', name: 'USDT TRC20', abbr: 'USDT · TRON', color: '#26a17b', bg: 'rgba(38,161,123,0.1)', desc: 'Stable dollar-pegged token on the TRON network. Fast and low-fee.' },
              { symbol: 'T', name: 'USDT ERC20', abbr: 'USDT · Ethereum', color: '#627EEA', bg: 'rgba(98,126,234,0.1)', desc: 'Stable dollar-pegged token on Ethereum. Widely supported.' },
            ].map(c => (
              <div key={c.name} className="card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: c.bg, border: `2px solid ${c.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: c.color, flexShrink: 0 }}>
                  {c.symbol}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: c.color, fontWeight: 600, marginBottom: 6 }}>{c.abbr}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Why Choose ANOW</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {features.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="glass-card">
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <Icon size={20} color="var(--accent)" />
                  </div>
                  <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{f.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '4rem 1.5rem', background: 'var(--bg-secondary)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '2.5rem' }}>What Users Say</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {testimonials.map(t => (
              <div key={t.user} className="card">
                <div style={{ fontSize: '1.25rem', color: 'var(--warning)', marginBottom: '0.75rem' }}>★★★★★</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem' }}>"{t.text}"</p>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>@{t.user}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '5rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center', marginBottom: '2.5rem' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, i) => (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.125rem 1.5rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: '1rem' }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9375rem' }}>{faq.q}</span>
                  <ChevronDown size={18} color="var(--text-muted)" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '4rem 1.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(14,165,233,0.1), transparent)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem' }}>Start Trading Anonymously</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>No email. No phone. No ID. Just a username and you're in.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--accent)" />
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>ANOW</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/faq" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>FAQ</Link>
            <Link to="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/terms" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} ANOW. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
