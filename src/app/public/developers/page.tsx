// Developers page
import { PublicLayout } from '@/components/layouts/public-layout';
import { Developers } from '@/features/developers';

export const metadata = {
  title: 'Developers',
  description: 'Contributors and development team',
};

export default function DevelopersPage() {
  return (
    <PublicLayout showNavLinks={false}>
      <Developers />
    </PublicLayout>
  );
}