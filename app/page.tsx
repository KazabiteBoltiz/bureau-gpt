'use client';

import { useEffect } from 'react';
import { Code2, Github, Pen, Pencil, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-oxford-blue to-black text-platinum">
      {/* Sticky Header */}
      <header className="fixed top-0 w-full bg-oxford-blue/90 backdrop-blur-sm z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Pen className="h-8 w-8 text-orange-web" />
            <span className="text-xl font-bold">BureauGPT</span>
            
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="Orator" className="hover:text-orange-web transition-colors">Orator</a>
            <a href="Shabd" className="hover:text-orange-web transition-colors">Shabd</a>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl font-bold leading-tight">
                Made by Indians, for Indians
                <span className="text-orange-web"> Innovation</span>
              </h1>
              <p className="text-xl text-platinum/80">
                Seamless communication for impactful governance.
              </p>
            </div>
            <div className="relative">
              <pre className="rounded-lg bg-oxford-blue/50 p-6 font-mono text-sm leading-relaxed animate-float">
                <code className="text-platinum">
{`const BureauGPT = {
  features: ['Shabd', 'Orator'],
  performance: 'Blazing Fast',
  reliability: '99.99%',
  innovation: true
};`}
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}