use audiotags::Tag;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use id3::TagLike;
use serde::{Deserialize, Serialize};
use std::path::Path;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};
use tauri_plugin_autostart::MacosLauncher;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_positioner::{Position, WindowExt};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MusicMetadata {
    title: Option<String>,
    artist: Option<String>,
    album: Option<String>,
    year: Option<String>,
    genre: Option<String>,
    duration: Option<f64>,
    cover_art: Option<String>,
}

fn clean_filename_title(filepath: &str) -> String {
    let filename = Path::new(filepath)
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or(filepath);

    filename.replace('_', " ").replace('-', " ")
}

#[tauri::command]
fn extract_metadata(filepath: &str) -> Result<MusicMetadata, String> {
    let tag_result = Tag::new().read_from_path(filepath);
    let duration = get_audio_duration(filepath);
    let cover_art = extract_cover_art(filepath);

    if let Ok(tag) = tag_result {
        let title = tag.title().map(String::from);
        let artist = tag.artist().map(String::from);
        let album = tag.album_title().map(String::from);
        let year = tag.year().map(|y| y.to_string());
        let genre = tag.genre().map(String::from);

        if title.is_none() && artist.is_none() && album.is_none() {
            match id3_fallback(filepath) {
                Ok(mut id3_metadata) => {
                    id3_metadata.duration = duration.as_ref().ok().cloned();
                    id3_metadata.cover_art = cover_art.clone();
                    Ok(id3_metadata)
                }
                Err(_) => Ok(MusicMetadata {
                    title: Some(clean_filename_title(filepath)),
                    artist: Some("Unknown Artist".to_string()),
                    album: Some("Unknown Album".to_string()),
                    year: None,
                    genre: None,
                    duration: duration.ok(),
                    cover_art,
                }),
            }
        } else {
            Ok(MusicMetadata {
                title: title.or_else(|| Some(clean_filename_title(filepath))),
                artist: artist.or_else(|| Some("Unknown Artist".to_string())),
                album: album.or_else(|| Some("Unknown Album".to_string())),
                year,
                genre,
                duration: duration.ok(),
                cover_art,
            })
        }
    } else {
        match id3_fallback(filepath) {
            Ok(mut metadata) => {
                metadata.duration = duration.as_ref().ok().cloned();
                metadata.cover_art = cover_art.clone();
                Ok(metadata)
            }
            Err(_) => Ok(MusicMetadata {
                title: Some(clean_filename_title(filepath)),
                artist: Some("Unknown Artist".to_string()),
                album: Some("Unknown Album".to_string()),
                year: None,
                genre: None,
                duration: duration.ok(),
                cover_art,
            }),
        }
    }
}

fn extract_cover_art(filepath: &str) -> Option<String> {
    if let Ok(tag) = id3::Tag::read_from_path(filepath) {
        if let Some(picture) = tag.pictures().next() {
            return Some(format!(
                "data:{};base64,{}",
                picture.mime_type,
                BASE64.encode(&picture.data)
            ));
        }
    }

    if let Ok(tag) = Tag::new().read_from_path(filepath) {
        if let Some(album_cover) = tag.album_cover() {
            let mime = match album_cover.mime_type {
                audiotags::MimeType::Png => "image/png",
                audiotags::MimeType::Jpeg => "image/jpeg",
                audiotags::MimeType::Bmp => "image/bmp",
                audiotags::MimeType::Gif => "image/gif",
                _ => "image/jpeg",
            };
            return Some(format!(
                "data:{};base64,{}",
                mime,
                BASE64.encode(album_cover.data)
            ));
        }
    }
    None
}

fn get_audio_duration(filepath: &str) -> Result<f64, String> {
    let path = Path::new(filepath);
    let file = std::fs::File::open(path).map_err(|e| e.to_string())?;
    let mss = MediaSourceStream::new(Box::new(file), Default::default());
    let mut hint = Hint::new();
    if let Some(extension) = path.extension() {
        if let Some(extension_str) = extension.to_str() {
            hint.with_extension(extension_str);
        }
    }
    let format_opts = FormatOptions::default();
    let metadata_opts = MetadataOptions::default();
    let probed = symphonia::default::get_probe()
        .format(&hint, mss, &format_opts, &metadata_opts)
        .map_err(|e| format!("Error probing media: {}", e))?;
    let format = probed.format;
    let track = format
        .tracks()
        .iter()
        .find(|t| t.codec_params.codec != symphonia::core::codecs::CODEC_TYPE_NULL)
        .ok_or("No valid track found")?;
    if let Some(n_frames) = track.codec_params.n_frames {
        if let Some(sample_rate) = track.codec_params.sample_rate {
            let seconds = n_frames as f64 / sample_rate as f64;
            return Ok(seconds);
        }
    }
    if let Some(tb) = track.codec_params.time_base {
        if let Some(n_frames) = track.codec_params.n_frames {
            let seconds = n_frames as f64 * tb.numer as f64 / tb.denom as f64;
            return Ok(seconds);
        }
    }
    Err("Could not determine audio duration".to_string())
}

fn id3_fallback(filepath: &str) -> Result<MusicMetadata, String> {
    match id3::Tag::read_from_path(filepath) {
        Ok(tag) => {
            let metadata = MusicMetadata {
                title: tag
                    .title()
                    .map(String::from)
                    .or_else(|| Some(clean_filename_title(filepath))),
                artist: tag
                    .artist()
                    .map(String::from)
                    .or_else(|| Some("Unknown Artist".to_string())),
                album: tag
                    .album()
                    .map(String::from)
                    .or_else(|| Some("Unknown Album".to_string())),
                year: tag.year().map(|y| y.to_string()),
                genre: tag.genre().map(String::from),
                duration: None,
                cover_art: None,
            };
            Ok(metadata)
        }
        Err(e) => Err(format!("Failed to extract metadata: {}", e)),
    }
}

#[tauri::command]
fn get_file_url(filepath: &str) -> Result<String, String> {
    let path = std::path::Path::new(filepath);
    if !path.exists() {
        return Err(format!("File not found: {}", filepath));
    }

    let canonical_path = path
        .canonicalize()
        .map_err(|e| format!("Failed to get canonical path: {}", e))?;

    let path_str = canonical_path.to_string_lossy().replace('\\', "/");

    let path_str = if path_str.starts_with('/') && path_str.chars().nth(2) == Some(':') {
        path_str[1..].to_string()
    } else {
        path_str.to_string()
    };

    let url = format!("file:///{}", path_str);
    Ok(url)
}

#[tauri::command]
fn reposition_window(window: tauri::Window) {
    let _ = window.move_window(Position::BottomRight);
    if let Ok(pos) = window.outer_position() {
        let scale_factor = window.scale_factor().unwrap_or(1.0);
        let offset = (60.0 * scale_factor) as i32;
        let _ = window.set_position(tauri::PhysicalPosition::new(
            pos.x - offset,
            pos.y - offset,
        ));
    }
}

#[tauri::command]
fn set_window_position(window: tauri::Window, x: i32, y: i32) {
    let win_size = window.outer_size().unwrap_or(tauri::PhysicalSize::new(256, 256));
    if let Ok(monitors) = window.available_monitors() {
        let is_valid = monitors.iter().any(|m| {
            let m_pos = m.position();
            let m_size = m.size();
            x >= m_pos.x
                && (x + win_size.width as i32) <= (m_pos.x + m_size.width as i32)
                && y >= m_pos.y
                && (y + win_size.height as i32) <= (m_pos.y + m_size.height as i32)
        });
        if is_valid {
            let _ = window.set_position(tauri::PhysicalPosition::new(x, y));
            return;
        }
    }
    reposition_window(window);
}

#[tauri::command]
fn show_main_window(window: tauri::Window) {
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();
}

#[tauri::command]
fn toggle_window_visibility(window: tauri::Window) {
    if window.is_visible().unwrap_or(false) && !window.is_minimized().unwrap_or(false) {
        let _ = window.hide();
    } else {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn get_cli_args() -> Vec<String> {
    std::env::args().skip(1).collect()
}

#[tauri::command]
async fn select_audio_files() -> Result<Vec<String>, String> {
    let files = rfd::AsyncFileDialog::new()
        .add_filter(
            "Audio Files",
            &["mp3", "wav", "flac", "ogg", "m4a", "aac", "opus", "wma"],
        )
        .pick_files()
        .await;

    match files {
        Some(handles) => Ok(handles
            .into_iter()
            .map(|h| h.path().to_string_lossy().into_owned())
            .collect()),
        None => Ok(Vec::new()),
    }
}

fn toggle_or_show_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let is_visible = window.is_visible().unwrap_or(false);
        let is_minimized = window.is_minimized().unwrap_or(false);
        let is_focused = window.is_focused().unwrap_or(false);

        if is_visible && !is_minimized && is_focused {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.unminimize();
            let _ = window.set_focus();
        }
    }
}

#[cfg(windows)]
use windows_sys::Win32::Foundation::{HWND, LPARAM, LRESULT, WPARAM};
#[cfg(windows)]
use windows_sys::Win32::Graphics::Dwm::{
    DwmSetWindowAttribute, DWMWA_BORDER_COLOR, DWMWA_COLOR_NONE,
    DWMWA_WINDOW_CORNER_PREFERENCE,
};
#[cfg(windows)]
use windows_sys::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
#[cfg(windows)]
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetWindowLongPtrW, SetWindowLongPtrW, SetWindowPos, GWL_EXSTYLE, GWL_STYLE, SWP_FRAMECHANGED,
    SWP_NOACTIVATE, SWP_NOMOVE, SWP_NOSIZE, SWP_NOZORDER, WM_ERASEBKGND, WM_NCACTIVATE, WM_NCPAINT,
    WS_BORDER, WS_CAPTION, WS_DLGFRAME, WS_EX_CLIENTEDGE, WS_EX_DLGMODALFRAME, WS_EX_STATICEDGE,
    WS_EX_WINDOWEDGE, WS_MAXIMIZEBOX, WS_MINIMIZEBOX, WS_POPUP, WS_SYSMENU, WS_THICKFRAME,
};

#[cfg(windows)]
unsafe extern "system" fn musix_subclass_proc(
    hwnd: HWND,
    umsg: u32,
    wparam: WPARAM,
    lparam: LPARAM,
    _uidsubclass: usize,
    _dwrefdata: usize,
) -> LRESULT {
    match umsg {
        WM_NCPAINT => 0,
        WM_NCACTIVATE => 1,
        WM_ERASEBKGND => 1,
        _ => DefSubclassProc(hwnd, umsg, wparam, lparam),
    }
}

#[cfg(windows)]
unsafe fn apply_musix_window_styling(hwnd: isize) {
    let current_style = GetWindowLongPtrW(hwnd as _, GWL_STYLE) as u32;
    let new_style = (current_style
        & !(WS_CAPTION
            | WS_THICKFRAME
            | WS_MINIMIZEBOX
            | WS_MAXIMIZEBOX
            | WS_SYSMENU
            | WS_BORDER
            | WS_DLGFRAME))
        | WS_POPUP;
    SetWindowLongPtrW(hwnd as _, GWL_STYLE, new_style as _);

    let current_ex_style = GetWindowLongPtrW(hwnd as _, GWL_EXSTYLE) as u32;
    let new_ex_style = current_ex_style
        & !(WS_EX_WINDOWEDGE
            | WS_EX_CLIENTEDGE
            | WS_EX_STATICEDGE
            | WS_EX_DLGMODALFRAME);
    SetWindowLongPtrW(hwnd as _, GWL_EXSTYLE, new_ex_style as _);

    // Suppress Windows 11 accent-colored border completely
    let border_color = DWMWA_COLOR_NONE; // 0xFFFFFFFE
    let _ = DwmSetWindowAttribute(
        hwnd as _,
        DWMWA_BORDER_COLOR as u32,
        &border_color as *const _ as *const std::ffi::c_void,
        std::mem::size_of_val(&border_color) as u32,
    );

    // DWMWCP_DONOTROUND (1): Never let DWM round the OS window frame.
    // The CSS card in the webview handles the 24px (and 64px in miniview) rounded corners.
    let corner_preference = 1u32;
    let _ = DwmSetWindowAttribute(
        hwnd as _,
        DWMWA_WINDOW_CORNER_PREFERENCE as u32,
        &corner_preference as *const _ as *const std::ffi::c_void,
        std::mem::size_of_val(&corner_preference) as u32,
    );

    // Subclass the HWND to intercept non-client area paint, activate, and erase
    SetWindowSubclass(hwnd as _, Some(musix_subclass_proc), 1001, 0);

    SetWindowPos(
        hwnd as _,
        0 as _,
        0,
        0,
        0,
        0,
        SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER | SWP_FRAMECHANGED,
    );
}

#[tauri::command]
fn start_dragging(window: tauri::Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
async fn resize_window_keep_anchor(
    window: tauri::Window,
    target_width: f64,
    target_height: f64,
) -> Result<(), String> {
    let scale_factor = window.scale_factor().unwrap_or(1.0);
    let current_size = window.outer_size().map_err(|e| e.to_string())?;
    let current_pos = window.outer_position().map_err(|e| e.to_string())?;

    let start_phys_w = current_size.width as f64;
    let start_phys_h = current_size.height as f64;
    let target_phys_w = (target_width * scale_factor).round();
    let target_phys_h = (target_height * scale_factor).round();

    let anchor_x = current_pos.x + current_size.width as i32;
    let anchor_y = current_pos.y + current_size.height as i32;

    let final_x = anchor_x - target_phys_w as i32;
    let final_y = anchor_y - target_phys_h as i32;

    if (start_phys_w - target_phys_w).abs() >= 1.0 || (start_phys_h - target_phys_h).abs() >= 1.0 {
        #[cfg(windows)]
        {
            if let Ok(hwnd) = window.hwnd() {
                unsafe {
                    SetWindowPos(
                        hwnd.0 as _,
                        0 as _,
                        final_x,
                        final_y,
                        target_phys_w as i32,
                        target_phys_h as i32,
                        SWP_NOZORDER | SWP_NOACTIVATE,
                    );
                }
            }
        }

        #[cfg(not(windows))]
        {
            let _ = window.set_size(tauri::LogicalSize::new(target_width, target_height));
            let _ = window.set_position(tauri::PhysicalPosition::new(final_x, final_y));
        }
    }

    #[cfg(windows)]
    {
        if let Ok(hwnd) = window.hwnd() {
            unsafe {
                apply_musix_window_styling(hwnd.0 as _);
            }
        }
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }
            let _ = app.emit("single-instance-args", argv);
        }))
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--autostart"]),
        ))
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        let shortcut_str = shortcut.to_string().to_lowercase();
                        let is_toggle = shortcut_str.contains("m")
                            && ((shortcut_str.contains("alt") && shortcut_str.contains("shift"))
                                || ((shortcut_str.contains("ctrl")
                                    || shortcut_str.contains("control"))
                                    && shortcut_str.contains("alt")));
                        if is_toggle {
                            toggle_or_show_window(app);
                        } else if shortcut_str.contains("mediaplaypause") {
                            let _ = app.emit("shortcut-play-pause", ());
                        } else if shortcut_str.contains("mediatracknext")
                            || shortcut_str.contains("medianexttrack")
                        {
                            let _ = app.emit("shortcut-next", ());
                        } else if shortcut_str.contains("mediatrackprevious")
                            || shortcut_str.contains("mediaprevioustrack")
                        {
                            let _ = app.emit("shortcut-prev", ());
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            let is_autostart = std::env::args().any(|arg| arg == "--autostart");
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_skip_taskbar(true);
                #[cfg(windows)]
                {
                    if let Ok(hwnd) = window.hwnd() {
                        unsafe {
                            apply_musix_window_styling(hwnd.0 as _);
                        }
                    }
                }
                if is_autostart {
                    let _ = window.hide();
                } else {
                    let _ = window.move_window(Position::BottomRight);

                    if let Ok(pos) = window.outer_position() {
                        let scale_factor = window.scale_factor().unwrap_or(1.0);
                        let offset = (60.0 * scale_factor) as i32;
                        let _ = window.set_position(tauri::PhysicalPosition::new(
                            pos.x - offset,
                            pos.y - offset,
                        ));
                    }
                }
            }

            let shortcuts = [
                "Alt+Shift+M",
                "Ctrl+Alt+M",
                "MediaPlayPause",
                "MediaTrackNext",
                "MediaTrackPrevious",
            ];
            for s in shortcuts {
                if let Ok(sc) = s.parse::<Shortcut>() {
                    let _ = app.global_shortcut().register(sc);
                }
            }

            let show_item =
                MenuItem::with_id(app, "toggle", "Show / Focus Musix", true, None::<&str>)?;
            let play_item =
                MenuItem::with_id(app, "play_pause", "Play / Pause", true, None::<&str>)?;
            let next_item =
                MenuItem::with_id(app, "next", "Next Track", true, None::<&str>)?;
            let prev_item =
                MenuItem::with_id(app, "prev", "Previous Track", true, None::<&str>)?;
            let quit_item =
                MenuItem::with_id(app, "quit", "Quit Musix", true, None::<&str>)?;

            let tray_menu = Menu::with_items(
                app,
                &[
                    &show_item,
                    &play_item,
                    &next_item,
                    &prev_item,
                    &quit_item,
                ],
            )?;

            let mut tray_builder = TrayIconBuilder::new()
                .menu(&tray_menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "toggle" => {
                        toggle_or_show_window(app);
                    }
                    "play_pause" => {
                        let _ = app.emit("shortcut-play-pause", ());
                    }
                    "next" => {
                        let _ = app.emit("shortcut-next", ());
                    }
                    "prev" => {
                        let _ = app.emit("shortcut-prev", ());
                    }
                    "quit" => {
                        let _ = app.emit("app-quit", ());
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        toggle_or_show_window(app);
                    }
                });

            if let Some(icon) = app.default_window_icon() {
                tray_builder = tray_builder.icon(icon.clone());
            }

            let _tray = tray_builder.build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            #[cfg(windows)]
            if let tauri::WindowEvent::Focused(_) = event {
                if let Ok(hwnd) = window.hwnd() {
                    unsafe {
                        apply_musix_window_styling(hwnd.0 as _);
                    }
                }
            }
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.emit("window-close-requested", ());
                let _ = window.hide();
            }
        })
        .invoke_handler(tauri::generate_handler![
            extract_metadata,
            get_file_url,
            reposition_window,
            resize_window_keep_anchor,
            set_window_position,
            show_main_window,
            toggle_window_visibility,
            get_cli_args,
            select_audio_files,
            start_dragging
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
