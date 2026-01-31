export function validatePackage(pkg) {
  const errors = {};
  if (!pkg.name) errors.name = 'Package name is required';
  if (!pkg.duration || pkg.duration <= 0) errors.duration = 'Invalid duration';
  if (!['days', 'months'].includes(pkg.duration_type))
    errors.type = 'Invalid duration type';
  if (!pkg.price || pkg.price < 0) errors.price = 'Invalid price';
  return errors;
}
