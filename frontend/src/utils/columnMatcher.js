// Normalize column name for flexible matching
export const normalizeColumnName = (name) => {
  return String(name).toLowerCase().replace(/[\s_-]+/g, '');
};

// Match a column name to a list of target fields
export const matchColumn = (columnName, targetFields) => {
  const normalized = normalizeColumnName(columnName);
  
  for (const field of targetFields) {
    if (normalizeColumnName(field) === normalized) {
      return field;
    }
  }
  
  return null;
};

// Get all known system fields for hierarchy items
export const getSystemFields = () => {
  return [
    'title',
    'type',
    'parent',
    'beginning_latitude',
    'end_latitude',
    'beginning_longitude',
    'end_longitude',
    'beginninglatitude', // Alternative formats
    'endlatitude',
    'beginninglongitude',
    'endlongitude'
  ];
};

// Auto-map columns to system fields
export const autoMapColumns = (headers) => {
  const mappings = {};
  const systemFields = getSystemFields();
  
  headers.forEach((header, index) => {
    const matched = matchColumn(header, systemFields);
    if (matched) {
      // Normalize the matched field to our standard field names
      let fieldName = matched;
      if (['beginninglatitude'].includes(normalizeColumnName(matched))) {
        fieldName = 'beginning_latitude';
      } else if (['endlatitude'].includes(normalizeColumnName(matched))) {
        fieldName = 'end_latitude';
      } else if (['beginninglongitude'].includes(normalizeColumnName(matched))) {
        fieldName = 'beginning_longitude';
      } else if (['endlongitude'].includes(normalizeColumnName(matched))) {
        fieldName = 'end_longitude';
      }
      
      mappings[index] = {
        columnName: header,
        mappedTo: fieldName,
        type: 'system'
      };
    } else {
      mappings[index] = {
        columnName: header,
        mappedTo: null,
        type: 'unmapped'
      };
    }
  });
  
  return mappings;
};

