use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Debug, Clone, Deserialize)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub protocol: Option<String>,
    pub host: Option<String>,
    pub port: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProxyTestResult {
    pub ok: bool,
    pub ms: Option<u128>,
    pub status: Option<u16>,
    pub error: Option<String>,
}

pub async fn test_proxy_connection(config: ProxyConfig) -> ProxyTestResult {
    let host = match config.host {
        Some(ref h) if !h.trim().is_empty() => h.trim(),
        _ => return ProxyTestResult { ok: false, ms: None, status: None, error: Some("No host provided".into()) },
    };

    let port = match config.port {
        Some(ref p) if !p.trim().is_empty() => p.trim(),
        _ => return ProxyTestResult { ok: false, ms: None, status: None, error: Some("No port provided".into()) },
    };

    let protocol = config.protocol.as_deref().unwrap_or("http");
    let proxy_url_str = format!("{}://{}:{}", protocol, host, port);

    let mut proxy = match reqwest::Proxy::all(&proxy_url_str) {
        Ok(p) => p,
        Err(e) => return ProxyTestResult { ok: false, ms: None, status: None, error: Some(e.to_string()) },
    };

    if let (Some(u), Some(p)) = (config.username, config.password) {
        if !u.is_empty() {
            proxy = proxy.basic_auth(&u, &p);
        }
    }

    let client_builder = reqwest::Client::builder()
        .proxy(proxy)
        .timeout(Duration::from_secs(8));

    let client = match client_builder.build() {
        Ok(c) => c,
        Err(e) => return ProxyTestResult { ok: false, ms: None, status: None, error: Some(e.to_string()) },
    };

    let start = std::time::Instant::now();
    match client.get("https://api.openai.com/v1/models").send().await {
        Ok(resp) => {
            let elapsed = start.elapsed().as_millis();
            ProxyTestResult {
                ok: resp.status().is_success() || resp.status().as_u16() == 401,
                ms: Some(elapsed),
                status: Some(resp.status().as_u16()),
                error: None,
            }
        }
        Err(e) => ProxyTestResult {
            ok: false,
            ms: None,
            status: None,
            error: Some(e.to_string()),
        },
    }
}
