import type { Metadata, Viewport } from 'next';

import './globals.css';

import { BottomNav } from '@/components/bottom-nav';
import { ConfigNotice } from '@/components/config-notice';
import { Providers } from '@/components/providers';
import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';

export const metadata: Metadata = {
  title: {
    default: 'ZelaCidade — sua cidade, cuidada por todos',
    template: '%s · ZelaCidade',
  },
  description:
    'Relate problemas de iluminação, asfalto, acessibilidade e saneamento no seu bairro. Apoie os relatos da comunidade e acompanhe o status das soluções.',
  applicationName: 'ZelaCidade',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'ZelaCidade',
    title: 'ZelaCidade — sua cidade, cuidada por todos',
    description:
      'Um mural comunitário para relatar problemas urbanos, apoiar demandas e acompanhar soluções.',
  },
  twitter: {
    card: 'summary',
    title: 'ZelaCidade — sua cidade, cuidada por todos',
    description:
      'Relate problemas urbanos, apoie relatos do seu bairro e acompanhe as soluções.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#102a47',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <Providers>
          <SiteHeader />
          <ConfigNotice />
          <main
            id="conteudo"
            className="container flex-1 pb-28 pt-6 md:pb-16 md:pt-10"
          >
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
