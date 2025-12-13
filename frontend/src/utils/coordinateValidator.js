/**
 * Coordinate validation utilities
 * Validates latitude and longitude values according to geographic standards
 */

/**
 * Validates a latitude value
 * @param {string|number} lat - Latitude value to validate
 * @param {string} fieldName - Name of the field for error messages (default: 'Latitude')
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateLatitude = (lat, fieldName = 'Latitude') => {
  if (lat === '' || lat === null || lat === undefined) {
    return null; // Empty values are allowed (optional fields)
  }

  const num = parseFloat(lat);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < -90 || num > 90) {
    return `${fieldName} must be between -90 and 90 degrees`;
  }
  return null;
};

/**
 * Validates a longitude value
 * @param {string|number} lng - Longitude value to validate
 * @param {string} fieldName - Name of the field for error messages (default: 'Longitude')
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateLongitude = (lng, fieldName = 'Longitude') => {
  if (lng === '' || lng === null || lng === undefined) {
    return null; // Empty values are allowed (optional fields)
  }

  const num = parseFloat(lng);
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  if (num < -180 || num > 180) {
    return `${fieldName} must be between -180 and 180 degrees`;
  }
  return null;
};

/**
 * Validates a coordinate pair (latitude, longitude)
 * @param {string|number} lat - Latitude value
 * @param {string|number} lng - Longitude value
 * @param {string} fieldName - Base name for error messages
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateCoordinatePair = (lat, lng, fieldName = 'Coordinate') => {
  const latError = validateLatitude(lat, `${fieldName} latitude`);
  if (latError) return latError;

  const lngError = validateLongitude(lng, `${fieldName} longitude`);
  if (lngError) return lngError;

  return null;
};

/**
 * Validates an array of coordinate pairs
 * @param {Array} coordinates - Array of {lat, lng} objects
 * @param {string} geometryType - Type of geometry ('point', 'line', 'polygon')
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateCoordinates = (coordinates, geometryType = 'point') => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return 'At least one coordinate is required';
  }

  for (let i = 0; i < coordinates.length; i++) {
    const { lat, lng } = coordinates[i];

    if (!lat || !lng) {
      return `Coordinate ${i + 1} is incomplete`;
    }

    const error = validateCoordinatePair(lat, lng, `Coordinate ${i + 1}`);
    if (error) {
      return error;
    }
  }

  // Validate based on geometry type
  if (geometryType === 'line' && coordinates.length < 2) {
    return 'Line geometry requires at least 2 points';
  }

  if (geometryType === 'polygon' && coordinates.length < 3) {
    return 'Polygon geometry requires at least 3 points';
  }

  return null;
};

/**
 * Validates coordinate fields for hierarchy items (beginning/end lat/lng)
 * @param {Object} item - Item with coordinate fields
 * @returns {string|null} Error message if invalid, null if valid
 */
export const validateHierarchyCoordinates = (item) => {
  const errors = [];

  if (item.beginning_latitude) {
    const error = validateLatitude(item.beginning_latitude, 'Beginning latitude');
    if (error) errors.push(error);
  }

  if (item.end_latitude) {
    const error = validateLatitude(item.end_latitude, 'End latitude');
    if (error) errors.push(error);
  }

  if (item.beginning_longitude) {
    const error = validateLongitude(item.beginning_longitude, 'Beginning longitude');
    if (error) errors.push(error);
  }

  if (item.end_longitude) {
    const error = validateLongitude(item.end_longitude, 'End longitude');
    if (error) errors.push(error);
  }

  return errors.length > 0 ? errors[0] : null;
};

