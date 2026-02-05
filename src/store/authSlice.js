// authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  localUpdate: true,
  auth_user_id: null,
  selectedTab: 'dashboard',
  selectedFilter: null,
  validation: true,
  successModal: {
    message: 'test success',
    visible: false
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLocalUpdate: (state, action) => {
      state.localUpdate = action.payload;
    },
    setAuthUserId: (state, action) => {
      state.auth_user_id = action.payload;
    },
    setSelectedTab: (state, action) => {
      state.selectedTab = action.payload;
    },
    setSelectedFilter: (state, action) => {
      state.selectedFilter = action.payload;
    },
    setValidation: (state, action) =>{
      state.validation = action.payload;
    },
    setSuccessModal: (state, action) => {
      state.successModal = action.payload;
    }
  },
});

export const { setUser, setLocalUpdate, setAuthUserId, setSelectedTab, setSelectedFilter, setValidation, setSuccessModal } = authSlice.actions;
export default authSlice.reducer;
