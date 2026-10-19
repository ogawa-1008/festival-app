import "./FestivalDesign.css";

export default function PatternBackground({ loading = false }: { loading?: boolean }) {
  return (
    <div className={`festival-background${loading ? " festival-background--loading" : ""}`} aria-hidden="true">
      <div className="festival-background-image">
        <img src="/images/campus/background.png" alt="" />
      </div>
    </div>
  );
}
