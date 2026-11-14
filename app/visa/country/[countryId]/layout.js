import { pageMeta, seoCountry } from '../../../../lib/seo';
import { isVisaService } from '../../../../lib/visaKind';

export async function generateMetadata({ params }) {
  const { countryId } = await params;
  const c = await seoCountry(countryId);
  if (!c) return pageMeta({ title: 'التأشيرات', description: 'استخراج تأشيرات السفر للعراقيين.', path: '/visa', image: '/og/og-visa.jpg' });
  const svc = isVisaService(c);
  return pageMeta({
    title: svc ? c.name_ar : 'تأشيرة ' + c.name_ar,
    description: svc
      ? c.name_ar + ' للعراقيين' + (c.types.length ? ' (' + c.types.join('، ') + ')' : '') + ': المستندات المطلوبة ومدة الإنجاز والسعر. تواصل عبر واتساب أو الرقم المختصر 6393.'
      : 'تأشيرة ' + c.name_ar + ' للعراقيين' + (c.types.length ? ' (' + c.types.join('، ') + ')' : '') + ': المستندات المطلوبة ومدة الإصدار والسعر. قدّم عبر واتساب أو الرقم المختصر 6393.',
    path: '/visa/country/' + c.id,
    image: c.image || '/og/og-visa.jpg',
  });
}

export default function VisaCountryLayout({ children }) { return children; }
