import "./CollaborationLogo.css";

function CollaborationLogo() {
  return (
    <div className="collaboration-logo">

      {/* VANTAN */}
      <img
        src="/images/logo/11D1E35C-2582-4E8A-ACF6-3A426DB80FC0_4_5005_c.jpeg"
        alt="VANTAN"
        className="vantan-logo"
      />

      {/* × */}
      <span className="collaboration-cross">
        ×
      </span>

      {/* MONSTER HUNTER */}
      <img
        src="/images/logo/monster-hunter-logo-transparent-cropped.png"
        alt="MONSTER HUNTER"
        className="monster-hunter-logo"
      />

    </div>
  );
}

export default CollaborationLogo;