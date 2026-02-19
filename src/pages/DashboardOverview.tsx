import { useEffect, useState } from 'react';
import { LivingAppsService } from '@/services/livingAppsService';
import { BookOpen, ClipboardList, DoorOpen, GraduationCap, Users, TrendingUp, CheckCircle } from 'lucide-react';
import type { Kurse, Anmeldungen, Teilnehmer, Dozenten, Raeume } from '@/types/app';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { format, parseISO, isAfter, isBefore, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

interface StatItem {
  label: string;
  value: number | string;
  icon: React.ElementType;
  colorClass: string;
  iconClass: string;
  description: string;
}

export default function DashboardOverview() {
  const [kurse, setKurse] = useState<Kurse[]>([]);
  const [anmeldungen, setAnmeldungen] = useState<Anmeldungen[]>([]);
  const [teilnehmer, setTeilnehmer] = useState<Teilnehmer[]>([]);
  const [dozenten, setDozenten] = useState<Dozenten[]>([]);
  const [raeume, setRaeume] = useState<Raeume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      LivingAppsService.getKurse(),
      LivingAppsService.getAnmeldungen(),
      LivingAppsService.getTeilnehmer(),
      LivingAppsService.getDozenten(),
      LivingAppsService.getRaeume(),
    ]).then(([k, a, t, d, r]) => {
      setKurse(k);
      setAnmeldungen(a);
      setTeilnehmer(t);
      setDozenten(d);
      setRaeume(r);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const aktiveKurse = kurse.filter(k => {
    const start = k.fields.startdatum ? parseISO(k.fields.startdatum) : null;
    const end = k.fields.enddatum ? parseISO(k.fields.enddatum) : null;
    if (!start) return false;
    return (isBefore(start, today) || isToday(start)) && (!end || isAfter(end, today) || isToday(end));
  });

  const bezahltCount = anmeldungen.filter(a => a.fields.bezahlt === true).length;

  const gesamtEinnahmen = anmeldungen.reduce((sum, a) => {
    if (!a.fields.kurs) return sum;
    const kursId = a.fields.kurs.split('/').pop();
    const kurs = kurse.find(k => k.record_id === kursId);
    return sum + (kurs?.fields.preis ?? 0);
  }, 0);

  const bezahltEinnahmen = anmeldungen.reduce((sum, a) => {
    if (!a.fields.kurs || !a.fields.bezahlt) return sum;
    const kursId = a.fields.kurs.split('/').pop();
    const kurs = kurse.find(k => k.record_id === kursId);
    return sum + (kurs?.fields.preis ?? 0);
  }, 0);

  const stats: StatItem[] = [
    {
      label: 'Kurse',
      value: loading ? '—' : kurse.length,
      icon: BookOpen,
      colorClass: 'stat-card-amber',
      iconClass: 'icon-amber',
      description: `${loading ? '—' : aktiveKurse.length} aktiv`,
    },
    {
      label: 'Dozenten',
      value: loading ? '—' : dozenten.length,
      icon: GraduationCap,
      colorClass: 'stat-card-violet',
      iconClass: 'icon-violet',
      description: 'Lehrpersonal',
    },
    {
      label: 'Teilnehmer',
      value: loading ? '—' : teilnehmer.length,
      icon: Users,
      colorClass: 'stat-card-sky',
      iconClass: 'icon-sky',
      description: 'Registriert',
    },
    {
      label: 'Anmeldungen',
      value: loading ? '—' : anmeldungen.length,
      icon: ClipboardList,
      colorClass: 'stat-card-teal',
      iconClass: 'icon-teal',
      description: `${loading ? '—' : bezahltCount} bezahlt`,
    },
    {
      label: 'Räume',
      value: loading ? '—' : raeume.length,
      icon: DoorOpen,
      colorClass: 'stat-card-rose',
      iconClass: 'icon-rose',
      description: 'Verfügbar',
    },
  ];

  const kursChartData = kurse.slice(0, 8).map(k => {
    const count = anmeldungen.filter(a => {
      const kursId = a.fields.kurs?.split('/').pop();
      return kursId === k.record_id;
    }).length;
    return {
      name: k.fields.titel ? (k.fields.titel.length > 16 ? k.fields.titel.slice(0, 14) + '…' : k.fields.titel) : '—',
      anmeldungen: count,
    };
  });

  const upcomingKurse = kurse
    .filter(k => k.fields.startdatum && isAfter(parseISO(k.fields.startdatum), today))
    .sort((a, b) => (a.fields.startdatum ?? '').localeCompare(b.fields.startdatum ?? ''))
    .slice(0, 5);

  const chartColors = [
    'oklch(0.62 0.18 50)',
    'oklch(0.55 0.15 260)',
    'oklch(0.58 0.14 180)',
    'oklch(0.62 0.18 290)',
    'oklch(0.60 0.18 15)',
    'oklch(0.62 0.14 225)',
    'oklch(0.60 0.17 140)',
    'oklch(0.65 0.16 310)',
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="hero-gradient rounded-2xl p-8 relative overflow-hidden" style={{ color: 'oklch(0.98 0 0)' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 85% 40%, oklch(1 0 0 / 0.12) 0%, transparent 55%)' }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-xs font-semibold tracking-widest uppercase mb-2" style={{ opacity: 0.65 }}>Kursverwaltungssystem</p>
            <h1 className="text-4xl font-bold tracking-tight font-serif">KursManager</h1>
            <p className="mt-2 text-sm max-w-md" style={{ opacity: 0.7 }}>
              Kurse, Dozenten, Teilnehmer, Räume und Anmeldungen zentral verwalten.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0 min-w-[180px]">
            <div className="rounded-xl px-5 py-3 text-center" style={{ background: 'oklch(1 0 0 / 0.13)', border: '1px solid oklch(1 0 0 / 0.18)' }}>
              <p className="text-3xl font-bold">
                {loading ? '—' : `${bezahltEinnahmen.toLocaleString('de-DE')} €`}
              </p>
              <p className="text-xs mt-0.5 flex items-center justify-center gap-1" style={{ opacity: 0.65 }}>
                <CheckCircle size={11} /> Eingegangene Zahlungen
              </p>
            </div>
            <div className="rounded-xl px-5 py-2 text-center" style={{ background: 'oklch(1 0 0 / 0.07)', border: '1px solid oklch(1 0 0 / 0.1)' }}>
              <p className="text-lg font-semibold" style={{ opacity: 0.85 }}>
                {loading ? '—' : `${gesamtEinnahmen.toLocaleString('de-DE')} €`}
              </p>
              <p className="text-xs flex items-center justify-center gap-1" style={{ opacity: 0.55 }}>
                <TrendingUp size={10} /> Gesamtpotenzial
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`${s.colorClass} rounded-xl border p-4 card-shadow transition-all duration-200 hover:scale-[1.02] cursor-default`}
          >
            <div className="flex items-start justify-between mb-3">
              <div
                className={`${s.iconClass} w-9 h-9 rounded-lg flex items-center justify-center`}
                style={{ background: 'oklch(1 0 0 / 0.65)' }}
              >
                <s.icon size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{s.value}</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-card rounded-xl border p-6 card-shadow">
          <h2 className="text-base font-semibold text-foreground mb-1">Anmeldungen pro Kurs</h2>
          <p className="text-xs text-muted-foreground mb-5">Belegung der angelegten Kurse</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">Laden…</div>
          ) : kursChartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <BookOpen size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Noch keine Kurse vorhanden</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kursChartData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 250)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'oklch(0.52 0.02 250)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'oklch(1 0 0)', border: '1px solid oklch(0.91 0.01 250)', borderRadius: '8px', fontSize: '12px', fontFamily: 'IBM Plex Sans' }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(v: number) => [`${v} Anmeldungen`]}
                />
                <Bar dataKey="anmeldungen" radius={[4, 4, 0, 0]} name="Anmeldungen">
                  {kursChartData.map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="lg:col-span-2 bg-card rounded-xl border p-6 card-shadow">
          <h2 className="text-base font-semibold text-foreground mb-1">Kommende Kurse</h2>
          <p className="text-xs text-muted-foreground mb-5">Nächste geplante Kurse</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Laden…</p>
          ) : upcomingKurse.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <BookOpen size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Keine zukünftigen Kurse</p>
            </div>
          ) : (
            <div className="space-y-0">
              {upcomingKurse.map((k) => (
                <div key={k.record_id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 icon-amber"
                    style={{ background: 'oklch(0.72 0.16 50 / 0.1)' }}
                  >
                    <BookOpen size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{k.fields.titel ?? '—'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {k.fields.startdatum ? format(parseISO(k.fields.startdatum), 'dd. MMM yyyy', { locale: de }) : '—'}
                      {k.fields.preis != null && ` · ${k.fields.preis} €`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Progress */}
      {!loading && anmeldungen.length > 0 && (
        <div className="bg-card rounded-xl border p-6 card-shadow">
          <h2 className="text-base font-semibold text-foreground mb-5">Zahlungsstatus</h2>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{bezahltCount} von {anmeldungen.length} bezahlt</span>
                <span>{anmeldungen.length - bezahltCount} ausstehend</span>
              </div>
              <div className="h-3 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(bezahltCount / anmeldungen.length) * 100}%`,
                    background: 'oklch(0.55 0.14 160)',
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((bezahltCount / anmeldungen.length) * 100)}% bezahlt
              </p>
            </div>
            <div className="flex gap-8 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold icon-teal">{bezahltEinnahmen.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground mt-0.5">Eingegangen</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold icon-rose">{(gesamtEinnahmen - bezahltEinnahmen).toLocaleString('de-DE')} €</p>
                <p className="text-xs text-muted-foreground mt-0.5">Ausstehend</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
