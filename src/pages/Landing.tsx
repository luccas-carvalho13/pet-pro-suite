import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight,
  Cat,
  Dog,
  HeartHandshake,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";

const menuItems = [
  { label: "Recursos", href: "#recursos" },
  { label: "Planos", href: "#planos" },
  { label: "Resultados", href: "#resultados" },
  { label: "Contato", href: "#contato" },
];

const quickFacts = [
  { value: "+450", label: "pet shops ativos" },
  { value: "R$ 18 mi", label: "faturados por mês" },
  { value: "-35%", label: "tempo no atendimento" },
];

const categories = [
  {
    icon: Dog,
    title: "PDV + Estoque",
    description: "Venda produto e serviço no mesmo caixa com baixa automática no estoque.",
  },
  {
    icon: Scissors,
    title: "Agenda de banho e tosa",
    description: "Agendamentos, confirmação por WhatsApp e controle de profissionais em tempo real.",
  },
  {
    icon: Stethoscope,
    title: "Prontuário e vacinas",
    description: "Histórico do pet, alertas de retorno e campanhas para vacinação recorrente.",
  },
  {
    icon: HeartHandshake,
    title: "CRM e fidelização",
    description: "Programa de pontos, lembretes automáticos e ofertas segmentadas por perfil.",
  },
];

const topPlans = [
  {
    name: "Plano Start",
    description: "Ideal para 1 unidade com PDV, estoque e cadastro de clientes.",
    price: "R$ 149/mês",
    badge: "Para começar",
  },
  {
    name: "Plano Growth",
    description: "Inclui agenda, automações de retorno e relatórios financeiros completos.",
    price: "R$ 249/mês",
    badge: "Mais escolhido",
  },
  {
    name: "Plano Scale",
    description: "Multiunidades, gestão avançada de equipe e suporte prioritário.",
    price: "R$ 399/mês",
    badge: "Operação avançada",
  },
];

const trustItems = [
  {
    icon: Truck,
    title: "Implantação em 48h",
    description: "Onboarding prático para sua equipe operar rápido, sem travar a rotina.",
  },
  {
    icon: ShieldCheck,
    title: "Dados seguros",
    description: "Backups automáticos, controle de acesso por perfil e infraestrutura monitorada.",
  },
  {
    icon: Sparkles,
    title: "Suporte humano",
    description: "Atendimento no WhatsApp com especialistas em operação de pet shops.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[#f3e9e6] px-3 py-4 text-slate-800 sm:px-6 sm:py-6">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_8%,rgba(255,255,255,0.65),transparent_38%),radial-gradient(circle_at_85%_8%,rgba(255,227,186,0.35),transparent_32%),linear-gradient(180deg,#f3e9e6_0%,#efe4df_100%)]" />

      <div className="mx-auto max-w-7xl rounded-[34px] border border-white/80 bg-[#fffdfa] p-4 shadow-[0_28px_90px_-60px_rgba(52,42,35,0.65)] sm:p-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffcd7f] text-[#3f3d37] shadow-[inset_0_-6px_12px_rgba(236,168,72,0.45)]">
              <Cat className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none [font-family:'Sora',ui-sans-serif,system-ui]">FourPet Pro</p>
              <p className="text-xs text-slate-500">Gestão inteligente para negócios de quatro patas.</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {menuItems.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-9 w-9 rounded-full border border-[#efe2db] bg-white text-slate-600 hover:bg-[#fff4ea]"
              aria-label="Buscar recursos"
            >
              <Search className="h-4 w-4" />
            </Button>
            <Link to="/login">
              <Button variant="outline" className="rounded-full border-[#ebddd5] bg-white text-slate-700">
                Entrar
              </Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-full bg-[#ffbf66] text-slate-900 hover:bg-[#ffb64e]">Criar conta</Button>
            </Link>
          </div>
        </header>

        <section className="grid gap-12 pb-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div className="animate-landing-rise">
            <Badge className="rounded-full border border-[#ffe2b7] bg-[#fff4df] px-4 py-2 text-[#9d6220]">
              Plataforma de gestão para pet shop
            </Badge>

            <h1 className="mt-6 max-w-xl text-4xl font-semibold uppercase leading-[1.05] tracking-tight text-slate-800 md:text-6xl [font-family:'Sora',ui-sans-serif,system-ui]">
              O sistema que organiza sua operação e acelera suas vendas.
            </h1>

            <p className="mt-5 max-w-lg text-base text-slate-600 md:text-lg [font-family:'Nunito Sans',ui-sans-serif,system-ui]">
              Controle caixa, estoque, agenda, clientes e serviços em um painel simples. Menos retrabalho no balcão,
              mais previsibilidade no faturamento e atendimento mais rápido.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="rounded-full bg-[#ffbf66] px-8 text-base text-slate-900 hover:bg-[#ffb64e]">
                  Testar grátis
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#planos">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-[#ead9d0] bg-white px-8 text-base text-slate-700 hover:bg-[#fff7f2]"
                >
                  Ver planos
                </Button>
              </a>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {quickFacts.map((fact) => (
                <Card key={fact.label} className="rounded-2xl border-[#efe2db] bg-white/90 shadow-none">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-semibold text-slate-900 [font-family:'Sora',ui-sans-serif,system-ui]">{fact.value}</p>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{fact.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-[420px] w-full max-w-[530px] overflow-hidden rounded-[32px] border border-[#f2e5de] bg-[radial-gradient(circle_at_16%_12%,#fff7ef_0%,#fffcf8_38%,#fffcf8_100%)] p-6">
            <div className="absolute inset-x-16 bottom-12 h-28 rounded-[42%_58%_57%_43%/38%_38%_62%_62%] bg-gradient-to-r from-[#f6cf8f] via-[#f7bf6f] to-[#f6cf8f] opacity-80" />

            <div className="animate-landing-float absolute left-1/2 top-16 -translate-x-1/2">
              <div className="relative flex h-52 w-52 items-center justify-center rounded-[35%_65%_53%_47%/47%_35%_65%_53%] bg-[#2d3644] shadow-[0_34px_54px_-32px_rgba(19,24,34,0.9)]">
                <div className="absolute inset-2 rounded-[inherit] border border-white/25" />
                <Dog className="h-28 w-28 text-white" strokeWidth={1.8} />
              </div>
            </div>

            <div className="absolute right-7 top-10 rotate-6">
              <div className="animate-landing-chip rounded-2xl border border-[#f4e5dd] bg-white px-4 py-3 shadow-[0_16px_30px_-26px_rgba(26,24,20,0.9)]">
                <p className="text-xs font-semibold text-slate-700">Agenda online</p>
                <p className="text-xs text-[#ba7a2f]">Confirmação automática</p>
              </div>
            </div>

            <div className="absolute left-6 bottom-16 -rotate-6">
              <div className="animate-landing-chip landing-chip-delay-1 rounded-2xl border border-[#f4e5dd] bg-white px-4 py-3 shadow-[0_16px_30px_-26px_rgba(26,24,20,0.9)]">
                <p className="text-xs font-semibold text-slate-700">PDV integrado</p>
                <p className="text-xs text-[#ba7a2f]">Venda + serviço no caixa</p>
              </div>
            </div>

            <div className="absolute bottom-9 right-8 rotate-12">
              <div className="animate-landing-chip landing-chip-delay-2 rounded-2xl border border-[#f4e5dd] bg-white px-4 py-3 shadow-[0_16px_30px_-26px_rgba(26,24,20,0.9)]">
                <p className="text-xs font-semibold text-slate-700">Estoque inteligente</p>
                <p className="text-xs text-[#ba7a2f]">Alerta de reposição</p>
              </div>
            </div>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-[#e8ddd5] bg-white/85 px-4 py-1 text-xs text-slate-500">
              Feito para lojas, banho e tosa e clínicas pet
            </div>
          </div>
        </section>

        <section id="recursos" className="border-t border-[#f1e6df] pt-12">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#b47a39]">Recursos</p>
              <h2 className="text-3xl font-semibold text-slate-900 [font-family:'Sora',ui-sans-serif,system-ui]">
                Tudo que um pet shop precisa para operar sem caos
              </h2>
            </div>
            <a href="#planos" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
              Ver planos
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <Card key={item.title} className="rounded-2xl border-[#ede0d8] bg-white shadow-none transition hover:-translate-y-1 hover:border-[#e3c8af]">
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#fff1df] text-[#b67834]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="planos" className="py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-3xl font-semibold text-slate-900 [font-family:'Sora',ui-sans-serif,system-ui]">Planos mais escolhidos</h2>
            <Badge className="rounded-full border border-[#ffe2b7] bg-[#fff4df] text-[#9d6220]">14 dias grátis</Badge>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {topPlans.map((product) => (
              <Card key={product.name} className="rounded-2xl border-[#eaded7] bg-white shadow-none">
                <CardContent className="p-5">
                  <Badge className="mb-4 rounded-full bg-[#ffeecf] text-[#97601f]">{product.badge}</Badge>
                  <h3 className="text-xl font-semibold text-slate-900">{product.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{product.description}</p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="text-2xl font-semibold text-slate-900">{product.price}</span>
                    <Button className="rounded-full bg-[#273140] text-white hover:bg-[#1f2732]">Assinar</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="resultados" className="rounded-3xl border border-[#eddfd7] bg-[#fff8f1] p-6">
          <div className="mb-5">
            <p className="text-sm font-medium text-[#b47a39]">Resultados</p>
            <h2 className="text-2xl font-semibold text-slate-900 [font-family:'Sora',ui-sans-serif,system-ui]">
              Tecnologia com foco no caixa e na experiência do tutor
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {trustItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#efdccf] bg-white p-4">
                <div className="mb-3 inline-flex rounded-lg bg-[#fff0db] p-2 text-[#b67834]">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <footer id="contato" className="pt-12">
          <Separator className="bg-[#ecdfd8]" />
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 text-sm text-slate-600">
            <p>© {new Date().getFullYear()} FourPet Pro. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-slate-900">
                Entrar
              </Link>
              <Link to="/register" className="hover:text-slate-900">
                Criar conta
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
