/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // El hosting actual no sirve de forma fiable el optimizador de Next
        // (/_next/image): las imágenes remotas de Supabase aparecían rotas en
        // el panel (productos, categorías, carrusel, ventana emergente) y en la
        // tienda. Se sirven directamente desde Supabase, que ya guarda las
        // imágenes redimensionadas y en WebP al subirlas. Si se despliega en un
        // host con optimizador propio (p. ej. Vercel), poner esto en false.
        unoptimized: true,
        // Calidades usadas por la app (Next 16 exige declararlas).
        qualities: [70, 75],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    // Las redirecciones de Next ignoran mayúsculas, así que `/Acerca -> /acerca`
    // también capturaba `/acerca` y provocaba un bucle infinito. Las rutas
    // heredadas se resuelven en middleware.js con comparación exacta.
    async headers() {
        // CSP con nonce pendiente de migrar Analytics: AnalyticsConsent inyecta
        // un script inline (consentimiento + GTM) y @next/third-parties/google
        // inyecta otro, por lo que un CSP estricto con nonce rompería Google
        // Analytics. Hoy se usa 'unsafe-inline' de forma temporal en
        // script-src/style-src.
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // SAMEORIGIN (no DENY): el pie de página incrusta el PDF de la
                    // política de privacidad (/docs/...) en un iframe del propio sitio,
                    // y DENY también bloqueaba ese embebido del mismo origen.
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com",
                            "style-src 'self' 'unsafe-inline'",
                            "img-src 'self' data: blob: https:",
                            "media-src 'self' data: blob: https://*.supabase.co",
                            "font-src 'self' data:",
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://*.google-analytics.com https://www.googletagmanager.com https://analytics.google.com https://stats.g.doubleclick.net",
                            // Sin frame-src, el navegador usa default-src ('self') y bloquea los
                            // iframes hacia Supabase (catálogos PDF), los visores 3D de Zebra y
                            // el mapa de Google. Se permiten orígenes https porque los vendedores
                            // pueden indicar URLs 3D de cualquier dominio.
                            "frame-src 'self' https:",
                            // 'self' (no 'none') para permitir que el propio sitio incruste
                            // su PDF de privacidad; sigue bloqueando el embebido desde
                            // cualquier sitio externo (protección contra clickjacking).
                            "frame-ancestors 'self'",
                            "base-uri 'self'",
                            "form-action 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
