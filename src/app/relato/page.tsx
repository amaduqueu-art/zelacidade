import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ReportDetail } from '@/components/report-detail';
import { DetailSkeleton } from '@/components/skeletons';

export const metadata: Metadata = {
  title: 'Detalhes do relato',
  description:
    'Veja os detalhes, apoie a demanda e acompanhe o status público do relato.',
};

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <ReportDetail />
    </Suspense>
  );
}
