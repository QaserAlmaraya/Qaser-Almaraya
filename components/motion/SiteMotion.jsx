'use client';
// Mount point for the public-site motion layer (page transitions, parallax).
// It renders nothing by itself; each effect lives in its own file beside it.
import PageTransition from './PageTransition';
import Parallax from './Parallax';

export default function SiteMotion() {
  return (
    <>
      <PageTransition />
      <Parallax />
    </>
  );
}
