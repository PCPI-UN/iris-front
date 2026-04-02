import { PublicLayout } from '@/components/layouts/public-layout';
import { Developers } from '@/features/developers';

export const metadata = {

  description: 'Contributors and development team',
};

export default function ContributorsPage() {
  return (
    <PublicLayout showNavLinks={true}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="parallax-slow absolute top-0 left-0 w-[150%] h-[150%]"
          style={{
            background: `
              radial-gradient(circle at 20% 20%, oklch(0.75 0.15 195 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, oklch(0.82 0.18 330 / 0.15) 0%, transparent 50%),
              radial-gradient(circle at 50% 50%, oklch(0.88 0.16 85 / 0.1) 0%, transparent 50%)
            `,
          }}
        />

        <div
          className="absolute top-24 right-[10%] w-32 h-32 md:w-44 md:h-44 rounded-2xl opacity-20"
          style={{
            background: 'linear-gradient(135deg, oklch(0.75 0.15 195 / 0.45), oklch(0.82 0.18 330 / 0.35))',
            transform: 'rotate(24deg)',
            boxShadow: '0 20px 60px oklch(0.82 0.18 330 / 0.2)',
          }}
        />

        <div
          className="absolute bottom-24 left-[8%] w-24 h-24 md:w-36 md:h-36 opacity-20"
          style={{
            background: 'linear-gradient(120deg, oklch(0.88 0.16 85 / 0.42), oklch(0.75 0.15 195 / 0.25))',
            clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            filter: 'drop-shadow(0 12px 30px oklch(0.88 0.16 85 / 0.25))',
          }}
        />

        <div
          className="absolute top-[38%] left-[16%] w-12 h-12 md:w-16 md:h-16 rounded-full opacity-25 animate-pulse"
          style={{
            background: 'radial-gradient(circle at 30% 30%, oklch(0.82 0.18 330 / 0.45), oklch(0.82 0.18 330 / 0.12))',
            boxShadow: '0 0 28px oklch(0.82 0.18 330 / 0.25)',
          }}
        />

        <div
          className="absolute top-[65%] right-[18%] w-20 h-20 md:w-24 md:h-24 opacity-20"
          style={{
            border: '1.5px solid oklch(0.75 0.15 195 / 0.55)',
            transform: 'rotate(45deg)',
            boxShadow: '0 0 24px oklch(0.75 0.15 195 / 0.18)',
          }}
        />
      </div>

      <Developers />
    </PublicLayout>
  );
}
