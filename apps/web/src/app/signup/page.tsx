import { Logo, LogoMark } from "@/components/logo"
import { SignupForm } from "@/components/signup-form"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex justify-start">
          <a href="/"><Logo /></a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <SignupForm />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LogistikApp · Keine Kreditkarte nötig
        </p>
      </div>

      {/* Right: Brand panel */}
      <div className="relative hidden lg:flex flex-col items-center justify-center bg-foreground overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(var(--background) 1px, transparent 1px), linear-gradient(90deg, var(--background) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <LogoMark size={64} />
          <div>
            <h2 className="text-2xl font-bold text-background mb-3">In 5 Minuten einsatzbereit.</h2>
            <p className="text-background/60 text-sm leading-relaxed max-w-xs">
              Konto erstellen, Team einladen, Artikel erfassen — und schon wissen alle wo was ist.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs text-left">
            {[
              "14 Tage kostenlos testen",
              "Keine Kreditkarte nötig",
              "Jederzeit kündbar",
              "Schweizer Datenschutz",
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-background/80">
                <svg className="size-4 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
