'use client'
import { setSuccessModal, setUser } from "@/store/authSlice";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import { sessionServices } from "./sessionServices";
import { useDispatch } from "react-redux";
import { useRuntime } from "@/hooks/useRuntime";

export function useSessionManager(){
    const dispatch = useDispatch();
    const [email, setEmail] = useState('');
    const [user , setUserData] = useState(null);
    const { isTauri, isWeb, isReady } = useRuntime();
    const [password, setPassword] = useState('');
    const [signingIn, setSigningIn] = useState(false);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkingSession, setCheckingSession] = useState(true);
    const [sessionExists, setSessionExists] = useState(false);
    const [licenseError, setLicenseError] = useState(null);
    const [verified, setVerified] = useState(false);
    
    const [isSigningOut, setIsSigningOut] = useState(false);
    const router = useRouter();
    const handleLogin = async (e) => {
        
        if(!email || !password || email.trim() === '' || password.trim() === ''){
            setError("Please fill in all fields.");
            setSigningIn(false);
            return;
        }
        const { data, error } = await sessionServices.login(email, password);
        //console.log("Login response:", data, error);
        if (error) {
            setError(error.message);
            setSigningIn(false);
            return;
        }else{
            setUserData(data.user);
            setCheckingSession(true);
            setSigningIn(true)
            setError(null)
        }
    }

    const onSignout = async () => {
        setCheckingSession(true);
        const { error } = await sessionServices.signout();
        if (error) {
            console.error("Error signing out:", error);
        }
        setUserData(null);
        setCheckingSession(false);
        setSessionExists(false);
    }
    useEffect(() => {
        const checkSession = async () => {
            setCheckingSession(true);
            setSigningIn(false);
            const { data, error } = await sessionServices.sessionExists();
            //console.log("Session check response:", data, error);
            if (data?.session) {
                setSessionExists(true);
                setUserData(data.session.user);

            } else {
                setCheckingSession(false);
                setSessionExists(false);
            }
            //setCheckingSession(false);
        };
        checkSession();
    },[]);
    useEffect(()=>{
        if(!user || !isReady) return;
        if(user.gym_id) return;
        const fetchUserData = async () => {
            const userData = await sessionServices.getSupabaseUser(isTauri);
            //console.log("Fetched user data:", userData);
            if(userData){
                if(checkExpired(userData.end_date)){
                    setLicenseError("Your license has expired. Please contact support.");
                    setCheckingSession(false);
                    return;
                }
                dispatch(setUser(userData));
                setUserData(userData);
                //setVerified(true);
                setCheckingSession(false);
            }
        }
        fetchUserData();
    },[user, isReady])
    return {
        email,
        setEmail,
        password,
        setPassword,
        signingIn,
        error,
        handleLogin,
        loading,
        checkingSession,
        sessionExists,
        licenseError,
        verified,
        user,
        isSigningOut,
        onSignout
    };
} 
function checkExpired(date){
    const now = new Date();
    const expiryDate = new Date(date);
    return now > expiryDate;
}