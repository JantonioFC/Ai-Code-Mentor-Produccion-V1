import LoginClient from './LoginClient';

export const metadata = {
    title: 'Iniciar Sesión | AI Code Mentor',
    description: 'Accede a tu cuenta de AI Code Mentor - Ecosistema 360',
};

/**
 * Login Page (App Router)
 * Server Component que renderiza el cliente de la página de Login.
 */
export default function LoginPage() {
    return <LoginClient />;
}
