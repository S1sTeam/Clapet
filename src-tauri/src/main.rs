#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cursor::get_global_cursor_pos;
use proxy::{test_proxy_connection, ProxyConfig, ProxyTestResult};
use serde::Deserialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{
    AppHandle, Emitter, LogicalSize, Manager, PhysicalPosition, Position, Size, WebviewWindow,
};
use window::{DragManager, ScreenInfo, WindowPos};

#[derive(Debug, Deserialize)]
pub struct MovePayload {
    pub delta_x: Option<i32>,
    pub delta_y: Option<i32>,
    pub screen_x: Option<i32>,
    pub screen_y: Option<i32>,
}

#[derive(Clone, serde::Serialize)]
pub struct CursorMovePayload {
    #[serde(rename = "clientX")]
    pub client_x: i32,
    #[serde(rename = "clientY")]
    pub client_y: i32,
}

#[tauri::command]
fn start_drag(window: WebviewWindow, drag_mgr: tauri::State<'_, DragManager>) {
    let mut state = drag_mgr.0.lock().unwrap();
    state.is_dragging = true;
    state.start_cursor = get_global_cursor_pos().map(|c| (c.x, c.y));
    if let Ok(pos) = window.outer_position() {
        state.start_win_pos = Some((pos.x, pos.y));
    }
}

#[tauri::command]
fn move_window(window: WebviewWindow, drag_mgr: tauri::State<'_, DragManager>) {
    let state = drag_mgr.0.lock().unwrap();
    if !state.is_dragging {
        return;
    }

    if let (Some(start_cursor), Some(start_win), Some(current_cursor)) = (
        state.start_cursor,
        state.start_win_pos,
        get_global_cursor_pos(),
    ) {
        let target_x = start_win.0 + (current_cursor.x - start_cursor.0);
        let target_y = start_win.1 + (current_cursor.y - start_cursor.1);
        let _ = window.set_position(Position::Physical(PhysicalPosition::new(target_x, target_y)));
    }
}

#[tauri::command]
fn end_drag(drag_mgr: tauri::State<'_, DragManager>) {
    let mut state = drag_mgr.0.lock().unwrap();
    state.is_dragging = false;
    state.start_cursor = None;
    state.start_win_pos = None;
}

#[tauri::command]
fn get_window_position(window: WebviewWindow) -> Option<WindowPos> {
    let pos = window.outer_position().ok()?;
    let size = window.outer_size().ok()?;
    let monitor = window.primary_monitor().ok()??;
    let screen_width = monitor.size().width;

    Some(WindowPos {
        x: pos.x,
        y: pos.y,
        width: size.width,
        height: size.height,
        screen_width,
    })
}

#[tauri::command]
fn wander_move(window: WebviewWindow, delta_x: i32, delta_y: i32) {
    if let Ok(pos) = window.outer_position() {
        let _ = window.set_position(Position::Physical(PhysicalPosition::new(
            pos.x + delta_x,
            pos.y + delta_y,
        )));
    }
}

#[tauri::command]
fn set_window_pos(window: WebviewWindow, x: i32, y: i32) {
    let _ = window.set_position(Position::Physical(PhysicalPosition::new(x, y)));
}

#[tauri::command]
fn get_screen_info(window: WebviewWindow) -> Option<ScreenInfo> {
    let monitors = window.available_monitors().ok()?;
    if monitors.is_empty() {
        return None;
    }

    let mut min_x = i32::MAX;
    let mut min_y = i32::MAX;
    let mut max_x = i32::MIN;
    let mut max_y = i32::MIN;

    for m in monitors {
        let p = m.position();
        let s = m.size();
        min_x = min_x.min(p.x);
        min_y = min_y.min(p.y);
        max_x = max_x.max(p.x + s.width as i32);
        max_y = max_y.max(p.y + s.height as i32);
    }

    Some(ScreenInfo {
        x: min_x,
        y: min_y,
        width: max_x - min_x,
        height: max_y - min_y,
    })
}

#[tauri::command]
fn show_launcher(window: WebviewWindow) {
    let _ = window.set_resizable(true);
    let _ = window.set_min_size(Some(Size::Logical(LogicalSize::new(876.0, 574.0))));
    let _ = window.set_max_size(Option::<Size>::None);
    let _ = window.set_size(Size::Logical(LogicalSize::new(876.0, 574.0)));
    let _ = window.center();
}

#[tauri::command]
fn show_pet(window: WebviewWindow) {
    let _ = window.set_min_size(Some(Size::Logical(tauri::LogicalSize::new(320.0, 300.0))));
    let _ = window.set_max_size(Some(Size::Logical(tauri::LogicalSize::new(320.0, 300.0))));
    let _ = window.set_size(Size::Logical(tauri::LogicalSize::new(320.0, 300.0)));
    let _ = window.set_resizable(false);
}

#[tauri::command]
fn resize_pet_window(window: WebviewWindow, scale: f64) {
    let base_width = 320.0;
    let base_height = 300.0;
    let new_width = base_width * scale;
    let new_height = base_height * scale;
    let _ = window.set_min_size(Some(Size::Logical(LogicalSize::new(new_width, new_height))));
    let _ = window.set_max_size(Some(Size::Logical(LogicalSize::new(new_width, new_height))));
    let _ = window.set_size(Size::Logical(LogicalSize::new(new_width, new_height)));
}

#[tauri::command]
fn minimize_window(window: WebviewWindow) {
    let _ = window.minimize();
}

#[tauri::command]
fn close_window(window: WebviewWindow) {
    let _ = window.close();
}

#[tauri::command]
fn set_always_on_top(window: WebviewWindow, value: bool) {
    let _ = window.set_always_on_top(value);
}

#[tauri::command]
async fn test_proxy(cfg: ProxyConfig) -> ProxyTestResult {
    test_proxy_connection(cfg).await
}

#[tauri::command]
fn get_relative_cursor_pos(window: WebviewWindow) -> Option<CursorMovePayload> {
    let cursor = get_global_cursor_pos()?;
    let win_pos = window.outer_position().ok()?;
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let client_x = ((cursor.x - win_pos.x) as f64 / scale_factor) as i32;
    let client_y = ((cursor.y - win_pos.y) as f64 / scale_factor) as i32;
    Some(CursorMovePayload {
        client_x,
        client_y,
    })
}

fn spawn_cursor_tracker(app: AppHandle, tracking_enabled: Arc<AtomicBool>) {
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_millis(16));
        loop {
            interval.tick().await;
            if !tracking_enabled.load(Ordering::Relaxed) {
                continue;
            }
            if let Some(window) = app.get_webview_window("main") {
                if window.is_minimized().unwrap_or(false) || !window.is_visible().unwrap_or(true) {
                    continue;
                }
                if let (Some(cursor), Ok(win_pos)) = (get_global_cursor_pos(), window.outer_position()) {
                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                    let client_x = ((cursor.x - win_pos.x) as f64 / scale_factor) as i32;
                    let client_y = ((cursor.y - win_pos.y) as f64 / scale_factor) as i32;
                    let _ = app.emit("cursor-move", CursorMovePayload { client_x, client_y });
                }
            }
        }
    });
}

fn main() {
    let tracking_enabled = Arc::new(AtomicBool::new(true));

    tauri::Builder::default()
        .manage(DragManager::default())
        .setup(move |app| {
            spawn_cursor_tracker(app.handle().clone(), tracking_enabled);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            start_drag,
            move_window,
            end_drag,
            get_window_position,
            wander_move,
            set_window_pos,
            get_screen_info,
            show_launcher,
            show_pet,
            resize_pet_window,
            minimize_window,
            close_window,
            set_always_on_top,
            test_proxy,
            get_relative_cursor_pos
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
