// Web app manifest (served by Next at /manifest.webmanifest and linked automatically).
// Lets phones "add to home screen" and open the public site like an app.
// Icons are built by scripts/make-pwa-icons.mjs.
export default function manifest() {
  return {
    id: '/',
    name: 'قصر المرايا للسفر والسياحة',
    short_name: 'قصر المرايا',
    description: 'حجوزات الطيران، الفنادق، والبرامج السياحية — رحلتك تبدأ معنا.',
    lang: 'ar',
    dir: 'rtl',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#049dc5',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'الباقات', short_name: 'الباقات', url: '/packages', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'التأشيرات', short_name: 'التأشيرات', url: '/visa', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
      { name: 'الطيران', short_name: 'الطيران', url: '/flights', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
    ],
  };
}
