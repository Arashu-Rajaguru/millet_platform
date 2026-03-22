import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { User, Activity, Edit2, Save, MapPin, Phone, Settings, PackageOpen } from 'lucide-react';

export default function Profile() {
  const { user, login } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({ 
    name: user?.name || '', 
    email: user?.email || '',
    contact_number: user?.contact_number || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    preferences: user?.preferences || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const txs = await api.getTransactions();
        setTransactions(txs);
        
        if (user?.role === 'farmer') {
          const prods = await api.getProducts();
          setMyProducts(prods.filter((p:any) => p.farmer_id === user?.id));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleSave = async () => {
    try {
      const updated = await api.updateMe(formData);
      login(localStorage.getItem('token')!, updated);
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
  };

  if(!user) return null;

  return (
    <div className="container animate-fade-in">
      <h1 className="page-title">User Profile</h1>
      <p className="page-subtitle">Manage your account details and view platform activities.</p>
      
      <div className="glass-card" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User /> Account Details</h2>
          {!isEditing ? (
            <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
              <Edit2 size={16} /> Edit Profile
            </button>
          ) : (
            <button className="btn" onClick={handleSave}>
              <Save size={16} /> Save Changes
            </button>
          )}
        </div>
        
        <div className="grid">
          {/* Core Info */}
          <div className="input-group">
            <label className="input-label">Full Name</label>
            {isEditing ? <input type="text" className="input-field" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.name || 'Not Provided'}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            {isEditing ? <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.email || 'Not Provided'}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <p style={{ textTransform: 'capitalize', fontSize: '1.1rem' }}>{user.role}</p>
          </div>
          <div className="input-group">
            <label className="input-label"><Phone size={14} style={{display:'inline', marginRight:'4px'}}/> Contact Number</label>
            {isEditing ? <input type="text" className="input-field" value={formData.contact_number} onChange={e => setFormData({...formData, contact_number: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.contact_number || 'Not Provided'}</p>}
          </div>

          <div className="input-group">
            <label className="input-label">Trust Score</label>
            <p className="badge badge-warning" style={{fontSize: '1rem'}}>{user.trust_score.toFixed(1)} / 100</p>
          </div>
        </div>

        <hr style={{margin: '24px 0', borderColor: 'var(--glass-border)', opacity: 0.5}}/>

        <div className="grid">
          {/* Address Details */}
          <div className="input-group">
            <label className="input-label"><MapPin size={14} style={{display:'inline', marginRight:'4px'}}/> Residential Address</label>
            {isEditing ? <input type="text" className="input-field" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.address || 'Not Provided'}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">City</label>
            {isEditing ? <input type="text" className="input-field" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.city || 'Not Provided'}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">State / Province</label>
            {isEditing ? <input type="text" className="input-field" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.state || 'Not Provided'}</p>}
          </div>
          <div className="input-group">
            <label className="input-label">Country</label>
            {isEditing ? <input type="text" className="input-field" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} /> : <p style={{fontSize: '1.1rem'}}>{user.country || 'Not Provided'}</p>}
          </div>
        </div>

        {/* Dynamic Role Sections inside Details */}
        {user.role === 'buyer' && (
          <>
            <hr style={{margin: '24px 0', borderColor: 'var(--glass-border)', opacity: 0.5}}/>
            <div className="input-group" style={{maxWidth: '600px', gridColumn: '1 / -1'}}>
              <label className="input-label" style={{color: 'var(--primary-color)'}}><Settings size={14} style={{display:'inline'}}/> Crop/Product Preferences</label>
              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>Describe the millets you usually intend to source (e.g. Organic Foxtail Millet only, high moisture content).</p>
              {isEditing ? (
                <textarea className="input-field" rows={3} value={formData.preferences} onChange={e => setFormData({...formData, preferences: e.target.value})} />
              ) : (
                <p style={{fontSize: '1.05rem', padding: '16px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid var(--glass-border)', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'}}>
                  {user.preferences || 'No preferences specified.'}
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <div className="grid">
        {/* Farmer Specific Panel */}
        {user.role === 'farmer' && (
          <div className="glass-card">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize:'1.6rem' }}>
              <PackageOpen size={24} color="var(--primary-color)" /> My Listed Crops
            </h2>
            {loading ? <p>Loading...</p> : myProducts.length > 0 ? (
               <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                 {myProducts.map(p => (
                   <div key={p.id} style={{padding: '16px', background: '#FFFFFF', border: '1px solid #D1D8CE', borderRadius: '8px', boxShadow: 'var(--shadow-sm)'}}>
                     <strong style={{display:'block', fontSize:'1.2rem', color:'var(--text-primary)'}}>{p.name}</strong>
                     <span style={{color:'var(--text-secondary)', fontSize:'0.9rem'}}>{p.type} — {p.quantity}kg pending for market</span>
                     <div style={{marginTop: '8px'}}>
                        <span className={`badge ${p.certification_status==='Approved'?'badge-success':'badge-warning'}`}>{p.certification_status} Certificate</span>
                     </div>
                   </div>
                 ))}
               </div>
            ) : <p style={{color:'var(--text-secondary)'}}>No products active in the market. Head to your dashboard to add a crop!</p>}
          </div>
        )}

        {/* Universal Transaction History Panel */}
        <div className="glass-card" style={user.role === 'buyer' ? {gridColumn: '1 / -1'} : {}}>
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize:'1.6rem' }}>
             <Activity size={24} color="var(--primary-color)" /> Ledger Summary
          </h2>
          {loading ? <p>Loading...</p> : transactions.length > 0 ? (
             <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
               {transactions.map(tx => (
                 <div key={tx.id} style={{padding: '16px', background: '#FFFFFF', border: '1px solid #E0E4DE', borderRadius: '8px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'}}>
                   <div style={{display: 'flex', justifyContent:'space-between', marginBottom:'8px'}}>
                     <strong style={{color:'var(--text-primary)'}}>Receipt ID #{tx.id}</strong>
                     <span style={{color:'var(--text-secondary)'}}>{new Date(tx.timestamp).toLocaleString()}</span>
                   </div>
                   
                   {user.role === 'farmer' && (
                     <p style={{marginBottom: '8px', fontSize: '1rem', color: 'var(--text-primary)'}}>
                        Sold <strong>{tx.quantity} kg</strong> of <strong>{tx.product?.name}</strong> to <strong style={{color:'var(--primary-color)'}}>{tx.buyer?.name}</strong>.
                     </p>
                   )}
                   {user.role === 'buyer' && (
                     <p style={{marginBottom: '8px', fontSize: '1rem', color: 'var(--text-primary)'}}>
                        Purchased <strong>{tx.quantity} kg</strong> of <strong>{tx.product?.name}</strong>.
                     </p>
                   )}

                   <p style={{marginBottom: '4px'}}>Ledger Transfer Amount: <strong style={{color:'var(--accent-gold)'}}>${tx.amount.toFixed(2)}</strong></p>
                   
                   <div style={{display: 'flex', gap: '8px', marginTop: '12px'}}>
                     <span className="badge badge-success">{tx.status} Resolution</span>
                     {tx.is_fraudulent && <span className="badge badge-danger">ML Anomaly Block</span>}
                   </div>
                 </div>
               ))}
             </div>
          ) : <p style={{color:'var(--text-secondary)'}}>No transaction history processed locally.</p>}
        </div>
      </div>
    </div>
  );
}
