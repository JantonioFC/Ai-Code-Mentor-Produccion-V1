import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import AuthLocal from '@/lib/auth-local';
import ConnectForm from './ConnectForm';

export const metadata = {
    title: 'Conectar VS Code | AI Code Mentor',
    description: 'Autoriza tu extensión de VS Code para acceder a tu cuenta.'
};

export default function ConnectPage() {
    // 1. Protección de Ruta (Server-Side)
    const cookieStore = cookies();
    const token = cookieStore.get('ai-code-mentor-auth');

    if (!token) {
        redirect('/login?redirect=/connect');
    }

    const authResult = AuthLocal.verifyToken(token.value);

    if (!authResult.isValid) {
        redirect('/login?redirect=/connect');
    }

    const { email } = authResult;

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="z-10 w-full flex flex-col items-center">
                <div className="mb-8 flex items-center gap-2">
                    <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">AI</span>
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight">Code Mentor</span>
                </div>
                
                <ConnectForm user={{ email }} />
                
                <p className="mt-8 text-slate-500 text-sm">
                    Revisa que el código coincida con el mostrado en tu editor.
                </p>
            </div>
        </main>
    );
}
