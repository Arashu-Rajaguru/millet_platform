import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { CreditCard, MapPin, Truck, ShieldCheck, Map } from 'lucide-react';

export default function Checkout() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(10);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  const [shipping, setShipping] = useState({
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    zip: ''
  });
  const [locationCoords, setLocationCoords] = useState<{lat: number, lon: number} | null>(null);

  const [payment, setPayment] = useState({
    cardNumber: '', expiry: '', cvc: '', name: user?.name || ''
  });

  useEffect(() => {
    api.getProducts().then(products => {
      const target = products.find((p: any) => p.id === parseInt(productId || '0'));
      setProduct(target);
      setLoading(false);
    });
  }, [productId]);

  const deliveryDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric'
  });

  const generateMapIframe = () => {
    if (!locationCoords) return null;
    const {lat, lon} = locationCoords;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lon-0.01},${lat-0.01},${lon+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lon}`;
  };

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        setLocationCoords({lat, lon});
        
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          if (data.address) {
            setShipping({
              ...shipping,
              city: data.address.city || data.address.town || data.address.village || '',
              state: data.address.state || '',
              country: data.address.country || '',
              address: data.display_name.split(',')[0] || ''
            });
          }
        } catch (e) {
            console.error("Geocoding failed", e);
        }
      }, () => {
        alert("Location access denied or unavailable. Please ensure your browser permissions allow location access.");
      });
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity > product.quantity) {
        alert(`Cannot purchase more than available inventory (${product.quantity} kg).`);
        return;
    }
    setProcessing(true);
    try {
      await api.createTransaction({ product_id: product.id, quantity });
      alert("Payment Successful! Your order is secured on the blockchain ledger.");
      navigate('/profile');
    } catch (err: any) {
      alert(err.message || 'Payment processing failed. Transaction declined by ML fraud filter.');
      setProcessing(false);
    }
  };

  if (loading) return <div className="container"><p>Loading secure checkout algorithm...</p></div>;
  if (!product) return <div className="container"><p>Targeted asset not found.</p></div>;

  const total = (product.price * quantity).toFixed(2);
  const platformFee = (product.price * quantity * 0.02).toFixed(2); // 2% fee
  const finalTotal = (parseFloat(total) + parseFloat(platformFee)).toFixed(2);

  return (
    <div className="container animate-fade-in" style={{maxWidth: '1100px'}}>
      <h1 className="page-title">E-Commerce Market Checkout</h1>
      <p className="page-subtitle">Finalize your acquisition of premium {product.type}.</p>

      <div style={{display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap'}}>
        
        {/* Left Column - Forms */}
        <div style={{flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '24px'}}>
          
          <div className="glass-card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
              <h2 style={{display:'flex', alignItems:'center', gap:'8px', fontSize: '1.6rem'}}><MapPin size={22} color="var(--primary-color)"/> Shipping Destination</h2>
              <button type="button" className="btn btn-secondary" onClick={detectLocation} style={{padding: '8px 14px', fontSize: '0.85rem'}}>
                <Map size={16}/> Auto-Detect Coordinates
              </button>
            </div>
            
            {locationCoords && (
                <div className="animate-fade-in" style={{marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', height: '220px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'}}>
                    <iframe width="100%" height="100%" frameBorder="0" scrolling="no" src={generateMapIframe()!}></iframe>
                </div>
            )}

            <div className="grid">
              <div className="input-group" style={{gridColumn: '1 / -1'}}>
                <label className="input-label">Street Address</label>
                <input type="text" className="input-field" value={shipping.address} onChange={e=>setShipping({...shipping, address: e.target.value})} placeholder="123 Farm Lane" />
              </div>
              <div className="input-group">
                <label className="input-label">City</label>
                <input type="text" className="input-field" value={shipping.city} onChange={e=>setShipping({...shipping, city: e.target.value})} placeholder="Metropolis" />
              </div>
              <div className="input-group">
                <label className="input-label">State / Province</label>
                <input type="text" className="input-field" value={shipping.state} onChange={e=>setShipping({...shipping, state: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Postal / Zip Code</label>
                <input type="text" className="input-field" value={shipping.zip} onChange={e=>setShipping({...shipping, zip: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">Country</label>
                <input type="text" className="input-field" value={shipping.country} onChange={e=>setShipping({...shipping, country: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="glass-card">
            <h2 style={{marginBottom: '20px', display:'flex', alignItems:'center', gap:'8px', fontSize: '1.6rem'}}><CreditCard size={22} color="var(--primary-color)"/> Encrypted Payment</h2>
            <div className="grid">
              <div className="input-group" style={{gridColumn: '1 / -1'}}>
                <label className="input-label">Cardholder Identity</label>
                <input type="text" className="input-field" value={payment.name} onChange={e=>setPayment({...payment, name: e.target.value})} placeholder="JOHN DOE" />
              </div>
              <div className="input-group" style={{gridColumn: '1 / -1'}}>
                <label className="input-label">Card Number</label>
                <input type="text" className="input-field" value={payment.cardNumber} onChange={e=>setPayment({...payment, cardNumber: e.target.value})} placeholder="0000 0000 0000 0000" />
              </div>
              <div className="input-group">
                <label className="input-label">Expiry (MM/YY)</label>
                <input type="text" className="input-field" value={payment.expiry} onChange={e=>setPayment({...payment, expiry: e.target.value})} placeholder="MM/YY" />
              </div>
              <div className="input-group">
                <label className="input-label">CVC Security Code</label>
                <input type="password" maxLength={4} className="input-field" value={payment.cvc} onChange={e=>setPayment({...payment, cvc: e.target.value})} placeholder="123" />
              </div>
            </div>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '12px'}}>
               <ShieldCheck size={16} color="var(--success)"/> Financial transmission is end-to-end encrypted and aggressively shielded by AI anomaly detection modules.
            </p>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="glass-card" style={{flex: '1 1 360px', position: 'sticky', top: '100px', padding: '32px'}}>
            <h2 style={{marginBottom: '28px', fontSize: '1.8rem', letterSpacing: '-0.5px'}}>Order Summary</h2>
            
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.1rem'}}>
                <strong style={{color: 'var(--text-primary)'}}>{product.name}</strong>
                <span>${product.price}/kg</span>
            </div>
            
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', paddingBottom: '28px', borderBottom: '1px solid var(--glass-border)'}}>
                <span style={{color: 'var(--text-secondary)'}}>Negotiated Volume (kg)</span>
                <input type="number" min="1" max={product.quantity} className="input-field" style={{width: '100px', padding: '8px', fontWeight: 600}} value={quantity} onChange={e=>setQuantity(parseFloat(e.target.value) || 0)} />
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-secondary)'}}>
                <span>Crop Subtotal</span>
                <span>${total}</span>
            </div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '28px', color: 'var(--text-secondary)'}}>
                <span>Platform Assurance & ML Fee (2%)</span>
                <span>${platformFee}</span>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '36px', fontSize: '1.6rem', fontWeight: 700, color: 'var(--primary-color)'}}>
                <span>Grand Total</span>
                <span>${finalTotal}</span>
            </div>

            <div style={{padding: '20px', background: '#F6F4EB', borderRadius: '12px', marginBottom: '32px', border: '1px solid rgba(220, 169, 54, 0.2)'}}>
               <p style={{display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-primary)'}}><Truck size={20} color="var(--accent-gold)"/> Earliest Guaranteed Delivery</p>
               <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5}}>The logistics engine expects arrival by <strong style={{color: 'var(--text-primary)'}}>{deliveryDate}</strong> directly to your designated processing facility.</p>
            </div>

            <button className="btn" style={{width: '100%', padding: '16px', fontSize: '1.1rem', borderRadius: '12px', boxShadow: '0 8px 16px rgba(38, 92, 56, 0.2)'}} onClick={handleCheckout} disabled={processing || quantity <= 0}>
               {processing ? 'Processing Secure Hash...' : 'Complete Authenticated Purchase'}
            </button>
        </div>

      </div>
    </div>
  );
}
