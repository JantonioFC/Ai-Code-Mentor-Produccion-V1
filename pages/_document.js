import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        {/* Forzar modo claro en todos los navegadores (Brave, Firefox, Chrome) */}
        {/* Evita que el browser aplique auto dark-mode sobre colores de texto */}
        <meta name="color-scheme" content="light" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
