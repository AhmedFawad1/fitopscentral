use tauri::Manager;
use serde_json::Value;

pub async fn fetch_latest_release() -> Result<(String, String), String> {
    let url = "https://api.github.com/repos/AhmedFawad1/whatsapp-engine/releases/latest";

    let client = reqwest::Client::new();
    let resp = client
        .get(url)
        .header("User-Agent", "tauri-app")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let json: Value = resp.json().await.map_err(|e| e.to_string())?;

    let tag = json["tag_name"]
        .as_str()
        .ok_or("Missing tag_name")?
        .to_string();

    let asset = json["assets"]
        .as_array()
        .and_then(|a| {
            a.iter().find(|x| {
                x["name"].as_str() == Some("whatsapp-engine-win-x64.zip")
            })
        })
        .ok_or("ZIP asset not found")?;

    let download_url = asset["browser_download_url"]
        .as_str()
        .ok_or("Missing download URL")?
        .to_string();

    Ok((tag, download_url))
}

use std::{fs::File, io::Write, path::Path};

pub async fn download_zip(url: &str, out: &Path) -> Result<(), String> {
    let bytes = reqwest::get(url)
        .await
        .map_err(|e| e.to_string())?
        .bytes()
        .await
        .map_err(|e| e.to_string())?;

    let mut file = File::create(out).map_err(|e| e.to_string())?;
    file.write_all(&bytes).map_err(|e| e.to_string())?;

    Ok(())
}


use zip::ZipArchive;
use std::{fs, io};

pub fn extract_zip(zip_path: &Path, dest: &Path) -> Result<(), String> {
    let file = File::open(zip_path).map_err(|e| e.to_string())?;
    let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut entry = archive.by_index(i).map_err(|e| e.to_string())?;
        let out_path = dest.join(entry.name());

        if entry.is_dir() {
            fs::create_dir_all(&out_path).map_err(|e| e.to_string())?;
        } else {
            if let Some(parent) = out_path.parent() {
                fs::create_dir_all(parent).map_err(|e| e.to_string())?;
            }

            let mut outfile = File::create(&out_path).map_err(|e| e.to_string())?;
            io::copy(&mut entry, &mut outfile).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

use std::path::PathBuf;
use tauri::AppHandle;

fn read_local_version(engine_dir: &Path) -> Option<String> {
    let version_path = engine_dir.join("whatsapp").join("engine.version");
    println!("Reading local version from: {:?}", version_path);
    std::fs::read_to_string(version_path)
        .ok()
        .map(|v| v.trim().to_string())
}

fn normalize_version(tag: &str) -> String {
    tag.trim_start_matches('v').to_string()
}


pub async fn update_whatsapp_engine(app: &AppHandle) -> Result<(), String> {
    let app_data = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let engine_dir = app_data.join("whatsapp");
    // print engine dir 
    println!("Engine directory: {:?}", engine_dir);
    let zip_path = app_data.join("whatsapp-engine.zip");

    // 1️⃣ Fetch latest from GitHub
    let (remote_tag, download_url) = fetch_latest_release().await?;
    let remote_version = normalize_version(&remote_tag);

    // 2️⃣ Read local version (if exists)
    let local_version = read_local_version(&engine_dir);

    // 3️⃣ Compare
    if let Some(local) = local_version {
        if local == remote_version {
            println!("WhatsApp engine already up to date (v{})", local);
            return Ok(());
        }

        println!(
            "Updating WhatsApp engine {} → {}",
            local, remote_version
        );
    } else {
        println!("No local engine found, installing v{}", remote_version);
    }

    // 4️⃣ Download
    println!("Downloading WhatsApp engine...");
    download_zip(&download_url, &zip_path).await?;

    // 5️⃣ Extract
    println!("Extracting WhatsApp engine...");
    extract_zip(&zip_path, &engine_dir)?;

    // 6️⃣ Cleanup
    std::fs::remove_file(zip_path).ok();

    println!("WhatsApp engine updated to v{}", remote_version);
    Ok(())
}
