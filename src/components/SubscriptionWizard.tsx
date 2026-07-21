import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Calculator, ArrowRight, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';

const CREDITS_PER_SCAN = 0.01;
const GLOBAL_MONTHLY_SCAN_LIMIT = 250;
const OVERHEAD_MULTIPLIER = 1.2;

type Plan = { name: string; credits: number; note: string };

function recommendPlan(credits: number): Plan {
  if (credits <= 80) return { name: 'Pro 100', credits: 100, note: 'Najjeftiniji plaćeni plan, dovoljno za manje korištenje.' };
  if (credits <= 200) return { name: 'Pro 250', credits: 250, note: 'Preporučeno za manje aplikacije s desetak aktivnih korisnika.' };
  if (credits <= 400) return { name: 'Pro 500', credits: 500, note: 'Za srednje intenzivno korištenje.' };
  if (credits <= 800) return { name: 'Business 1000', credits: 1000, note: 'Preporučeno kad AI skeniranje redovito prelazi 500 kredita.' };
  if (credits <= 1600) return { name: 'Business 2000', credits: 2000, note: 'Za veliki broj korisnika ili intenzivno skeniranje.' };
  return { name: 'Business 5000+ ili Enterprise', credits: 5000, note: 'Za timove i aplikacije s vrlo velikim opsegom — razmotrite Enterprise ponudu.' };
}

function formatNum(n: number) {
  return n.toLocaleString('hr-HR', { maximumFractionDigits: 2 });
}

export default function SubscriptionWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [users, setUsers] = useState(10);
  const [scansPerUser, setScansPerUser] = useState(20);

  const result = useMemo(() => {
    const rawScans = users * scansPerUser;
    const effectiveScans = Math.min(rawScans, GLOBAL_MONTHLY_SCAN_LIMIT);
    const baseCredits = effectiveScans * CREDITS_PER_SCAN;
    const totalCredits = baseCredits * OVERHEAD_MULTIPLIER;
    const plan = recommendPlan(totalCredits);
    return { rawScans, effectiveScans, baseCredits, totalCredits, plan, capped: rawScans > GLOBAL_MONTHLY_SCAN_LIMIT };
  }, [users, scansPerUser]);

  const reset = () => { setStep(1); setUsers(10); setScansPerUser(20); };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Calculator className="w-4 h-4 mr-2" />
          Kalkulator pretplate
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Čarobnjak za preporuku pretplate
          </DialogTitle>
          <DialogDescription>
            Procijenite mjesečni trošak Lovable kredita i pronađite prikladan plan za vašu aplikaciju.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="users" className="text-base">Očekivani broj korisnika</Label>
                <p className="text-sm text-muted-foreground mt-1">Koliko ljudi će mjesečno aktivno koristiti aplikaciju?</p>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[users]}
                  onValueChange={(v) => setUsers(v[0])}
                  min={1}
                  max={1000}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  value={users}
                  onChange={(e) => setUsers(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="scans" className="text-base">Prosjek AI skeniranja po korisniku mjesečno</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Koliko računa jedan korisnik skenira prosječno mjesečno? Trenutni globalni limit je {GLOBAL_MONTHLY_SCAN_LIMIT} skeniranja za cijelu aplikaciju.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Slider
                  value={[scansPerUser]}
                  onValueChange={(v) => setScansPerUser(v[0])}
                  min={0}
                  max={250}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  max={250}
                  value={scansPerUser}
                  onChange={(e) => setScansPerUser(Math.max(0, Math.min(250, Number(e.target.value) || 0)))}
                  className="w-24"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Card className="p-4 space-y-2 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Ukupno skeniranja/mj</span>
                  <span className="font-medium">
                    {formatNum(result.effectiveScans)}
                    {result.capped && (
                      <span className="text-xs text-muted-foreground ml-1">(od {formatNum(result.rawScans)} — cap {GLOBAL_MONTHLY_SCAN_LIMIT})</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trošak AI skeniranja</span>
                  <span className="font-medium">~{formatNum(result.baseCredits)} kredita</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uz ~20% rezerve (Cloud, edge)</span>
                  <span className="font-medium">~{formatNum(result.totalCredits)} kredita/mj</span>
                </div>
              </Card>

              <Card className="p-4 space-y-2 border-primary/40 bg-primary/5">
                <div className="text-xs uppercase tracking-wide text-primary font-medium">Preporučeni plan</div>
                <div className="text-2xl font-serif">{result.plan.name}</div>
                <div className="text-sm text-muted-foreground">{result.plan.note}</div>
                <div className="text-xs text-muted-foreground">
                  Uključuje {formatNum(result.plan.credits)} kredita mjesečno.
                </div>
              </Card>

              <p className="text-xs text-muted-foreground">
                Procjena uključuje samo AI skeniranje računa. Stvarni trošak može varirati ovisno o ostalim operacijama (baza, storage, edge funkcije). Za točan pregled otvorite <span className="font-medium">Settings → Plans & credits</span> u Lovable workspace-u.
              </p>

              <a
                href="https://lovable.dev/pricing"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Pogledaj sve Lovable planove <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Natrag
            </Button>
          ) : <span />}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>
              Dalje <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={() => { setOpen(false); reset(); }}>Zatvori</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
