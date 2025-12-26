import { ChartJSNodeCanvas } from 'chartjs-node-canvas';

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

/**
 * Generate a bar chart image
 * @param {Array} data - Array of {label, value} objects
 * @param {String} title - Chart title
 * @param {String} labelKey - Key for labels (default: 'label')
 * @param {String} valueKey - Key for values (default: 'value')
 * @returns {Buffer} Chart image buffer
 */
export const generateBarChart = async (data, title, labelKey = 'label', valueKey = 'value') => {
  if (!data || data.length === 0) {
    return null;
  }

  const configuration = {
    type: 'bar',
    data: {
      labels: data.map(item => item[labelKey] || item.name || 'Unknown'),
      datasets: [{
        label: title,
        data: data.map(item => item[valueKey] || item.count || 0),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(199, 199, 199, 0.6)',
          'rgba(83, 102, 255, 0.6)',
          'rgba(255, 99, 255, 0.6)',
          'rgba(99, 255, 132, 0.6)'
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
          'rgba(199, 199, 199, 1)',
          'rgba(83, 102, 255, 1)',
          'rgba(255, 99, 255, 1)',
          'rgba(99, 255, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generating bar chart:', error);
    return null;
  }
};

/**
 * Generate a pie chart image
 * @param {Array} data - Array of {label, value} objects
 * @param {String} title - Chart title
 * @param {String} labelKey - Key for labels (default: 'label')
 * @param {String} valueKey - Key for values (default: 'value')
 * @returns {Buffer} Chart image buffer
 */
export const generatePieChart = async (data, title, labelKey = 'label', valueKey = 'value') => {
  if (!data || data.length === 0) {
    return null;
  }

  const colors = [
    'rgba(54, 162, 235, 0.6)',
    'rgba(255, 99, 132, 0.6)',
    'rgba(255, 206, 86, 0.6)',
    'rgba(75, 192, 192, 0.6)',
    'rgba(153, 102, 255, 0.6)',
    'rgba(255, 159, 64, 0.6)',
    'rgba(199, 199, 199, 0.6)',
    'rgba(83, 102, 255, 0.6)',
    'rgba(255, 99, 255, 0.6)',
    'rgba(99, 255, 132, 0.6)'
  ];

  const configuration = {
    type: 'pie',
    data: {
      labels: data.map(item => item[labelKey] || item.name || 'Unknown'),
      datasets: [{
        label: title,
        data: data.map(item => item[valueKey] || item.count || 0),
        backgroundColor: colors.slice(0, data.length),
        borderColor: colors.slice(0, data.length).map(c => c.replace('0.6', '1')),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: true,
          position: 'right'
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generating pie chart:', error);
    return null;
  }
};

/**
 * Generate a line chart image
 * @param {Array} data - Array of {label, value} objects
 * @param {String} title - Chart title
 * @param {String} labelKey - Key for labels (default: 'label')
 * @param {String} valueKey - Key for values (default: 'value')
 * @returns {Buffer} Chart image buffer
 */
export const generateLineChart = async (data, title, labelKey = 'label', valueKey = 'value') => {
  if (!data || data.length === 0) {
    return null;
  }

  const configuration = {
    type: 'line',
    data: {
      labels: data.map(item => item[labelKey] || item.name || item.date || 'Unknown'),
      datasets: [{
        label: title,
        data: data.map(item => item[valueKey] || item.count || 0),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  };

  try {
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    return imageBuffer;
  } catch (error) {
    console.error('Error generating line chart:', error);
    return null;
  }
};

