import { PublicLayout } from '@/components/layouts/public-layout';
import { Developers } from '@/features/developers';
import { DevelopersBackground } from '@/features/developers/components/developers-background';
import { ScrollTopOnMount } from '@/features/developers/components/scroll-top-on-mount';
import { Footer } from '@/features/landing/components/cta-footer';

export const metadata = {
  title: {
    absolute: 'Iris',
  },
  description: 'Contributors and development team',
};

export default function DevelopersPage() {
  return (
    <PublicLayout showNavLinks={true}>
      <ScrollTopOnMount />
      <DevelopersBackground />

      <Developers />
      <Footer />
    </PublicLayout>
  );
}