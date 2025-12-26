/**
 * Utility functions for downloading charts as images
 */

/**
 * Downloads a chart as PNG image
 * @param {HTMLElement} containerRef - Reference to the chart container element
 * @param {string} filename - Name for the downloaded file (without extension)
 */
export const downloadChartAsPNG = async (containerRef, filename = 'chart') => {
  if (!containerRef) {
    console.error('Chart container reference is required');
    return;
  }

  const svgElement = containerRef.querySelector('svg');
  if (!svgElement) {
    console.error('No SVG element found in chart container');
    return;
  }

  try {
    // Clone the SVG to avoid modifying the original
    const clonedSvg = svgElement.cloneNode(true);
    
    // Get computed dimensions
    const svgRect = svgElement.getBoundingClientRect();
    const width = svgRect.width || 800;
    const height = svgRect.height || 600;
    
    // Set explicit dimensions on clone
    clonedSvg.setAttribute('width', width);
    clonedSvg.setAttribute('height', height);
    
    // Add white background for PNG
    const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    background.setAttribute('width', '100%');
    background.setAttribute('height', '100%');
    background.setAttribute('fill', 'white');
    clonedSvg.insertBefore(background, clonedSvg.firstChild);

    // Serialize SVG
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clonedSvg);
    
    // Create a blob and URL
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create image and canvas for PNG conversion
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Use higher resolution for better quality
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    ctx.scale(scale, scale);

    img.onload = () => {
      // Fill white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);
      
      // Draw the image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to PNG and download
      canvas.toBlob((blob) => {
        const pngUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `${filename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(pngUrl);
      }, 'image/png');
      
      URL.revokeObjectURL(url);
    };

    img.onerror = (error) => {
      console.error('Error loading SVG for PNG conversion:', error);
      URL.revokeObjectURL(url);
    };

    img.src = url;
  } catch (error) {
    console.error('Error downloading chart as PNG:', error);
  }
};

/**
 * Downloads a chart as SVG file
 * @param {HTMLElement} containerRef - Reference to the chart container element
 * @param {string} filename - Name for the downloaded file (without extension)
 */
export const downloadChartAsSVG = (containerRef, filename = 'chart') => {
  if (!containerRef) {
    console.error('Chart container reference is required');
    return;
  }

  const svgElement = containerRef.querySelector('svg');
  if (!svgElement) {
    console.error('No SVG element found in chart container');
    return;
  }

  try {
    // Clone and prepare SVG
    const clonedSvg = svgElement.cloneNode(true);
    
    // Get dimensions
    const svgRect = svgElement.getBoundingClientRect();
    clonedSvg.setAttribute('width', svgRect.width || 800);
    clonedSvg.setAttribute('height', svgRect.height || 600);
    
    // Add XML declaration and doctype
    const serializer = new XMLSerializer();
    let svgString = serializer.serializeToString(clonedSvg);
    
    // Add XML declaration if not present
    if (!svgString.startsWith('<?xml')) {
      svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + svgString;
    }

    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading chart as SVG:', error);
  }
};

/**
 * Sanitizes a filename by removing/replacing invalid characters
 * @param {string} filename - The filename to sanitize
 * @returns {string} - Sanitized filename
 */
export const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .toLowerCase() || 'chart';
};

