import { useEffect, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import { useSelector } from 'react-redux';
import { genUUID } from '../uuid';
import { salesService } from './salesService';
import { payment_methods } from '@/app/lib/functions';
export function useSalesManager({
  user,
  permissions,
  branches,
  gymId,
  branchId
}) {
    const { isTauri, isWeb, isReady } = useRuntime();
    const [packages, setPackages] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [errors, setErrors] = useState({});
    const [selectedMember, setSelectedMember] = useState(null);
    const [modifiedView, setModifiedView] = useState(false);
    const [searchFilter, setSearchFilter] = useState([]);
    const [showDetails, setShowDetails] = useState(false);
    const [financialSummary, setFinancialSummary] = useState({
        totalAmount: 0,
        totalBalance: 0
    });
    const onFieldChange = (field, value) => {
      if(field === 'selectedMember' && value){
          setModifiedView(true);
      }else if(field === 'formValues'){
          setFormValues({});
          setErrors({});
          setSearchFilter([]);
          return;
      }else if(field === 'showDetails'){
          setShowDetails(value);
      }else if(field === 'modifiedView'){
          setModifiedView(value);
      }
      else{
        setFormValues(prev => ({
          ...prev,
          [field]: value
        }));
        setErrors({})
      }
    }
    const handleSearch = async()=>{
        let errors = {};
        if(!formValues.txn_date || formValues.txn_date.trim() === ''){
            errors.txn_date = "Please enter a search term.";
            setErrors(errors);
            return;
        }
        setErrors({});
        let data = isWeb?
        await salesService.searchSupabase(formValues, gymId, branchId, user.max_branches === 1, permissions ) : 
        await salesService.searchSqlite(formValues, gymId, branchId);
        let countedIds = [];
        setSearchFilter(data || []);
        let totalAmount = 0;
        let totalBalance = 0;
        let cash = 0;
        let online = 0;
        let refund = 0;
        let cleanData = [];
        (data || []).forEach(record => {
          totalAmount += record.txn_type!=='refund' ? parseFloat(record.amount) || 0 : 0;
          if(!countedIds.includes(record.id)){
            countedIds.push(record.id);
            totalBalance += parseFloat(record.balance) || 0;
            cleanData.push(record);
          }else{
             // remove duplicate balance amounts
             record.balance = null;
             cleanData.push(record);
          }
          if(record.txn_type.toLowerCase() === 'refund'){
            refund += parseFloat(record.amount) || 0;
          }
          if(payment_methods.map(pm => pm.toLowerCase()).includes(record.payment_method?.toLowerCase())){
            online += record.txn_type!=='refund' ? parseFloat(record.amount) || 0 : 0;
          }
          else{
            cash += record.txn_type!=='refund' ? parseFloat(record.amount) || 0 : 0;
          }
        });
        setSearchFilter(cleanData);
        setFinancialSummary({
          totalAmount,
          totalBalance,
          cash,
          online,
          refund
        });
    }
    useEffect(() => {
        const fetchData = async () => {
            let data;
            if(isWeb){
                data = await salesService.fetchData(gymId, branchId);
            } else if(isTauri){
                data = await salesService.fetchDataSQLite(gymId, branchId);
            }
            setPackages(data.packages || []);
            setTrainers(data.trainers || []);
        }
        if(isReady){
            fetchData();
        }
    }, [isReady, isWeb, isTauri, gymId, branchId]);
    return {
          packages,
          trainers,
          branches,
          formValues,
          errors,
          onFieldChange,
          selectedMember,
          searchFilter,
          handleSearch,
          financialSummary,
          showDetails,
          modifiedView
    }
}