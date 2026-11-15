'use client';
import Icon from '../Icon';
import { useCompareIds, toggleCompare } from './compareStore';

// The small «قارن» tick on a package card. It is passed to PackageCard through
// its `compareSlot` prop, so cards that are not given one stay as they were.
export default function CompareToggle({ id, title = '', lang = 'ar' }) {
  const on = useCompareIds().includes(String(id));
  const en = lang === 'en';
  const name = String(title || '').trim();
  const label = on
    ? (en ? 'Remove from comparison' : 'إزالة من المقارنة')
    : (en ? 'Add to comparison' : 'إضافة إلى المقارنة');
  return (
    <button
      type="button"
      className={'qc-pick' + (on ? ' on' : '')}
      aria-pressed={on}
      aria-label={name ? `${label}: ${name}` : label}
      data-no-i18n=""
      onClick={() => toggleCompare(id)}
    >
      <span className="qc-pick-box" aria-hidden="true">{on ? <Icon name="check" size={12} strokeWidth={3} /> : null}</span>
      <span>{en ? 'Compare' : 'قارن'}</span>
    </button>
  );
}
