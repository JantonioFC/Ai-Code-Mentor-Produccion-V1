import TemplatesClient from './TemplatesClient';

export const metadata = {
    title: 'Plantillas Educativas | AI Code Mentor',
    description: 'Centro de plantillas educativas del Ecosistema 360',
};

/**
 * Plantillas Page (App Router)
 * Server Component that acts as the entry point for /plantillas
 */
export default function PlantillasPage() {
    return <TemplatesClient />;
}
