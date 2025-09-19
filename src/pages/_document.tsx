import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Tuitora - Multi-school EdTech Platform for School Management" />
        <meta name="keywords" content="education, school management, edtech, attendance, payments, communication" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Google Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        
        {/* PWA meta tags */}
        <meta name="theme-color" content="#4B0082" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Tuitora" />
        
        {/* Open Graph meta tags */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Tuitora - School Management Platform" />
        <meta property="og:description" content="Modern school management for African schools with communication, attendance tracking, and payment management." />
        <meta property="og:image" content="/images/og-image.png" />
        <meta property="og:url" content="https://tuitora.com" />
        
        {/* Twitter Card meta tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Tuitora - School Management Platform" />
        <meta name="twitter:description" content="Modern school management for African schools." />
        <meta name="twitter:image" content="/images/twitter-image.png" />
      </Head>
      <body className="font-inter antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}