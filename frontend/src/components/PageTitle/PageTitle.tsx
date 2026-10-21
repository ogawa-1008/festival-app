import "./PageTitle.css";

type PageTitleProps = {
  eyebrow: string;
  title: string;
};

// 画面上部の見出し（英字の小見出しと日本語の題名を、上下の線で挟む）
function PageTitle({ eyebrow, title }: PageTitleProps) {
  return (
    <header className="page-title">
      <span className="page-title-eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
    </header>
  );
}

export default PageTitle;
