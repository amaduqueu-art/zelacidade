/**
 * ZelaCidade — configuração do Next.js para Cloudflare Pages.
 *
 * Estratégia de deploy: STATIC EXPORT (`output: 'export'`).
 * O Cloudflare Pages serve a pasta `out/` diretamente, sem adapter e sem
 * servidor Node. Toda a lógica de dados roda no browser via Supabase JS,
 * e a segurança é garantida pelas políticas de RLS no PostgreSQL.
 *
 * Build no Cloudflare Pages:
 *   - Comando de build: `npm run build`
 *   - Diretório de saída: `out`
 *   - Variáveis: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Gera HTML/CSS/JS estáticos em `out/` — compatível com Cloudflare Pages.
  output: 'export',

  // O otimizador de imagens do Next precisa de servidor; no static export
  // usamos as URLs públicas do Supabase Storage diretamente.
  images: {
    unoptimized: true,
  },

  // Gera /relatar/index.html em vez de /relatar.html. Evita 404 ao acessar
  // rotas com barra final e melhora o cache no CDN da Cloudflare.
  trailingSlash: true,

  reactStrictMode: true,

  // Não expõe o header "X-Powered-By: Next.js".
  poweredByHeader: false,

  eslint: {
    ignoreDuringBuilds: false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
