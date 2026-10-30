import BottomNavigation from "../../components/Navigation/BottomNavigation";
import FieldCollection from "../../components/FieldCollection/FieldCollection";
import ProgressSubHeader from "./ProgressSubHeader";

import "./Progress.css";

// 進捗：スタンプを集める（スタンプの集計とフィールドごとの詳細）
function ProgressFields() {
  return (
    <main className="progress-page">
      <div className="progress-content">
        <ProgressSubHeader eyebrow="STAMP" title="スタンプを集める" />
        <FieldCollection />
      </div>

      <BottomNavigation active="progress" />
    </main>
  );
}

export default ProgressFields;
