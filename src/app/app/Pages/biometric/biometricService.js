import { invoke } from "@tauri-apps/api/core";

export const biometricService = {
    getConfig: async ()=>{
        let data = invoke("load_config")
        return data;
    },
    zkRegisterUser: async(userId, userName) =>{
        invoke("zk_add_user", { id: userId.toString(), name: userName });
    },
    zkDeleteUser: async(userId) =>{
        invoke("zk_delete_user", { id: userId.toString() });
    },
    zkStopEnroll: async() =>{
        invoke("zk_stop_enrollment", { id: "" });
    },
    secugenRestartService: async(mode) => {
        try {
            await invoke("fp_start_service", { mode: mode });
            return {
                success: true
            };
        }catch (error) {
            return {
                success: false,
                error: error
            };
        }
    }
}