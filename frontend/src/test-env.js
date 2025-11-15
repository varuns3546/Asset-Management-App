// Test file to check environment variables
console.log('=== Environment Variable Test ===');
console.log('REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('REACT_APP_ARCGIS_API_KEY:', process.env.REACT_APP_ARCGIS_API_KEY ? 'Present' : 'Missing');
console.log('All REACT_APP vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('================================');
