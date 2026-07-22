use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct CursorPos {
    pub x: i32,
    pub y: i32,
}

#[cfg(windows)]
pub fn get_global_cursor_pos() -> Option<CursorPos> {
    use windows_sys::Win32::Foundation::POINT;
    use windows_sys::Win32::UI::WindowsAndMessaging::GetCursorPos;
    unsafe {
        let mut pt = POINT { x: 0, y: 0 };
        if GetCursorPos(&mut pt) != 0 {
            Some(CursorPos { x: pt.x, y: pt.y })
        } else {
            None
        }
    }
}

#[cfg(not(windows))]
pub fn get_global_cursor_pos() -> Option<CursorPos> {
    None
}
