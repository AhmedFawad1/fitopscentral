import { useEffect, useState } from 'react';
import { validatePackage } from './validatePackage';
import { useRuntime } from '@/hooks/useRuntime';

export function usePackageManager({
  user,
  confirm,
  packageService,
  uuid,
  dispatch,
  setLocalUpdate,
  setSuccessModal
}) {
  const { isTauri, isWeb, isReady } = useRuntime();
  const [packages, setPackages] = useState([]);
  const [errors, setErrors] = useState({});
  const [formValues, setFormValues] = useState({
    branch_id: user.branch_id
  });

  const fetchPackages = async () => {
    const data = isWeb ? await packageService.fetch(user.gym_id, formValues.branch_id) : await packageService.fetchSQLite(user.gym_id, formValues.branch_id);
    setPackages(data);
  };

  useEffect(() => {
    if(!isReady) return;
    fetchPackages();
  }, [formValues.branch_id, isReady]);

  useEffect(()=>{
    if(!formValues.id){
      setFormValues({
        branch_id: user.branch_id
      });
      setErrors({});
    }
  },[formValues.id])

  const onFieldChange = (field, value) => {
    setErrors({});
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const onPackageSelect = e => {
    const selected = packages.find(p => p.id === e.target.value);
    if (!selected) {
      setFormValues({ branch_id: user.branch_id });
      return;
    }
    setFormValues({ ...selected, selectedPackage: selected.id });
  };

  const onDelete = async () => {
    if (!formValues.id) {
      setErrors({ selectedPackage: 'Please select a package to delete.' });
      return;
    }

    if (!(await confirm(
      'Are you sure you want to delete this package?',
      'Deleting Package',
      'Error',
      true, 
      'Delete'
    ))) return;

    let result = isWeb ? await packageService.softDelete(formValues.id, user.gym_id) : await packageService.softDeleteSQLite(formValues.id, user.gym_id);
    if(result.error){
      await confirm(
        `Error deleting package: ${result.error.message || result.error}`,
        `Error`,
        'Error',
        false,
        'Ok'
      );
      return;
    }
    setFormValues({ branch_id: user.branch_id });
    dispatch(setLocalUpdate(true));
    dispatch(setSuccessModal({ message: 'Package deleted!', visible: true }));
    fetchPackages();
  };

  const onSubmit = async () => {
      const validationErrors = validatePackage(formValues);
      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return;
      }

      if (!(await confirm(
        formValues.id ? 'Do you want to update this package?' :
        'Do you want to save changes to this package?', 
        formValues.id ? 'Update Package' :
        'Save Package',
        'Confirm',
        true,
        'Save'
      ))) return;

      const payload = {
        price: formValues.price,
        name: formValues.name,
        duration: formValues.duration,
        duration_type: formValues.duration_type,
        cancellation: formValues.cancellation,
        admission_fee: formValues.admission_fee,
        branch_id: formValues.branch_id,
        id: formValues.id || uuid(),
        gym_id: user.gym_id,
        updated_at: new Date().toISOString()
      };
      
      let {data, error} = isWeb ? await packageService.save(payload) : await packageService.saveSQLite(payload);
      if(error){
        await confirm(
          'An error occurred while saving the package. Please try again.',
          'Error',
          'Error',
          false,
          'OK'
        );
        return;
      }
      dispatch(setLocalUpdate(true));
      dispatch(setSuccessModal({ message: 'Package saved!', visible: true }));
      setFormValues({ branch_id: user.branch_id });
      fetchPackages();
    };

  return {
    packages,
    errors,
    formValues,
    onFieldChange,
    onPackageSelect,
    onSubmit,
    onDelete
  };
}
