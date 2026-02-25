// Sentry client initialization (must be first import)
import '../sentry.client.config';

import '../styles/globals.css'
import '../styles/design-system.css' // 🎨 Industrial Refined Design System
import { LessonProvider } from '../contexts/LessonContext'
import { ProjectTrackingProvider } from '../contexts/ProjectTrackingContext'
import { APITrackingProvider } from '../contexts/APITrackingContext'
import { AuthProvider, useAuth } from '../lib/auth/useAuth'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// ⭐ MISIÓN 226.1: Carga condicional del PerformanceMonitor
// Solo se carga cuando la URL contiene ?profile=true
const DynamicPerformanceMonitor = dynamic(
  () => import('../components/PerformanceMonitor'),
  { ssr: false } // Cliente-only, nunca en servidor
)

import { DefaultSeo } from 'next-seo'
import { PixelLoader } from '../components/analytics/PixelLoader'
import CookieBanner from '../components/compliance/CookieBanner'

function AuthGate({ children }) {
  const { authState, loading, user } = useAuth();


  console.log('🚪 [AUTH-GATE] Render - authState:', authState, 'loading:', loading, 'user:', user?.email);

  // CRITICAL FIX: Always render children, never block with LoadingScreen
  // If not authenticated, ProtectedRoute will handle redirect
  return <>{children}</>;
}

export default function App({ Component, pageProps }) {
  // ⭐ MISIÓN 226.1: Carga condicional basada en URL
  // El PerformanceMonitor SOLO se carga si la URL contiene ?profile=true
  const router = useRouter()
  const shouldProfile = router.query.profile === 'true'

  return (
    <main className="font-sans antialiased" suppressHydrationWarning>
      <DefaultSeo
        title="AI Code Mentor | Domina la Ingeniería de Software con IA"
        description="Plataforma de aprendizaje acelerado para desarrolladores. Transforma tu carrera con el Ecosistema 360 y mentoría basada en IA."
        openGraph={{
          type: 'website',
          locale: 'es_ES',
          url: 'https://aicodementor.com/',
          site_name: 'AI Code Mentor',
          images: [
            {
              url: 'https://aicodementor.com/og-image.jpg',
              width: 1200,
              height: 630,
              alt: 'AI Code Mentor Dashboard',
            },
          ],
        }}
        twitter={{
          handle: '@aicodementor',
          site: '@aicodementor',
          cardType: 'summary_large_image',
        }}
      />

      {/* 📊 Ops: Render Pixel Loader for Ads */}
      <PixelLoader />

      {/* ⚖️ Compliance: Cookie Consent */}
      <CookieBanner />

      {/* ⭐ MISIÓN 226.1: Renderizado condicional con importación dinámica */}
      {/* Para activar: agregar ?profile=true a la URL */}
      {shouldProfile && <DynamicPerformanceMonitor />}

      <AuthProvider>
        {/* 🔧 PHASE 0 FIX v2: Inline AuthGate (no dynamic import) */}
        <AuthGate>
          <APITrackingProvider>
            <LessonProvider>
              <ProjectTrackingProvider>
                <Component {...pageProps} />
              </ProjectTrackingProvider>
            </LessonProvider>
          </APITrackingProvider>
        </AuthGate>
      </AuthProvider>
    </main>
  )
}
