import React, { useState, useEffect } from 'react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory');
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol">🌱</div>
          <div>
            AgriOps <span className="brand-ai">AI</span>
            <small>MANAGEMENT SYSTEM</small>
          </div>
        </div>
        <nav style={{ marginTop: '20px' }}>
          <a href="#inventory" className={activeTab === 'inventory' ? 'active' : ''} onClick={() => setActiveTab('inventory')}>
            Inventory
          </a>
          <a href="#suppliers" className={activeTab === 'suppliers' ? 'active' : ''} onClick={() => setActiveTab('suppliers')}>
            Suppliers
          </a>
          <a href="#recommendations" className={activeTab === 'recommendations' ? 'active' : ''} onClick={() => setActiveTab('recommendations')}>
            Recommendations
          </a>
        </nav>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>AgriOps Web Dashboard</div>
          <div className="environment"><span></span>Development</div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <span className="eyebrow">DASHBOARD</span>
              <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</h1>
              <p>Manage farm resources and AI agent supply chains.</p>
            </div>
          </div>
          <div className="panel">
            <div className="panel-heading">
              <h2>Overview</h2>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No items loaded or connected to API.</td>
                  </tr>
                ) : (
                  items.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>{item.category}</td>
                      <td>{item.currentStock} {item.unitOfMeasurement}</td>
                      <td>
                        <span className={`badge ${item.currentStock <= item.minimumStockLevel ? 'low-stock' : 'healthy'}`}>
                          {item.currentStock <= item.minimumStockLevel ? 'Low Stock' : 'Healthy'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}