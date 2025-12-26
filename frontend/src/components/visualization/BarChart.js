import React, { useRef, useState } from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { downloadChartAsPNG, downloadChartAsSVG, sanitizeFilename } from '../../utils/chartDownloadUtils';

const BarChart = ({ data, dataKey, nameKey = 'name', title, height = 300 }) => {
  const chartRef = useRef(null);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const handleDownload = (format) => {
    const filename = sanitizeFilename(title || 'bar-chart');
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
    </div>
  );
};

export default BarChart;
