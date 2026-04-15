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
    <div
      style={{
        padding: "32px 20px",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", color: "#111827" }}>
          Complete Your KYC
        </h1>
        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px" }}>
          Upload documents and capture a live selfie to submit verification.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: "white",
          border: "1px solid #E5E7EB",
          borderRadius: "14px",
          boxShadow: "0 14px 30px rgba(17,24,39,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid #E5E7EB",
            backgroundColor: "#F9FAFB",
          }}
        >
          <p style={{ color: "#4B5563", margin: 0, fontSize: "14px" }}>
            Required: Aadhar, PAN, and a live camera selfie.
          </p>
        </div>

        <div style={{ padding: "24px" }}>
          {formError && (
            <p
              style={{
                color: "#B91C1C",
                marginBottom: "16px",
                fontSize: "14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FCA5A5",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              {formError}
            </p>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "14px",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
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
                style={{ fontSize: "14px", width: "100%" }}
              />
            </div>

            <div
              style={{
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "14px",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "600",
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
                style={{ fontSize: "14px", width: "100%" }}
              />
            </div>
          </div>

          <div
            style={{
              border: "1px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "10px",
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
                  borderRadius: "10px",
                  marginBottom: "10px",
                  minHeight: "260px",
                  maxHeight: "380px",
                  objectFit: "cover",
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
                  borderRadius: "10px",
                  marginBottom: "10px",
                }}
              />
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {cameraError && (
              <p
                style={{
                  color: "#B91C1C",
                  marginBottom: "10px",
                  fontSize: "14px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FCA5A5",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                {cameraError}
              </p>
            )}

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={startCamera}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#2563EB",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 8px 16px rgba(37,99,235,0.25)",
                }}
              >
                {isCameraActive ? "Restart Camera" : "Start Camera"}
              </button>

              <button
                type="button"
                onClick={captureSelfie}
                disabled={!isCameraActive}
                style={{
                  padding: "10px 14px",
                  backgroundColor: "#059669",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isCameraActive ? "pointer" : "not-allowed",
                  fontWeight: "600",
                  opacity: isCameraActive ? 1 : 0.6,
                }}
              >
                Capture Selfie
              </button>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            borderTop: "1px solid #E5E7EB",
            padding: "16px 24px 20px",
            backgroundColor: "#F9FAFB",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/profile")}
            style={{
              padding: "10px 16px",
              backgroundColor: "white",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "10px 16px",
              backgroundColor: "#2563EB",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              opacity: loading ? 0.7 : 1,
              boxShadow: "0 8px 18px rgba(37,99,235,0.25)",
            }}
          >
            {loading ? "Submitting..." : "Submit KYC"}
          </button>
        </div>
      </form>
    </div>
  );
}
