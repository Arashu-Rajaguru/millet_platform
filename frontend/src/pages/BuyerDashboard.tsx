import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, API_URL } from '../services/api';
import { ShoppingCart, ShieldCheck, Activity, Filter, User } from 'lucide-react';

export default function BuyerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedFarmer, setSelectedFarmer] = useState<any>(null);
  
  const [filterType, setFilterType] = useState('All');
  const [sortOrder, setSortOrder] = useState('none');

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const displayedProducts = products
    .filter(p => filterType === 'All' || p.type === filterType)
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  return (
    <div className="container animate-fade-in">
      <h1 className="page-title">Digital Marketplace</h1>
      <p className="page-subtitle">Browse transparent, ML-verified millet crops.</p>

      {/* FILTER AND SORT BAR */}
      <div className="glass-card" style={{display: 'flex', gap: '24px', marginBottom: '24px', alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <Filter size={18} color="var(--text-secondary)" />
          <label className="input-label" style={{marginBottom: 0}}>Category:</label>
          <select className="input-field" style={{width: '200px', padding: '8px 12px', marginBottom: 0}} value={filterType} onChange={e=>setFilterType(e.target.value)}>
            <option value="All">All Types</option>
            <option value="Pearl Millet">Pearl Millet</option>
            <option value="Finger Millet">Finger Millet</option>
            <option value="Foxtail Millet">Foxtail Millet</option>
            <option value="Sorghum">Sorghum</option>
          </select>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <label className="input-label" style={{marginBottom: 0}}>Sort Price:</label>
          <select className="input-field" style={{width: '200px', padding: '8px 12px', marginBottom: 0}} value={sortOrder} onChange={e=>setSortOrder(e.target.value)}>
            <option value="none">Default</option>
            <option value="asc">Lowest to Highest</option>
            <option value="desc">Highest to Lowest</option>
          </select>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="grid">
          {displayedProducts.map(product => (
            <div key={product.id} className="glass-card" style={{display: 'flex', flexDirection: 'column'}}>
              <h3>{product.name} <span style={{fontSize: '1rem', color: 'var(--text-secondary)'}}>({product.type})</span></h3>
              
              <div style={{marginTop: '16px', flex: 1}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                    <strong>Listing Price:</strong>
                    <span>${product.price}/kg</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
                    <strong>Total Available:</strong>
                    <span>{product.quantity} kg</span>
                </div>

                <div style={{marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#F9FAF8', borderRadius: '8px', border: '1px solid #E0E4DE'}}>
                  <User size={16} color="var(--primary-color)"/>
                  <span style={{fontSize: '0.9rem', color: 'var(--text-secondary)'}}>Cultivator:</span>
                  <button className="btn btn-secondary" style={{padding: '4px 12px', fontSize: '0.85rem', borderRadius: '8px', fontWeight: 600}} onClick={() => setSelectedFarmer(product.farmer)}>
                    {product.farmer.name}
                  </button>
                </div>
                {product.certification_file_url && (
                    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px'}}>
                        <strong>Certificate:</strong>
                        <a href={`${API_URL}${product.certification_file_url}`} target="_blank" rel="noreferrer" style={{color: 'var(--primary-color)'}}>View Document</a>
                    </div>
                )}
              </div>

              <div style={{padding: '16px', background: 'rgba(38, 92, 56, 0.04)', borderRadius: '12px', border: '1px solid rgba(38, 92, 56, 0.1)', margin: '16px 0'}}>
                <h4 style={{fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)'}}><Activity size={16}/> AI Insights</h4>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '8px'}}>
                    <span style={{color: 'var(--text-secondary)'}}>Predicted Quality:</span>
                    <span className={`badge ${product.quality==='High'?'badge-success':'badge-warning'}`}>{product.quality}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem'}}>
                    <span style={{color: 'var(--text-secondary)'}}>Algorithm Fair Price:</span>
                    <strong style={{color: 'var(--accent-gold)'}}>${product.predicted_price}/kg</strong>
                </div>
              </div>

              <div style={{fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '16px', wordBreak: 'break-all'}}>
                <ShieldCheck size={12} style={{verticalAlign: 'middle', marginRight: '4px'}}/>
                Trace ID: {product.trace_id}
              </div>

              <button 
                className="btn" 
                style={{width: '100%'}} 
                onClick={() => navigate(`/checkout/${product.id}`)}
                disabled={product.quantity < 1}
              >
                <ShoppingCart size={18} /> Proceed to Checkout
              </button>
            </div>
          ))}
          {displayedProducts.length === 0 && <p>No products match your filters.</p>}
        </div>
      )}

      {/* FARMER PROFILE OVERLAY */}
      {selectedFarmer && (
        <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(26, 36, 27, 0.5)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', backdropFilter: 'blur(4px)' }}>
           <div className="glass-card animate-fade-in" style={{width: '90%', maxWidth: '420px', background: '#FFFFFF', boxShadow: '0 24px 64px rgba(26, 36, 27, 0.2)'}}>
              <h2 style={{display: 'flex', alignItems: 'center', gap: '8px'}}><User color="var(--primary-color)"/> Farmer Public ID</h2>
              <p style={{fontSize: '1.4rem', fontWeight: 600, marginTop: '20px', color: 'var(--text-primary)'}}>{selectedFarmer.name}</p>
              
              <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
                 <span style={{color: 'var(--text-secondary)'}}>Community Trust Rank:</span>
                 <span className="badge badge-warning">{selectedFarmer.trust_score.toFixed(1)} / 100</span>
              </div>
              
              <hr style={{margin: '20px 0', borderColor: 'var(--glass-border)'}}/>
              
              <p style={{marginBottom: '12px', fontSize: '0.95rem'}}><strong>Registered Location:</strong> {selectedFarmer.city}, {selectedFarmer.state}, {selectedFarmer.country}</p>
              <p style={{marginBottom: '12px', fontSize: '0.95rem'}}><strong>Direct Contact:</strong> {selectedFarmer.contact_number || 'Kept Confidential via Platform'}</p>
              
              <div style={{marginTop: '32px', display: 'flex', justifyContent: 'flex-end'}}>
                 <button className="btn" onClick={() => setSelectedFarmer(null)}>Close Profile View</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}
