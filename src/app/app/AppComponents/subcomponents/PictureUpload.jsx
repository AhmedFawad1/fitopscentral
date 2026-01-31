"use client";
import React from "react";

export function PictureUpload({ gender, imageUrl, onImageChange, isTauri }) {
  const fileInputRef = React.useRef(null);
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [videoReady, setVideoReady] = React.useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
    setVideoReady(false);
  };

  const startCamera = async () => {
    // Fallback if camera is not available (desktop without camera, http, etc.)
    if(!isTauri) return
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // change to "environment" for back camera on mobile
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      // Wait for video metadata so width/height are available
      requestAnimationFrame(() => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.playsInline = true;
          video.muted = true;

          video.onloadedmetadata = () => {
            video.play().then(() => setVideoReady(true)).catch((err) => {
              console.error("Video play error:", err);
            });
          };
        }
      });
    } catch (err) {
      console.error("Error accessing camera:", err);
      // Permission denied or other error → fallback to file picker
      fileInputRef.current?.click();
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;

    // Ensure video has a frame
    if (video.readyState < 2) {
      console.warn("Video not ready yet");
      return;
    }

    let width = video.videoWidth;
    let height = video.videoHeight;

    if (!width || !height) {
      // safety fallback – but if this hits often, you are capturing too early
      width = 320;
      height = 320;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Could not get canvas context");
      return;
    }

    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // <- store this in DB
    if (onImageChange) {
      onImageChange(dataUrl);
    }

    stopCamera();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (onImageChange) {
        onImageChange(reader.result); // base64 data URL again
      }
    };
    reader.readAsDataURL(file);
  };

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Avatar / Preview */}
      <div
        className="w-32 h-32 border border-gray-300 rounded-full overflow-hidden mb-2"
        onClick={startCamera}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Uploaded"
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={`/images/${gender}-avatar.jpg`}
            alt="Default avatar"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Hidden file input (fallback or manual upload) */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageChange}
        style={{ opacity: 0, position: "absolute", pointerEvents: "none" }}
      />

      {
        isTauri &&
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="mt-1 text-xs text-blue-600 underline"
        >
          Upload from device instead
        </button>
      }

      {/* Camera overlay */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[var(--background)] rounded-xl p-4 flex flex-col items-center gap-3 shadow-lg">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-64 h-64 bg-black rounded-lg object-cover"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCapture}
                disabled={!videoReady}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  videoReady
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                {videoReady ? "Capture" : "Loading camera…"}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
