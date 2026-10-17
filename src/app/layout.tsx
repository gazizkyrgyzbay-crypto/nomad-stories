import type {Metadata,Viewport} from 'next';
import './globals.css';
import './scenery.css';
import './staff.css';
export const metadata:Metadata={title:'NOMAD STORIES — Kolsay',description:'NOMAD STORIES · Көлсай. Саяхаттаңыз, зерттеңіз, есте сақтаңыз. Тест нұсқасы.'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0a1418'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="kk"><body>{children}</body></html>}
