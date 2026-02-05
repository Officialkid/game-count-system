import './globals-enhanced.css'
import './animations.css'
import './mobile-optimized.css'
import { BottomTabBar } from '@/components/BottomTabBar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        {/* Mobile bottom navigation - only visible on mobile devices */}
        <BottomTabBar />
      </body>
    </html>
  );
}
