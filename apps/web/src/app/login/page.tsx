import { Logo, LogoMark } from "@/components/logo"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col p-6 md:p-10">
        <div className="flex justify-start">
          <a href="/"><Logo /></a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <LoginForm />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LogistikApp · Schweizer Datenschutz
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
            <h2 className="text-2xl font-bold text-background mb-3">Immer wissen, was wo ist.</h2>
            <p className="text-background/60 text-sm leading-relaxed max-w-xs">
              Werkzeuge, Materialien und Fahrzeugbestände — lückenlos erfasst und jederzeit abrufbar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {[
              { label: "Materialien", value: "1'247", color: "text-primary" },
              { label: "Werkzeuge", value: "84", color: "text-secondary" },
              { label: "Standorte", value: "12", color: "text-background" },
              { label: "Buchungen heute", value: "38", color: "text-primary" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-background/5 rounded-xl p-4 border border-background/10">
                <p className="text-xs text-background/50 mb-1">{label}</p>
                <p className={`text-xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-background/50">
            <svg className="size-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            Server in der Schweiz · nDSG-konform
          </div>
        </div>
      </div>
    </div>
  )
}
