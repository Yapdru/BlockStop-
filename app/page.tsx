"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function Home() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 },
    },
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-light-bg via-primary-50 to-primary-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-border">
        <nav className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            🛡️ BlockStop PRO
          </h1>
          <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            Sign In
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <motion.section
        className="max-w-6xl mx-auto px-4 py-20"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div className="text-center mb-16" variants={itemVariants}>
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            Advanced Email & File Security
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Protect yourself with DRAR AI & BetterBot PRO. Check emails, scan files, and get instant alerts.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <motion.div className="grid md:grid-cols-3 gap-8 mb-16" variants={containerVariants}>
          {[
            {
              title: "Email Checker",
              description: "Analyze emails for phishing, malicious links, and spam",
              icon: "📧",
              href: "/email-checker",
            },
            {
              title: "File Scanner",
              description: "Scan files for malware, viruses, and ransomware threats",
              icon: "📁",
              href: "/file-scanner",
            },
            {
              title: "Gmail Alerts",
              description: "Get real-time alerts directly in your Gmail inbox",
              icon: "🔔",
              href: "#",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition border border-light-border"
              variants={itemVariants}
              whileHover={{ y: -5 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-6">{feature.description}</p>
              <Link
                href={feature.href}
                className="text-primary-600 font-semibold hover:text-primary-700 inline-flex items-center gap-2"
              >
                Get Started →
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          variants={itemVariants}
        >
          <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-lg font-semibold rounded-xl hover:shadow-lg transition transform hover:scale-105">
            Start Free Analysis
          </button>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-white border-t border-light-border mt-20">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; 2026 BlockStop PRO. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
