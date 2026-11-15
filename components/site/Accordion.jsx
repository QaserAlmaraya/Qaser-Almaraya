'use client';

// One accordion for the inner pages (FAQ, legal text, booking notes, job details).
// Each item is a real button (aria-expanded + aria-controls) and a labelled region.
// The panel stays in the DOM while closed, so the page's Arabic -> English DOM
// dictionary still reaches its text; it is taken out of the tab order and the
// accessibility tree with `inert` + visibility. Height animates with the
// grid-rows 0fr -> 1fr trick (styles in app/qs-inner.css, off under reduced motion).
import { useId, useState } from 'react';
import Icon from '../Icon';

export function Accordion({ children, className = '', ...rest }) {
  return <div className={('qi-acc ' + className).trim()} {...rest}>{children}</div>;
}

export function AccordionItem({ title, n, defaultOpen = false, as: Heading = 'h3', children }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const btnId = id + 'b';
  const panelId = id + 'p';
  return (
    <div className="qi-acc-item" data-open={open ? 'true' : 'false'}>
      <Heading className="qi-acc-head">
        <button
          type="button"
          id={btnId}
          className="qi-acc-btn"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          {n != null ? <span className="qi-acc-n" aria-hidden="true" data-no-i18n="">{n}</span> : null}
          <span className="qi-acc-title">{title}</span>
          <Icon name="chevron-down" size={18} className="qi-acc-chev" aria-hidden="true" />
        </button>
      </Heading>
      <div id={panelId} role="region" aria-labelledby={btnId} className="qi-acc-panel" inert={open ? undefined : true}>
        <div className="qi-acc-clip">
          <div className="qi-acc-body">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default Accordion;
