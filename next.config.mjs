/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**.supabase.co',
                pathname: '/storage/v1/object/public/**',
            },
        ],
    },
    async redirects() {
        return [
            // La ruta heredada en mayúsculas se redirige de forma permanente.
            // En sistemas insensibles a mayúsculas (macOS) no puede coexistir un
            // archivo app/(shop)/Acerca/page.jsx con /acerca/page.jsx, por eso
            // esta regla es la responsable de canonicalizar /Acerca.
            { source: '/Acerca', destination: '/acerca', permanent: true },
            { source: '/Contactos', destination: '/acerca#contacto', permanent: true },
            { source: '/Productos', destination: '/all-products?category=rfid', permanent: true },
        ];
    },
    async headers() {
        // CSP con nonce pendiente de migrar Analytics: app/layout.js incluye un
        // script inline y @next/third-parties/google inyecta otro, por lo que
        // un CSP estricto con nonce rompería Google Analytics. Hoy se usa
        // 'unsafe-inline' de forma temporal en script-src/style-src.
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
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
                            "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://www.google-analytics.com https://region1.google-analytics.com",
                            "frame-ancestors 'none'",
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
