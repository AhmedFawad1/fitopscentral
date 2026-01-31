import { useRuntime } from "@/hooks/useRuntime";
import { useEffect, useState } from "react";

export function useTemplateManager({
    user,
    confirm,
    templateService,
    uuid,
    dispatch,
    setLocalUpdate,
    setSuccessModal
}) {
    const [templates, setTemplates] = useState([]);
    const [errors, setErrors] = useState({});
    const { isTauri, isWeb, isReady } = useRuntime();
    const [formValues, setFormValues] = useState({
        branch_id: user.branch_id
    });
    const fetchTemplates = async () => {
        const data = isWeb ? await templateService.fetch(user.gym_id, formValues.branch_id) : await templateService.fetchSqlite(user.gym_id, formValues.branch_id);
        setFormValues(prev => ({branch_id: prev.branch_id}));
        setTemplates(data);
    };

    useEffect(() => {
        if (!isReady) return;
        fetchTemplates();
    }, [formValues.branch_id, isReady]);

    useEffect(() => {
        if (formValues.selectedTemplate) {
            const selected = templates.find(s => s.id === formValues.selectedTemplate);
            if (selected) {
                setFormValues({ ...selected, selectedTemplate: selected.id });
            }
        }else{
            setFormValues({ branch_id: formValues.branch_id });//reset to initial state except branch and serial number
        }
    }, [formValues.selectedTemplate]);
    const templateValidation = () =>{
        const errors = {};
        if (!formValues.name || formValues.name.trim() === '') {
            errors.name = 'Name is required';
        }
        if (!formValues.type || formValues.type.trim() === '') {
            errors.type = 'Type is required';
        }
        if (!formValues.branch_id || formValues.branch_id.trim() === '') {
            errors.branch_id = 'Branch is required';
        }
        if (!formValues.content || formValues.content.trim() === '') {
            errors.content = 'Content is required';
        }
        
        setErrors(errors);
        return errors;
    }

    const onFieldChange = (field, value) => {
        setErrors({});
        setFormValues(prev => ({ ...prev, [field]: value }));
    };

    const onTemplateSelect = e => {
        const selected = templates.find(s => s.id === e.target.value);
        if (!selected) {
            setFormValues({ branch_id: user.branch_id });
            return;
        }
        setFormValues({ ...selected, selectedTemplate: selected.id });
    };

    const onDelete = async () => {
        if (!formValues.id) {
            setErrors({ selectedTemplate: 'Please select a template to delete.' });
            return;
        }
        if (!(await confirm(
            'Are you sure you want to delete this template?',
            'Deleting Template',
            'Error',
            true,
            'Delete Template'
        ))) return;
        let resp = isWeb ? await templateService.softDelete(formValues.id, user.gym_id) : await templateService.softDeleteSqlite(formValues.id, user.gym_id);
        if (resp.error) {
            await confirm(
                'An error occurred while deleting the template. Please try again.',
                'Deleting Template',
                'Error',
                false,
                'OK'
            );
            return;
        }
        setFormValues({ branch_id: user.branch_id });
        dispatch(setLocalUpdate(true));
        fetchTemplates();
        dispatch(setSuccessModal({ message: 'Template deleted successfully.', visible: true }));
    }
    const onSubmit = async () => {
        let validationErrors = templateValidation();
        if (Object.keys(validationErrors).length > 0) {
            return;
        }
        let ok = await confirm(
            'Do you want to save the template details?',
            'Save Template',
            'Confirm',
            true,
            'Save'
        );
        if (!ok) return;
        const payload = {
            id: formValues.id || uuid(),
            gym_id: user.gym_id,
            branch_id: formValues.branch_id,
            name: formValues.name,
            type: formValues.type,
            content: formValues.content,
            updated_at: new Date().toISOString(),
            updated_by: user.id
        };
        let response = isWeb ? await templateService.save(payload) : await templateService.saveSqlite(payload);
        if (response?.error) {
            await confirm(
                'An error occurred while saving the template. Please try again.',
                'Saving Template',
                'Error',
                false,
                'OK'
            );
            return;
        }
        dispatch(setLocalUpdate(true));
        setFormValues({ branch_id: user.branch_id });
        dispatch(setSuccessModal({
            message: 'Template saved successfully.',
            visible: true
        }))
        fetchTemplates();
    }

    return {
        templates,
        errors,
        formValues,
        onFieldChange,
        onTemplateSelect,
        templateValidation,
        onSubmit,
        onDelete
    };
}