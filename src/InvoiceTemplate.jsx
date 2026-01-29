import React, { forwardRef } from 'react';

const InvoiceTemplate = forwardRef(({ transaction, business, paperSize = 'A4' }, ref) => {
  if (!transaction || !business) return null;

  const isSale = transaction.type === 'Sales';

  // Paper size dimensions (width x height in mm)
  const paperSizes = {
    'A4': { width: '210mm', height: '297mm' },
    'A5': { width: '148mm', height: '210mm' },
    'Letter': { width: '216mm', height: '279mm' },
    'Legal': { width: '216mm', height: '356mm' }
  };
  
  const selectedSize = paperSizes[paperSize] || paperSizes['A4'];

  return (
    <div ref={ref} style={{ 
      padding: '40px', 
      backgroundColor: 'white', 
      color: 'black', 
      width: selectedSize.width, 
      minHeight: selectedSize.height, 
      margin: 'auto', 
      border: '1px solid #eee',
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      lineHeight: '1.4'
    }>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2', margin: '0 0 4px 0' }}>
            {business.name}
          </h1>
          <p style={{ margin: '4px 0' }}>{business.address}</p>
          <p style={{ margin: '4px 0' }}>Phone: {business.phone}</p>
          {business.gstNumber && <p style={{ margin: '4px 0' }}>GSTIN: {business.gstNumber}</p>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
            {isSale ? 'TAX INVOICE' : 'PURCHASE BILL'}
          </h2>
          <p style={{ margin: '4px 0' }}># {transaction.invoiceNumber}</p>
          <p style={{ margin: '4px 0' }}>Date: {transaction.date}</p>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ccc', marginBottom: '32px' }} />

      {/* Bill To / From */}
      <div style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', textTransform: 'uppercase', color: '#666' }}>
          {isSale ? 'Bill To:' : 'Vendor Details:'}
        </h3>
        <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>{transaction.partyName}</h4>
        {/* We could fetch party details if needed, but for now we use what's in tx */}
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f3f4f6' }}>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', border: '1px solid #ddd' }}>#</th>
            <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', border: '1px solid #ddd' }}>Item Description</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #ddd' }}>Qty</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #ddd' }}>Rate</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #ddd' }}>GST %</th>
            <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', border: '1px solid #ddd' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '12px', border: '1px solid #ddd' }}>{index + 1}</td>
              <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: '500' }}>{item.name}</td>
              <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{item.qty}</td>
              <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>₹{item.price.toFixed(2)}</td>
              <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>{item.taxRate}%</td>
              <td style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Subtotal</span>
            <span>₹{transaction.subtotal?.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: '#666' }}>Tax Amount</span>
            <span>₹{transaction.taxAmount?.toFixed(2)}</span>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '8px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1976d2' }}>
              ₹{transaction.totalAmount?.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', paddingTop: '64px' }}>
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666', fontWeight: 'bold' }}>Terms & Conditions:</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
              1. Goods once sold will not be taken back.<br />
              2. Interest @ 18% will be charged if payment is not made within 7 days.
            </p>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <div style={{ height: '40px' }}></div>
            <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold' }}>For {business.name}</p>
            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default InvoiceTemplate;
