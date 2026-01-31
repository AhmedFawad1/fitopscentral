use serialport::{SerialPort, SerialPortType};
use std::time::Duration;

#[tauri::command]
pub fn send_to_arduino() -> Result<String, String> {
    let ports = serialport::available_ports()
        .map_err(|e| format!("Port list error: {}", e))?;

    // --------------------------
    // Known Arduino VID/PID pairs
    // --------------------------
    const ARDUINO_IDS: &[(u16, u16)] = &[
        (0x2341, 0x0043), // Arduino Uno (genuine)
        (0x2341, 0x0001), // Arduino Uno Rev1
        (0x2341, 0x0010), // Arduino Mega
        (0x2A03, 0x0043), // Arduino Uno (new manufacturer)
        (0x1A86, 0x7523), // CH340 USB-SERIAL (common clones)
        (0x10C4, 0xEA60), // CP2102 USB-UART
    ];

    // --------------------------------------------------------
    // STEP 1: Find a USB port that matches a known Arduino VID
    // --------------------------------------------------------
    let arduino_port = ports.into_iter().find(|p| {
        if let SerialPortType::UsbPort(info) = &p.port_type {
            ARDUINO_IDS.iter().any(|(vid, pid)| *vid == info.vid && *pid == info.pid)
        } else {
            false
        }
    });

    let port_info = match arduino_port {
        Some(p) => p,
        None => return Err("❌ No Arduino detected on any serial port".into()),
    };

    let port_name = port_info.port_name.clone();
    println!("✅ Arduino detected on: {}", port_name);

    // --------------------------------------------------------
    // STEP 2: Open the serial port
    // --------------------------------------------------------
    let mut port = serialport::new(&port_name, 9600)
        .timeout(Duration::from_millis(300))
        .open()
        .map_err(|e| format!("Failed to open {}: {}", port_name, e))?;

    // Arduino auto-reset delay after serial open
    std::thread::sleep(Duration::from_millis(250));

    // --------------------------------------------------------
    // STEP 3: Send "1"
    // --------------------------------------------------------
    port.write_all(b"1")
        .map_err(|e| format!("Write error: {}", e))?;

    println!("➡️ Sent '1' to Arduino");

    Ok(format!("Sent '1' to Arduino on {}", port_name))
}
