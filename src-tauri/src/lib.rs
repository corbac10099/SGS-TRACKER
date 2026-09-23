#[tauri::command]
fn open_browser(url: String) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;
    const CREATE_NO_WINDOW: u32 = 0x08000000;
    std::process::Command::new("cmd")
      .args(["/c", "start", "", &url])
      .creation_flags(CREATE_NO_WINDOW)
      .spawn()
      .map_err(|e| e.to_string())?;
    Ok(())
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = url;
    Ok(())
  }
}

#[cfg(target_os = "windows")]
#[link(name = "dwmapi")]
extern "system" {
  fn DwmSetWindowAttribute(
    hwnd: *mut std::ffi::c_void,
    dw_attribute: u32,
    pv_attribute: *const std::ffi::c_void,
    cb_attribute: u32,
  ) -> i32;
}

#[tauri::command]
fn set_titlebar_color(window: tauri::WebviewWindow, r: u8, g: u8, b: u8) -> Result<(), String> {
  #[cfg(target_os = "windows")]
  {
    if let Ok(hwnd) = window.hwnd() {
      const DWMWA_CAPTION_COLOR: u32 = 35;
      const DWMWA_TEXT_COLOR: u32 = 36;

      let color_ref: u32 = ((b as u32) << 16) | ((g as u32) << 8) | (r as u32);
      unsafe {
        let _ = DwmSetWindowAttribute(
          hwnd.0 as *mut std::ffi::c_void,
          DWMWA_CAPTION_COLOR,
          &color_ref as *const _ as *const std::ffi::c_void,
          std::mem::size_of::<u32>() as u32,
        );
      }

      // Calcul de la luminance pour le texte de la barre de titre
      let lum = (0.299 * (r as f32) + 0.587 * (g as f32) + 0.114 * (b as f32)) / 255.0;
      let text_color_ref: u32 = if lum > 0.55 { 0x00140D09 } else { 0x00FFFFFF };

      unsafe {
        let _ = DwmSetWindowAttribute(
          hwnd.0 as *mut std::ffi::c_void,
          DWMWA_TEXT_COLOR,
          &text_color_ref as *const _ as *const std::ffi::c_void,
          std::mem::size_of::<u32>() as u32,
        );
      }
    }
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = (window, r, g, b);
  }
  Ok(())
}

use tauri_plugin_updater::UpdaterExt;

#[derive(serde::Serialize)]
struct UpdateCheckResult {
  available: bool,
  version: Option<String>,
  current_version: Option<String>,
  body: Option<String>,
  date: Option<String>,
}

#[tauri::command]
async fn check_app_update(app: tauri::AppHandle) -> Result<UpdateCheckResult, String> {
  let updater = app.updater().map_err(|e| e.to_string())?;
  match updater.check().await {
    Ok(Some(update)) => Ok(UpdateCheckResult {
      available: true,
      version: Some(update.version.clone()),
      current_version: Some(update.current_version.clone()),
      body: update.body.clone(),
      date: update.date.map(|d| d.to_string()),
    }),
    Ok(None) => Ok(UpdateCheckResult {
      available: false,
      version: None,
      current_version: None,
      body: None,
      date: None,
    }),
    Err(e) => Err(format!("Erreur lors de la recherche de mise à jour: {}", e)),
  }
}

#[tauri::command]
async fn install_app_update(app: tauri::AppHandle) -> Result<String, String> {
  let updater = app.updater().map_err(|e| e.to_string())?;
  if let Some(update) = updater.check().await.map_err(|e| e.to_string())? {
    let mut downloaded = 0;
    update
      .download_and_install(
        |chunk_length, content_length| {
          downloaded += chunk_length;
          let _ = (downloaded, content_length);
        },
        || {
          // Téléchargement terminé
        },
      )
      .await
      .map_err(|e| format!("Erreur d'installation: {}", e))?;

    // Redémarrage de l'application
    app.restart();
    #[allow(unreachable_code)]
    Ok("Mise à jour installée avec succès. Redémarrage en cours...".to_string())
  } else {
    Err("Aucune mise à jour disponible.".to_string())
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .invoke_handler(tauri::generate_handler![
      open_browser,
      set_titlebar_color,
      check_app_update,
      install_app_update
    ])
    .setup(|app| {
      #[cfg(target_os = "windows")]
      {
        use tauri::Manager;
        if let Some(window) = app.get_webview_window("main") {
          if let Ok(hwnd) = window.hwnd() {
            const DWMWA_CAPTION_COLOR: u32 = 35;
            const DWMWA_TEXT_COLOR: u32 = 36;
            let dark_bg: u32 = 0x00130E0A;
            let white_text: u32 = 0x00FFFFFF;
            unsafe {
              let _ = DwmSetWindowAttribute(
                hwnd.0 as *mut std::ffi::c_void,
                DWMWA_CAPTION_COLOR,
                &dark_bg as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
              );
              let _ = DwmSetWindowAttribute(
                hwnd.0 as *mut std::ffi::c_void,
                DWMWA_TEXT_COLOR,
                &white_text as *const _ as *const std::ffi::c_void,
                std::mem::size_of::<u32>() as u32,
              );
            }
          }
        }
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
