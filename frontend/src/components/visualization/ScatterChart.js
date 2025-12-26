import React from 'react';
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ScatterChart = ({ data, xKey, yKey, title, height = 300 }) => {
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
        <RechartsScatterChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} name={xKey} />
          <YAxis dataKey={yKey} name={yKey} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter name="Data Points" data={data} fill="#007bff" />
        </RechartsScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ScatterChart;

