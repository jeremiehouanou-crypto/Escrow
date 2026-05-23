import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Info, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Currency, FiatCurrency } from '../lib/supabase';

const currencies: Currency[] = ['BTC', 'USDT_TRC20', 'USDT_ERC20'];
const fiatCurrencies: FiatCurrency[] = ['USD', 'EUR', 'GBP'];
const fiatSymbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£' };

export default function NewEscrow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [sellerUsername, setSellerUsername] = useState('');
  const [description, setDescription] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState<FiatCurrency>('USD');
  const [currency, setCurrency] = useState<Currency>('BTC');
  const [deliveryDays, setDeliveryDays] = useState('7');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [sellerId, setSellerId] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [feePercent, setFeePercent] = useState(1.5);

  useEffect(() => { loadRatesAndSettings(); }, []);

  async function loadRatesAndSettings() {
    const [ratesRes, settingsRes] = await Promise.all([
      supabase.from('exchange_rates').select('*'),
      supabase.from('platform_settings').select('key, value').in('key', ['platform_fee_percent']),
    ]);
    if (ratesRes.data) {
      const map: Record<string, number> = {};
      ratesRes.data.forEach((r: { base_currency: string; quote_currency: string; rate: number }) => {
        map[`${r.base_currency}_${r.quote_currency}`] = r.rate;
      });
      setRates(map);
    }
    if (settingsRes.data) {
      const fee = settingsRes.data.find(s => s.key === 'platform_fee_percent');
      if (fee) setFeePercent(parseFloat(fee.value));
    }
  }

  function getRate(): number {
    const base = currency === 'BTC' ? 'BTC' : 'USDT';
    return rates[`${base}_${fiatCurrency}`] || 0;
  }

  function getCryptoAmount(): number {
    const rate = getRate();
    if (!rate || !fiatAmount) return 0;
    return parseFloat(fiatAmount) / rate;
  }

  function getFee(): number { return getCryptoAmount() * (feePercent / 100); }
  function getTotal(): number { return getCryptoAmount() + getFee(); }

  async function lookupSeller() {
    setError('');
    if (!sellerUsername.trim()) { setError('Enter a seller username.'); return; }
    if (sellerUsername.toLowerCase() === user?.username) { setError('You cannot create an escrow with yourself.'); return; }
    const { data } = await supabase.from('users').select('id, username').eq('username', sellerUsername.toLowerCase()).maybeSingle();
    if (!data) { setError('Seller not found. Check the username.'); return; }
    setSellerId(data.id);
    const { data: w } = await supabase.from('wallets').select('available_balance').eq('user_id', user!.id).eq('currency', currency).maybeSingle();
    setWalletBalance(w?.available_balance || 0);
    setStep(2);
  }

  async function handleSubmit() {
    setError('');
    if (!fiatAmount || parseFloat(fiatAmount) <= 0) { setError('Enter a valid fiat amount.'); return; }
    const total = getTotal();
    if (total > walletBalance) {
      setError(`Insufficient balance. You need ${total.toFixed(8)} ${currency} but have ${walletBalance.toFixed(8)}.`);
      return;
    }
    setLoading(true);

    const { data: escrow, error: escrowError } = await supabase
      .from('escrow_transactions')
      .insert({
        buyer_id: user!.id, seller_id: sellerId,
        currency, amount_crypto: getCryptoAmount(),
        amount_fiat: parseFloat(fiatAmount), fiat_currency: fiatCurrency,
        exchange_rate: getRate(), description, delivery_days: parseInt(deliveryDays),
        platform_fee: getFee(), status: 'funded',
      })
      .select().single();

    if (escrowError || !escrow) {
      setError('Failed to create escrow. Please try again.');
      setLoading(false);
      return;
    }

    // Deduct from buyer wallet
    await supabase.from('wallets').update({
      available_balance: walletBalance - total,
      escrow_balance: (walletBalance - total >= 0 ? getCryptoAmount() : 0),
    }).eq('user_id', user!.id).eq('currency', currency);

    // Move to escrow balance
    const { data: buyerWallet } = await supabase.from('wallets').select('escrow_balance, available_balance').eq('user_id', user!.id).eq('currency', currency).maybeSingle();
    if (buyerWallet) {
      await supabase.from('wallets').update({
        available_balance: buyerWallet.available_balance - total,
        escrow_balance: buyerWallet.escrow_balance + getCryptoAmount(),
      }).eq('user_id', user!.id).eq('currency', currency);
    }

    // Notify seller
    await supabase.from('notifications').insert({
      user_id: sellerId, type: 'escrow_funded',
      title: 'New Escrow Order',
      message: `${user!.username} has created an escrow for ${getCryptoAmount().toFixed(8)} ${currency}.`,
      link: `/escrow/${escrow.id}`,
    });

    navigate(`/escrow/${escrow.id}`);
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Create New Escrow</h1>
        <p>Secure funds between buyer and seller</p>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', alignItems: 'center' }}>
        {[1, 2, 3].map((s, i) => (
          <>
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: step >= s ? 'var(--accent)' : 'var(--bg-hover)',
                border: `2px solid ${step >= s ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem',
                color: step >= s ? '#fff' : 'var(--text-muted)',
              }}>{s}</div>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                {['Find Seller', 'Set Terms', 'Confirm'][i]}
              </span>
            </div>
            {i < 2 && <ArrowRight size={14} color="var(--text-muted)" />}
          </>
        ))}
      </div>

      <div style={{ maxWidth: 520 }}>
        {error && <div className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>{error}</div>}

        {step === 1 && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Find Seller</h3>
            <div className="form-group">
              <label className="label">Seller Username</label>
              <input type="text" className="input" placeholder="seller_username" value={sellerUsername} onChange={e => setSellerUsername(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="label">Payment Currency</label>
              <select className="input" value={currency} onChange={e => setCurrency(e.target.value as Currency)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                {currencies.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <button onClick={lookupSeller} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              Continue <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Set Escrow Terms</h3>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.875rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Seller</div>
              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>@{sellerUsername}</div>
            </div>
            <div className="form-group">
              <label className="label">Description / Product</label>
              <textarea className="input" rows={3} placeholder="Describe what you are purchasing..." value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical', minHeight: 80 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="label">Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {fiatSymbols[fiatCurrency]}
                  </span>
                  <input type="number" className="input" style={{ paddingLeft: '1.75rem' }} placeholder="100.00" value={fiatAmount} onChange={e => setFiatAmount(e.target.value)} min="0" step="any" />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Currency</label>
                <select className="input" value={fiatCurrency} onChange={e => setFiatCurrency(e.target.value as FiatCurrency)} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {fiatCurrencies.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Delivery Time (Days)</label>
              <input type="number" className="input" value={deliveryDays} onChange={e => setDeliveryDays(e.target.value)} min="1" max="90" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button onClick={() => { if (!description || !fiatAmount) { setError('Fill in all fields.'); return; } setError(''); setStep(3); }} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                Review <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="card">
            <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>Confirm & Fund Escrow</h3>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: 10, padding: '1.25rem', marginBottom: '1.25rem' }}>
              {[
                { label: 'Seller', value: `@${sellerUsername}` },
                { label: 'Description', value: description },
                { label: 'Fiat Amount', value: `${fiatSymbols[fiatCurrency]}${fiatAmount} ${fiatCurrency}` },
                { label: 'Exchange Rate', value: `1 ${currency === 'BTC' ? 'BTC' : 'USDT'} = ${fiatSymbols[fiatCurrency]}${getRate().toLocaleString()}` },
                { label: 'Crypto Amount', value: `${getCryptoAmount().toFixed(8)} ${currency}` },
                { label: `Platform Fee (${feePercent}%)`, value: `${getFee().toFixed(8)} ${currency}` },
                { label: 'Delivery Days', value: `${deliveryDays} days` },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0 0', fontSize: '1rem', fontWeight: 800 }}>
                <span style={{ color: 'var(--text-primary)' }}>Total Deducted</span>
                <span style={{ color: 'var(--accent)' }}>{getTotal().toFixed(8)} {currency}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Your {currency} Balance</span>
              <span style={{ color: getTotal() > walletBalance ? 'var(--danger)' : 'var(--success)', fontWeight: 700 }}>
                {walletBalance.toFixed(8)} {currency}
              </span>
            </div>

            {getTotal() > walletBalance && (
              <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                Insufficient balance. Please deposit more {currency}.
              </div>
            )}

            <div className="alert alert-info" style={{ marginBottom: '1.25rem' }}>
              <Info size={16} style={{ flexShrink: 0 }} />
              Funds will be locked in escrow until you confirm delivery or a dispute is resolved.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setStep(2)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Back</button>
              <button onClick={handleSubmit} className="btn btn-success" style={{ flex: 2, justifyContent: 'center' }} disabled={loading || getTotal() > walletBalance}>
                {loading ? <span className="spinner" /> : <><ShieldCheck size={16} /> Fund Escrow</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
