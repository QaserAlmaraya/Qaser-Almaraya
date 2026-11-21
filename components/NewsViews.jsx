'use client';
import Icon from './Icon';
import { useState } from 'react';
import Link from 'next/link';
import SiteHeader from './SiteHeader';
import SiteFooter from './SiteFooter';
import NewsBody, { NEWS_BODY_CSS } from './NewsBody';
import { useLangToggle } from '../lib/i18n';
import { waLink } from '../lib/whatsapp';
import { optimized } from '../lib/img';

const CATS = {
  news: { ar: 'أخبار الشركة', en: 'Company news' },
  tips: { ar: 'نصائح السفر', en: 'Travel tips' },
  visas: { ar: 'تأشيرات', en: 'Visas' },
  offers: { ar: 'عروض ورحلات', en: 'Offers & trips' },
  events: { ar: 'فعاليات ومعارض', en: 'Events & expos' },
  alert: { ar: 'تنبيه للمسافرين', en: 'Travel alerts' },
};

const pick = (en, a, b) => (en && b ? b : a || b || '');
const fmtDate = (d, en) => {
  try { return new Date(d).toLocaleDateString(en ? 'en-GB' : 'ar-IQ-u-nu-latn', { day: 'numeric', month: 'long', year: 'numeric' }); } catch { return ''; }
};

const CSS = `
.qn-hero{background:var(--tw-band-deep,#049dc5);color:#fff;position:relative;overflow:hidden}
.qn-hero-in{max-width:1240px;margin:0 auto;padding:48px 32px 40px;position:relative;display:flex;flex-direction:column;gap:12px}
.qn-kick{font-size:13px;font-weight:500;color:rgba(255,255,255,.92)}
.qn-hero h1{margin:0;font-size:clamp(26px,3.6vw,32px);line-height:1.15;color:#fff}
.qn-hero p{margin:0;max-width:640px;font-size:17px;line-height:1.8;color:rgba(255,255,255,.92)}
.qn-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}
.qn-chip{padding:8px 16px;border-radius:999px;font-size:13px;font-weight:600;text-decoration:none;color:#fff;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.3)}
.qn-chip.on{background:#fff;color:#049dc5}
.qn-wrap{max-width:1240px;margin:0 auto;padding:32px 32px 72px}
.qn-feat{display:grid;grid-template-columns:1.25fr 1fr;border-radius:var(--tw-radius,16px);overflow:hidden;background:var(--qd-surface,#fff);border:1px solid var(--qd-line,#ececed);text-decoration:none;color:inherit;margin-bottom:24px}
.qn-feat .img{min-height:320px;background:var(--qd-soft,#dff3fa) center/cover}
.qn-feat .txt{padding:32px;display:flex;flex-direction:column;gap:12px;justify-content:center}
.qn-feat h2{margin:0;font-size:26px;line-height:1.3}
.qn-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px}
.qn-card{display:flex;flex-direction:column;border-radius:var(--tw-radius,16px);overflow:hidden;background:var(--qd-surface,#fff);border:1px solid var(--qd-line,#ececed);text-decoration:none;color:inherit}
.qn-card .img{aspect-ratio:16/9;background:var(--qd-soft,#dff3fa) center/cover}
.qn-card .txt{padding:16px 20px 20px;display:flex;flex-direction:column;gap:8px;flex:1}
.qn-card h3{margin:0;font-size:20px;line-height:1.4}
.qn-ex{margin:0;font-size:15px;line-height:1.75;color:var(--qd-ink2,#5b646d);display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.qn-meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;color:var(--qd-ink2,#5f666e)}
.qn-more{margin-top:auto;font-size:15px;font-weight:600;color:var(--qd-cyan,#049dc5)}
.qn-empty{text-align:center;padding:60px 20px;color:var(--qd-ink2,#5f666e);display:flex;flex-direction:column;align-items:center;gap:10px}
.qn-art-hero{position:relative;min-height:380px;display:flex;align-items:flex-end;background:var(--tw-band-deep,#049dc5) center/cover;color:#fff}
.qn-art-hero.has-cover:before{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(2,30,40,.88),rgba(2,30,40,.25) 60%,rgba(2,30,40,.1))}
.qn-art-hero .in{position:relative;max-width:860px;width:100%;margin:0 auto;padding:40px 24px 32px;display:flex;flex-direction:column;gap:12px}
.qn-art-hero h1{margin:0;font-size:clamp(26px,3.6vw,32px);line-height:1.25;color:#fff}
.qn-art-hero .qn-meta{color:rgba(255,255,255,.85)}
.qn-art{max-width:760px;margin:0 auto;padding:32px 24px 20px}
.qn-lead{font-size:20px;line-height:1.85;color:var(--qd-body,#3d4650);margin:0 0 24px;font-weight:500}
.qn-share{display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--qd-line,#ececed);padding-top:16px;margin-top:12px;font-size:15px;color:var(--qd-ink2,#5f666e)}
.qn-share a,.qn-share button{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:8px 14px;font-weight:600;font-size:13px;text-decoration:none;cursor:pointer;font-family:inherit;border:1px solid var(--qd-line,#ececed);background:var(--qd-surface,#fff);color:var(--qd-ink,#1d2733)}
.qn-share .wa{background:#25d366;border-color:#25d366;color:#fff}
.qn-cta{margin:32px 0 0;border-radius:var(--tw-radius,16px);padding:24px;background:var(--qs-brand-soft,#eaf8fd);display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.qn-cta b{font-size:17px}
.qn-rel{max-width:1240px;margin:0 auto;padding:8px 32px 72px}
.qn-rel h2{font-size:26px;margin:0 0 16px}
@media(max-width:820px){.qn-feat{grid-template-columns:1fr}.qn-feat .img{min-height:210px}.qn-hero-in,.qn-wrap,.qn-rel{padding-inline:16px}.qn-art-hero{min-height:300px}}
${NEWS_BODY_CSS}
`;

function Card({ p, en }) {
  const cat = CATS[p.category] || CATS.news;
  return (
    <Link href={'/news/' + encodeURIComponent(p.slug)} className="qn-card">
      <div className="img" style={{ backgroundImage: p.cover_url ? `url("${optimized(p.cover_url, 828)}")` : 'var(--tw-band-deep,#049dc5)' }} />
      <div className="txt">
        <div className="qn-meta"><span className={'qn-cat' + (p.category === 'alert' ? ' is-alert' : '')}>{en ? cat.en : cat.ar}</span><span>{fmtDate(p.published_at, en)}</span><span>· {p.minutes} {en ? 'min read' : 'دقائق قراءة'}</span></div>
        <h3>{pick(en, p.title_ar, p.title_en)}</h3>
        <p className="qn-ex">{pick(en, p.excerpt_ar, p.excerpt_en)}</p>
        <span className="qn-more">{en ? 'Read more →' : 'اقرأ المزيد ←'}</span>
      </div>
    </Link>
  );
}

export function NewsIndexView({ posts, category }) {
  const { lang } = useLangToggle();
  const en = lang === 'en';
  const [first, ...rest] = posts;
  return (
    <div dir={en ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--qs-paper,#f6f8f9)' }}>
      <style>{CSS}</style>
      <SiteHeader active="المدونة" />
      <main style={{ flex: 1 }} data-no-i18n="">
        <section className="qn-hero">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/logo-mark-white.webp" alt="" style={{ position: 'absolute', insetInlineEnd: -90, top: -70, height: 340, opacity: 0.1 }} />
          <div className="qn-hero-in">
            <span className="qn-kick">{en ? 'BLOG & NEWS' : 'المدونة'}</span>
            <h1>{en ? 'News, tips and stories from the road' : 'أخبار ونصائح وقصص من عالم السفر'}</h1>
            <p>{en ? 'The latest from Qaser Almaraya: visa updates, travel tips, new trips and where we have been.' : 'آخر أخبار قصر المرايا: تحديثات التأشيرات، نصائح السفر، رحلات جديدة، ومشاركاتنا في المعارض.'}</p>
            <div className="qn-chips">
              <Link href="/news" className={'qn-chip' + (!category ? ' on' : '')}>{en ? 'All' : 'الكل'}</Link>
              {Object.entries(CATS).map(([id, c]) => (
                <Link key={id} href={'/news?category=' + id} className={'qn-chip' + (category === id ? ' on' : '')}>{en ? c.en : c.ar}</Link>
              ))}
            </div>
          </div>
        </section>
        <div className="qn-wrap">
          {!posts.length && (
            <div className="qn-empty">
              <Icon name="newspaper" size={44} strokeWidth={1.4} style={{ color: 'var(--qs-brand-deep,#049dc5)' }} />
              <b style={{ fontSize: 17, color: 'var(--qs-ink,#1d2733)' }}>{en ? 'No posts here yet' : 'لا توجد مقالات هنا بعد'}</b>
              <span>{en ? 'Check back soon.' : 'تابعنا قريباً.'}</span>
            </div>
          )}
          {first && (
            <Link href={'/news/' + encodeURIComponent(first.slug)} className="qn-feat">
              <div className="img" style={{ backgroundImage: first.cover_url ? `url("${optimized(first.cover_url, 1080)}")` : 'var(--tw-band-deep,#049dc5)' }} />
              <div className="txt">
                <div className="qn-meta"><span className={'qn-cat' + (first.category === 'alert' ? ' is-alert' : '')}>{en ? (CATS[first.category] || CATS.news).en : (CATS[first.category] || CATS.news).ar}</span><span>{fmtDate(first.published_at, en)}</span><span>· {first.minutes} {en ? 'min read' : 'دقائق قراءة'}</span></div>
                <h2>{pick(en, first.title_ar, first.title_en)}</h2>
                <p className="qn-ex" style={{ WebkitLineClamp: 4, fontSize: 17 }}>{pick(en, first.excerpt_ar, first.excerpt_en)}</p>
                <span className="qn-more">{en ? 'Read the article →' : 'اقرأ المقال ←'}</span>
              </div>
            </Link>
          )}
          {rest.length > 0 && <div className="qn-grid">{rest.map((p) => <Card key={p.id} p={p} en={en} />)}</div>}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function NewsArticleView({ post, related }) {
  const { lang } = useLangToggle();
  const en = lang === 'en';
  const [copied, setCopied] = useState(false);
  const cat = CATS[post.category] || CATS.news;
  const title = pick(en, post.title_ar, post.title_en);
  const body = pick(en, post.body_ar, post.body_en);
  const lead = pick(en, post.excerpt_ar, post.excerpt_en);
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <div dir={en ? 'ltr' : 'rtl'} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--qd-surface,#fff)' }}>
      <style>{CSS}</style>
      <SiteHeader active="المدونة" />
      <main style={{ flex: 1 }} data-no-i18n="">
        <section className={post.cover_url ? 'qn-art-hero has-cover' : 'qn-art-hero'} style={{ backgroundImage: post.cover_url ? `url("${optimized(post.cover_url, 1920)}")` : undefined }}>
          <div className="in">
            <Link href="/news" style={{ color: 'rgba(255,255,255,.85)', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>{en ? '← All posts' : '← كل المقالات'}</Link>
            <div className="qn-meta"><span className={'qn-cat' + (post.category === 'alert' ? ' is-alert' : '')}>{en ? cat.en : cat.ar}</span><span>{fmtDate(post.published_at, en)}</span><span>· {post.minutes} {en ? 'min read' : 'دقائق قراءة'}</span></div>
            <h1>{title}</h1>
          </div>
        </section>
        <article className="qn-art">
          {lead && <p className="qn-lead">{lead}</p>}
          <NewsBody text={body} />
          <div className="qn-share">
            <span>{en ? 'Share:' : 'شارك المقال:'}</span>
            <a className="wa" href={'https://wa.me/?text=' + encodeURIComponent(title + '\n' + url)} target="_blank" rel="noopener">WhatsApp</a>
            <a href={'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url)} target="_blank" rel="noopener">Facebook</a>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? (en ? '✓ Copied' : '✓ تم النسخ') : (en ? 'Copy link' : 'نسخ الرابط')}</button>
          </div>
          <div className="qn-cta">
            <div><b>{en ? 'Planning a trip?' : 'تخطط لرحلة؟'}</b><div style={{ fontSize: 15, color: 'var(--qd-ink2,#5b646d)', marginTop: 4 }}>{en ? 'Our team handles visas, flights and packages for you.' : 'فريقنا يتولى التأشيرة والطيران والباقة نيابةً عنك.'}</div></div>
            <a href={waLink((en ? 'Hello, I read "' : 'مرحباً، قرأت مقال "') + title + (en ? '" and would like some help.' : '" وأرغب بالمساعدة.'))} target="_blank" rel="noopener" className="qa-btn" style={{ background: '#25d366', color: '#fff', textDecoration: 'none' }}>{en ? 'Message us on WhatsApp' : 'راسلنا على واتساب'}</a>
          </div>
        </article>
        {related.length > 0 && (
          <section className="qn-rel">
            <h2>{en ? 'More to read' : 'مقالات أخرى'}</h2>
            <div className="qn-grid">{related.map((p) => <Card key={p.id} p={p} en={en} />)}</div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
