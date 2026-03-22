import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Tag, ShieldCheck, Box, Filter, Edit2, Save, X, Bell } from 'lucide-react';

export default function FarmerDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    name: '', type: 'Pearl Millet', quantity: '', price: ''
  });
  const [certFile, setCertFile] = useState<File | null>(null);

  const [filterType, setFilterType] = useState('All');
  const [sortOrder, setSortOrder] = useState('none');

  // New States for confirmation and editing
  const [confirmData, setConfirmData] = useState<any>(null);
  const [editingParams, setEditingParams] = useState<{ id: number, price: string } | null>(null);

  // New State for Notifications polling
  const [recentSales, setRecentSales] = useState<any[]>([]);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      const userData = await api.getMe();
      setProducts(data.filter((p: any) => p.farmer_id === userData.id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
        const txs = await api.getTransactions();
        // Since transactions return strictly seller's history when role is Farmer
        setRecentSales(txs.slice(0, 3)); 
    } catch (e) {
        console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // 10s short-polling
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const certStatus = certFile ? 'Approved' : 'Pending';
      const prediction = await api.predictPrice(formData.type, parseFloat(formData.quantity), certStatus);
      setConfirmData({
         ...formData,
         ml_suggested_price: prediction.predicted_price
      });
    } catch (err) {
      console.error(err);
      setConfirmData(formData);
    }
  };

  const confirmSubmit = async () => {
    try {
      let fileUrl = null;
      if (certFile) {
        const uploadRes = await api.uploadFile(certFile);
        fileUrl = uploadRes.url;
      }
      
      await api.createProduct({
        ...confirmData,
        quantity: parseFloat(confirmData.quantity),
        price: parseFloat(confirmData.price),
        certification_file_url: fileUrl
      });
      setShowAdd(false);
      setConfirmData(null);
      setFormData({ name: '', type: 'Pearl Millet', quantity: '', price: '' });
      setCertFile(null);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Error creating product");
    }
  };

  const handleUpdatePrice = async (id: number) => {
    if (!editingParams) return;
    try {
        await api.updateProduct(id, { price: parseFloat(editingParams.price) });
        setEditingParams(null);
        fetchProducts();
    } catch (e: any) {
        alert(e.message || "Failed to update price");
    }
  };

  const displayedProducts = products
    .filter(p => filterType === 'All' || p.type === filterType)
    .sort((a, b) => {
      if (sortOrder === 'asc') return a.price - b.price;
      if (sortOrder === 'desc') return b.price - a.price;
      return 0;
    });

  return (
    <div className="container animate-fade-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px'}}>
        <div>
          <h1 className="page-title">Farmer Dashboard</h1>
          <p className="page-subtitle">Manage your millet inventory and view ML insights</p>
        </div>
        {!showAdd && (
          <button className="btn" onClick={() => setShowAdd(true)}>
            <Plus size={20} /> Add Product
          </button>
        )}
      </div>

      {recentSales.length > 0 && (
          <div className="animate-fade-in" style={{marginBottom: '32px', background: '#ecfdf5', border: '1px solid #10b981', padding: '20px', borderRadius: '12px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.15)'}}>
            <h3 style={{display:'flex', alignItems:'center', gap:'10px', color:'var(--success)', marginBottom: '16px'}}>
               <Bell size={24} fill="var(--success)"/> Market Notifications (Recent Sales)
            </h3>
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                {recentSales.map(tx => (
                     <div key={tx.id} style={{padding: '12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', borderLeft: '4px solid var(--success)'}}>
                         <p style={{fontSize: '1.05rem', color: 'var(--text-primary)'}}>
                             🎉 Your product <strong>{tx.product?.name}</strong> was just purchased by <strong style={{color: 'var(--primary-color)'}}>{tx.buyer?.name}</strong>!
                         </p>
                         <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px'}}>
                             Volume: {tx.quantity} kg | Revenue: <strong>${tx.amount.toFixed(2)}</strong> | Triggered: {new Date(tx.timestamp).toLocaleString()}
                         </p>
                     </div>
                ))}
            </div>
          </div>
      )}

      {showAdd && (
        <div className="glass-card" style={{marginBottom: '32px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
            <h3>Add New Crop</h3>
            <button className="btn btn-secondary" style={{padding: '6px'}} onClick={() => setShowAdd(false)}>
               <X size={18} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid">
            <div className="input-group">
              <label className="input-label">Product Name</label>
              <input type="text" className="input-field" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">Millet Type</label>
              <select className="input-field" value={formData.type} onChange={e=>setFormData({...formData, type: e.target.value})}>
                <option value="Pearl Millet">Pearl Millet</option>
                <option value="Finger Millet">Finger Millet</option>
                <option value="Foxtail Millet">Foxtail Millet</option>
                <option value="Sorghum">Sorghum</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Quantity (kg)</label>
              <input type="number" step="0.1" className="input-field" value={formData.quantity} onChange={e=>setFormData({...formData, quantity: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">Price per kg ($)</label>
              <input type="number" step="0.01" className="input-field" value={formData.price} onChange={e=>setFormData({...formData, price: e.target.value})} required />
            </div>
            <div className="input-group">
              <label className="input-label">Certification (PDF/Image)</label>
              <input type="file" className="input-field" onChange={e => setCertFile(e.target.files?.[0] || null)} accept=".pdf,.png,.jpg,.jpeg" />
            </div>
            <div className="input-group" style={{display: 'flex', alignItems: 'flex-end'}}>
              <button type="submit" className="btn" style={{width: '100%'}}>Proceed to Verify</button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRMATION OVERLAY */}
      {confirmData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(26, 36, 27, 0.4)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="glass-card animate-fade-in" style={{width: '90%', maxWidth: '500px', background: '#FFFFFF', boxShadow: '0 24px 64px rgba(26, 36, 27, 0.2)'}}>
            <h2 style={{marginBottom: '16px', color: 'var(--primary-color)'}}>Confirm Market Listing</h2>
            <p style={{marginBottom: '24px', color: 'var(--text-secondary)'}}>Please verify your crop parameters and evaluate your set price before officially dispatching to the public marketplace.</p>
            
            <div style={{marginBottom: '28px', background: '#F6F4EB', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)'}}>
               <p style={{marginBottom: '12px'}}><strong>Crop Identity:</strong> {confirmData.name}</p>
               <p style={{marginBottom: '12px'}}><strong>Millet Category:</strong> {confirmData.type}</p>
               <p style={{marginBottom: '12px'}}><strong>Total Volume Available:</strong> {confirmData.quantity} kg</p>
               <p style={{marginBottom: '12px', fontSize: '1.25rem', color: 'var(--primary-color)'}}><strong>Market Offer Price:</strong> ${confirmData.price} / kg</p>
               {confirmData.ml_suggested_price && (
                 <p style={{marginBottom: '12px', fontSize: '1.1rem', color: 'var(--accent-gold)'}}><strong><ShieldCheck size={18} style={{verticalAlign: 'bottom', marginRight: '6px'}}/>ML Optimal Suggestion:</strong> ${confirmData.ml_suggested_price} / kg</p>
               )}
               {certFile && <p style={{marginBottom: '0', fontSize: '0.9rem'}}><strong>Certification Attachment:</strong> Ready to upload [{certFile.name}]</p>}
               {!certFile && <p style={{marginBottom: '0', fontSize: '0.9rem', color: 'var(--danger)'}}><strong>⚠️ Warning:</strong> No certification attached. This will negatively impact the ML trust rank.</p>}
            </div>

            <div style={{display: 'flex', gap: '16px', justifyContent: 'flex-end'}}>
               <button className="btn btn-secondary" onClick={() => setConfirmData(null)}>Cancel & Modify</button>
               <button className="btn" onClick={confirmSubmit}>Confirm & List Item</button>
            </div>
          </div>
        </div>
      )}

      <h2>Your Inventory</h2>
      
      {/* FILTER AND SORT BAR */}
      <div className="glass-card" style={{display: 'flex', gap: '24px', margin: '16px 0 24px 0', alignItems: 'center', flexWrap: 'wrap', padding: '16px 24px'}}>
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
            <div key={product.id} className="glass-card">
              <h3>{product.name}</h3>
              <p style={{color: 'var(--text-secondary)', marginBottom: '16px'}}>{product.type}</p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{display:'flex', alignItems:'center', gap:'8px'}}><Box size={16}/> Quantity:</span>
                  <strong>{product.quantity} kg</strong>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{display:'flex', alignItems:'center', gap:'8px'}}><Tag size={16}/> Your Price:</span>
                  {editingParams?.id === product.id ? (
                      <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                        <input type="number" step="0.01" className="input-field" style={{width: '90px', padding: '6px', fontSize: '0.9rem', marginBottom: 0}} value={editingParams?.price || ''} onChange={e=>setEditingParams(prev => prev ? {...prev, price: e.target.value} : null)} />
                        <button className="btn" style={{padding: '6px 12px'}} onClick={() => handleUpdatePrice(product.id)}>
                            <Save size={14}/>
                        </button>
                        <button className="btn btn-secondary" style={{padding: '6px 12px'}} onClick={() => setEditingParams(null)}>
                            <X size={14}/>
                        </button>
                      </div>
                  ) : (
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <strong style={{fontSize: '1.1rem'}}>${product.price}/kg</strong>
                        <button className="btn btn-secondary" style={{padding: '4px 8px', fontSize: '0.85rem'}} onClick={() => setEditingParams({id: product.id, price: product.price.toString()})}>
                           <Edit2 size={12}/> Edit
                        </button>
                      </div>
                  )}
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                  <span style={{display:'flex', alignItems:'center', gap:'8px', color: 'var(--text-secondary)'}}><ShieldCheck size={16}/> ML Optimal Suggestion:</span>
                  <strong style={{color: 'var(--accent-gold)'}}>${product.predicted_price}/kg</strong>
                </div>
              </div>

              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                <span className={`badge ${product.quality==='High'?'badge-success':'badge-warning'}`}>Quality: {product.quality}</span>
                <span className={`badge ${product.certification_status==='Approved'?'badge-success':'badge-info'}`}>{product.certification_status}</span>
              </div>
              <div style={{marginTop: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)', wordBreak: 'break-all'}}>
                Trace ID: {product.trace_id}
              </div>
            </div>
          ))}
          {displayedProducts.length === 0 && <p>No products match your filters.</p>}
        </div>
      )}
    </div>
  );
}
