import "./CollaborationLogo.css";

// 公式のコラボロゴ（MONSTER HUNTER × VANTAN を1枚にしたもの）
function CollaborationLogo() {
  return (
    <div className="collaboration-logo">
      <img
        src="/images/logo/collaboration-logo.webp"
        alt="MONSTER HUNTER × VANTAN"
        className="collaboration-logo-image"
      />
    </div>
  );
}

export default CollaborationLogo;
