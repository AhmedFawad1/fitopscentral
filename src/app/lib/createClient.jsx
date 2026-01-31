// createClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


export async function supabaseEdge(functionName, data) {
  const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${functionName}`,
      {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          ...data
        }),
      }
    );
  try{
    if(!res.ok){
      let errorData = await res.json();
      return { error: errorData.error || errorData.data.error || "Invalid credentials" };
    }
    let resJson = await res.json();
    return resJson;
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return { error: "An unexpected error occurred. Please try again." };
  }
} 
