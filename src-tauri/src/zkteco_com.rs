use anyhow::{anyhow, Result};
use std::ffi::c_void;
use std::mem::zeroed;
use std::ptr;

use winapi::shared::guiddef::{CLSID, IID_NULL};
use winapi::shared::minwindef::{LCID, UINT};
use winapi::shared::ntdef::LPCWSTR;
use winapi::shared::winerror::SUCCEEDED;

use winapi::um::combaseapi::{
    CoCreateInstance,
    CoInitializeEx,
    CoUninitialize,
    CLSCTX_INPROC_SERVER,
};

use winapi::um::objbase::COINIT_APARTMENTTHREADED;

use winapi::um::oaidl::{
    IDispatch,
    DISPPARAMS,
    EXCEPINFO,
    DISPATCH_METHOD,
    DISPID,
    IID_IDispatch,
    VARIANT,
};

use winapi::um::oleauto::{
    CLSIDFromProgID,
    SysAllocString,
    VariantInit,
    VariantClear,
};

use winapi::um::wtypes::{
    BSTR,
    VARIANT_BOOL,
    VT_I4,
    VT_BSTR,
    VT_BYREF,
};


const LOCALE_USER_DEFAULT: LCID = 0x0400;
const LOCALE_SYSTEM_DEFAULT: LCID = 0x0800;


/// Guard COM initialization
pub struct ComGuard;

impl ComGuard {
    pub fn init_sta() -> Result<Self> {
        unsafe {
            let hr = CoInitializeEx(ptr::null_mut(), COINIT_APARTMENTTHREADED);
            if !SUCCEEDED(hr) {
                return Err(anyhow!("CoInitializeEx failed: 0x{:08X}", hr));
            }
        }
        Ok(Self)
    }
}

impl Drop for ComGuard {
    fn drop(&mut self) {
        unsafe { CoUninitialize() };
    }
}


/// UTF-16 helper
fn to_wide(s: &str) -> Vec<u16> {
    let mut v = s.encode_utf16().collect::<Vec<u16>>();
    v.push(0);
    v
}


/// Create VARIANT VT_I4
unsafe fn variant_from_i32(value: i32) -> VARIANT {
    let mut var: VARIANT = zeroed();
    VariantInit(&mut var);

    (*var.n1.n2()).vt = VT_I4 as u16;
    *(*var.n1.n2()).n3.lVal_mut() = value;

    var
}

/// Create VARIANT VT_BSTR
unsafe fn variant_from_bstr(bstr: BSTR) -> VARIANT {
    let mut var: VARIANT = zeroed();
    VariantInit(&mut var);

    (*var.n1.n2()).vt = VT_BSTR as u16;
    *(*var.n1.n2()).n3.bstrVal_mut() = bstr;

    var
}

/// Create VARIANT VT_I4 | VT_BYREF
unsafe fn variant_i32_byref(ptr_i32: *mut i32) -> VARIANT {
    let mut var: VARIANT = zeroed();
    VariantInit(&mut var);

    (*var.n1.n2()).vt = (VT_I4 | VT_BYREF) as u16;
    *(*var.n1.n2()).n3.plVal_mut() = ptr_i32;

    var
}


/// IDispatch wrapper
pub struct Dispatch {
    ptr: *mut IDispatch,
}

impl Dispatch {
    pub fn new(ptr: *mut IDispatch) -> Self {
        Self { ptr }
    }

    unsafe fn get_dispid(&self, name: &str) -> Result<DISPID> {
        let wide = to_wide(name);
        let mut dispid: DISPID = 0;
        let mut wptr = wide.as_ptr() as *mut u16;

        let hr = (*self.ptr).GetIDsOfNames(
            &IID_NULL,
            &mut wptr,
            1,
            LOCALE_USER_DEFAULT,
            &mut dispid,
        );

        if !SUCCEEDED(hr) {
            return Err(anyhow!("GetIDsOfNames('{}') failed: 0x{:08X}", name, hr));
        }

        Ok(dispid)
    }

    unsafe fn invoke(&self, name: &str, mut args: Vec<VARIANT>) -> Result<VARIANT> {
        let dispid = self.get_dispid(name)?;

        // COM expects reverse order
        args.reverse();

        let mut dp = DISPPARAMS {
            rgvarg: args.as_mut_ptr(),
            rgdispidNamedArgs: ptr::null_mut(),
            cArgs: args.len() as UINT,
            cNamedArgs: 0,
        };

        let mut result: VARIANT = zeroed();
        VariantInit(&mut result);

        let mut exc: EXCEPINFO = zeroed();
        let mut arg_err = 0;

        let hr = (*self.ptr).Invoke(
            dispid,
            &IID_NULL,
            LOCALE_SYSTEM_DEFAULT,
            DISPATCH_METHOD,
            &mut dp,
            &mut result,
            &mut exc,
            &mut arg_err,
        );

        for v in &mut args {
            VariantClear(v);
        }

        if !SUCCEEDED(hr) {
            return Err(anyhow!(
                "Invoke('{}') failed: hr=0x{:08X}, arg_err={}",
                name, hr, arg_err
            ));
        }

        Ok(result)
    }
}

impl Drop for Dispatch {
    fn drop(&mut self) {
        unsafe {
            if !self.ptr.is_null() {
                (*self.ptr).Release();
            }
        }
    }
}


/// High-level wrapper
pub struct ZkTeco {
    _guard: ComGuard,
    disp: Dispatch,
}

impl ZkTeco {
    pub fn new() -> Result<Self> {
        let guard = ComGuard::init_sta()?;

        unsafe {
            let wide = to_wide("zkemkeeper.CZKEM");

            let mut clsid: CLSID = zeroed();
            let hr = CLSIDFromProgID(wide.as_ptr() as LPCWSTR, &mut clsid);

            if !SUCCEEDED(hr) {
                return Err(anyhow!("CLSIDFromProgID failed: 0x{:08X}", hr));
            }

            let mut obj: *mut c_void = ptr::null_mut();

            let hr = CoCreateInstance(
                &clsid,
                ptr::null_mut(),
                CLSCTX_INPROC_SERVER,
                &IID_IDispatch,
                &mut obj,
            );

            if !SUCCEEDED(hr) {
                return Err(anyhow!("CoCreateInstance failed: 0x{:08X}", hr));
            }

            Ok(Self {
                _guard: guard,
                disp: Dispatch::new(obj as *mut IDispatch),
            })
        }
    }

    /// Connect_Net(ip, port)
    pub fn connect_net(&self, ip: &str, port: i32) -> Result<bool> {
        unsafe {
            let w = to_wide(ip);
            let b = SysAllocString(w.as_ptr());

            let args = vec![
                variant_from_i32(port),
                variant_from_bstr(b),
            ];

            let mut res = self.disp.invoke("Connect_Net", args)?;

            let ok: VARIANT_BOOL = (*res.n1.n2()).n3.boolVal();
            VariantClear(&mut res);

            Ok(ok != 0)
        }
    }

    /// GetLastError(&mut code)
    pub fn get_last_error(&self) -> Result<i32> {
        unsafe {
            let mut code: i32 = 0;

            let args = vec![variant_i32_byref(&mut code as *mut i32)];

            let mut res = self.disp.invoke("GetLastError", args)?;
            VariantClear(&mut res);

            Ok(code)
        }
    }
}
