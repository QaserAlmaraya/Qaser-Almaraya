'use client';
import Icon from '../Icon';

// One folded block: a native <details>, so it works without JavaScript, is
// announced correctly by screen readers and opens with the keyboard. The row
// (icon, title, one line of explanation, chevron) is the summary; the body is
// whatever the page passes in. Open/close motion lives in app/qs-home.css and
// is switched off for people who ask for reduced motion.
export default function HomeFold({ icon, title, note, open = false, id, children }) {
  return (
    <details className="qs-fold" open={open || undefined} id={id}>
      <summary className="qs-fold-sum">
        {icon ? <span className="qs-fold-icon"><Icon name={icon} size={22} strokeWidth={1.6} /></span> : null}
        <span className="qs-fold-text">
          <strong>{title}</strong>
          {note ? <span>{note}</span> : null}
        </span>
        <Icon name="chevron-down" size={20} strokeWidth={1.8} className="qs-fold-chev" />
      </summary>
      <div className="qs-fold-body">{children}</div>
    </details>
  );
}
