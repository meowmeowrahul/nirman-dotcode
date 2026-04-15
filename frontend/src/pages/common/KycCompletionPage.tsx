import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function KycCompletionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          Please upload your identity documents to complete your KYC
          verification.
        </p>

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
            Government ID Number
          </label>
          <input
            required
            type="text"
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid #D1D5DB",
              borderRadius: "6px",
              fontSize: "14px",
            }}
            placeholder="Enter ID number"
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
            Upload Document Image
          </label>
          <input
            required
            type="file"
            accept="image/*,.pdf"
            style={{ fontSize: "14px" }}
          />
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
