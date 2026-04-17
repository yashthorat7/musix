use tauri::Manager;
use tauri_plugin_positioner::{WindowExt, Position};
use audiotags::Tag;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use id3::TagLike;
use serde::{Deserialize, Serialize};
use std::path::Path;
use symphonia::core::formats::FormatOptions;
use symphonia::core::io::MediaSourceStream;
use symphonia::core::meta::MetadataOptions;
use symphonia::core::probe::Hint;

#[derive(Serialize, Deserialize)]
pub struct MusicMetadata {
    title: Option<String>,
    artist: Option<String>,
    album: Option<String>,
    year: Option<String>,
    genre: Option<String>,
    duration: Option<f64>,
    cover_art: Option<String>,
}


#[tauri::command]
fn extract_metadata(filepath: &str) -> Result<MusicMetadata, String> {
    let tag_result = Tag::new().read_from_path(filepath);
    let duration = get_audio_duration(filepath);
    let cover_art = extract_cover_art(filepath);

    if let Ok(tag) = tag_result {
        let metadata = MusicMetadata {
            title: tag.title().map(String::from),
            artist: tag.artist().map(String::from),
            album: tag.album_title().map(String::from),
            year: tag.year().map(|y| y.to_string()),
            genre: tag.genre().map(String::from),
            duration: duration.as_ref().ok().cloned(),
            cover_art: cover_art.clone(),
        };

        if metadata.title.is_none()
            && metadata.artist.is_none()
            && metadata.album.is_none()
            && metadata.year.is_none()
            && metadata.genre.is_none()
        {
            match id3_fallback(filepath) {
                Ok(mut id3_metadata) => {
                    id3_metadata.duration = duration.as_ref().ok().cloned();
                    id3_metadata.cover_art = cover_art.clone();
                    Ok(id3_metadata)
                }
                Err(_) => Ok(MusicMetadata {
                    title: Some(
                        filepath
                            .split('/')
                            .last()
                            .unwrap_or("Unknown")
                            .split('\\')
                            .last()
                            .unwrap_or("Unknown")
                            .to_string(),
                    ),
                    artist: Some("Unknown Artist".to_string()),
                    album: Some("Unknown Album".to_string()),
                    year: None,
                    genre: None,
                    duration: duration.ok(),
                    cover_art,
                }),
            }
        } else {
            Ok(metadata)
        }
    } else {
        match id3_fallback(filepath) {
            Ok(mut metadata) => {
                metadata.duration = duration.as_ref().ok().cloned();
                metadata.cover_art = cover_art.clone();
                Ok(metadata)
            }
            Err(_) => Ok(MusicMetadata {
                title: Some(
                    filepath
                        .split('/')
                        .last()
                        .unwrap_or("Unknown")
                        .split('\\')
                        .last()
                        .unwrap_or("Unknown")
                        .to_string(),
                ),
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
                title: tag.title().map(String::from),
                artist: tag.artist().map(String::from),
                album: tag.album().map(String::from),
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

    let path_str = if path_str.starts_with("/") && path_str.chars().nth(2) == Some(':') {
        path_str[1..].to_string()
    } else {
        path_str.to_string()
    };

    let url = format!("file:///{}", path_str);
    Ok(url)
}

#[tauri::command]
fn reposition_window(window: tauri::Window) {
    let _ = window.move_window(tauri_plugin_positioner::Position::BottomRight);
    if let Ok(pos) = window.outer_position() {
        let scale_factor = window.scale_factor().unwrap_or(1.0);
        let offset = (20.0 * scale_factor) as i32;
        let _ = window.set_position(tauri::PhysicalPosition::new(
            pos.x - offset,
            pos.y - offset,
        ));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.move_window(Position::BottomRight);
                
                if let Ok(pos) = window.outer_position() {
                    let scale_factor = window.scale_factor().unwrap_or(1.0);
                    let offset = (20.0 * scale_factor) as i32;
                    let _ = window.set_position(tauri::PhysicalPosition::new(
                        pos.x - offset,
                        pos.y - offset,
                    ));
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            extract_metadata,
            get_file_url,
            reposition_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
