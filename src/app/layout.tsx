import type {Metadata,Viewport} from 'next';
import './globals.css';
import './scenery.css';
import './staff.css';
export const metadata:Metadata={title:'NOMAD STORIES — Kolsay',description:'Chapter 01 · Kolsay. Stay, explore, remember. Demo only.'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0a1418'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>}
