import { supabase } from "@/app/lib/createClient";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { customerService } from "./customerService";
import { setLocalUpdate } from "@/store/authSlice";
export default function useInfiniteScroll({
    fetchFn,
    isWeb,
    isReady,
    refresh,
    limit = 20,
    disabled = true,
    deps = [],
    selectedFilter,
    selected,
}) {
    const [items, setItems] = useState([]);
    const dispatch = useDispatch();
    const [offset, setOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);
    const branch_id = useSelector((state) => state.auth.user.branch_id);
    const user = useSelector((state) => state.auth.user);
    const RoleBook = useSelector((state) => state.auth.user?.role_manager || {});
    const singleBranch = user?.max_branches === 1;
    const gym_id = useSelector((state) => state.auth.user.gym_id);
    const localUpdate = useSelector((state) => state.auth.localUpdate);
    // Reset when dependencies change
    useEffect(() => {
        setItems([]);
        setOffset(0);
        setHasMore(true);
    }, deps);

    // Core loader
    useEffect(() => {
        if (disabled) return;
        if (selected) return;
        if (!hasMore) return;
        if (isLoading) return;
        if (!containerRef.current) return;
        if (!isReady) return;
        setIsLoading(true);

        const prevScrollTop = containerRef.current.scrollTop;
  
        fetchFn(offset)
            .then((data) => {
                if (!data || data.length === 0) {
                    setHasMore(false);
                }
                setItems(prev => {
                    return [...prev, ...data];
                });

                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (containerRef.current) {
                            containerRef.current.scrollTop = prevScrollTop;
                        }
                        setIsLoading(false);
                    }, 30);
                });
            })
            .catch((error) => {
                setIsLoading(false)
            });
    }, [offset, disabled, hasMore, localUpdate, selectedFilter, isReady, refresh]);
    useEffect(() => {   
        const getUpdatedMemberView = async () => {
            let  data = isWeb ? await customerService.searchSingleSupabase(
                gym_id,selected.id,
            ) : await customerService.searchSingleTauri(
                gym_id,
                selected.id
            );
            dispatch(setLocalUpdate(false));
            console.log('Fetched updated member view:', data, selected);
            setItems(data ? data.data? data.data : data : []);
        }
        if(localUpdate && selected){
            getUpdatedMemberView()
        }
    }, [localUpdate]);
    // Scroll listener
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (isLoading || disabled || !hasMore) return;

        const threshold = 200;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
            setOffset(prev => prev + limit);
        }
    }, [isLoading, disabled, hasMore]);

    // Attach scroll listener
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll);
        return () => el.removeEventListener("scroll", handleScroll);
    }, [handleScroll]);
    
    return {
        items,
        containerRef,
        isLoading,
        hasMore,
        offset,
        reset: () => {
            setItems([]);
            setOffset(0);
            setHasMore(true);
        },
        setItems // 🔥 expose setter
    };
}
