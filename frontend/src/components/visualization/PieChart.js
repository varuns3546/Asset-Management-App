import React, { useRef, useState } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { downloadChartAsPNG, downloadChartAsSVG, sanitizeFilename } from '../../utils/chartDownloadUtils';

const COLORS = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#6f42c1', '#fd7e14', '#20c997'];

const PieChart = ({ data, dataKey, nameKey = 'name', title, height = 300 }) => {
  const chartRef = useRef(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleDownload = (format) => {
    const filename = sanitizeFilename(title || 'pie-chart');
    if (format === 'png') {
      downloadChartAsPNG(chartRef.current, filename);
    } else {
      downloadChartAsSVG(chartRef.current, filename);
    }
    setShowDownloadMenu(false);
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No data available for {title}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }} className="chart-container">
      <div className="chart-header">
        {title && <h3 className="chart-title">{title}</h3>}
        <div className="chart-download-wrapper">
          <button
            className="chart-download-btn"
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            title="Download chart"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          {showDownloadMenu && (
            <div className="chart-download-menu">
              <button onClick={() => handleDownload('png')}>Download PNG</button>
              <button onClick={() => handleDownload('svg')}>Download SVG</button>
            </div>
          )}
        </div>
      </div>
      <div ref={chartRef} style={{ width: '100%', height: 'calc(100% - 50px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChart;
