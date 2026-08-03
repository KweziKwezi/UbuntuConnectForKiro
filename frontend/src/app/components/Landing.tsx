import { Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Button } from "./ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-white">
            UbuntuConnect
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-white hover:text-white/80">
              Sign In
            </Link>
            <Link to="/register">
              <Button size="sm" className="bg-white text-orange-600 hover:bg-neutral-100">
                Register
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1671581084275-82416d389bf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxoYW5kcyUyMHRvZ2V0aGVyJTIwdGVhbXdvcmslMjBjb2xsYWJvcmF0aW9uJTIwZGl2ZXJzaXR5fGVufDF8fHx8MTc3NjA4MTg5NHww&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Hands together in unity"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
        </div>

        <div className="relative z-10 container mx-auto px-6 lg:px-12 max-w-7xl">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-white mb-6">UbuntuConnect</h1>
              <p className="text-white/90 text-xl lg:text-2xl mb-4 max-w-xl">
                Bridging grassroots impact with transparent support
              </p>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                The digital platform connecting South African NPOs with individuals and businesses through trust, visibility, and meaningful engagement.
              </p>
              <Link to="/register">
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg">
                  Get Started
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-24 px-6 lg:px-12 bg-neutral-50">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-6">The Visibility Gap</h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Grassroots NPOs across South Africa are doing meaningful work, but struggle to access funding and support because people and businesses don't know they exist—or can't verify their credibility.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Three Audiences */}
      <section className="py-24 px-6 lg:px-12">
        <div className="container mx-auto max-w-7xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            Built for Impact
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-12">
            {/* NPOs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col"
            >
              <div className="relative h-64 mb-6 overflow-hidden rounded-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1585847812247-4482e9f6f0cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxTb3V0aCUyMEFmcmljYW4lMjBjb21tdW5pdHklMjB2b2x1bnRlZXJzJTIwaGVscGluZyUyMHBlb3BsZSUyMGdyYXNzcm9vdHN8ZW58MXx8fHwxNzc2MDgxODkzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Community volunteers"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mb-3">For NPOs</h3>
              <p className="text-neutral-600">
                Build credibility, showcase your impact, and connect with supporters through a transparent digital profile and real-time project updates.
              </p>
            </motion.div>

            {/* Individuals */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-col"
            >
              <div className="relative h-64 mb-6 overflow-hidden rounded-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1630510590497-e69fac21bfbd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxoYW5kcyUyMHRvZ2V0aGVyJTIwdGVhbXdvcmslMjBjb2xsYWJvcmF0aW9uJTIwZGl2ZXJzaXR5fGVufDF8fHx8MTc3NjA4MTg5NHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Collaboration"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mb-3">For Individuals</h3>
              <p className="text-neutral-600">
                Discover vetted organizations aligned with your values, follow their journey, and contribute with confidence through seamless in-app donations.
              </p>
            </motion.div>

            {/* Businesses */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-col"
            >
              <div className="relative h-64 mb-6 overflow-hidden rounded-lg">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1633443315288-e97afe7c1f5f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHw1fHxTb3V0aCUyMEFmcmljYW4lMjBjb21tdW5pdHklMjB2b2x1bnRlZXJzJTIwaGVscGluZyUyMHBlb3BsZSUyMGdyYXNzcm9vdHN8ZW58MXx8fHwxNzc2MDgxODkzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Business partnership"
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="mb-3">For Businesses</h3>
              <p className="text-neutral-600">
                Meet B-BBEE and CSR goals with verified NPO partnerships that deliver measurable, reportable outcomes for your social impact initiatives.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 lg:px-12 bg-neutral-50">
        <div className="container mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            Transparency at Every Step
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="mb-2">Discover</h3>
              <p className="text-neutral-600">
                Find organizations by cause, location, or impact area
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="mb-2">Verify</h3>
              <p className="text-neutral-600">
                View verified credentials and transparent track records
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="mb-2">Connect</h3>
              <p className="text-neutral-600">
                Engage, follow, donate, or partner with confidence
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 lg:px-12 bg-gradient-to-br from-orange-600 to-orange-700">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-white mb-6">Join the Movement</h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Whether you're an NPO seeking visibility, an individual looking to make an impact, or a business pursuing meaningful CSR partnerships—start here.
            </p>
            <Link to="/register">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-neutral-100 px-8 py-6 text-lg">
                Create Your Account
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-neutral-900 text-white/70 text-center">
        <p>&copy; 2026 UbuntuConnect. Building bridges through transparency.</p>
      </footer>
    </div>
  );
}
