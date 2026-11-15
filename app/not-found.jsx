import Link from 'next/link';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { waLink } from '../lib/whatsapp';
import CtaButton from '../components/CtaButton';

export const metadata = { title: 'الصفحة غير موجودة | قصر المرايا للسفر والسياحة', robots: { index: false } };

// Arabic "page not found" with the main ways forward, instead of the English default.
export default function NotFound() {
  return (
    <>
      <SiteHeader active="" />
      <main className="qa-sec" style={{ minHeight: '55vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/mascot-skylo-questions-cut.webp" alt="" width="220" height="191" style={{ width: 220, height: 'auto' }} />
        <h1 style={{ fontSize: 32, fontWeight: 600 }}>عذراً، هذه الصفحة غير موجودة</h1>
        <p style={{ fontSize: 17, color: 'var(--qs-body,#3d4650)', maxWidth: 520, lineHeight: 1.7 }}>ربما تغيّر الرابط أو انتهت هذه الباقة. اختر من الأقسام التالية أو تواصل معنا مباشرة.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
          <CtaButton href="/packages" label="الباقات" />
          <Link href="/visa" className="qa-btn" style={{ background: '#fff', color: 'var(--qs-ink,#1d2733)', border: '1px solid var(--qs-line-2,#cacbcc)' }}>التأشيرات</Link>
          <Link href="/" className="qa-btn" style={{ background: '#fff', color: 'var(--qs-ink,#1d2733)', border: '1px solid var(--qs-line-2,#cacbcc)' }}>الرئيسية</Link>
          <a href={waLink('مرحباً قصر المرايا، أحتاج مساعدة.')} target="_blank" rel="noopener" className="qa-btn" style={{ background: '#fff', color: 'var(--qs-ink,#1d2733)', border: '1px solid var(--qs-line-2,#cacbcc)' }}>واتساب</a>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
