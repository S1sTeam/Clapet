use serde::{Deserialize, Serialize};
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenInfo {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WindowPos {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    #[serde(rename = "screenWidth")]
    pub screen_width: u32,
}

#[derive(Debug, Default)]
pub struct DragState {
    pub is_dragging: bool,
    pub start_cursor: Option<(i32, i32)>,
    pub start_win_pos: Option<(i32, i32)>,
}

pub struct DragManager(pub Mutex<DragState>);

impl Default for DragManager {
    fn default() -> Self {
        Self(Mutex::new(DragState::default()))
    }
}
