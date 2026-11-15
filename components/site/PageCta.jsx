// The closing band of an inner page: one sentence and the page's single primary
// action (a <CtaButton/> passed as `action`), with an optional quiet second link.
// Purely presentational; styles in app/qs-inner.css.
export default function PageCta({ title, children, action, secondary, media }) {
  return (
    <section className="qa-sec qi-cta-sec">
      <div className="qi-cta">
        {media ? <span className="qi-cta-media">{media}</span> : null}
        <div className="qi-cta-copy">
          {title ? <h2 className="qi-cta-title">{title}</h2> : null}
          {children ? <p className="qi-cta-text">{children}</p> : null}
        </div>
        <div className="qi-cta-actions">
          {action}
          {secondary}
        </div>
      </div>
    </section>
  );
}
