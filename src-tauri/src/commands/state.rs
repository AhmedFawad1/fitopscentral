use tokio::net::TcpStream;
use tokio::sync::Mutex;

// --------------------------------------------------
// Persistent State for ZKTeco Service + TCP Client
// --------------------------------------------------
pub struct ZkProcessState {
    pub started: Mutex<bool>,                // prevents double service start
    pub stream: Mutex<Option<TcpStream>>,    // persistent TCP stream to C# bridge
}

impl ZkProcessState {
    pub fn new() -> Self {
        Self {
            started: Mutex::new(false),
            stream: Mutex::new(None),
        }
    }
}
