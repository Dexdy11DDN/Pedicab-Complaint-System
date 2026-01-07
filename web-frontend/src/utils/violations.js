// Shared violation types and categories
// Used by both web and mobile apps for consistency

export const VIOLATION_CATEGORIES = {
  'Driver Violations': [
    'No Valid License',
    'Expired Driver\'s License',
    'Failure to Bring License',
    'No Mayor\'s Permit (Driver)',
    'Student Driver Not Accompanied',
    'Reckless Driving',
    'Disregarding Traffic Sign',
    'Overcharging',
    'Refusal to Convey',
    'Discourtesy/Arrogance',
    'Rude Behavior',
    'Unauthorized Route',
    'No Fare Matrix Displayed',
    'Operating Under Influence',
    'No Uniform/ID',
    'Driving in Slippers/Sleeveless Shirt'
  ],
  'Vehicle Violations': [
    'No Plate Number',
    'Plate Improperly Displayed',
    'Obstructed Plate',
    'No Plate Sticker',
    'No Registration/Official Receipt',
    'Expired Franchise',
    'Expired Registration',
    'Invalid Registration',
    'Incomplete OR/CR',
    'Illegal Parking',
    'Parking on the Sidewalk',
    'Parking Infront of a Driveway',
    'Obstruction',
    'Missing Headlights',
    'Missing Taillights',
    'No Side Mirrors',
    'Poor Vehicle Condition',
    'Overloading',
    'Excessive Noise',
    'No Seatbelt',
    'Defective Brakes'
  ],
  'Others': [
    'Other Violation'
  ]
};

// Get all violation types as a flat array
export const getAllViolationTypes = () => {
  return Object.values(VIOLATION_CATEGORIES).flat();
};

// Get the category for a specific violation type
export const getViolationCategory = (violationType) => {
  const normalizedType = violationType.toLowerCase().replace(/_/g, ' ');
  
  for (const [category, violations] of Object.entries(VIOLATION_CATEGORIES)) {
    const found = violations.find(v => 
      v.toLowerCase() === normalizedType ||
      v.toLowerCase().replace(/['\s\/]/g, '_') === violationType.toLowerCase() ||
      v.toLowerCase().replace(/['\s\/]/g, '') === violationType.toLowerCase().replace(/_/g, '')
    );
    if (found) return category;
  }
  return 'Other';
};

// Format violation type for display
export const formatViolationType = (type) => {
  if (!type) return '';
  return type
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Group violations by category
export const groupViolationsByCategory = (violations) => {
  const grouped = {
    'Driver Violations': [],
    'Vehicle Violations': [],
    'Other': []
  };
  
  violations.forEach(violation => {
    const category = getViolationCategory(violation.type);
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(violation);
  });
  
  // Remove empty categories
  return Object.fromEntries(
    Object.entries(grouped).filter(([_, violations]) => violations.length > 0)
  );
};
