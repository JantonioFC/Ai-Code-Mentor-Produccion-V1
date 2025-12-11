import '../styles/globals.css'
import { LessonProvider } from '../contexts/LessonContext'
import { ProjectTrackingProvider } from '../contexts/ProjectTrackingContext'
import { APITrackingProvider } from '../contexts/APITrackingContext'
import { AuthProvider } from '../lib/auth/useAuth'
import AuthLoadingWrapper from '../components/auth/AuthLoadingWrapper' // MISIÓN 221
import { Inter, Fira_Code } from 'next/font/google'
import { useRouter } from 'next/router'
import dynamic from 'next/dynamic'

// ⭐ MISIÓN 226.1: Carga condicional del PerformanceMonitor
// Solo se carga cuando la URL contiene ?profile=true
const DynamicPerformanceMonitor = dynamic(
  () => import('../components/PerformanceMonitor'),
  { ssr: false } // Cliente-only, nunca en servidor
)

// Configurar fuentes Google optimizadas
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const firaCode = Fira_Code({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-fira-code',
  display: 'swap',
})

export default function App({ Component, pageProps }) {
  // ⭐ MISIÓN 226.1: Carga condicional basada en URL
  // El PerformanceMonitor SOLO se carga si la URL contiene ?profile=true
  const router = useRouter()
  const shouldProfile = router.query.profile === 'true'

  return (
    <main className={`${inter.variable} ${firaCode.variable}`}>
      {/* ⭐ MISIÓN 226.1: Renderizado condicional con importación dinámica */}
      {/* Para activar: agregar ?profile=true a la URL */}
      {shouldProfile && <DynamicPerformanceMonitor />}
      
      <AuthProvider>
        {/* MISIÓN 221: Wrapper que muestra LoadingScreen durante verificación de sesión */}
        <AuthLoadingWrapper>
          <APITrackingProvider>
            <LessonProvider>
              <ProjectTrackingProvider>
                <Component {...pageProps} />
              </ProjectTrackingProvider>
            </LessonProvider>
          </APITrackingProvider>
        </AuthLoadingWrapper>
      </AuthProvider>
    </main>
  )
}
