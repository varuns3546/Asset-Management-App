import React from 'react';

const StatCard = ({ title, value, subtitle, icon }) => {
  return (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e0e0e0',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {icon && (
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
        {title}
      </div>
      <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default StatCard;

