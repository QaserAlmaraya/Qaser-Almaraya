import { pageMeta, seoVisaCard } from '../../../lib/seo';
import { isVisaService } from '../../../lib/visaKind';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const c = await seoVisaCard(id);
  if (!c) return pageMeta({ title: 'التأشيرات', description: 'استخراج تأشيرات السفر للعراقيين.', path: '/visa', image: '/og/og-visa.jpg' });
  const svc = isVisaService(c);
  const type = c.visa_type_name_ar || (svc ? '' : 'تأشيرة');
  const name = svc && type && type.trim() === (c.country_name_ar || '').trim()
    ? c.country_name_ar
    : [type, c.country_name_ar].filter(Boolean).join(' — ');
  const bits = [c.stay_duration && 'مدة الإقامة ' + c.stay_duration, c.issuing_time_days && 'مدة الإصدار ' + c.issuing_time_days].filter(Boolean).join('، ');
  return pageMeta({
    title: name,
    description: (svc ? '' : 'تأشيرة ') + (c.country_name_ar || '') + ' للعراقيين' + (bits ? ': ' + bits : '') + '. المستندات المطلوبة والسعر، وتواصل عبر واتساب أو الرقم المختصر 6393.',
    path: '/visa/' + c.id,
    image: c.card_image_url || c.image_url || '/og/og-visa.jpg',
  });
}

export default function VisaCardLayout({ children }) { return children; }
