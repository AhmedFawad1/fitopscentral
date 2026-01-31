import { supabase } from '@/app/lib/createClient';

export const userService = {
  fetch: async (gymId, branchId) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('gym_id', gymId)
      .eq('branch_id', branchId)
      .eq('deleted', false)
      .order('full_name', { ascending: true });
      console.log(data)
    return data || [];
  },

  save: async user => {
    return supabase
      .from('users')
      .upsert(user);
  },
  updateUser: async (id, password) =>{
     let res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-user`,
          {
              method: "POST",
              headers: {
              "Content-Type": "application/json",
              },
              body: JSON.stringify({
              userId:  id,
              password:password,
              }),
          }
          );
     const result = await res.json();
     return result;
  },
  signup: async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      email_confirm: true,
    });
    return { data, error };
  },
  upsertUser: async (user)=>{
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upsert-user`,
      {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify(user),
      }
      );

      const json = await res.json();
      return json;
  },
  logout: async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        console.log("🚫 No session found, skipping sign out");
        return { error: null };
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.log("❌ Sign out error:", error);
        return { error };
      }

      return { error };
    },

  softDelete: async (id) => {
    const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-user`,
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            
            },
            body: JSON.stringify({
              userId: id,
            }),
        }
        );

    const data = await res.json();
    return data;
  },

  saveBranch: async (branch) => {
    return supabase
      .from('branches')
      .upsert(branch);
  },
  deleteBranch: async (id) => {
    return supabase
      .from('branches')
      .update({ deleted: true })
      .eq('id', id);
  }
};

