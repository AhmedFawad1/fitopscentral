import { supabase, supabaseEdge } from '@/app/lib/createClient';
import { invoke } from '@tauri-apps/api/core';
import { parse } from 'node:path';

export const sessionServices = {
    login: async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    },
    sessionExists: async () => {
        const session = supabase.auth.getSession();
        return session;
    },
    getSupabaseUser: async (isTauri) => {
        let connected = await checkInternetConnection();
        const userString = localStorage.getItem('supabaseUser');
        if(isTauri && !connected){
            console.log("Running in Tauri or offline mode, fetching user from local storage.");
            
            if(!userString) return null;
            const user = JSON.parse(userString);
            return user;
        }
        
        console.log(JSON.parse(userString))
        const { data: { user } } = await supabase.auth.getUser();
        console.log("Supabase auth user:", user);
        if(!user)  return null;
        if(user){
            let { data, error } = await supabaseEdge("license-verification", {
            user_id: user.id
            });
            if(data.expired){
                setLicenseError("Your license has expired. Please contact support.");
            }
            if(isTauri){
                localStorage.setItem('supabaseUser', JSON.stringify({...user, ...data}));
            }
            //console.log("License verification response:", data, error);
            return {...user, ...data};
        }
        return user;
    },
    signout: async () => {
        const { error } = await supabase.auth.signOut();
        localStorage.removeItem('supabaseUser');
        return { error };
    }
}


 export async function checkInternetConnection() {
        if (!navigator.onLine) return false;

        const start = performance.now();

        try {
            const response = await fetch("https://1.1.1.1/cdn-cgi/trace", {
            cache: "no-cache",
            });

            const duration = performance.now() - start;
            if (!response.ok) return false;

            if (duration > 1500) {
            return false;
            }
            return true;

        } catch (err) {
            return false;
        }
    }