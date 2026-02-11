import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  DollarSign,
  PawPrint,
  Package,
  Scissors,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { label: "Clínicas ativas", value: "+240" },
  { label: "Agendamentos/mês", value: "+18 mil" },
  { label: "Clientes gerenciados", value: "+95 mil" },
  { label: "NPS médio", value: "91" },
];

const modules = [
  {
    icon: Users,
    title: "Clientes e pets",
    description: "Cadastro completo, histórico e vínculo tutor-pet sem retrabalho.",
  },
  {
    icon: Calendar,
    title: "Agenda da clínica",
    description: "Consultas, banho e tosa organizados por dia, semana e mês.",
  },
  {
    icon: Scissors,
    title: "Serviços",
    description: "Tabela de serviços com duração, preço e comissão por categoria.",
  },
  {
    icon: Package,
    title: "Estoque",
    description: "Controle de produtos com alertas de mínimo e status de reposição.",
  },
  {
    icon: DollarSign,
    title: "Financeiro",
    description: "Receitas e despesas com visão clara de lucro e caixa mensal.",
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Exportações e indicadores para decisão da operação.",
  },
];

const plans = [
  {
    name: "Essencial",
    price: "R$ 79",
    subtitle: "Para operação inicial",
    features: ["1 usuário", "Até 120 pets", "Agenda + clientes + pets", "Suporte por e-mail"],
    cta: "Começar no Essencial",
  },
  {
    name: "Profissional",
    price: "R$ 149",
    subtitle: "Plano mais usado",
    features: ["Até 5 usuários", "Até 600 pets", "Financeiro + estoque", "Relatórios avançados"],
    cta: "Começar no Profissional",
    featured: true,
  },
  {
    name: "Empresarial",
    price: "R$ 299",
    subtitle: "Para alto volume",
    features: ["Usuários ilimitados", "Pets ilimitados", "API e integrações", "Suporte prioritário 24/7"],
    cta: "Falar com especialista",
  },
];

const compareRows = [
  ["Clientes e pets", "Sim", "Sim", "Sim"],
  ["Agenda", "Sim", "Sim", "Sim"],
  ["Serviços", "Sim", "Sim", "Sim"],
  ["Estoque", "-", "Sim", "Sim"],
  ["Financeiro", "-", "Sim", "Sim"],
  ["Relatórios avançados", "-", "Sim", "Sim"],
  ["API", "-", "-", "Sim"],
  ["Usuários", "1", "5", "Ilimitado"],
  ["Pets", "120", "600", "Ilimitado"],
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(45,212,191,0.18),transparent_40%),radial-gradient(circle_at_85%_12%,rgba(56,189,248,0.15),transparent_36%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-100 ring-1 ring-cyan-200">
              <PawPrint className="h-4 w-4 text-cyan-700" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">Pet Pro Suite</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#modulos" className="text-sm text-slate-600 transition hover:text-slate-900">Módulos</a>
            <a href="#planos" className="text-sm text-slate-600 transition hover:text-slate-900">Planos</a>
            <a href="#comparativo" className="text-sm text-slate-600 transition hover:text-slate-900">Comparativo</a>
            <Link to="/login"><Button variant="outline" size="sm" className="border-slate-300 text-slate-800">Entrar</Button></Link>
            <Link to="/register"><Button size="sm" className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600">Começar grátis</Button></Link>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="mb-6 border border-cyan-200 bg-cyan-50 px-4 py-2 text-cyan-800">
                <Sparkles className="mr-2 h-4 w-4" />
                Sistema completo para gestão de clínica veterinária
              </Badge>
              <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-slate-900 md:text-6xl">
                Gestão veterinária moderna,
                <span className="block bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">clara e sem planilhas</span>
              </h1>
              <p className="mb-8 max-w-2xl text-lg text-slate-600 md:text-xl">
                Organize clientes, pets, agenda, serviços, estoque, financeiro e relatórios em um só lugar.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link to="/register">
                  <Button size="lg" className="min-w-[220px] bg-gradient-to-r from-teal-500 to-cyan-500 text-base text-white hover:from-teal-600 hover:to-cyan-600">
                    Testar agora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="min-w-[220px] border-slate-300 bg-white text-base text-slate-800 hover:bg-slate-100">
                    Ver plataforma
                  </Button>
                </Link>
              </div>
            </div>

            <Card className="border-slate-200 bg-white/90 shadow-xl backdrop-blur">
              <CardHeader>
                <CardTitle className="text-slate-900">Resumo diário da operação</CardTitle>
                <CardDescription className="text-slate-600">Visão rápida dos pontos críticos da clínica.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Consultas hoje</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">27</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Faturamento</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">R$ 3.980</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Estoque saudável</p>
                    <p className="text-sm font-medium text-teal-700">92%</p>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <div className="h-2 w-[92%] rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((item) => (
              <Card key={item.label} className="border-slate-200 bg-white/90">
                <CardContent className="pt-6 text-center">
                  <p className="text-3xl font-semibold text-slate-900">{item.value}</p>
                  <p className="text-sm text-slate-600">{item.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="modulos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-semibold text-slate-900 md:text-5xl">Tudo que já existe no seu sistema</h2>
            <p className="mx-auto max-w-3xl text-lg text-slate-600">
              Página alinhada com os módulos reais da sua plataforma, sem inventar segmento.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((item) => (
              <Card key={item.title} className="group border-slate-200 bg-white/95 transition hover:-translate-y-1 hover:border-cyan-300 hover:shadow-lg">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-slate-900">{item.title}</CardTitle>
                  <CardDescription className="text-slate-600">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="planos" className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-semibold text-slate-900 md:text-5xl">Planos para escalar com segurança</h2>
            <p className="mx-auto max-w-2xl text-lg text-slate-600">
              Diferenças de plano aplicadas automaticamente por módulo e limite.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative border-2 ${plan.featured ? "border-cyan-400 bg-cyan-50/60 shadow-cyan-100" : "border-slate-200 bg-white"}`}>
                {plan.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-cyan-600 text-white">Mais escolhido</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl text-slate-900">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-600">{plan.subtitle}</CardDescription>
                  <div className="pt-2">
                    <span className="text-4xl font-semibold text-slate-900">{plan.price}</span>
                    <span className="text-slate-600">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-cyan-700" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link to="/register">
                    <Button className={`w-full ${plan.featured ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600" : "border-slate-300 bg-white text-slate-800 hover:bg-slate-100"}`} variant={plan.featured ? "default" : "outline"}>
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="comparativo" className="pb-20">
        <div className="container mx-auto px-4">
          <Card className="overflow-hidden border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[740px]">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-semibold text-slate-900">Recurso</th>
                    <th className="p-4 text-sm font-semibold text-slate-900">Essencial</th>
                    <th className="p-4 text-sm font-semibold text-slate-900">Profissional</th>
                    <th className="p-4 text-sm font-semibold text-slate-900">Empresarial</th>
                  </tr>
                </thead>
                <tbody>
                  {compareRows.map((row) => (
                    <tr key={row[0]} className="border-t border-slate-200">
                      <td className="p-4 text-sm font-medium text-slate-900">{row[0]}</td>
                      <td className="p-4 text-sm text-slate-600">{row[1]}</td>
                      <td className="p-4 text-sm text-slate-600">{row[2]}</td>
                      <td className="p-4 text-sm text-slate-600">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 py-16">
        <div className="container mx-auto px-4 text-center">
          <Stethoscope className="mx-auto mb-4 h-10 w-10 text-cyan-700" />
          <h3 className="mb-3 text-3xl font-semibold text-slate-900">Sua clínica mais organizada a partir de hoje</h3>
          <p className="mx-auto mb-6 max-w-2xl text-slate-600">Comece com o plano ideal e evolua conforme o crescimento da operação.</p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white hover:from-teal-600 hover:to-cyan-600">
              Criar conta agora
              <ShieldCheck className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-50 py-10">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <Link to="/" className="inline-flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100">
                  <PawPrint className="h-5 w-5 text-cyan-700" />
                </div>
                <span className="font-semibold text-slate-900">Pet Pro Suite</span>
              </Link>
              <p className="max-w-sm text-sm text-slate-600">Gestão de clínica veterinária com agenda, clientes, pets, serviços, estoque, financeiro e relatórios.</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Produto</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="#modulos" className="hover:text-slate-900">Módulos</a></li>
                <li><a href="#planos" className="hover:text-slate-900">Planos</a></li>
                <li><a href="#comparativo" className="hover:text-slate-900">Comparativo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Acesso</h4>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><Link to="/login" className="hover:text-slate-900">Entrar</Link></li>
                <li><Link to="/register" className="hover:text-slate-900">Criar conta</Link></li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-slate-200" />
          <p className="text-center text-sm text-slate-500">© {new Date().getFullYear()} Pet Pro Suite. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
