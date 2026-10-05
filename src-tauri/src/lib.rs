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

#[tauri::command]
fn toggle_overlay(app: tauri::AppHandle) -> Result<bool, String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    let is_visible = window.is_visible().unwrap_or(false);
    if is_visible {
      let _ = window.hide();
      Ok(false)
    } else {
      let _ = window.show();
      let _ = window.unminimize();
      let _ = window.set_always_on_top(true);
      let _ = window.set_focus();
      Ok(true)
    }
  } else {
    Err("Fenêtre overlay introuvable".to_string())
  }
}

#[tauri::command]
fn register_overlay_shortcut(app: tauri::AppHandle, shortcut: String) -> Result<bool, String> {
  use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

  let _ = app.global_shortcut().unregister_all();
  let key_str = shortcut.trim();
  if key_str.is_empty() {
    return Ok(true);
  }

  if let Ok(sc) = key_str.parse::<Shortcut>() {
    app.global_shortcut().register(sc).map_err(|e| e.to_string())?;
    Ok(true)
  } else {
    if let Ok(fallback) = "F9".parse::<Shortcut>() {
      let _ = app.global_shortcut().register(fallback);
    }
    Err("Format de touche invalide (ex: F9, Control+F9, Alt+O)".to_string())
  }
}

#[tauri::command]
async fn apply_in_place_update(app: tauri::AppHandle, url: String) -> Result<String, String> {
  #[cfg(target_os = "windows")]
  {
    use std::os::windows::process::CommandExt;

    let target_url = if url.starts_with("http://") || url.starts_with("https://") {
      url
    } else {
      format!("http://localhost:3000{}", url)
    };

    let temp_dir = std::env::temp_dir();
    let installer_path = temp_dir.join("sgs_internal_update.exe");
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let current_exe_str = current_exe.to_string_lossy().to_string();
    let installer_str = installer_path.to_string_lossy().to_string();

    const CREATE_NO_WINDOW: u32 = 0x08000000;

    // 1. Télécharger le package de mise à jour en tâche asynchrone sans bloquer l'interface
    let dl_target = target_url.clone();
    let dl_dest = installer_str.clone();

    let download_ok = tauri::async_runtime::spawn_blocking(move || {
      let dl_script = format!(
        "$ProgressPreference = 'SilentlyContinue'; \
         [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; \
         $wc = New-Object System.Net.WebClient; \
         $wc.DownloadFile('{url}', '{dest}'); \
         if ((Test-Path '{dest}') -and (Get-Item '{dest}').Length -gt 1000) {{ exit 0 }} else {{ exit 1 }}",
        url = dl_target.replace("'", "''"),
        dest = dl_dest.replace("'", "''")
      );

      std::process::Command::new("powershell")
        .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &dl_script])
        .creation_flags(CREATE_NO_WINDOW)
        .status()
    })
    .await
    .map_err(|e| format!("Erreur d'exécution de la tâche: {}", e))?
    .map_err(|e| format!("Erreur de téléchargement: {}", e))?;

    if !download_ok.success() {
      return Err("Échec du téléchargement du paquet de mise à jour.".to_string());
    }

    // 2. Appliquer les fichiers silencieusement en interne (flag /S) et relancer l'app
    let apply_script = format!(
      "$ProgressPreference = 'SilentlyContinue'; \
       Start-Sleep -Milliseconds 600; \
       Start-Process -FilePath '{installer}' -ArgumentList '/S' -Wait; \
       Remove-Item -Path '{installer}' -Force -ErrorAction SilentlyContinue; \
       $installed = Get-ChildItem -Path \"$env:LOCALAPPDATA\\Programs\" -Filter \"*SGS-Tracker*.exe\" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName; \
       if ($installed -and (Test-Path $installed)) {{ \
         Start-Process -FilePath $installed; \
       }} elseif (Test-Path '{current_exe}') {{ \
         Start-Process -FilePath '{current_exe}'; \
       }}",
      installer = installer_str.replace("'", "''"),
      current_exe = current_exe_str.replace("'", "''")
    );

    std::process::Command::new("powershell")
      .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", &apply_script])
      .creation_flags(CREATE_NO_WINDOW)
      .spawn()
      .map_err(|e| format!("Erreur lors de l'application de la mise à jour: {}", e))?;

    // 3. Fermer proprement l'application après 400ms pour libérer les fichiers
    let app_handle = app.clone();
    std::thread::spawn(move || {
      std::thread::sleep(std::time::Duration::from_millis(400));
      app_handle.exit(0);
    });

    Ok("Mise à jour interne appliquée avec succès ! Redémarrage en cours...".to_string())
  }
  #[cfg(not(target_os = "windows"))]
  {
    let _ = (app, url);
    Ok("Non supporté sur cette plateforme".to_string())
  }
}

#[tauri::command]
async fn download_and_launch_installer(app: tauri::AppHandle, url: String) -> Result<String, String> {
  apply_in_place_update(app, url).await
}

#[tauri::command]
fn start_drag_window(app: tauri::AppHandle) -> Result<(), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    window.start_dragging().map_err(|e| e.to_string())
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn set_overlay_size(app: tauri::AppHandle, width: f64, height: f64) -> Result<(), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    let size = tauri::LogicalSize::new(width.max(360.0), height.max(260.0));
    window.set_size(size).map_err(|e| e.to_string())?;
    Ok(())
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn get_overlay_position(app: tauri::AppHandle) -> Result<(f64, f64), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    let scale = window.scale_factor().unwrap_or(1.0);
    let phys = window.outer_position().map_err(|e| e.to_string())?;
    let logical = phys.to_logical::<f64>(scale);
    Ok((logical.x, logical.y))
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn set_overlay_position(app: tauri::AppHandle, x: f64, y: f64) -> Result<(), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    let pos = tauri::LogicalPosition::new(x, y);
    window.set_position(pos).map_err(|e| e.to_string())?;
    Ok(())
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn move_overlay_window(app: tauri::AppHandle, delta_x: f64, delta_y: f64) -> Result<(), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    let scale = window.scale_factor().unwrap_or(1.0);
    if let Ok(phys) = window.outer_position() {
      let logical = phys.to_logical::<f64>(scale);
      let new_pos = tauri::LogicalPosition::new(logical.x + delta_x, logical.y + delta_y);
      window.set_position(new_pos).map_err(|e| e.to_string())?;
    }
    Ok(())
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn set_overlay_click_through(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
  use tauri::Manager;
  if let Some(window) = app.get_webview_window("overlay") {
    window.set_ignore_cursor_events(enabled).map_err(|e| e.to_string())?;
    Ok(())
  } else {
    Err("Overlay window not found".to_string())
  }
}

#[tauri::command]
fn get_app_version(app: tauri::AppHandle) -> String {
  app.package_info().version.to_string()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_process::init())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(
      tauri_plugin_global_shortcut::Builder::new()
        .with_handler(|app, _shortcut, event| {
          if event.state() == tauri_plugin_global_shortcut::ShortcutState::Pressed {
            let _ = toggle_overlay(app.clone());
          }
        })
        .build(),
    )
    .invoke_handler(tauri::generate_handler![
      open_browser,
      set_titlebar_color,
      check_app_update,
      install_app_update,
      apply_in_place_update,
      download_and_launch_installer,
      register_overlay_shortcut,
      toggle_overlay,
      start_drag_window,
      set_overlay_size,
      move_overlay_window,
      set_overlay_position,
      get_overlay_position,
      set_overlay_click_through,
      get_app_version
    ])
    .setup(|app| {
      use tauri::Manager;

      // ─── Configuration de l'icône dans la zone de notification Windows (System Tray) ───
      #[cfg(desktop)]
      {
        use tauri::{
          menu::{Menu, MenuItem},
          tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
        };

        let show_main_item = MenuItem::with_id(app, "show_main", "Afficher SGS-Tracker", true, None::<&str>)?;
        let toggle_overlay_item = MenuItem::with_id(app, "toggle_overlay", "Afficher / Masquer l'Overlay (F9)", true, None::<&str>)?;
        let quit_item = MenuItem::with_id(app, "quit", "Quitter l'application", true, None::<&str>)?;

        let tray_menu = Menu::with_items(app, &[&show_main_item, &toggle_overlay_item, &quit_item])?;

        if let Some(icon) = app.default_window_icon() {
          let _ = TrayIconBuilder::new()
            .icon(icon.clone())
            .menu(&tray_menu)
            .show_menu_on_left_click(false)
            .tooltip("SGS-Tracker — Actif en arrière-plan")
            .on_menu_event(|app, event| {
              match event.id().as_ref() {
                "show_main" => {
                  if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                  }
                }
                "toggle_overlay" => {
                  let _ = toggle_overlay(app.clone());
                }
                "quit" => {
                  app.exit(0);
                }
                _ => {}
              }
            })
            .on_tray_icon_event(|tray, event| {
              if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
              } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                  if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                  } else {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                  }
                }
              }
            })
            .build(app)?;
        }
      }

      #[cfg(target_os = "windows")]
      {
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

      // Enregistrement du raccourci global par défaut F9 au niveau du système
      {
        use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};
        if let Ok(sc) = "F9".parse::<Shortcut>() {
          let _ = app.global_shortcut().register(sc);
        }
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      // Lorsqu'on clique sur la croix rouge de fermeture de la fenêtre principale,
      // on la masque pour qu'elle reste active en arrière-plan dans la barre des tâches (System Tray).
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if window.label() == "main" {
          let _ = window.hide();
          api.prevent_close();
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
