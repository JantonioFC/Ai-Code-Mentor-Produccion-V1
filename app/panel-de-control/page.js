import DashboardClient from './DashboardClient';

export const metadata = {
    title: 'Panel de Control | AI Code Mentor',
    description: 'Dashboard principal del ecosistema educativo Ecosistema 360',
};

/**
 * Panel de Control (App Router)
 * Server Component que renderiza el cliente del Dashboard.
 */
export default function PanelDeControlPage() {
    return <DashboardClient />;
}
