'use client';

// Fold-away sections for the public route pages (package, visa, guide).
//
// Each item is a real button (aria-expanded + aria-controls) and a labelled
// region. The region stays in the document when it is closed, so the page's
// language dictionary still reaches its text and printing can open every item
// (see app/qs-routes.css, @media print). Closed regions are visibility:hidden,
// which keeps them out of the tab order and away from screen readers.
//
//   <Accordion>
//     <AccordionItem title="..." meta="5" defaultOpen>...</AccordionItem>
//   </Accordion>
import { useId, useState } from 'react';
import Icon from '../Icon';

export function Accordion({ children, className = '', ...rest }) {
  return <div className={('qr-acc ' + className).trim()} {...rest}>{children}</div>;
}

export function AccordionItem({ title, meta, icon, defaultOpen = false, noI18n = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId();
  const btnId = 'qr-acc-b-' + uid;
  const panelId = 'qr-acc-p-' + uid;
  return (
    <div className={'qr-acc-item' + (open ? ' is-open' : '')}>
      <h3 className="qr-acc-h">
        <button type="button" id={btnId} className="qr-acc-btn" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((o) => !o)}>
          {icon ? <span className="qr-acc-ico" aria-hidden="true"><Icon name={icon} size={18} /></span> : null}
          <span className="qr-acc-title" data-no-i18n={noI18n ? '' : undefined}>{title}</span>
          {meta !== undefined && meta !== null && meta !== '' ? <span className="qr-acc-meta" data-no-i18n="">{meta}</span> : null}
          <span className="qr-acc-chev" aria-hidden="true"><Icon name="chevron-down" size={18} /></span>
        </button>
      </h3>
      <div id={panelId} role="region" aria-labelledby={btnId} className="qr-acc-panel">
        <div className="qr-acc-clip">
          <div className="qr-acc-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Accordion;
