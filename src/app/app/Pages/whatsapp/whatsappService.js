import { supabase } from "@/app/lib/createClient";
import { checkInternetConnection } from "../../sessionServices";
import { invoke } from "@tauri-apps/api/core";

const API_BASE = process.env.NEXT_PUBLIC_WHATSAPP_API;

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    throw new Error("User not authenticated");
  }

  return data.session.access_token;
}

export const whatsappService = {
  apiFetch: async (path, options = {}) => {
    let connected = await checkInternetConnection()
    if(!connected)  {
      throw new Error(`No Internet conenction`);
    }
    const token = await getAccessToken();
    
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`API ${res.status}: ${text}`);
    }

    return res.json();
  },
  startEngine: async()=>{
     invoke('start_whatsapp_engine')
  }
};
