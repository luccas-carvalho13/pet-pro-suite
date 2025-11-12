import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Calendar, Users, Package, DollarSign, BarChart3, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  const features = [
    {
      icon: Calendar,
      title: "Agendamento Inteligente",
      description: "Gerencie consultas, banhos e tosa com calendário interativo e notificações automáticas.",
    },
    {
      icon: Users,
      title: "Gestão de Clientes",
      description: "Cadastro completo de clientes e pets com histórico médico e vacinas.",
    },
    {
      icon: Package,
      title: "Controle de Estoque",
      description: "Gerenciamento de produtos, medicamentos e alertas de estoque mínimo.",
    },
    {
      icon: DollarSign,
      title: "Financeiro Completo",
      description: "Controle de receitas, despesas, fluxo de caixa e relatórios detalhados.",
    },
    {
      icon: BarChart3,
      title: "Relatórios e Análises",
      description: "Métricas de desempenho, faturamento e indicadores em tempo real.",
    },
    {
      icon: Clock,
      title: "Atendimento Rápido",
      description: "Acesso instantâneo ao histórico do pet durante o atendimento.",
    },
  ];

  const plans = [
    {
      name: "Essencial",
      price: "R$ 79",
      description: "Ideal para pequenas clínicas",
      features: [
        "Até 100 clientes",
        "1 usuário",
        "Agendamento básico",
        "Gestão de pets",
        "Suporte por email",
      ],
    },
    {
      name: "Profissional",
      price: "R$ 149",
      description: "Para clínicas em crescimento",
      features: [
        "Clientes ilimitados",
        "Até 5 usuários",
        "Agendamento completo",
        "Controle financeiro",
        "Gestão de estoque",
        "Relatórios avançados",
        "Suporte prioritário",
      ],
      popular: true,
    },
    {
      name: "Empresarial",
      price: "R$ 299",
      description: "Para grandes clínicas e redes",
      features: [
        "Tudo do Profissional",
        "Usuários ilimitados",
        "Multi-unidades",
        "API personalizada",
        "Suporte 24/7",
        "Treinamento incluso",
      ],
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">PetCare ERP</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Recursos
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
            <Link to="/auth">
              <Button variant="outline" size="sm">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="gradient-primary">Começar Grátis</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32 gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              <span>Sistema completo para petshops e clínicas veterinárias</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              Gerencie sua clínica com{" "}
              <span className="gradient-primary bg-clip-text text-transparent">simplicidade</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Tudo que você precisa em um só lugar: agendamento, atendimento, financeiro e estoque. 
              Mais tempo cuidando dos pets, menos tempo com burocracia.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary shadow-primary text-base">
                  Começar Gratuitamente
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-base">
                Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tudo que você precisa para crescer
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Um sistema completo que se adapta ao seu negócio, desde pequenas clínicas até grandes redes.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="border-2 hover:border-primary/50 transition-all hover:shadow-md">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Planos para cada tamanho de negócio
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal e comece hoje mesmo. Sem taxas de configuração.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`relative ${plan.popular ? 'border-primary border-2 shadow-primary' : 'border-2'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      Mais Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button 
                      className={`w-full ${plan.popular ? 'gradient-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Começar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              <span className="font-semibold">PetCare ERP</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 PetCare ERP. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
