import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const features = [
  {
    icon: "⚡",
    title: "Lightning Fast",
    description:
      "Built on Next.js 16 with Turbopack. Pages load instantly with server-side rendering and edge caching.",
  },
  {
    icon: "🔐",
    title: "Auth & RBAC",
    description:
      "Email/password auth, admin roles, and session management — all wired up with Better-Auth out of the box.",
  },
  {
    icon: "💳",
    title: "Stripe Billing",
    description:
      "Checkout sessions, subscription management, billing portal, and webhook handling — ready to go.",
  },
  {
    icon: "📱",
    title: "Mobile App Included",
    description:
      "Expo React Native app with RevenueCat IAP, NativewindUI, and shared auth — iOS and Android.",
  },
  {
    icon: "🗄️",
    title: "Database Ready",
    description:
      "Drizzle ORM with PostgreSQL. Schema, migrations, and type-safe queries — no configuration needed.",
  },
  {
    icon: "🚀",
    title: "Deploy in Minutes",
    description:
      "Vercel for web, EAS for mobile. GitHub Actions CI/CD pipelines included.",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with the basics.",
    features: ["1 user", "Up to 3 projects", "Community support"],
    cta: "Get started",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per month",
    description: "For growing teams and serious projects.",
    features: [
      "Unlimited users",
      "Unlimited projects",
      "Priority support",
      "Advanced analytics",
      "Custom domain",
    ],
    cta: "Start free trial",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$99",
    period: "per month",
    description: "Custom solutions for large organisations.",
    features: [
      "Everything in Pro",
      "SLA guarantee",
      "Dedicated support",
      "SSO / SAML",
      "Audit logs",
    ],
    cta: "Contact us",
    href: "/signup",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight">Acme Inc.</span>
          <nav className="flex items-center gap-4">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-4 py-24 text-center">
          <Badge variant="outline" className="mb-4">
            Open-source SaaS template
          </Badge>
          <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
            Ship your SaaS
            <br />
            <span className="text-primary">in days, not months</span>
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground">
            A production-ready monorepo with Next.js, Expo, Stripe, Better-Auth, and everything
            else you need to go from idea to revenue — fast.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/signup">
              <Button size="lg" className="px-8">
                Start building for free
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="px-8">
                View demo
              </Button>
            </Link>
          </div>
        </section>

        <Separator />

        {/* Features */}
        <section id="features" className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">Everything you need</h2>
            <p className="text-muted-foreground">
              Skip the boilerplate. Start with a complete, production-grade foundation.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="border-border/50">
                <CardHeader>
                  <div className="mb-2 text-2xl">{f.icon}</div>
                  <CardTitle className="text-base">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* Pricing */}
        <section id="pricing" className="mx-auto max-w-5xl px-4 py-20">
          <div className="mb-12 text-center">
            <h2 className="mb-3 text-3xl font-bold tracking-tight">Simple pricing</h2>
            <p className="text-muted-foreground">No hidden fees. Cancel anytime.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={plan.highlight ? "border-primary shadow-md" : "border-border/50"}
              >
                <CardHeader>
                  {plan.highlight && (
                    <Badge className="mb-2 w-fit">Most popular</Badge>
                  )}
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/ {plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="space-y-2 text-sm">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <span className="text-primary">✓</span>
                        {feat}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href}>
                    <Button
                      className="w-full"
                      variant={plan.highlight ? "default" : "outline"}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Acme Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
