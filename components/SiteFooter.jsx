import Link from 'next/link';
import Icon from './Icon';
import PaymentBadges from './PaymentBadges';

// Footer of the pages that have their own route file (/packages, /visa, /guide,
// /news, 404). It uses the same markup and classes (app/qs-inner.css, `qi-foot`)
// as the footer inside components/Site.jsx, so the site has one footer.
// The pages that exist only inside Site.jsx (about, insurance, groups, terms,
// privacy) have no URL of their own, so they are not listed here.
export default function SiteFooter() {
  return (
    <footer className="qi-foot">
      <div className="qi-foot-grid">
        <div className="qi-foot-brand">
          <span className="qi-foot-logo"><img src="/assets/logo-mark-tight.webp" alt="قصر المرايا" /></span>
          <p className="qi-foot-tag">رحلتك تبدأ معنا</p>
          <p className="qi-foot-sub">نأخذك إلى حيث تتمنى، لنصنع ذكريات لا تُنسى.</p>
        </div>
        <div className="qi-foot-col">
          <h4>خدماتنا</h4>
          <Link href="/flights">حجوزات الطيران</Link>
          <Link href="/flights">حجوزات الفنادق</Link>
          <Link href="/flights">عروض السفر</Link>
        </div>
        <div className="qi-foot-col">
          <h4>عن الشركة</h4>
          <Link href="/jobs">التوظيف</Link>
          <a href="/assets/qaser-almaraya-company-profile-2026.pdf" target="_blank" rel="noopener">ملف تعريفي</a>
        </div>
        <div className="qi-foot-col">
          <h4>مركز المعلومات</h4>
          <Link href="/news">المدونة</Link>
          <Link href="/news?category=tips">نصائح السفر</Link>
          <Link href="/faq">الأسئلة الشائعة</Link>
        </div>
        <div className="qi-foot-col">
          <h4>للتواصل</h4>
          <a href="tel:009647749999600" dir="ltr">00964-774-9999-600</a>
          <a href="tel:009647849999600" dir="ltr">00964-784-9999-600</a>
          <a href="mailto:sales@almarayagroup.com">sales@almarayagroup.com</a>
          <span>العراق: شارع 14 رمضان، بغداد</span>
          <span>أوقات الدوام: يومياً من 9 صباحاً حتى 12 منتصف الليل</span>
        </div>
      </div>
      <div className="qi-foot-row">
        <div className="qi-foot-social">
          <h4>تابعنا</h4>
          <div>
            <a href="https://www.instagram.com/qaseralmaraya/?hl=ar" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram"><Icon name="instagram" size="19" /></a>
            <a href="https://www.linkedin.com/company/qaseralmaraya" target="_blank" rel="noopener" aria-label="LinkedIn" title="LinkedIn">in</a>
            <a href="https://www.facebook.com/p/%D8%B4%D8%B1%D9%83%D8%A9-%D9%82%D8%B5%D8%B1-%D8%A7%D9%84%D9%85%D8%B1%D8%A7%D9%8A%D8%A7-%D9%84%D9%84%D8%B3%D9%81%D8%B1-%D9%88%D8%A7%D9%84%D8%B3%D9%8A%D8%A7%D8%AD%D8%A9-61567289284263/?locale=ar_AR" target="_blank" rel="noopener" aria-label="Facebook" title="Facebook">f</a>
          </div>
        </div>
        <PaymentBadges />
      </div>
      <div className="qi-foot-bar">
        <div>
          <span>© 2026 قصر المرايا للسفر و السياحة — رقم الإجازة 784 — جميع الحقوق محفوظة</span>
        </div>
      </div>
    </footer>
  );
}
