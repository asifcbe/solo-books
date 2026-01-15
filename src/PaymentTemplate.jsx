import React, { forwardRef } from 'react';

const PaymentTemplate = forwardRef(({ data, business }, ref) => {
  if (!data || !business) return null;

  const { partyName, totalAmount, date, paymentMode, referenceNo, notes, type } = data;
  const isPaymentIn = type === 'PaymentIn';

  return (
    <div ref={ref} style={{ 
      padding: '50px', 
      backgroundColor: 'white', 
      color: 'black', 
      width: '210mm', 
      minHeight: '148mm', // Half A4 height
      margin: 'auto', 
      fontFamily: 'Arial, sans-serif',
      lineHeight: '1.5',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', borderBottom: '2px solid #10b981', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', margin: '0 0 5px 0' }}>
            {business.name}
          </h1>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>{business.address}</p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>Phone: {business.phone}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0', color: '#64748b' }}>
            PAYMENT RECEIPT
          </h2>
          <p style={{ margin: '0' }}>Date: <strong>{date}</strong></p>
          <p style={{ margin: '0', fontSize: '12px' }}>Ref: {referenceNo}</p>
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0', padding: '15px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}>
        <p style={{ margin: '0', color: '#15803d', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isPaymentIn ? 'Received With Thanks From' : 'Paid With Regards To'}
        </p>
        <h3 style={{ margin: '5px 0', fontSize: '22px', fontWeight: 'bold' }}>{partyName}</h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '30px 0' }}>
        <div style={{ padding: '15px 40px', border: '2px dashed #10b981', borderRadius: '12px', textAlign: 'center' }}>
          <p style={{ margin: '0', fontSize: '12px', color: '#64748b', textTransform: 'uppercase' }}>Amount Paid</p>
          <h2 style={{ margin: '0', fontSize: '32px', fontWeight: '900', color: '#10b981' }}>₹{totalAmount.toLocaleString()}</h2>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '40px', marginBottom: '30px' }}>
        <div style={{ flex: 1 }}>
          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Payment Mode:</span>
          <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{paymentMode}</p>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Reference No:</span>
          <p style={{ margin: '2px 0', fontWeight: 'bold' }}>{referenceNo}</p>
        </div>
        {notes && (
          <div style={{ flex: 2 }}>
            <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Notes:</span>
            <p style={{ margin: '2px 0', fontSize: '13px' }}>{notes}</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
          <p>© SOLO BOOKS Accounting</p>
          <p>This is an automated payment receipt.</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '120px', borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
          <p style={{ fontSize: '11px', fontWeight: 'bold' }}>Authorized Signature</p>
        </div>
      </div>
    </div>
  );
});

export default PaymentTemplate;
