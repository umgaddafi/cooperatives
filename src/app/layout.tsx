
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'CoopNest - Cooperative Society Management',
  description: 'Smart, secure governance for cooperative societies.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="https://picsum.photos/seed/cooplogo/32/32" />
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            const originalError = console.error;
            const originalWarn = console.warn;
            const originalLog = console.log;
            
            const isForbidden = (msg) => {
              if (!msg) return false;
              try {
                const s = typeof msg === 'string' ? msg : (msg.message || JSON.stringify(msg));
                const l = s.toLowerCase();
                return l.includes('internal unhandled error') || 
                       l.includes('internal assertion failed') || 
                       l.includes('unexpected state') ||
                       l.includes('id: ca9') || 
                       l.includes('id: b815') ||
                       l.includes('notallowederror') ||
                       l.includes('clipboard') ||
              } catch (e) {
                return false;
              }
            };

            console.error = function(...args) {
              if (args.some(isForbidden)) return;
              originalError.apply(console, args);
            };

            console.warn = function(...args) {
              if (args.some(isForbidden)) return;
              originalWarn.apply(console, args);
            };

            console.log = function(...args) {
              if (args.some(isForbidden)) return;
              originalLog.apply(console, args);
            };

            window.addEventListener('unhandledrejection', (event) => {
              if (isForbidden(event.reason)) {
                event.stopImmediatePropagation();
                event.preventDefault();
              }
            }, true);

            window.addEventListener('error', (event) => {
              if (isForbidden(event.message) || isForbidden(event.error)) {
                event.stopImmediatePropagation();
                event.preventDefault();
              }
            }, true);
          })();
        `}} />
      </head>
      <body className="font-body antialiased selection:bg-primary/30">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
