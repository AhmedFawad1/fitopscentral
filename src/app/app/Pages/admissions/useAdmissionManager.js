import { useEffect, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import { useSelector } from 'react-redux';
import { calculateExpiryDate, getTotalAmount, payment_methods, replaceTags } from '@/app/lib/functions';
import { genUUID } from '../uuid';
import { send } from 'node:process';

const initialFormValues = {
  admission_date: new Date().toISOString().split('T')[0],
  receipt_date: new Date().toISOString().split('T')[0],
  start_date: new Date().toISOString().split('T')[0],
  gender: 'male',
  payment_method: 'cash'
};
export function useAdmissionManager({
  user,
  confirm,
  admissionService,
  whatsappService,
  uuid,
  dispatch,
  setLocalUpdate,
  setSuccessModal
}) {
  const { isTauri, isWeb, isReady } = useRuntime();
  const [errors, setErrors] = useState({});
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [templates, setTemplates] = useState([]);

  const autoResendMessageOnRenewal = useSelector((state) => state.profile.tauriConfig?.autoResendMessageOnRenewal);
  const sendCopyToAdmin = useSelector((state) => state.profile.tauriConfig?.sendCopyToAdmin);

  const firstDateOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0];
  const lastDateOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0];
  const [formValues, setFormValues] = useState({
    branch_id: user.branch_id,
    ...initialFormValues
  });

  const fetchData = async () => {
    let data = isWeb ? await admissionService.fetchData(user.gym_id, formValues.branch_id) : await admissionService.fetchDataSQLite(user.gym_id, formValues.branch_id);
    if(data?.error){
      console.error("Error fetching admission data: ", data.error);
      setPackages([]);
      setTrainers([]);
      return;
    }else{
      setPackages(data.packages || []);
      setTrainers(data.trainers || []);
      setTemplates(data.templates || []);
      setFormValues(prev => ({ ...prev, serial_number: data.serial_number }));
    }
  }

  useEffect(() => {
    if(!isReady) return;
    fetchData();
  }, [formValues.branch_id, isReady]);
  
  const recalculatePackageValues = (nextValues) => {
    const selectedPackage = packages.find(
      pkg => pkg.name === nextValues.package
    );
    if (!selectedPackage) return nextValues;

    const selectedTrainer = trainers.find(
      trn => trn.id === nextValues.trainer_id
    );
    const { due_date, cancellation_date } = calculateExpiryDate(
      nextValues.start_date,
      selectedPackage.duration,
      selectedPackage.duration_type,
      selectedPackage.cancellation
    );
    const { totalAmount, balance } = getTotalAmount(
      selectedPackage,
      selectedTrainer,
      {
        ...nextValues,
      }
    );
    if(selectedTrainer && !nextValues.trainer_assigned_on){
      nextValues.trainer_assigned_on = new Date().toISOString().split('T')[0];
    }
    if(selectedTrainer){

       nextValues.trainer_expiry = trainerExpiry(
        nextValues.trainer_assigned_on
      );
    }
    if(selectedTrainer && !nextValues.trainer_fee){
      
      nextValues.trainer_fee = selectedTrainer.fee || 0;
    }
    return {
      ...nextValues,
      total_amount: totalAmount,
      balance,
      due_date,
      cancellation_date
    };
  };

  const onFieldChange = (field, value) => {

    // 🔹 CLEAR FORM
    if (field === 'clearForm') {
      setFormValues({ 
        branch_id: user.branch_id,
        gym_id: user.gym_id,
        serial_number: formValues.serial_number,
        ...initialFormValues
      });
      setErrors({});
      return;
    }

    setFormValues(prev => {
      let nextValues = { ...prev, [field]: value };

      // 🔹 BRANCH CHANGE
      if (field === 'branch_id') {
        fetchData();
        return nextValues;
      }

      // 🔹 PACKAGE-RELATED FIELDS
      const packageRelatedFields = [
        'package',
        'amount_paid',
        'admission_date',
        'receipt_date',
        'admission_fee',
        'package_fee',
        'trainer_fee',
        'discount',
        'trainer_id',
        'trainer_assigned_on',
        'start_date'
      ];

      if (packageRelatedFields.includes(field)) {
        nextValues = recalculatePackageValues(nextValues);
      }

      return nextValues;
    });
    setErrors({});
  };
 
  const validateAdmission = (formValues) => {
    const errors = {};
    if (!formValues.name || formValues.name.trim() === '') {
      errors.name = 'Name is required';
    }
    if (!formValues.contact || formValues.contact.trim() === '') {
      errors.contact = 'Contact is required';
    }
    if(!formValues.package || formValues.package.trim() === ''){
      errors.package = 'Package is required';
    }
    if(!formValues.start_date || formValues.start_date.trim() === ''){
      errors.start_date = 'Start date is required';
    }
    if(formValues.amount_paid > formValues.total_amount){
      errors.amount_paid = 'Amount paid cannot be greater than total amount';
    }
    if(!formValues.total_amount){
      errors.total_amount = 'Total amount cannot be zero';
    }
    if(formValues.trainer_id && !formValues.trainer_assigned_on){
      errors.trainer_assigned_on = 'Trainer assigned date is required when a trainer is selected';
    } 
    if(!formValues.payment_method || formValues.payment_method.trim() === ''){
      errors.payment_method = 'Payment method is required';
    }
    return errors;
  }
  const sendBulkMessages = async (message,receipient, adminCopy) => {
         let gymId = user.gym_id;
         let branchId = user.branch_id;
         let resp =await whatsappService.apiFetch(
            `/messages/${gymId}/${branchId}/enqueue`,
            {
              method: "POST",
              body: JSON.stringify({
                to: receipient,
                body: message
              })
            }
          );
          console.log('Message send response:', resp);
        let adminMessage = `Copy of message sent to ${receipient}:\n\n${message}`;
        if(sendCopyToAdmin && sendCopyToAdmin.length > 0){
            for(let adminNumber of sendCopyToAdmin){
                let resp = await whatsappService.apiFetch(
                    `/messages/${gymId}/${branchId}/enqueue`,
                    {
                      method: "POST",
                      body: JSON.stringify({
                        to: adminNumber,
                        body: adminMessage
                      })
                    }
                  );
                console.log('Admin copy send response:', resp);
            }
        }
    }
  const sendWhatsappMessage = async (payload) => {
    if(!autoResendMessageOnRenewal) return;
    if(user.tier < 8) return;
    let finalMember = payload;
    let selectedTemplate = templates.find(tpl => tpl.name === 'Payment Receipt');
    if(!selectedTemplate) return;
    let finalText = replaceTags(selectedTemplate.content, finalMember, packages, trainers);
    await sendBulkMessages(finalText, finalMember.contact, sendCopyToAdmin);
  }
  const onSubmit = async () => {
      const validationErrors = validateAdmission(formValues);
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
      let package_id = packages.find(
        pkg => pkg.name === formValues.package
      )?.id;
      const payload = {
        id: genUUID(),
        membership_id: genUUID(),
        transaction_id: genUUID(),
        serial_number: formValues.serial_number,
        gym_id: user.gym_id,
        branch_id: formValues.branch_id || user.branch_id,
        name: formValues.name,
        contact: formValues.contact,
        father_name: formValues.father_name || '',
        address: formValues.address
          ? formValues.address.trim()
          : '',
        gender: formValues.gender,
        package_id: package_id,
        trainer_id: formValues.trainer_id || null,
        trainer_assigned_on: formValues.trainer_assigned_on || null,
        trainer_expiry: formValues.trainer_expiry || null,
        admission_date: formValues.admission_date,
        trainer_fee: formValues.trainer_fee || 0,
        receipt_date: formValues.receipt_date,
        start_date: formValues.start_date,
        due_date: formValues.due_date || null,
        cancellation_date: formValues.cancellation_date || null,
        total_amount: formValues.total_amount || 0,
        amount_paid: formValues.amount_paid || 0,
        balance: formValues.balance || 0,
        payment_methods: formValues.payment_method,
        updated_at: new Date().toISOString(),
        discount: formValues.discount || 0,
        txn_date_today: formValues.txn_date_today || false,
        admission_fee: formValues.admission_fee || false,
        package_fee: formValues.package_fee || false,
        photo_url: formValues.photo_url || ''
      };
      //sendWhatsappMessage(payload);
      console.log(payload)
      // return
      let data= isWeb ? await admissionService.save(payload) : await admissionService.saveSQLite(payload);
      if(data?.error){
        console.log("Error saving admission: ", data.error);
        await confirm(
          'An error occurred while saving the admission. Please try again.',
          'Error',
          'Error',
          false,
          'OK'
        );
        return;
      }
      dispatch(setLocalUpdate(true));
      fetchData();
      dispatch(setSuccessModal({ message: 'Admission Added Successfully!', visible: true }));
      setFormValues({
         ...initialFormValues,
         gym_id: user.gym_id,
         branch_id: formValues.branch_id || user.branch_id
      });
    };

  return {
    packages,
    trainers,
    errors,
    formValues,
    onFieldChange,
    onSubmit,
    isTauri
  };
}
export function trainerExpiry(startDate) {
    let expiryDate = new Date(startDate);
    // add 30 days 
    console.log(startDate)
    expiryDate.setDate(expiryDate.getDate() + 30);
    return expiryDate.toISOString().split('T')[0];
}