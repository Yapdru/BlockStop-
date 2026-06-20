'use client';

import Link from 'next/link';
import { Button, Card, Badge } from '@/components';
import { a11y } from '@/lib/a11y';

export default function Home() {
  const features = [
    {
      title: 'Email Checker',
      description: 'Analyze emails for phishing, malicious links, and spam using DRAR AI',
      icon: '📧',
      href: '/email-checker',
    },
    {
      title: 'File Scanner',
      description: 'Scan files for malware, viruses, and ransomware using BetterBot PRO',
      icon: '📁',
      href: '/file-scanner',
    },
    {
      title: 'BetterBot AI',
      description: 'Ask questions about threats and get intelligent security recommendations',
      icon: '🤖',
      href: '/betterbot',
    },
  ];

  const tiers = [
    {
      name: 'Free',
      price: '₹0',
      period: 'Forever',
      features: ['Email analysis', 'File scanning', '50 scans/month', 'Basic threats'],
      icon: '🆓',
      cta: 'Get Started',
      href: '/register',
    },
    {
      name: 'NEO',
      price: '₹99',
      period: '/month',
      features: ['All Free', '6 team members', 'Unlimited scans', 'WiFi security', 'VPN (5)'],
      icon: '🚀',
      cta: 'Start Free Trial',
      href: '/register?plan=neo',
      highlight: false,
    },
    {
      name: 'MAX',
      price: '₹299',
      period: '/month',
      features: ['All NEO', 'BetterBot AI', 'Threat hunting', 'AI analysis', 'API access'],
      icon: '⭐',
      cta: 'Explore MAX',
      href: '/register?plan=max',
      highlight: true,
    },
  ];

  return (
    <main className="min-h-screen bg-neutral-50" id="main-content">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="absolute top-0 left-0 p-2 bg-primary-600 text-white rounded-b-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 -translate-y-full focus:translate-y-0 transition-transform"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-neutral-0 border-b border-neutral-200 sticky top-0 z-40">
        <div className="container-max py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded">
            <span className="text-2xl" aria-hidden="true">🛡️</span>
            <h1 className="text-h4 font-bold text-neutral-900">BlockStop</h1>
          </Link>

          <nav className="flex items-center gap-4" aria-label="Main navigation">
            <Link
              href="/pricing"
              className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded font-medium"
            >
              Pricing
            </Link>
            <Link
              href="/dashboard"
              className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded font-medium"
            >
              Dashboard
            </Link>
            <Button
              variant="primary"
              size="sm"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
            >
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container-max py-20 text-center" aria-label="Hero section">
        <div className="max-w-3xl mx-auto mb-12">
          <Badge variant="primary" className="mb-4">
            🎯 Advanced Email & File Security
          </Badge>
          <h2 className="text-h1 font-bold text-neutral-900 mb-6">
            Protect Yourself from Email & File Threats
          </h2>
          <p className="text-lg text-neutral-600 mb-8">
            BlockStop uses advanced AI engines (DRAR AI & BetterBot PRO) to analyze emails, scan files, and protect you from phishing, malware, and ransomware attacks.
          </p>

          <div className="flex justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
            >
              <Link href="/email-checker"><span aria-hidden="true">📧</span> Check Email Now</Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
            >
              <Link href="/file-scanner"><span aria-hidden="true">📁</span> Scan File Now</Link>
            </Button>
          </div>
        </div>

        {/* Trust Signals */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4 py-12 border-y border-neutral-200">
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">256-bit</p>
            <p className="text-xs text-neutral-600">Encryption</p>
          </div>
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">SOC2</p>
            <p className="text-xs text-neutral-600">Certified</p>
          </div>
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">99.9%</p>
            <p className="text-xs text-neutral-600">Uptime</p>
          </div>
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">24/7</p>
            <p className="text-xs text-neutral-600">Support</p>
          </div>
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">Real-time</p>
            <p className="text-xs text-neutral-600">Analysis</p>
          </div>
          <div className="text-center">
            <p className="text-h6 font-bold text-neutral-900">Global</p>
            <p className="text-xs text-neutral-600">Reach</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container-max py-20" aria-label="Core features">
        <h2 className="text-h2 font-bold text-neutral-900 text-center mb-12">Core Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <Card
              key={feature.title}
              padding="lg"
              className="flex flex-col transition hover:border-primary-300 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-600"
            >
              <div className="text-5xl mb-4" aria-hidden="true">{feature.icon}</div>
              <h3 className="text-h5 font-bold text-neutral-900 mb-3">{feature.title}</h3>
              <p className="text-neutral-600 mb-6 flex-1">{feature.description}</p>
              <Link href={feature.href}>
                <Button
                  variant="secondary"
                  className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
                  aria-label={`Try ${feature.title} now`}
                >
                  Try It Now →
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container-max py-20" aria-label="Pricing plans">
        <div className="text-center mb-12">
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-neutral-600">Choose the perfect plan for your security needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              padding="lg"
              className={`flex flex-col transition focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-600 ${
                tier.highlight
                  ? 'border-2 border-accent-400 shadow-lg scale-105 md:scale-100 lg:scale-105'
                  : 'border-neutral-200'
              }`}
            >
              {tier.highlight && (
                <Badge variant="accent" className="mb-4 w-fit">
                  Most Popular
                </Badge>
              )}

              <div className="mb-6">
                <div className="text-4xl mb-3" aria-hidden="true">{tier.icon}</div>
                <h3 className="text-h4 font-bold text-neutral-900">{tier.name}</h3>
                <p className="text-sm text-neutral-600 mt-2">{tier.price} {tier.period}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className="text-success font-bold mt-0.5">✓</span>
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                variant={tier.highlight ? 'primary' : 'secondary'}
                className="w-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
                aria-label={`${tier.cta} for ${tier.name} plan at ${tier.price} ${tier.period}`}
              >
                <Link href={tier.href}>{tier.cta}</Link>
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/pricing">
            <Button
              variant="secondary"
              size="lg"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
              aria-label="View all pricing plans"
            >
              View All Pricing Plans →
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="container-max py-20 bg-primary-50 border border-primary-200 rounded-xl"
        aria-label="Call to action to get started"
      >
        <div className="text-center">
          <h2 className="text-h2 font-bold text-neutral-900 mb-4">Ready to Stay Secure?</h2>
          <p className="text-lg text-neutral-600 mb-8 max-w-2xl mx-auto">
            Start with our free tier and experience BlockStop&apos;s advanced security features. No credit card required.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600"
            >
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-600"
            >
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-400 py-12 mt-20" role="contentinfo">
        <div className="container-max text-center">
          <p>&copy; 2026 BlockStop. Advanced email and file security for everyone.</p>
          <nav className="flex justify-center gap-6 mt-6 text-sm" aria-label="Footer navigation">
            <Link href="#" className="hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded">
              Privacy
            </Link>
            <Link href="#" className="hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded">
              Terms
            </Link>
            <Link href="#" className="hover:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-600 rounded">
              Security
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
