import type { Metadata } from 'next';

import { HowItWorks, HomeHero } from '@/components/home-hero';
import { ReportFeed } from '@/components/report-feed';

export const metadata: Metadata = {
  title: {
    absolute: 'Mural da cidade · ZelaCidade',
  },
  description:
    'Veja os relatos mais recentes e os mais apoiados pela comunidade. Apoie problemas de iluminação, asfalto, acessibilidade e saneamento no seu bairro.',
};

export default function HomePage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <HomeHero />
      <ReportFeed />
      <HowItWorks />
    </div>
  );
}
