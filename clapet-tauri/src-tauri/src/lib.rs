use serde::{Deserialize, Serialize};
use std::time::Instant;
use tauri::{Position, Size, Window};

#[derive(Serialize, Deserialize, Debug)]
pub struct WindowPosition {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
    pub screen_width: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ScreenInfo {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub protocol: Option<String>,
    pub host: Option<String>,
    pub port: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct TestProxyResult {
    pub ok: bool,
    pub ms: Option<u128>,
    pub status: Option<u16>,
    pub error: Option<String>,
}

#[tauri::command]
fn start_drag(window: Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
fn move_window(window: Window, delta_x: f64, delta_y: f64) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.current_monitor() {
        let scale_factor = monitor.scale_factor();
        if let Ok(pos) = window.outer_position() {
            let logical_pos = pos.to_logical::<f64>(scale_factor);
            let new_x = logical_pos.x + delta_x;
            let new_y = logical_pos.y + delta_y;
            let _ = window.set_position(Position::Logical(tauri::LogicalPosition::new(new_x, new_y)));
        }
    }
    Ok(())
}

#[tauri::command]
fn get_window_position(window: Window) -> Result<Option<WindowPosition>, String> {
    if let (Ok(pos), Ok(size), Ok(Some(monitor))) = (
        window.outer_position(),
        window.outer_size(),
        window.primary_monitor(),
    ) {
        let scale_factor = monitor.scale_factor();
        let logical_pos = pos.to_logical::<f64>(scale_factor);
        let logical_size = size.to_logical::<f64>(scale_factor);
        let logical_monitor_size = monitor.size().to_logical::<f64>(scale_factor);
        
        Ok(Some(WindowPosition {
            x: logical_pos.x as i32,
            y: logical_pos.y as i32,
            width: logical_size.width as u32,
            height: logical_size.height as u32,
            screen_width: logical_monitor_size.width as u32,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn wander_move(window: Window, delta_x: f64, delta_y: f64) -> Result<(), String> {
    move_window(window, delta_x, delta_y)
}

#[tauri::command]
fn set_window_pos(window: Window, x: f64, y: f64) -> Result<(), String> {
    let _ = window.set_position(Position::Logical(tauri::LogicalPosition::new(x, y)));
    Ok(())
}

#[tauri::command]
fn get_screen_info(window: Window) -> Result<Option<ScreenInfo>, String> {
    if let Ok(monitors) = window.available_monitors() {
        let mut min_x = f64::MAX;
        let mut min_y = f64::MAX;
        let mut max_x = f64::MIN;
        let mut max_y = f64::MIN;

        for m in monitors {
            let scale = m.scale_factor();
            let pos = m.position().to_logical::<f64>(scale);
            let size = m.size().to_logical::<f64>(scale);
            min_x = min_x.min(pos.x);
            min_y = min_y.min(pos.y);
            max_x = max_x.max(pos.x + size.width);
            max_y = max_y.max(pos.y + size.height);
        }

        Ok(Some(ScreenInfo {
            x: min_x as i32,
            y: min_y as i32,
            width: (max_x - min_x) as u32,
            height: (max_y - min_y) as u32,
        }))
    } else {
        Ok(None)
    }
}

#[tauri::command]
fn show_launcher(window: Window) -> Result<(), String> {
    if let Ok(Some(monitor)) = window.primary_monitor() {
        let display = monitor.size();
        let scale_factor = monitor.scale_factor();
        let lx = ((display.width as f64 / scale_factor) - 800.0) / 2.0;
        let ly = ((display.height as f64 / scale_factor) - 640.0) / 2.0;

        let _ = window.set_size(Size::Logical(tauri::LogicalSize::new(800.0, 640.0)));
        let _ = window.set_position(Position::Logical(tauri::LogicalPosition::new(lx, ly)));
        let _ = window.set_resizable(false);
    }
    Ok(())
}

#[tauri::command]
fn show_pet(window: Window) -> Result<(), String> {
    let _ = window.set_size(Size::Logical(tauri::LogicalSize::new(420.0, 350.0)));
    let _ = window.set_resizable(false);
    Ok(())
}

#[tauri::command]
fn resize_pet_window(window: Window, width: f64, height: f64) -> Result<(), String> {
    let _ = window.set_size(Size::Logical(tauri::LogicalSize::new(width, height)));
    Ok(())
}

#[tauri::command]
fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_always_on_top(window: Window, value: bool) -> Result<(), String> {
    window.set_always_on_top(value).map_err(|e| e.to_string())
}

fn create_client_with_proxy(cfg: Option<ProxyConfig>) -> reqwest::Client {
    let mut builder = reqwest::Client::builder().timeout(std::time::Duration::from_secs(12));
    if let Some(c) = cfg {
        if c.enabled {
            if let (Some(host), Some(port)) = (c.host, c.port) {
                if !host.is_empty() && !port.is_empty() {
                    let protocol = c.protocol.unwrap_or_else(|| "http".to_string());
                    let proxy_scheme = format!("{}://{}:{}", protocol, host, port);
                    if let Ok(mut proxy) = reqwest::Proxy::all(&proxy_scheme) {
                        if let (Some(u), Some(p)) = (c.username, c.password) {
                            if !u.is_empty() {
                                proxy = proxy.basic_auth(&u, &p);
                            }
                        }
                        builder = builder.proxy(proxy);
                    }
                }
            }
        }
    }
    builder.build().unwrap_or_else(|_| reqwest::Client::new())
}

#[tauri::command]
async fn test_proxy(cfg: ProxyConfig) -> Result<TestProxyResult, String> {
    let client = create_client_with_proxy(Some(cfg));
    let start = Instant::now();
    match client.get("https://api.openai.com/v1/models").send().await {
        Ok(resp) => {
            let duration = start.elapsed().as_millis();
            Ok(TestProxyResult {
                ok: true,
                ms: Some(duration),
                status: Some(resp.status().as_u16()),
                error: None,
            })
        }
        Err(e) => Ok(TestProxyResult {
            ok: false,
            ms: None,
            status: None,
            error: Some(e.to_string()),
        }),
    }
}

use serde_json::Value;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ModelInfo {
    pub id: String,
    pub name: String,
}

#[tauri::command]
async fn fetch_models(provider: String, api_key: String, custom_url: Option<String>) -> Result<Vec<ModelInfo>, String> {
    let client = reqwest::Client::new();
    
    let (url, auth_header) = match provider.as_str() {
        "openai" => ("https://api.openai.com/v1/models".to_string(), format!("Bearer {}", api_key)),
        "groq" => ("https://api.groq.com/openai/v1/models".to_string(), format!("Bearer {}", api_key)),
        "openrouter" => ("https://openrouter.ai/api/v1/models".to_string(), format!("Bearer {}", api_key)),
        "anthropic" => {
            return Ok(vec![
                ModelInfo { id: "claude-3-5-sonnet-20240620".to_string(), name: "Claude 3.5 Sonnet".to_string() },
                ModelInfo { id: "claude-3-opus-20240229".to_string(), name: "Claude 3 Opus".to_string() },
                ModelInfo { id: "claude-3-haiku-20240307".to_string(), name: "Claude 3 Haiku".to_string() },
            ]);
        },
        "gemini" => (format!("https://generativelanguage.googleapis.com/v1beta/models?key={}", api_key), "".to_string()),
        "deepseek" => ("https://api.deepseek.com/models".to_string(), format!("Bearer {}", api_key)),
        "mistral" => ("https://api.mistral.ai/v1/models".to_string(), format!("Bearer {}", api_key)),
        "together" => ("https://api.together.xyz/v1/models".to_string(), format!("Bearer {}", api_key)),
        "perplexity" => {
            return Ok(vec![
                ModelInfo { id: "llama-3.1-sonar-small-128k-online".to_string(), name: "Sonar Small Online".to_string() },
                ModelInfo { id: "llama-3.1-sonar-large-128k-online".to_string(), name: "Sonar Large Online".to_string() },
            ]);
        },
        "xai" => ("https://api.x.ai/v1/models".to_string(), format!("Bearer {}", api_key)),
        "custom" => {
            let base = custom_url.unwrap_or_else(|| "http://localhost:11434/v1".to_string());
            (format!("{}/models", base), format!("Bearer {}", api_key))
        },
        _ => return Err("Unknown provider".to_string())
    };

    let mut req = client.get(&url);
    if !auth_header.is_empty() {
        req = req.header("Authorization", auth_header);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;
    
    if !resp.status().is_success() {
        return Err(format!("HTTP Error: {}", resp.status()));
    }

    let json: Value = resp.json().await.map_err(|e| e.to_string())?;
    
    let mut models = Vec::new();

    if provider == "gemini" {
        if let Some(arr) = json.get("models").and_then(|v| v.as_array()) {
            for m in arr {
                if let Some(name) = m.get("name").and_then(|v| v.as_str()) {
                    let id = name.replace("models/", "");
                    models.push(ModelInfo { id: id.clone(), name: id });
                }
            }
        }
    } else {
        if let Some(arr) = json.get("data").and_then(|v| v.as_array()) {
            for m in arr {
                if let Some(id) = m.get("id").and_then(|v| v.as_str()) {
                    models.push(ModelInfo { id: id.to_string(), name: id.to_string() });
                }
            }
        }
    }

    models.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(models)
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CursorPos {
    pub x: f64,
    pub y: f64,
}

#[cfg(target_os = "windows")]
extern "system" {
    fn GetCursorPos(lpPoint: *mut POINT) -> i32;
}

#[cfg(target_os = "windows")]
#[repr(C)]
struct POINT {
    x: i32,
    y: i32,
}

#[tauri::command]
fn get_cursor_relative(window: Window) -> Result<Option<CursorPos>, String> {
    #[cfg(target_os = "windows")]
    {
        let mut pt = POINT { x: 0, y: 0 };
        unsafe {
            GetCursorPos(&mut pt as *mut POINT);
        }
        if let (Ok(win_pos), Ok(Some(monitor))) = (window.outer_position(), window.primary_monitor()) {
            let scale = monitor.scale_factor();
            let win_logical = win_pos.to_logical::<f64>(scale);
            let cur_logical_x = (pt.x as f64) / scale;
            let cur_logical_y = (pt.y as f64) / scale;

            return Ok(Some(CursorPos {
                x: cur_logical_x - win_logical.x,
                y: cur_logical_y - win_logical.y,
            }));
        }
    }
    Ok(None)
}

#[tauri::command]
async fn send_ai_message(
    provider: String,
    api_key: String,
    model: String,
    prompt: String,
    custom_url: Option<String>,
    proxy: Option<ProxyConfig>,
) -> Result<String, String> {
    let client = create_client_with_proxy(proxy);

    let (url, auth_header) = match provider.as_str() {
        "openai" => ("https://api.openai.com/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "groq" => ("https://api.groq.com/openai/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "openrouter" => ("https://openrouter.ai/api/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "deepseek" => ("https://api.deepseek.com/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "mistral" => ("https://api.mistral.ai/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "together" => ("https://api.together.xyz/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "xai" => ("https://api.x.ai/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
        "custom" => {
            let base = custom_url.unwrap_or_else(|| "http://localhost:11434/v1".to_string());
            (format!("{}/chat/completions", base), format!("Bearer {}", api_key))
        },
        _ => ("https://api.openai.com/v1/chat/completions".to_string(), format!("Bearer {}", api_key)),
    };

    let payload = serde_json::json!({
        "model": model,
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": 500
    });

    let mut req = client.post(&url).json(&payload);
    if !auth_header.is_empty() {
        req = req.header("Authorization", auth_header);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        return Err(format!("HTTP Error: {}", resp.status()));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    if let Some(content) = json["choices"][0]["message"]["content"].as_str() {
        Ok(content.to_string())
    } else {
        Err("Invalid AI response format".to_string())
    }
}

#[tauri::command]
async fn speak_elevenlabs(api_key: String, text: String, voice_id: Option<String>, proxy: Option<ProxyConfig>) -> Result<String, String> {
    use base64::engine::general_purpose::STANDARD;
    use base64::Engine;
    let client = create_client_with_proxy(proxy);
    let voice = voice_id.unwrap_or_else(|| "RLRdvNFwJJct2XZOgfzy".to_string());
    let url = format!("https://api.elevenlabs.io/v1/text-to-speech/{}", voice);

    let body = serde_json::json!({
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    });

    let res = client
        .post(&url)
        .header("xi-api-key", api_key.trim())
        .header("Accept", "audio/mpeg")
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if status.is_success() {
        let bytes = res.bytes().await.map_err(|e| e.to_string())?;
        let base64_audio = STANDARD.encode(&bytes);
        return Ok(base64_audio);
    }

    let err_text = res.text().await.unwrap_or_default();
    
    // Try fallback model eleven_flash_v2_5 if first model failed
    let body_flash = serde_json::json!({
        "text": text,
        "model_id": "eleven_flash_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    });

    let res_flash = client
        .post(&url)
        .header("xi-api-key", api_key.trim())
        .header("Accept", "audio/mpeg")
        .header("Content-Type", "application/json")
        .json(&body_flash)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if res_flash.status().is_success() {
        let bytes = res_flash.bytes().await.map_err(|e| e.to_string())?;
        let base64_audio = STANDARD.encode(&bytes);
        return Ok(base64_audio);
    }

    Err(format!("ElevenLabs API Response ({})", err_text))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            start_drag,
            move_window,
            get_window_position,
            wander_move,
            set_window_pos,
            get_screen_info,
            show_launcher,
            show_pet,
            minimize_window,
            close_window,
            set_always_on_top,
            test_proxy,
            fetch_models,
            get_cursor_relative,
            send_ai_message,
            resize_pet_window,
            speak_elevenlabs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
