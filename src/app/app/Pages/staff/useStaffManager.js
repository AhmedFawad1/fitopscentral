import { useRuntime } from "@/hooks/useRuntime";
import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export function useStaffManager({
    user,
    confirm,
    staffService,
    uuid,
    dispatch,
    setLocalUpdate,
    setSuccessModal
}) {
    const [registerBiometric, setRegisterBiometric] = useState(false);
    const logs = useSelector((state) => state.profile.eventLogs);
    const [staff, setStaff] = useState([]);
    const [errors, setErrors] = useState({});
    const [formValues, setFormValues] = useState({
        branch_id: user.branch_id
    });
    const [showModal, setShowModal] = useState(false);
    const status = useSelector((state) => state.profile.deviceStatus);
    const [deviceMessage, setDeviceMessage] = useState('');

    const [serial_number, setSerialNumber] = useState(1);
    const { isTauri, isWeb, isReady } = useRuntime();
    const fetchStaff = async () => {
        const data = isWeb ? await staffService.fetch(user.gym_id, formValues.branch_id) : await staffService.fetchSQLite(user.gym_id, formValues.branch_id);
        const serial_number = isWeb ? await staffService.fetchNextSerialNumber(user.gym_id, formValues.branch_id) : await staffService.fetchNextSerialNumberSQLite(user.gym_id, formValues.branch_id);
        setFormValues(prev => ({branch_id: prev.branch_id, serial_number}));
        setSerialNumber(serial_number);
        setStaff(data);
    };

    useEffect(() => {
        if(!isReady) return;
        fetchStaff();
    }, [formValues.branch_id, isReady]);

    useEffect(() => {
        if (formValues.selectedStaff) {
            const selected = staff.find(s => s.id === formValues.selectedStaff);
            if (selected) {
                setFormValues({ ...selected, selectedStaff: selected.id });
            }
        }else{
            setFormValues({ branch_id: formValues.branch_id, serial_number: serial_number });//reset to initial state except branch and serial number
        }
    }, [formValues.selectedStaff]);

    useEffect(()=>{
        if(!isTauri) return;
        // example log

        if (logs.length === 0) return;

        const raw = logs[0][0];
        if(!raw || typeof raw !== 'string') return;
        // Extract the JSON object from the log line
        const jsonMatch = raw.match(/\{.*\}$/);

        if (!jsonMatch) {
            console.log("No JSON found in log", raw);
            return;
        }

        const jsonString = jsonMatch[0];

        let parsed;
        try {
            parsed = JSON.parse(jsonString);
        } catch (err) {
            console.error("JSON parsing failed:", err);
            return;
        }


        let typeMessage = parsed.type;

        switch(typeMessage){
            // Add cases here as needed
            case 'enroll_start':
                setDeviceMessage('🟢 Biometric enrollment started.');
                break;  
            case 'enroll_stop':
                //setDeviceMessage('🔴 Biometric enrollment stopped.');
                break;  
            case 'delete_user':
                setDeviceMessage('🗑️ Biometric data deleted.');
                break;
            case 'enroll_done':
                setDeviceMessage('✅ Biometric enrollment completed successfully.');
                setRegisterBiometric(false);
                break;
            case 'error':
                if(status === 'connected' && parsed.data && parsed.data.message){
                    if(parsed.data.message === 'DeleteUser failed'){
                        setDeviceMessage(`❌ Failed to delete biometric data for ${customer.data.serial_number}. User may not exist on device.`);
                    }else if(parsed.data.message === 'StartEnroll failed'){
                        setDeviceMessage('❌ Failed to start biometric enrollment. User May already be enrolled.');
                        setRegisterBiometric(false);
                    }
                }
                break;
            default:    
                break;
        }
    },[logs])

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

    const staffValidation = () =>{
        const errors = {};
        if (!formValues.name || formValues.name.trim() === '') {
            errors.name = 'Name is required';
        }
        if(!formValues.branch_id || formValues.branch_id.trim() === ''){
            errors.branch_id = 'Branch is required';
        }
        if(!formValues.staff_type || formValues.staff_type.trim() === ''){
            errors.staff_type = 'Staff type is required';
        }
        if(!formValues.salary_type || formValues.salary_type.trim() === ''){
            errors.salary_type = 'Salary type is required';
        }
        if(formValues.salary_type === 'fixed' && (!formValues.base_salary || isNaN(formValues.base_salary))){
            errors.base_salary = 'Valid salary is required for fixed salary type';
        }
        if(formValues.salary_type === 'hourly' && (!formValues.hourly_rate || isNaN(formValues.hourly_rate))){
            errors.hourly_rate = 'Valid hourly rate is required for hourly salary type';
        }
        setErrors(errors);
        return errors;
    }

    const onFieldChange = (field, value) => {
        setErrors({});
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    const onStaffSelect = e => {
        const selected = staff.find(s => s.id === e.target.value);
        if (!selected) {
            setFormValues({ branch_id: user.branch_id });
            return;
        }
        setFormValues({ ...selected, selectedStaff: selected.id });
    };

    const onDelete = async () => {
        if (!formValues.id) {
            setErrors({ selectedStaff: 'Please select a staff member to delete.' });
            return;
        }
        if (!(await confirm(
            'Are you sure you want to delete this staff member?',
            'Deleting Staff Member',
            'Error',
            true,
            'Delete Staff'
        ))) return;
        let response = isWeb ? await staffService.softDelete(formValues.id, user.gym_id) : await staffService.softDeleteSQLite(formValues.id, user.gym_id);
        if (response.error) {
            await confirm(
                'An error occurred while deleting the staff member. Please try again.',
                'Deleting Staff Member',
                'Error',
                false,
                'OK'
            );
            return;
        }
        setFormValues({ branch_id: user.branch_id });
        dispatch(setLocalUpdate(true));
        fetchStaff();
        dispatch(setSuccessModal({ message: 'Staff member deleted successfully.', visible: true }));
    }
    const onSubmit = async () => {
        let validationErrors = staffValidation();
        if (Object.keys(validationErrors).length > 0) {
            return;
        }
        let ok = await confirm(
            'Do you want to save the staff member details?',
            'Save Staff Member',
            'Confirm',
            true,
            'Save'
        );
        if (!ok) return;
        const payload = {
            id: formValues.id || uuid(),
            name: formValues.name,
            nic: formValues.nic || null,
            branch_id: formValues.branch_id,
            gym_id: user.gym_id,
            staff_type: formValues.staff_type,
            salary_type: formValues.salary_type,
            base_salary: formValues.base_salary ? parseFloat(formValues.base_salary) : null,
            hourly_rate: formValues.hourly_rate ? parseFloat(formValues.hourly_rate) : null,
            serial_number: formValues.serial_number,
            work_start_time: formValues.work_start_time,
            work_end_time: formValues.work_end_time,
            commission_percent: formValues.commission_percent ? parseFloat(formValues.commission_percent) : null,
            fee: formValues.fee ? parseFloat(formValues.fee) : null,
            contact: formValues.contact || null,
            email: formValues.email || null,
            address: formValues.address || null,
            updated_at: new Date().toISOString(),
            updated_by: user.id
        };
        let { data, error } = isWeb ? await staffService.save(payload) : await staffService.saveSQLite(payload);
        if (error) {
            await confirm(
                'An error occurred while saving the staff member. Please try again.',
                'Saving Staff Member',
                'Error',
                false,
                'OK'
            );
            return;
        }
        dispatch(setLocalUpdate(true));
        setFormValues({ branch_id: user.branch_id, serial_number: await (isWeb ? staffService.fetchNextSerialNumber(user.gym_id, formValues.branch_id) : staffService.fetchNextSerialNumberSQLite(user.gym_id, formValues.branch_id)) });
        dispatch(setSuccessModal({
            message: 'Staff member saved successfully.',
            visible: true
        }))
        fetchStaff();
    }

    const deleteBiometric = async () => {
        await invoke("zk_delete_user", { id: formValues.serial_number.toString() });
    }
    return {
        staff,
        errors,
        formValues,
        onFieldChange,
        onStaffSelect,
        staffValidation,
        onSubmit,
        onDelete,
        showModal,
        setShowModal,
        status,
        deviceMessage,
        isTauri,
        deleteBiometric,
        setRegisterBiometric,
        registerBiometric
    };
}