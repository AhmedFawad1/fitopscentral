
import { setLocalUpdate, setUser } from "@/store/authSlice";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase, supabaseEdge } from "./createClient";
import { useRouter } from "next/navigation";
/* -----------------------------------------
   CONSTANTS
----------------------------------------- */

const DEFAULT_GRACE_MS = 72 * 60 * 60 * 1000; // 72 hours

/* -----------------------------------------
   HOOK
----------------------------------------- */

export function useAppBootstrap({ localUpdate }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const firstLoadRef = useRef(true);
  const cancelledRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const user = useSelector((state) => state.auth.user);
  const [licenseError, setLicenseError] = useState(null);
  const forceLogout = async() => {
    let {error} = await supabase.auth.signOut();
    if(error){
      console.error("Error during sign out:", error);
    }
    dispatch(setUser(null));
  }
  useEffect(() => {
    if (!firstLoadRef.current) return;
    firstLoadRef.current = false;
    let success = false;
    const bootstrap = async () => {
      setLoading(true);

      try {
        console.log("Bootstrapping app...");
        if(!user){
          let supabaseUser = await getSupabaseUser();
          if(!supabaseUser){
              await forceLogout();
              router.push('/login');
              return;
          }
          success = true;
          dispatch(setUser(supabaseUser));
        }
      } catch (err) {
        //console.error("Bootstrap failed:", err);
        setLicenseError("Startup error. Please login again to get a new license token.");
        //forceLogout();
      } finally {
        if (!cancelledRef.current && success) {
          setLoading(false);
          dispatch(setLocalUpdate(false));
        }
      }
    };

    bootstrap();

    return () => {
      cancelledRef.current = true;
    };
  }, [localUpdate]);

  return {
    loading,
    licenseError
  };
}
export const getSupabaseUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user)  return null;
    if(user){
      let { data, error } = await supabaseEdge("license-verification", {
        user_id: user.id
      });
      console.log("License verification data:", data);
      if(data.expired){
        setLicenseError("Your license has expired. Please contact support.");
      }
      //console.log("License verification response:", data, error);
      return {...user, ...data};
    }
    return user;
  }