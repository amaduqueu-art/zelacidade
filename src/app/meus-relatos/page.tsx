import type { Metadata } from 'next';

import { MyReports } from '@/components/my-reports';

export const metadata: Metadata = {
  title: 'Meus relatos',
  description:
    'Acompanhe os problemas que você registrou e o apoio recebido da comunidade.',
};

export default function MyReportsPage() {
  return <MyReports />;
}
