export default function GlobalLoading() {
  return (
    <div
      className="bqt-screen"
      style={{ justifyContent: "center", alignItems: "center" }}
      aria-label="Loading"
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          border: "3px solid var(--parchment-300)",
          borderTopColor: "var(--saffron-500)",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
