interface ActiveListingProps {
  isLoading: boolean;
}

export function ActiveListing({ isLoading }: ActiveListingProps) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #CBD5E1",
        borderRadius: 4,
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: 18,
          height: 18,
          border: "2px solid #1E3A8A",
          borderTopColor: "transparent",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
        }}
      />
      <p style={{ margin: 0, color: "#0F172A", fontWeight: 600 }}>
        {isLoading
          ? "Listing Active: Waiting for an emergency request near your location..."
          : "Listing Active: Waiting for an emergency request near your location..."}
      </p>
    </div>
  );
}
