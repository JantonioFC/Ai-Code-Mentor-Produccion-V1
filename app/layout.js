import './globals.css';
import '../styles/design-system.css';
import { Providers } from './providers';

export const metadata = {
    title: 'AI Code Mentor | Domina la Ingeniería de Software con IA',
    description: 'Plataforma de aprendizaje acelerado para desarrolladores. Transforma tu carrera con el Ecosistema 360 y mentoría basada en IA.',
    openGraph: {
        type: 'website',
        locale: 'es_ES',
        url: 'https://aicodementor.com/',
        siteName: 'AI Code Mentor',
        images: [
            {
                url: 'https://aicodementor.com/og-image.jpg',
                width: 1200,
                height: 630,
                alt: 'AI Code Mentor Dashboard',
            },
        ],
    },
    twitter: {
        handle: '@aicodementor',
        site: '@aicodementor',
        cardType: 'summary_large_image',
    },
};

/**
 * Root Layout for App Router
 * Integra SEO, Analíticas, Compliance y Proveedores Globales.
 */
export default function RootLayout({ children }) {
    return (
        <html lang="es" suppressHydrationWarning>
            <body className="font-sans antialiased bg-[#0F1115] text-[#EDEDED]">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
