import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export function KycCompletionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setSelfieImage(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      setCameraError(
        "Unable to access camera. Please allow camera permission and try again.",
      );
      setIsCameraActive(false);
    }
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) {
      setCameraError("Failed to capture selfie. Please try again.");
      return;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setSelfieImage(imageData);
    stopCamera();
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!aadharFile || !panFile || !selfieImage) {
      setFormError(
        "Aadhar upload, PAN upload, and live selfie capture are required.",
      );
      return;
    }

    setLoading(true);
    // Simulate KYC submission
    setTimeout(() => {
      setLoading(false);
      navigate("/profile");
    }, 1000);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "24px" }}
      >
        Complete Your KYC
      </h1>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ color: "#4B5563", marginBottom: "24px", fontSize: "14px" }}>
          Upload required documents and capture a live selfie to complete your
          KYC verification.
        </p>

        {formError && (
          <p
            style={{ color: "#B91C1C", marginBottom: "16px", fontSize: "14px" }}
          >
            {formError}
          </p>
        )}

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Aadhar Upload
          </label>
          <input
            required
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setAadharFile(selected);
            }}
            style={{ fontSize: "14px" }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            PAN Upload
          </label>
          <input
            required
            type="file"
            accept="image/*,.pdf"
            onChange={(event) => {
              const selected = event.target.files?.[0] ?? null;
              setPanFile(selected);
            }}
            style={{ fontSize: "14px" }}
          />
        </div>

        <div style={{ marginBottom: "24px" }}>
          <label
            style={{
              display: "block",
              fontSize: "14px",
              fontWeight: "500",
              color: "#374151",
              marginBottom: "8px",
            }}
          >
            Selfie (Live Camera Only)
          </label>

          {!selfieImage && (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                marginBottom: "8px",
                minHeight: "220px",
                backgroundColor: "#111827",
              }}
            />
          )}

          {selfieImage && (
            <img
              src={selfieImage}
              alt="Captured selfie"
              style={{
                width: "100%",
                border: "1px solid #D1D5DB",
                borderRadius: "6px",
                marginBottom: "8px",
              }}
            />
          )}

          <canvas ref={canvasRef} style={{ display: "none" }} />

          {cameraError && (
            <p
              style={{
                color: "#B91C1C",
                marginBottom: "8px",
                fontSize: "14px",
              }}
            >
              {cameraError}
            </p>
          )}

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={startCamera}
              style={{
                padding: "8px 12px",
                backgroundColor: "#2563EB",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {isCameraActive ? "Restart Camera" : "Start Camera"}
            </button>

            <button
              type="button"
              onClick={captureSelfie}
              disabled={!isCameraActive}
              style={{
                padding: "8px 12px",
                backgroundColor: "#059669",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: isCameraActive ? "pointer" : "not-allowed",
                fontWeight: "500",
                opacity: isCameraActive ? 1 : 0.6,
              }}
            >
              Capture Selfie
            </button>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            borderTop: "1px solid #E5E7EB",
            paddingTop: "16px",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "8px 16px",
              backgroundColor: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Submitting..." : "Submit KYC"}
          </button>
        </div>
      </form>
    </div>
  );
}
