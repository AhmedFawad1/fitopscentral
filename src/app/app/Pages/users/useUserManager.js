import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

export function useUserManager({
    user,
    branches,
    confirm,
    userService,
    uuid,
    dispatch,
    setLocalUpdate,
    setSuccessModal,
    setShowBranchOverlay
}) {
    const router = useRouter();
    const [users, setUsers] = useState([]);
    const [errors, setErrors] = useState({});
    const [formValues, setFormValues] = useState({
        branch_id: user.branch_id
    });
    const fetchUsers = async () => {
        const data = await userService.fetch(user.gym_id, formValues.branch_id);
        setFormValues(prev => ({branch_id: prev.branch_id}));
        setUsers(data);
    };

    useEffect(() => {
        fetchUsers();
    }, [formValues.branch_id]);

    useEffect(() => {
        if (formValues.selectedUser) {
            const selected = users.find(s => s.id === formValues.selectedUser);
            if (selected) {
                setFormValues({ ...selected, selectedUser: selected.id });
            }
        }else{
            setFormValues({ branch_id: formValues.branch_id });//reset to initial state except branch and serial number
        }
    }, [formValues.selectedUser]);

    useEffect(() => {
        let selected = branches.find(b => b.id === formValues.selectedBranch);
        if (selected) {
            setFormValues({
                ...formValues,
                ...selected
            })
        }
    }, [formValues.selectedBranch]);

    const userValidation = () =>{
        const errors = {};
        if (!formValues.full_name || formValues.full_name.trim() === '') {
            errors.full_name = 'Name is required';
        }
        if (!formValues.email || formValues.email.trim() === '') {
            errors.email = 'Email is required';
        }
        if (!formValues.password || formValues.password.trim() === '') {
            if(!formValues.id){ //only require password for new users
                errors.password = 'Password is required';
            }
        }
        if (!formValues.role || formValues.role.trim() === '') {
            errors.role = 'Role is required';
        }
        setErrors(errors);
        return errors;
    }
    const onFieldChange = (field, value) => {
        setErrors({});
        setFormValues(prev => ({ ...prev, [field]: value }));
    };
    const onUserSelect = e => {
        const selected = users.find(s => s.id === e.target.value);
        if (!selected) {
            setFormValues({ branch_id: user.branch_id });
            return;
        }
        setFormValues({ ...selected, selectedUser: selected.id });
    };
    const onDelete = async () => {
        if (!formValues.id) {
            setErrors({ selectedUser: 'Please select a user to delete.' });
            return;
        }
        if (!(await confirm(
            'Are you sure you want to delete this user?',
            'Deleting User',
            'Error',
            true,
            'Delete User'
        ))) return;
        await userService.softDelete(formValues.id, user.gym_id);
        setFormValues({ branch_id: user.branch_id });
        dispatch(setLocalUpdate(true));
        fetchUsers();
        dispatch(setSuccessModal({ message: 'User deleted successfully.', visible: true }));
        window.location.reload();
    }
    const onSubmit = async () => {
        let validationErrors = userValidation();
        if (Object.keys(validationErrors).length > 0) {
            return;
        }
        let ok = await confirm(
            'Do you want to save the user details?',
            'Save User',
            'Confirm',
            true,
            'Save'
        );
        if (!ok) return;
        let logout = false;
        const payload = {
            id: formValues.id || uuid(),
            gym_id: user.gym_id,
            branch_id: formValues.branch_id,
            full_name: formValues.full_name,
            email: formValues.email,
            role: formValues.role,
            updated_at: new Date().toISOString(),
        };
        
        if (formValues.password && formValues.password.trim() !== '' && formValues.id) {
            delete payload.password; //do not send password in payload for existing users
            let { data: userData, error: userError } = await userService.save(payload);
            if (userError) {
                console.error('Error saving user:', userError);
                await confirm(
                    'An error occurred while saving the user. Please try again.',
                    'Saving User',
                    'Error',
                    false,
                    'OK'
                );
                return;
            }
            let res = await userService.updateUser(payload.id, formValues.password);
            if (res.error) {
                setErrors({ password: res.error || 'Error updating password' });
                return;
            }else{
                // logout if the current user updated their own password
                if(payload.id === user.id){
                    // reload current window
                    window.location.reload();
                }
            }
        }else if(formValues.id){
            let { data: userData, error: userError } = await userService.save(payload);
            if (userError) {
                await confirm(
                    'An error occurred while saving the user. Please try again.',
                    'Saving User',
                    'Error',
                    false,
                    'OK'
                );
                return;
            }
        }else{
            if(users.length >= user.max_users){
                await confirm(
                    `You have reached the maximum number of users (${user.max_users}). Please upgrade your plan to add more users.`,
                    'User Limit Reached',
                    'Error',
                    false,
                    'OK'
                );
                return;
            }else{
                const {data, error} = await userService.signup(formValues.email, formValues.password);
                if(error){
                    setErrors({ email: error.message || 'Error creating user' });
                    return;
                }
                payload.id = data.user.id;
                payload.auth_user_id = data.user.id;
                let { data: userData, error: userError } = await userService.upsertUser(payload);
                if (userError) {
                    await confirm(
                        'An error occurred while saving the user. Please try again.',
                        'Saving User',
                        'Error',
                        false,
                        'OK'
                    );
                    return;
                }
            }
        }

        dispatch(setLocalUpdate(true));
        setFormValues({ branch_id: user.branch_id });
        dispatch(setSuccessModal({
            message: 'User saved successfully.',
            visible: true
        }))
        fetchUsers();
    }
    const onAddBranch = async() => {
        // Logic to add branch
        if(branches.length >= user.max_branches){
            await confirm(
                `You have reached the maximum number of branches (${user.max_branches}). Please upgrade your plan to add more branches.`,   
                'Branch Limit Reached',
                'Error',
                false,
                'OK'
            );
            return;
        }
        let errors = {};
        if (!formValues.name || formValues.name.trim() === '') {
            errors.branch_name = 'Branch name is required';
        }
        if (Object.keys(errors).length > 0) {
            setErrors(errors);
            return;
        }
        // Add branch logic here
        let ok = await confirm(
            formValues.id ? 'Do you want to update this branch?' :
            'Do you want to add this branch?',
            formValues.id ? 'Update Branch' :
            'Add Branch',
            'Confirm',
            true,
            formValues.id ? 'Update' :
            'Add'
        );
        if (!ok) return;
        let payload = {
            id: formValues.id || uuid(),
            gym_id: user.gym_id,
            name: formValues.name,  
            address: formValues.address,
            code: formValues.code
        };
        let res = await userService.saveBranch(payload);
        if (res.error) {
            await confirm(
                'An error occurred while saving the branch. Please try again.',
                'Saving Branch',
                'Error',
                false,
                'OK'
            );
            return;
        }
        setFormValues({ branch_id: formValues.branch_id });
        dispatch(setLocalUpdate(true));
        setShowBranchOverlay(false);
        fetchUsers();
        dispatch(setSuccessModal({ message: 'Branch saved successfully.', visible: true }));
        window.location.reload();
    }
    const onDeleteBranch = async() => {
        // Logic to delete branch
        if (!formValues.id) {
            setErrors({ branch: 'Please select a branch to delete.' });
            return;
        }
        let ok = await confirm(
            'Are you sure you want to delete this branch?',
            'Delete Branch',
            'Confirm',
            true,
            'Delete'
        );
        if (!ok) return;
    }
    return {
        users,
        errors,
        formValues,
        onFieldChange,
        onUserSelect,
        userValidation,
        onSubmit,
        onDelete,
        onAddBranch,
        onDeleteBranch
    };
}