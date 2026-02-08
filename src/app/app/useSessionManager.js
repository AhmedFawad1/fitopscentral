'use client'
import { setSuccessModal, setUser } from "@/store/authSlice";
import { use, useEffect, useRef, useState } from "react";
import { useRouter } from 'next/navigation';
import { sessionServices } from "./sessionServices";
import { useDispatch } from "react-redux";
import { useRuntime } from "@/hooks/useRuntime";
import { containsDangerousChars, exceedsLength, isRateLimited, isValidEmail, sanitizeEmail, validateSafeInput } from "../utils/security";

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
        e.preventDefault();

        // 🛑 Rate-limit spam clicks / bots
        if (isRateLimited()) {
            setError("Slow down bestie 🫣 try again in a sec.");
            return;
        }
        if (!validateSafeInput(email)) {
            setError("Invalid input detected.");
            return;
        }

        if (!email || !password) {
            setError("Please fill in all fields.");
            return;
        }

        // 🧼 SANITIZE EMAIL ONLY
        const cleanEmail = sanitizeEmail(email);

        // 🚨 BLOCK WEIRD INPUT
        if (
            cleanEmail === "" ||
            password.trim() === "" ||
            exceedsLength(cleanEmail, 254) ||
            exceedsLength(password, 128)
        ) {
            setError("Invalid input.");
            return;
        }

        // 🚨 XSS / Injection defense
        if (containsDangerousChars(cleanEmail)) {
            setError("Invalid email format.");
            return;
        }

        // 🚨 Email structure validation
        if (!isValidEmail(cleanEmail)) {
            setError("Please enter a valid email.");
            return;
        }

        // ❌ DO NOT SANITIZE PASSWORD
        // passwords can legally contain symbols

        setSigningIn(true);

        const { data, error } = await sessionServices.login(
            cleanEmail,
            password
        );

        if (error) {
            setError(`${error.message}`);
            setSigningIn(false);
            return;
        }

        setUserData(data.user);
        setCheckingSession(true);
        setError(null);
        };


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