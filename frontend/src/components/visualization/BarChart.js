import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const BarChart = ({ data, dataKey, nameKey = 'name', title, height = 300 }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No data available for {title}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      {title && <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={nameKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill="#007bff" />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChart;

