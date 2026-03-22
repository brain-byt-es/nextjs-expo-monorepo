"use client";

import { useEffect, useState, useCallback } from "react";
import { LogoMark } from "@/components/logo";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Database,
  Globe,
  Shield,
  Smartphone,
  Monitor,
} from "lucide-react";

interface CheckResult {
  status: "up" | "down";
  latency?: number;
}

interface StatusResponse {
  status: "operational" | "degraded" | "outage";
  checks: Record<string, CheckResult>;
  uptime: string;
  lastChecked: string;
  incidents: { title: string; description: string; date: string; status: string }[];
}

interface DaySummary {
  date: string;
  checks: number;
  operational: number;
  degraded: number;
  outage: number;
  uptimePercent: number;
  avgApiLatency: number | null;
  avgDbLatency: number | null;
}

interface HistoryResponse {
  days: DaySummary[];
  overallUptime: number;
}

const SERVICE_META: Record<string, { label: string; icon: React.ElementType }> = {
  api: { label: "API", icon: Globe },
  database: { label: "Datenbank", icon: Database },
  auth: { label: "Authentifizierung", icon: Shield },
  web: { label: "Web-App", icon: Monitor },
  mobile: { label: "Mobile API", icon: Smartphone },
};

const STATUS_CONFIG = {
  operational: {
    label: "Alle Systeme betriebsbereit",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: CheckCircle2,
  },
  degraded: {
    label: "Eingeschränkter Betrieb",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-800",
    icon: AlertTriangle,
  },
  outage: {
    label: "Systemstörung",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40",
    border: "border-red-200 dark:border-red-800",
    icon: XCircle,
  },
};

const PERIOD_OPTIONS = [
  { label: "7 Tage", days: 7 },
  { label: "30 Tage", days: 30 },
  { label: "90 Tage", days: 90 },
  { label: "1 Jahr", days: 365 },
] as const;

function StatusDot({ status }: { status: "up" | "down" }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${
        status === "up"
          ? "bg-emerald-500"
          : "bg-red-500"
      }`}
    />
  );
}

function getBarColor(uptimePercent: number): string {
  if (uptimePercent < 0) return "bg-gray-300 dark:bg-gray-600"; // no data
  if (uptimePercent >= 100) return "bg-emerald-500/80 dark:bg-emerald-500/60";
  if (uptimePercent >= 95) return "bg-amber-400/80 dark:bg-amber-400/60";
  return "bg-red-500/80 dark:bg-red-500/60";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

function UptimeBar({ history }: { history: DaySummary[] }) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);

  return (
    <div className="relative">
      <div className="flex items-end gap-[2px]">
        {history.map((day, i) => (
          <div
            key={day.date}
            className="group relative flex-1 min-w-0"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setTooltip({ idx: i, x: rect.left + rect.width / 2, y: rect.top });
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            <div
              className={`h-8 w-full rounded-[2px] cursor-pointer transition-opacity hover:opacity-80 ${getBarColor(day.uptimePercent)}`}
            />
          </div>
        ))}
      </div>

      {/* Date labels - show first, middle, last */}
      <div className="mt-1.5 flex justify-between">
        <span className="text-[10px] text-muted-foreground">
          {history.length > 0 ? formatDate(history[0].date) : ""}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {history.length > 0 ? formatDate(history[history.length - 1].date) : ""}
        </span>
      </div>

      {/* Tooltip */}
      {tooltip !== null && history[tooltip.idx] && (
        <div className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 pointer-events-none"
          style={{
            left: `${((tooltip.idx + 0.5) / history.length) * 100}%`,
          }}
        >
          <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg whitespace-nowrap">
            <p className="font-medium text-foreground">
              {new Date(history[tooltip.idx].date + "T12:00:00").toLocaleDateString("de-CH", {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
            {history[tooltip.idx].checks === 0 ? (
              <p className="text-muted-foreground mt-0.5">Keine Daten</p>
            ) : (
              <>
                <p className="text-muted-foreground mt-0.5">
                  Verfügbarkeit: {history[tooltip.idx].uptimePercent.toFixed(1)}%
                </p>
                <p className="text-muted-foreground">
                  Prüfungen: {history[tooltip.idx].checks}
                </p>
                {(history[tooltip.idx].degraded > 0 || history[tooltip.idx].outage > 0) && (
                  <p className="text-muted-foreground">
                    Störungen: {history[tooltip.idx].degraded + history[tooltip.idx].outage}
                  </p>
                )}
                {history[tooltip.idx].avgApiLatency != null && (
                  <p className="text-muted-foreground">
                    Latenz: {history[tooltip.idx].avgApiLatency}ms
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/80" /> 100%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-400/80" /> &gt;95%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500/80" /> &lt;95%
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-300 dark:bg-gray-600" /> Keine Daten
        </span>
      </div>
    </div>
  );
}

export default function StatusPage() {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(7);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/status", { cache: "no-store" });
      const json: StatusResponse = await res.json();
      // Add synthetic checks for web & mobile (derived from api)
      if (json.checks.api) {
        json.checks.web = { status: json.checks.api.status, latency: json.checks.api.latency };
        json.checks.mobile = { status: json.checks.api.status, latency: json.checks.api.latency };
      }
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchHistory = useCallback(async (days: number) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/status/history?days=${days}`, { cache: "no-store" });
      const json: HistoryResponse = await res.json();
      setHistory(json);
    } catch {
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 60_000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  useEffect(() => {
    fetchHistory(selectedPeriod);
  }, [selectedPeriod, fetchHistory]);

  const overallStatus = data?.status ?? "outage";
  const config = STATUS_CONFIG[overallStatus];
  const StatusIcon = config.icon;

  // Compute average latency from history
  const avgLatency =
    history && history.days.length > 0
      ? (() => {
          const latencies = history.days
            .filter((d) => d.avgApiLatency != null)
            .map((d) => d.avgApiLatency!);
          return latencies.length > 0
            ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
            : null;
        })()
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-16">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <LogoMark size={28} />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Logistik<span className="text-primary">App</span>
            <span className="ml-2 text-sm font-normal text-muted-foreground">Systemstatus</span>
          </span>
        </div>
        <button
          onClick={() => fetchStatus(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Overall Status Banner */}
      {loading ? (
        <div className="mb-8 flex items-center justify-center rounded-xl border border-border bg-muted/30 p-8">
          <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Status wird geladen...</span>
        </div>
      ) : (
        <div className={`mb-8 flex items-center gap-3 rounded-xl border p-5 ${config.bg} ${config.border}`}>
          <StatusIcon className={`h-7 w-7 ${config.color}`} />
          <div className="flex-1">
            <p className={`text-lg font-semibold ${config.color}`}>{config.label}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
              {history && history.overallUptime >= 0 && (
                <p className="text-sm text-muted-foreground">
                  {history.overallUptime.toFixed(1)}% Verfügbarkeit (letzte {selectedPeriod === 365 ? "365" : selectedPeriod} Tage)
                </p>
              )}
              {avgLatency != null && (
                <p className="text-sm text-muted-foreground">
                  Ø {avgLatency}ms Antwortzeit
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Checks */}
      {!loading && data && (
        <div className="mb-8 divide-y divide-border rounded-xl border border-border bg-card">
          {Object.entries(SERVICE_META).map(([key, meta]) => {
            const check = data.checks[key];
            const Icon = meta.icon;
            return (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{meta.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  {check?.latency !== undefined && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {check.latency}ms
                    </span>
                  )}
                  <StatusDot status={check?.status ?? "down"} />
                  <span
                    className={`text-xs font-medium ${
                      check?.status === "up"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {check?.status === "up" ? "Betriebsbereit" : "Gestört"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Uptime History */}
      {!loading && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Verfügbarkeits-Historie
            </h2>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.days}
                  onClick={() => setSelectedPeriod(opt.days)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedPeriod === opt.days
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {historyLoading ? (
            <div className="flex h-12 items-center justify-center">
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : history && history.days.length > 0 ? (
            <>
              <UptimeBar history={history.days} />
              {history.overallUptime >= 0 && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Gesamtverfügbarkeit: {history.overallUptime.toFixed(2)}%
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">Noch keine Daten vorhanden</p>
          )}
        </div>
      )}

      {/* Incidents */}
      {!loading && (
        <div className="mb-8 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Aktuelle Störungen</h2>
          {!data?.incidents?.length ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Keine aktuellen Störungen
            </div>
          ) : (
            <ul className="space-y-3">
              {data.incidents.map((incident, i) => (
                <li key={i} className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
                  <p className="text-sm font-medium text-foreground">{incident.title}</p>
                  <p className="text-xs text-muted-foreground">{incident.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{incident.date}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Last checked + auto-refresh hint */}
      {!loading && data && (
        <p className="mb-6 text-center text-xs text-muted-foreground">
          Zuletzt geprüft: {new Date(data.lastChecked).toLocaleString("de-CH")} · Systemstatus wird alle 60 Sekunden aktualisiert
        </p>
      )}

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        LogistikApp · status.logistikapp.ch
      </footer>
    </div>
  );
}
