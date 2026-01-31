export const validatePackage = (pkg) => {
    const errors = {};
    if(!pkg.branch_id || pkg.branch_id.trim() === '') {
        errors.branch = 'Branch is required';
    }
    if (!pkg.name || pkg.name.trim() === '') {
        errors.name = 'Package name is required';
    }
    if (!pkg.duration || isNaN(pkg.duration) || pkg.duration <= 0) {
        errors.duration = 'Valid duration is required';
    }
    if (!pkg.duration_type || (pkg.duration_type !== 'days' && pkg.duration_type !== 'months')) {
        errors.type = 'Duration type must be either "days" or "months"';
    }
    if (!pkg.price || isNaN(pkg.price) || pkg.price < 0) {
        errors.price = 'Valid package fee is required';
    }
    return errors;
}