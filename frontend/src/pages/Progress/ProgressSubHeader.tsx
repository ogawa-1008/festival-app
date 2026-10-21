import { Link } from "react-router-dom";

import PageTitle from "../../components/PageTitle/PageTitle";

// 進捗の各ページの見出しと、進捗のトップへ戻るボタン
function ProgressSubHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="progress-sub-header">
      <div className="progress-sub-header-row">
        <Link className="progress-sub-back" to="/progress">
          <span className="progress-sub-back-icon" aria-hidden="true">←</span>
          進捗に戻る
        </Link>
      </div>
      <PageTitle eyebrow={eyebrow} title={title} />
    </div>
  );
}

export default ProgressSubHeader;
