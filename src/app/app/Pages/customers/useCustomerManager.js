import { use, useEffect, useRef, useState } from 'react';
import { useRuntime } from '@/hooks/useRuntime';
import useInfiniteScroll from './useInfiniteScroll';
import { setSelectedFilter } from '@/store/authSlice';

export function useCustomerManager({
  user,
  setSelectedTab,
  permissions,
  branch_id,
  singleBranch,
  selectedUser,
  selectedFilter,
  limit,
  confirm,
  customerService,
  uuid,
  dispatch,
  setLocalUpdate,
  setSuccessModal,
  showCustomer,
  selectedCustomer,
  setSelectedCustomer

}) {
  const { isTauri, isWeb, isReady } = useRuntime();
  const [fetchSingleCustomer, setFetchSingleCustomer] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const searchRef = useRef(null);
  const {
        items: customers,
        containerRef: sectionRef,
        isLoading,
        hasMore,
        reset,
        setItems,
        offset
    } = useInfiniteScroll({
        limit: 20,
        disabled: showSearchModal || searchFilter.length > 0,
        deps: [selectedFilter, user, refresh],
        selectedFilter: selectedFilter,
        isReady: isReady,
        isWeb: isWeb,
        fetchFn: async () => {
            const { data } = isWeb? await customerService.fetchSupabase(
                user.gym_id,
                singleBranch && branch_id ? branch_id : 
                permissions.canManageBranches ? null : branch_id,
                selectedFilter,
                limit,
                customers
            ) : await customerService.fetchTauri(
                user.gym_id,
                singleBranch && branch_id ? branch_id : 
                permissions.canManageBranches ? null : branch_id,
                selectedFilter,
                60,
                offset
            );
            return data || [];
        },
        selected: selectedCustomer,
        refresh: refresh
    });
  const modalRef = useRef(showSearchModal);
  const userRef = useRef(selectedUser);
  
  const onFieldChange = async (field, value) => {
      if (field === 'searchTerm') {
        setSearchTerm(value);

        if (!value?.trim()) {
          setSearchFilter([]);
          setSearchLoading(false);
          return;
        }

        setSearchLoading(true); // ✅ BEFORE await

        if (isTauri) {
          try {
            const data = await customerService.searchTauri(
              value,
              user.gym_id,
              singleBranch && branch_id
                ? branch_id
                : permissions.canManageBranches
                  ? null
                  : branch_id,
              offset
            );

            console.log('Search results:', data);

            setSearchFilter(Array.isArray(data) ? data : []);
          } catch (err) {
            console.error('Search error:', err);
            setSearchFilter([]);
          } finally {
            setSearchLoading(false); // ✅ ALWAYS runs
          }
        }
      }

      else if (field === 'searchFilter') {
        setSearchFilter(value);
        setSearchLoading(false);
      }

      else if (field === 'showSearchModal') {
        setShowSearchModal(value);
      }else if(field === 'selectedCustomer'){
        // set selected user logic if needed
        setSelectedCustomer({
            ...value.data
        });
        setSelectedTab(value.type);
      }
  };
  
  useEffect(() => {
      modalRef.current = showSearchModal;
  }, [showSearchModal]);

  useEffect(() => {
      userRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    if(!isReady) return;
    if(!isWeb) return;
    function debounce(fn, delay = 500) {
      let timer;
          return (...args) => {
              clearTimeout(timer);
              timer = setTimeout(() => fn(...args), delay);
          };
    }

    const onStopTyping = debounce((value) => {
        if(!value) return;

        let limit = 10;
        const tokens = value
        .trim()
        .split(/\s+/)
        .filter(Boolean);

        if (!tokens.length) {
            setSearchLoading(false);
            setSearchFilter([]);
            return;
        };

        const orConditions = tokens.flatMap(token => {
        const isNumber = /^\d+$/.test(token);

        return [
            `name.ilike.%${value}%`,
            `father_name.ilike.%${value}%`,
            `contact.ilike.%${value}%`,
            ...(isNumber ? [`serial_number.eq.${value}`] : [])
        ];
        }).join(',');
        customerService.searchSupabase(user.gym_id,
            singleBranch && branch_id ? branch_id : 
            permissions.canManageBranches ? null : branch_id,
            orConditions, limit).then(({ data, error }) => {
            if (error) {
                console.error('Search error:', error);
                setSearchLoading(false);
                return;
            }else {
                console.log('Search results:', data);
                setSearchFilter(data || []);
                setSearchLoading(false);
            }
          })
    }, 500);

    document.getElementById("searchTerm").addEventListener("input", (e) => {
      onStopTyping(e.target.value);
    });
  
  },[isReady])
  useEffect(() => {
    if(!isReady) return;
    const handleKey = (e) => {
        if (e.code === "Escape") {
            if (modalRef.current || userRef.current) {
                setShowSearchModal(false);
                setSelectedUser(null);
                return;
            }
            dispatch(setSelectedFilter("total members"));
            
            reset();
            setSearchFilter([]);
            setSearchTerm('');
            setRefresh(prev => !prev);
        }
    };

    document.addEventListener("keyup", handleKey, true);
    return () => {
        document.removeEventListener("keyup", handleKey, true);
    };
}, [selectedCustomer,isReady]);
  return {
    customers,
    isLoading,
    searchTerm,
    sectionRef,
    searchRef,
    searchFilter,
    searchLoading,
    showSearchModal,
    setShowSearchModal,
    onFieldChange,
    setItems,
    reset,
  };
}
