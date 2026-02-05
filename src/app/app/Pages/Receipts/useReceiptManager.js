import { useEffect, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import { useSelector } from 'react-redux';
import { setLocalUpdate } from '@/store/authSlice';
import { calculateExpiryDate, getTotalAmount, payment_methods, replaceTags } from '@/app/lib/functions';
import { trainerExpiry } from '../admissions/useAdmissionManager';
import { whatsappService } from '../whatsapp/whatsappService';
import { setSendMessage } from '@/store/profileSlice';
export function useReceiptManager({
  user,
  customer,
  selectedTab,
  setSelectedTab,
  setSelectedCustomer,
  confirm,
  receiptService,
  resourceServices,
  uuid,
  dispatch,
  setSuccessModal
}) {
  const { isTauri, isWeb, isReady } = useRuntime();
  const status = useSelector(s => s.profile.deviceStatus); 
  const autoResendMessageOnRenewal = useSelector((state) => state.profile.tauriConfig?.autoResendMessageOnRenewal);
  const sendCopyToAdmin = useSelector((state) => state.profile.tauriConfig?.sendCopyToAdmin);
  const [receipts, setReceipts] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [errors, setErrors] = useState({});
  const [trainerAssignment, setTrainerAssignment] = useState(false);
  const [addPaymentModal, setAddPaymentModal] = useState(false);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allowEscape, setAllowEscape] = useState(true);
  const localUpdate = useSelector((state) => state.auth.localUpdate);
  const [formValues, setFormValues] = useState({
    ...customer,
    start_date: new Date().toISOString().split('T')[0],
    receipt_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    due_date: '',
    cancellation_date: '',
    total_amount: '0',
    discount: '0',
    balance: '0',
    amount_paid: '0',
    txn_type: 'renewal'
  });
  const hasReceipts = receipts.length > 0;
  const recalculatePackageValues = (nextValues) => {
      const selectedPackage = packages.find(
        pkg => pkg.id === nextValues.package
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
          ...nextValues
        }
      );
      if(selectedTrainer && !nextValues.trainer_assigned_on){
        nextValues.trainer_assigned_on = new Date().toISOString().split('T')[0];
      }
      if(selectedTrainer && nextValues.trainer_assigned_on){
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
  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    switch(tab) {
        case 'Profile':
            setFormValues({
                ...customer
            });
            break;
        case 'Add Receipts':
            setFormValues({
                ...customer,
                start_date: new Date().toISOString().split('T')[0],
                receipt_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                due_date: '',
                cancellation_date: '',
                total_amount: '0',
                discount: '0',
                balance: '0',
                amount_paid: '0',
                txn_type: 'renewal'
            });
            break;
        case 'Edit Membership':
            setFormValues({
                ...customer,
                start_date: new Date().toISOString().split('T')[0],
                receipt_date: new Date().toISOString().split('T')[0],
                payment_method: 'cash',
                due_date: '',
                cancellation_date: '',
                total_amount: '0',
                discount: '0',
                balance: '0',
                amount_paid: '0',
                type: 'renewal'
            });
            break;
        default:
            break;
    }
  }
  const tabs = [
    'Profile',
    status === 'connected' && 'Biometric Registration',
    hasReceipts && 'Send Message',
    hasReceipts && 'Print Receipts',
    hasReceipts && 'Edit Membership',
    'Add Receipts'
    ].filter(Boolean);

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
    }else if(field === 'trainerAssignment'){
      setTrainerAssignment(value);
      return;
    }else if(field === 'addPaymentModal'){
      setAddPaymentModal(value);
      return;
    }
    if (field === 'selected_receipt'){
      const receipt = receipts.find(r => r.membership_id === value);
      if(receipt){
        setFormValues(prev => ({
          ...prev,
          receipt: receipt,
          selected_receipt: value
        }));
        return
      }
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
        'start_date',
        'txn_type'
      ];

      if (packageRelatedFields.includes(field)) {
   
        nextValues = recalculatePackageValues(nextValues);
        console.log(nextValues)
      } 
      return nextValues;
    });
    setErrors({});
  };

  const onSubmitProfile = async () => {
      let errors = {};
      if(!formValues.name || formValues.name.trim() === ''){
          errors.name = 'Name is required';
      }
      if(!formValues.contact || formValues.contact.trim() === ''){
          errors.contact = 'Contact is required';
      }
      if(Object.keys(errors).length > 0){
          setErrors(errors);
          return;
      }
      let ok = await confirm(
          'Are you sure you want to update the profile?',
          'Update Profile',
          'Confirm',
          true,
          'Update'
      );
      if(!ok) return;

      const payload = {
         id: customer.id,
         name: formValues.name,
         BLOCKED: formValues.BLOCKED,
         contact: formValues.contact,
         father_name: formValues.father_name,
         address: formValues.address,
         dob: formValues.dob || '',
         email: formValues.email || '',
         admission_date: formValues.admission_date,
         photo_url: formValues.photo_url || customer.photo_url || '',
      };
      let response = isWeb ? await receiptService.updateCustomer(payload, user.gym_id) : await receiptService.updateCustomerSQLite(payload, user.gym_id);
      if(response.error){
          await confirm(
              'An error occurred while updating the profile. Please try again.',
              'Update Profile',
              'Error',
              false,
              'OK'
          );
          return;
      }
      dispatch(setLocalUpdate(true));
      // setLocalUpdate(prev => !prev);
      dispatch(setSuccessModal({ message: 'Profile updated successfully.', visible: true }));
  }

  const fetchReceipts = async () => {
    setFetching(true);
    try {
      let data = isWeb ? await receiptService.fetchReceipts(customer.id) : await receiptService.fetchReceiptSQL(customer.id);
 
      if(!isWeb){
         data = data.map(item => ({
          ...item,
          transaction_history: item.transaction_history ? JSON.parse(item.transaction_history) : [] 
         }));
         console.log('Parsed local receipts data:', data);
      }

      setReceipts(data || []);
    } catch (error) {
       setFetching(false);
    } finally {
      setFetching(false);
    }
  }
  
  const fetchData = async () => {
      let data = isWeb ? await receiptService.fetchData(user.gym_id, user.branch_id) : await receiptService.fetchDataSQLite(user.gym_id, user.branch_id);
      setPackages(data.packages || []);
      setTrainers(data.trainers || []);
      setTemplates(data.templates || []);
      console.log('Fetched packages, trainers, and templates data:', data.templates);
  }
  const sendBulkMessages = async (message,receipient, adminCopy) => {
       let gymId = user.gym_id;
        let branchId = user.branch_id;
       if(receipient && receipient.length > 0){
          dispatch(setSendMessage({
            number: receipient,
            text: message
          }));
       }
      let adminMessage = `Copy of message sent to ${receipient}:\n\n${message}`;
      if(sendCopyToAdmin && sendCopyToAdmin.length > 0){
          // wait for 5 seconds between each admin copy
          await new Promise(resolve => setTimeout(resolve, 5000));
          for(let adminNumber of sendCopyToAdmin){
              dispatch(setSendMessage({
                  number: adminNumber,
                  text: adminMessage
              }) );
          }
      }
  }
  const canSendMessage = (templateName)=>{
    if (user?.tier < 8 ) return false;
    if (!autoResendMessageOnRenewal) return false;
    const template = templates.find(t => t.name === templateName);
    return !!template;
  }
  const onAddTransaction = async()=>{
     let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
     let errors = {};
     if(!formValues.new_payment?.amount){
          errors.amount = 'Amount is required';
     }
     if(!formValues.new_payment?.txn_date){
          errors.txn_date = 'Payment date is required';
     }
     if(!formValues.new_payment?.txn_type){
          errors.txn_type = 'Payment method is required';
     }
     if(Object.keys(errors).length > 0){
          setErrors(errors);
          return;
     }
     let ok = await confirm(
          'Are you sure you want to add this transaction?',
          'Add Transaction',
          'Confirm',
          true,
          'Add'
      );
    if(!ok) return;
    let newAmount = parseFloat(formValues.new_payment.amount);
    let prevAmountPaid = parseFloat(selectedReceipt.amount_paid);
    let newBalance = parseFloat(selectedReceipt.balance);
    
    if(formValues.new_payment.txn_type === 'payment'){
        newBalance = newBalance - newAmount;
    }else{
        if(newAmount > prevAmountPaid){
            errors.amount = 'Refund amount cannot be greater than amount paid';
            setErrors(errors);
            return;
        }else{
            newBalance = newBalance + newAmount;
        }
    }
    if(newBalance < 0){
        errors.amount = 'Amount exceeds the balance due';
        setErrors(errors);
        return
    }
    let transactionPayload = {
        id: uuid(),
        gym_id: user.gym_id,
        branch_id: user.branch_id,
        member_id: selectedReceipt.member_id,
        membership_id: selectedReceipt.membership_id,
        amount: newAmount,
        txn_date: formValues.new_payment.txn_date,
        txn_type: formValues.new_payment.txn_type !== 'payment' ? 'refund' : 'payment',
        payment_method: formValues.new_payment.payment_method,
        updated_at: new Date().toISOString()
    }
    let membershipPayload = {
          id: selectedReceipt.membership_id,
          gym_id: user.gym_id,
          branch_id: user.branch_id,
          updated_at: new Date().toISOString(),
          amount_paid: prevAmountPaid + (formValues.new_payment.txn_type === 'payment' ? newAmount : -newAmount),
          balance: newBalance
    }
    // console.log('Transaction Payload:', transactionPayload);
    // console.log('Membership Payload:', membershipPayload);

    let response = isWeb ? await receiptService.addTransaction({
      transaction: transactionPayload,
      membership: membershipPayload
    }, user.gym_id) : await receiptService.addTransactionSQLite({
      transaction: transactionPayload,
      membership: membershipPayload
    });
    if(response.error){
          await confirm(
              'An error occurred while adding the transaction. Please try again.',
              'Add Transaction',
              'Error',
              false,
              'OK'
          );
          return;
      }
      setAddPaymentModal(false);
      dispatch(setSuccessModal({ message: 'Transaction added successfully.', visible: true }));
      fetchReceipts();
      setFormValues({
          ...customer,
          start_date: new Date().toISOString().split('T')[0],
          receipt_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          due_date: '',
          cancellation_date: '',
          total_amount: '0',
          discount: '0',
          balance: '0',
          amount_paid: '0',
          type: 'renewal'
      });
      if(canSendMessage('Payment Receipt')){
            let template = templates.find(t => t.name === 'Payment Receipt');
            let message = replaceTags(template.content, {...customer, ...membershipPayload, ...transactionPayload, total_amount: customer.total_amount_after_discount},
                  packages,
                  trainers
            );
            sendBulkMessages(message, customer.contact, sendCopyToAdmin);
      }
      dispatch(setLocalUpdate(true));
      // setLocalUpdate(prev => !prev);
  }
  const onAddMembership = async()=>{
    // Implementation for adding membership
    let errors = {};
    if(!formValues.package){
        errors.package = 'Package is required';
    }
    if(Object.keys(errors).length > 0){
        setErrors(errors);
        return;
    }
    let ok = await confirm(
          'Are you sure you want to add this membership?',
          'Add Membership',
          'Confirm',
          true,
          'Add'
      );
    if(!ok) return;
    // Prepare membership payload
    let membershipid = uuid();
    let membershipPayload = {
          id: membershipid,
          gym_id: user.gym_id,
          branch_id: user.branch_id,
          member_id: customer.id,
          package_id: formValues.package,
          trainer_id: formValues.trainer_id,
          receipt_date: formValues.receipt_date,
          start_date: formValues.start_date,
          due_date: formValues.due_date,
          cancellation_date: formValues.cancellation_date,
          total_amount: formValues.total_amount,
          amount_paid: parseInt(formValues.amount_paid) || 0,
          balance: parseInt(formValues.balance) || 0,
          discount: parseInt(formValues.discount) || 0,
          status: 'active',
          updated_at: new Date().toISOString(),
          trainer_assigned_on: formValues.trainer_assigned_on ? formValues.trainer_assigned_on : null,
          trainer_expiry: formValues.trainer_expiry ? formValues.trainer_expiry : ''
    }
    // console.log('Membership Payload:', membershipPayload);
    // return
    let transactionPayload = {
        id: uuid(),
        gym_id: user.gym_id,
        branch_id: user.branch_id,
        member_id: customer.id,
        membership_id: membershipid,
        amount: formValues.amount_paid,
        txn_date: formValues.receipt_date,
        txn_type: formValues.txn_type || 'refund',
        payment_method: formValues.payment_method,
        updated_at: new Date().toISOString()
    }
    let response = isWeb ? await receiptService.addMembership({
        membership: membershipPayload,
        transaction: transactionPayload
      }) : await receiptService.addMembershipSQLite({
        membership: membershipPayload,
        transaction: transactionPayload
      });
    
    if(response.error){
          await confirm(
              'An error occurred while adding the membership. Please try again.',
              'Add Membership',
              'Error',
              false,
              'OK'
          );
          return;
      }
      dispatch(setSuccessModal({ message: 'Membership added successfully.', visible: true }));
      fetchReceipts();
      setFormValues({
          ...customer,
          start_date: new Date().toISOString().split('T')[0],
          receipt_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          due_date: '',
          cancellation_date: '',
      });
      if(canSendMessage('Payment Receipt')){
            let template = templates.find(t => t.name === 'Payment Receipt');
            let message = replaceTags(template.content, {...customer, ...membershipPayload, ...transactionPayload, total_amount: customer.total_amount_after_discount},
                  packages,
                  trainers
            );
            sendBulkMessages(message, customer.contact, sendCopyToAdmin);
      }
      dispatch(setLocalUpdate(true));
  }
  const onDeleteTransaction = async(index) => {
    let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
    let transactionToDelete = selectedReceipt.transaction_history[index];
    let ok = await confirm(
          'Are you sure you want to delete this transaction?',
          'Delete Transaction',
          'Confirm',
          true,
          'Delete'
      );
    if(!ok) return;
    // Adjust membership amounts
    let newAmountPaid = parseFloat(selectedReceipt.amount_paid);
    let newBalance = parseFloat(selectedReceipt.balance);
    console.log(transactionToDelete)
    if(transactionToDelete.txn_type !== 'refund'){
        newAmountPaid -= parseFloat(transactionToDelete.amount);
        newBalance += parseFloat(transactionToDelete.amount);
    }else{
        // this is a refund
        newAmountPaid += parseFloat(transactionToDelete.amount);
        newBalance -= parseFloat(transactionToDelete.amount);
    }
    // console.log('New Amount Paid:', newAmountPaid, 'New Balance:', newBalance);
    // return
    let membershipPayload = {
          id: selectedReceipt.membership_id,
          gym_id: user.gym_id,
          branch_id: user.branch_id,
          updated_at: new Date().toISOString(),
          amount_paid: newAmountPaid,
          balance: newBalance
    }
    if(canSendMessage('Payment Receipt')){
            let template = templates.find(t => t.name === 'Payment Receipt');
            let message = `
            A transaction has been deleted from your membership:
            Membership ID: ${selectedReceipt.membership_id}
            Total Amount: ${transactionToDelete.amount}
            Date: ${transactionToDelete.txn_date}
            Customer Name: ${customer.name}
            `
            sendBulkMessages(message,'' , sendCopyToAdmin);
      }
    let response = isWeb ? await receiptService.deleteTransaction(transactionToDelete.transaction_id, membershipPayload, user.gym_id) : await receiptService.deleteTransactionSQLite(transactionToDelete.transaction_id, membershipPayload, user.gym_id);
    if(response.error){
          await confirm(
              'An error occurred while deleting the transaction. Please try again.',
              'Delete Transaction',
              'Error',
              false,
              'OK'
          );
          return;
      } 
      
      fetchReceipts();
      setFormValues({
          ...customer,
          start_date: new Date().toISOString().split('T')[0],
          receipt_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          due_date: '',
          cancellation_date: '',
          total_amount: '0',
          discount: '0',
          balance: '0',
          amount_paid: '0',
          type: 'renewal'
      });
      dispatch(setLocalUpdate(true));
      dispatch(setSuccessModal({ message: 'Transaction deleted successfully.', visible: true }));
  }
  const onFullRefund = async(index) => {
    // Implementation for full refund
    let errors = {};
    let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
    if(parseFloat(selectedReceipt.amount_paid) <= 0 || isNaN(parseFloat(selectedReceipt.amount_paid))){
        errors.amount = 'No amount paid to refund';
        setErrors(errors);
        return;
    }
    if(!formValues.new_payment?.amount || isNaN(parseFloat(formValues.new_payment.amount))){
        errors.amount = 'Amount is required for refund';
        setErrors(errors);
        return;
    }
    let ok = await confirm(
          'Are you sure you want to process a full refund for this receipt?',
          'Full Refund',
          'Confirm',
          true,
          'Refund'
      );
    if(!ok) return;
    console.log('Processing full refund for receipt:', selectedReceipt);
    let transactionPayload = {
        id: uuid(),
        gym_id: user.gym_id,
        branch_id: user.branch_id,
        member_id: selectedReceipt.member_id,
        membership_id: selectedReceipt.membership_id,
        amount: parseFloat(formValues.new_payment.amount),
        txn_date: formValues.new_payment.txn_date,
        txn_type: 'refund',
        payment_method: formValues.new_payment.payment_method,
        updated_at: new Date().toISOString()
    }
    let membershipPayload = {
          id: selectedReceipt.membership_id,
          gym_id: user.gym_id,
          status: 'cancelled',
          branch_id: user.branch_id,
          updated_at: new Date().toISOString(),
          amount_paid: 0,
          balance: 0,
          total_amount: 0,
          discount: 0
    }
    let response = isWeb ? await receiptService.addTransaction({transaction: transactionPayload, membership: membershipPayload}, user.gym_id) : await receiptService.addTransactionSQLite({transaction: transactionPayload, membership: membershipPayload});
    if(response.error){
          await confirm(
              'An error occurred while processing the full refund. Please try again.',
              'Full Refund',
              'Error',
              false,
              'OK'
          );
          return;
      }
      setAddPaymentModal(false);
      dispatch(setSuccessModal({ message: 'Full refund processed successfully.', visible: true }));
      dispatch(setLocalUpdate(true));
  }
  const onDeleteMembership = async()=>{
    let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
    let ok = await confirm(
          'Are you sure you want to delete this membership?',
          'Delete Membership',
          'Confirm',
          true,
          'Delete'
      );
    if(!ok) return;
    let response = isWeb ? await receiptService.deleteMembership(selectedReceipt.membership_id, user.gym_id) : await receiptService.deleteMembershipSQLite(selectedReceipt.membership_id, user.gym_id);
    if(response.error){
          await confirm(
              'An error occurred while deleting the membership. Please try again.',
              'Delete Membership',
              'Error',
              false,
              'OK'
          );
          return;
      }
      dispatch(setSuccessModal({ message: 'Membership deleted successfully.', visible: true }) );;
      fetchReceipts();
      dispatch(setLocalUpdate(true));
      setFormValues({
          ...customer,
          start_date: new Date().toISOString().split('T')[0],
          receipt_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          due_date: '',
          cancellation_date: '',
      });
      if(canSendMessage('Payment Receipt')){
            let template = templates.find(t => t.name === 'Payment Receipt');
            let message = `
            A membership has been deleted:
            Membership ID: ${selectedReceipt.membership_id}
            Customer Name: ${customer.name}
            Total Amount: ${selectedReceipt.amount_paid}
            `
            sendBulkMessages(message,'' , sendCopyToAdmin);
      }
  }
  const onDeleteProfile = async()=>{
    let ok = await confirm(
          'Are you sure you want to delete this profile? All associated memberships and transactions will also be deleted.',
          'Delete Profile',
          'Error',
          true,
          'Delete'
      );
    if(!ok) return;
    let response = isWeb ? await receiptService.deleteCustomer(customer.id, user.gym_id) : await receiptService.deleteCustomerSQLite(customer.id, user.gym_id);
    if(response.error){
          await confirm(
              'An error occurred while deleting the profile. Please try again.',
              'Delete Profile',
              'Error',
              false,
              'OK'
          );
          return;
      }
      dispatch(setLocalUpdate(true));
      dispatch(setSuccessModal({ message: 'Profile deleted successfully.', visible: true }));
      setTimeout(() => {
        setSelectedCustomer(null);
      }, 1000);
  }
  const onRenewTrainerAssignment = async()=>{
    let errors = {};
    let new_trainer = formValues.new_trainer;
    if(!new_trainer || !new_trainer.trainer_id){
        errors.trainer_id = 'Trainer is required';
    }
    if(!new_trainer || !new_trainer.start_date ){
        errors.start_date  = 'Assigned on date is required';
    }
    if(!new_trainer.fee){
        errors.fee = 'Trainer fee is required';
    }
    if(Object.keys(errors).length > 0){
        setErrors(errors);
        return;
    }
    let ok = await confirm(
          'Are you sure you want to renew the trainer assignment?',
          'Renew Trainer Assignment',
          'Confirm',
          true,
          'Renew'
      );
    if(!ok) return;
    let selectedTrainer = trainers.find(
        trn => trn.id === formValues.trainer_id
      );
    let newTrainerExpiry = trainerExpiry(new_trainer.start_date);
    let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
    let membershipId = selectedReceipt.membership_id;
    let prevTotalAmount = parseFloat(selectedReceipt.total_amount) || 0;
    let newTotalAmount = prevTotalAmount + parseFloat(new_trainer.fee);
    let prevBalance = parseFloat(selectedReceipt.balance) || 0;
    let newBalance = prevBalance + parseFloat(new_trainer.fee);
    let membershipPayload = {
          id: membershipId,
          gym_id: user.gym_id,
          branch_id: user.branch_id,
          updated_at: new Date().toISOString(),
          trainer_id: new_trainer.trainer_id,
          trainer_assigned_on: new_trainer.start_date,
          trainer_expiry: newTrainerExpiry,
          trainer_fee: new_trainer.fee,
          total_amount: newTotalAmount,
          balance: newBalance
    }
    let response = isWeb ? await receiptService.renewTrainerAssignment(membershipId,membershipPayload, user.gym_id) : await receiptService.renewTrainerAssignmentSQLite(membershipId,membershipPayload, user.gym_id);
    if(response.error){
          await confirm(
              'An error occurred while renewing the trainer assignment. Please try again.',
              'Renew Trainer Assignment',
              'Error',
              false,
              'OK'
          );
          return;
      }
      dispatch(setSuccessModal({ message: 'Trainer assignment renewed successfully.', visible: true }));
      fetchReceipts();
      setTrainerAssignment(false);
      dispatch(setLocalUpdate(true));
      setFormValues({
          ...customer,
          start_date: new Date().toISOString().split('T')[0],
          receipt_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          due_date: '',
          cancellation_date: '',
          total_amount: '0',
          discount: '0',
          balance: '0',
          amount_paid: '0',
          type: 'renewal'
      });
  }
  const onSendMessage = async ()=>{
    let selectedReceipt = receipts.find(r => r.membership_id === formValues.selected_receipt);
    let finalMember = {
        ...customer,
        ...selectedReceipt
    };
    let errors = {};
    let selectedTemplate = templates.find(tpl => tpl.id === formValues.message_template);
    if(!selectedTemplate){
        errors.message_template = 'Please select a message template';
    }
    if(!selectedReceipt){
        errors.selected_receipt = 'Please select a receipt to send message for';
    }
    if(Object.keys(errors).length > 0){
        setErrors(errors);
        return;
    }
    let finalText = replaceTags(selectedTemplate.content, finalMember, packages, trainers);
    if(user?.tier >= 8 ){
      await sendWhatsappMessage({
        user,
        finalMember,
        finalText,
        whatsappService,  
        dispatch
      });
      if(sendCopyToAdmin && sendCopyToAdmin.length > 0){
          for(let adminNumber of sendCopyToAdmin){
              let adminMessage = `Copy of message sent to ${finalMember.contact}:\n\n${finalText}`;
              await sendWhatsappMessage({
                  user: {...user, contact: adminNumber},
                  finalMember: {...finalMember, contact: adminNumber},
                  finalText: adminMessage,
                  whatsappService,
                  dispatch
              });
          }
      }
      dispatch(setSuccessModal({ message: 'Message sent successfully & will be queued.', visible: true }));
    }else{
       // create a whatsapp web link
       let whatsappLink = `https://wa.me/${finalMember.contact.replace(/\D/g,'')}?text=${encodeURIComponent(finalText)}`;
       resourceServices.openExternalLink(whatsappLink);
    }
  }
  useEffect(() => {
    if(!isReady) return;
    fetchReceipts();
    fetchData();
  },[isReady]);

  return {
        formValues,
        addPaymentModal,
        trainerAssignment,
        packages,
        trainers,
        templates,
        selectedTab,
        handleTabChange,
        receipts,
        tabs,
        onFieldChange,
        setReceipts,
        errors,
        setErrors,
        fetching,
        onSubmitProfile,
        onAddTransaction,
        onDeleteTransaction,
        onFullRefund,
        onAddMembership,
        onDeleteMembership,
        onDeleteProfile,
        onRenewTrainerAssignment,
        onSendMessage,
        isTauri,
        allowEscape,
        setAllowEscape
  };
}

export async function sendWhatsappMessage({
  user,
  finalMember,
  finalText,
  whatsappService,
  dispatch
}){
    try {
      dispatch(setSendMessage({
                  number: finalMember.contact,
                  text: finalText
              }))
    } catch (err) {
      console.error("SEND_MESSAGE_ERROR", err);
    }
}