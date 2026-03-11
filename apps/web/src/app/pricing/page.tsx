"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  interval: "month" | "year"
  features: string[]
  priceId: string // Stripe price ID
  popular?: boolean
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "Perfect for trying out",
    price: 0,
    interval: "month",
    features: [
      "Up to 3 projects",
      "Basic analytics",
      "Community support",
      "1 GB storage",
    ],
    priceId: "free",
  },
  {
    id: "pro",
    name: "Pro",
    description: "Best for growing teams",
    price: 29,
    interval: "month",
    features: [
      "Unlimited projects",
      "Advanced analytics",
      "Priority support",
      "100 GB storage",
      "Team collaboration",
      "Custom branding",
    ],
    priceId: "price_1234567890",
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations",
    price: 99,
    interval: "month",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated support",
      "Unlimited storage",
      "SSO & advanced security",
      "SLA guarantee",
      "API access",
    ],
    priceId: "price_0987654321",
  },
]

export default function PricingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSelectPlan = async (plan: Plan) => {
    if (plan.id === "free") {
      router.push("/signup")
      return
    }

    if (!session) {
      router.push("/signup")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId }),
      })

      if (!response.ok) throw new Error("Failed to create checkout")

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error("Checkout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">nextjs-expo</h1>
          {session ? (
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Dashboard
            </Button>
          ) : (
            <div className="space-x-2">
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Login
              </Button>
              <Button onClick={() => router.push("/signup")}>Sign Up</Button>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Choose the perfect plan for your needs. Always flexible to scale.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`flex flex-col relative ${
                plan.popular ? "border-primary border-2 shadow-lg" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge variant="default">Most Popular</Badge>
                </div>
              )}

              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                <div>
                  <p className="text-4xl font-bold">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </p>
                  {plan.price > 0 && (
                    <p className="text-sm text-muted-foreground">
                      per {plan.interval}
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <svg
                        className="h-4 w-4 text-green-600 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isLoading}
                  variant={plan.popular ? "default" : "outline"}
                  className="w-full"
                >
                  {isLoading ? "Loading..." : plan.id === "free" ? "Get Started" : "Subscribe Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="grid gap-8 md:max-w-2xl md:mx-auto">
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Do you offer annual billing?</h3>
              <p className="text-muted-foreground">
                We offer monthly billing currently. Annual billing with discounts is coming soon. Contact us for details.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, American Express) through Stripe.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                You can start with our Free plan to test all features. Upgrade anytime to unlock advanced capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-lg text-muted-foreground mb-8">
          Join thousands of users building amazing things with our platform.
        </p>
        <Button size="lg" onClick={() => router.push("/signup")}>
          Start Free Today
        </Button>
      </section>
    </div>
  )
}
