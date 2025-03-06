import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout({ children, title = 'FilmChain - Decentralized Film Financing' }) {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Decentralized platform for indie film financing" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow">
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
