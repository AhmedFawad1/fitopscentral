import { useEffect, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import { useSelector } from 'react-redux';
import { invoke } from '@tauri-apps/api/core';

export function useExpenseManager({
  user,
  confirm,
  expenseService,
  uuid,
  dispatch,
  setLocalUpdate,
  setSuccessModal,
  setShowOverlay
}) {
  const { isTauri, isWeb, isReady } = useRuntime();

  const [registerBiometric, setRegisterBiometric] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [errors, setErrors] = useState({});
  const firstDateOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
  const lastDateOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
  const [formValues, setFormValues] = useState({
    branch_id: user.branch_id,
    startDate: firstDateOfMonth,
    endDate: lastDateOfMonth,
  });

  const fetchExpenses = async () => {
    const data = isWeb ? await expenseService.fetch(user.gym_id, formValues.branch_id, formValues.startDate, formValues.endDate) : await expenseService.fetchSQLite(user.gym_id, formValues.branch_id, formValues.startDate, formValues.endDate);
    setExpenses(data);
  };

  useEffect(() => {
    if(!isReady) return;
    if(!formValues.startDate || formValues.startDate.trim() === ''){
        setExpenses([]);
    }
    fetchExpenses();
  }, [formValues.branch_id, isReady]);
  
  useEffect(()=>{
      if(!formValues.serial_number) return;
      async function start() {
              await invoke("zk_add_user", { id: formValues.serial_number.toString(), name: formValues.name });
      }
      async function stop() {
              await invoke("zk_stop_enrollment", { id: formValues.serial_number.toString() });
      }       
      if(registerBiometric && status === 'connected'){
          // invoke biometric registration
          start();
      }else if(!registerBiometric && status === 'connected'){
          // stop biometric registration
          stop();
      }
  },[registerBiometric])
  const onFieldChange = (field, value) => {
    if(field === 'clearForm'){
        setFormValues({
            branch_id: user.branch_id,
        });
        setErrors({})
        setExpenses([]);
        return;
    }
    setErrors({});
    setFormValues(prev => ({ ...prev, [field]: value }));
  };

  const onExpenseSelect = e => {
    const selected = expenses.find(p => p.id === e.target.value);
    if (!selected) {
      setFormValues({ branch_id: user.branch_id });
      return;
    }
    setFormValues({ ...selected, selectedExpense: selected.id });
  };

  const onDelete = async () => {
    if (!formValues.id) {
      setErrors({ selectedExpense: 'Please select an expense to delete.' });
      return;
    }

    if (!(await confirm(
      'Are you sure you want to delete this expense?',
      'Deleting Expense',
      'Error',
      true, 
      'Delete'
    ))) return;

    let result = isWeb ? await expenseService.softDelete(formValues.id, user.gym_id) : await expenseService.softDeleteSQLite(formValues.id, user.gym_id);
    if(result.error){
      await confirm(
        `Error deleting expense: ${result.error.message || result.error}`,
        `Error`,
        'Error',
        false,
        'Ok'
      );
      return;
    }
    setFormValues({ branch_id: user.branch_id });
    dispatch(setLocalUpdate(true));
    dispatch(setSuccessModal({ message: 'Expense deleted!', visible: true }));
    fetchExpenses();
  };
  const validateExpense = (formValues) => {
    const errors = {};
    if(!formValues.amount || isNaN(formValues.amount) || Number(formValues.amount) <= 0){
      errors.amount = 'Please enter a valid amount.';
    }
    if(!formValues.txn_date){
      errors.txn_date = 'Please select a date.';
    }
    if(!formValues.payment_method){
      errors.payment_method = 'Please select a payment method.';
    }
    if(!formValues.name || formValues.name.trim() === ''){
      errors.name = 'Please enter a name for the expense.';
    }
    return errors;
  }
  const validateSearch = (formValues) => {
    const errors = {};
    if(!formValues.startDate){
      errors.startDate = 'Start date is required.';
    }
    return errors;
  }
  const onSearch = async () => {
    const validationErrors = validateSearch(formValues);
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    let data = isWeb ? await expenseService.fetch(user.gym_id, formValues.branch_id, formValues.startDate, formValues.endDate) : await expenseService.fetchSQLite(user.gym_id, formValues.branch_id, formValues.startDate, formValues.endDate);
    setExpenses(data);
  };
  const onSubmit = async () => {
      const validationErrors = validateExpense(formValues);
      if (Object.keys(validationErrors).length) {
        setErrors(validationErrors);
        return;
      }

      if (!(await confirm(
        formValues.id ? 'Do you want to update this expense?' :
        'Do you want to save changes to this expense?', 
        formValues.id ? 'Update Expense' :
        'Save Expense',
        'Confirm',
        true,
        'Save'
      ))) return;

      const payload = {
        txn_date: formValues.txn_date,
        name: formValues.name,
        amount: parseFloat(formValues.amount),
        payment_method: formValues.payment_method,
        category: formValues.category || '',
        description: formValues.description || '',
        gym_id: user.gym_id,
        branch_id: formValues.branch_id || user.branch_id,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
        id: formValues.id || uuid(),
      };
      
      let data= isWeb ? await expenseService.save(payload) : await expenseService.saveSQLite(payload);
      if(data?.error){
        console.error("Error saving expense: ", data.error);
        await confirm(
          'An error occurred while saving the expense. Please try again.',
          'Error',
          'Error',
          false,
          'OK'
        );
        return;
      }
      dispatch(setLocalUpdate(true));
      setShowOverlay(false);
      setExpenses([])
      dispatch(setSuccessModal({ message: 'Expense saved!', visible: true }));
      setFormValues({ branch_id: user.branch_id });
    };

  return {

    expenses,
    errors,
    formValues,
    onFieldChange,
    onExpenseSelect,
    onSubmit,
    onSearch,
    onDelete,
    registerBiometric
  };
}
