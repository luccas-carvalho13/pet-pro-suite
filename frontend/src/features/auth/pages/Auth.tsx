import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Heart, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { plansService, type Plan } from "@/api/services/plans.service";
import { authService } from "@/api/services/auth.service";

const Auth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Form states
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    password: "",
    clinicName: "",
    cnpj: "",
    phone: "",
    address: "",
    acceptTerms: false,
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const plansData = await plansService.getAll();
      setPlans(plansData);
      
      // Selecionar plano trial por padrão
      const trialPlan = plansData.find(p => p.is_trial);
      if (trialPlan) {
        setSelectedPlanId(trialPlan.id);
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authService.signIn(email, password);
      toast.success("Login realizado com sucesso!");
      // Recarregar página para atualizar useAuth
      window.location.href = "/dashboard";
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!registerData.acceptTerms) {
      toast.error("Você deve aceitar os termos e políticas para continuar");
      return;
    }

    if (!selectedPlanId) {
      toast.error("Selecione um plano para continuar");
      return;
    }

    setIsLoading(true);

    try {
      // Gerar slug único baseado no nome da clínica
      const slug = registerData.clinicName
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      // Chamar Edge Function para registrar tenant
      const result = await authService.registerTenant({
        fullName: registerData.fullName,
        email: registerData.email,
        password: registerData.password,
        clinicName: registerData.clinicName,
        slug,
        cnpj: registerData.cnpj || undefined,
        phone: registerData.phone || undefined,
        address: registerData.address || undefined,
        planId: selectedPlanId,
      });

      toast.success("Conta criada com sucesso! Redirecionando...");
      
      // Recarregar página para atualizar useAuth
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isTrialPlan = selectedPlan?.is_trial;

  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link to="/" className="flex items-center gap-2 justify-center mb-8">
          <Heart className="h-8 w-8 text-primary" />
          <span className="font-bold text-2xl">PetCare ERP</span>
        </Link>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Bem-vindo</CardTitle>
            <CardDescription>
              Entre na sua conta ou crie uma nova para começar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Senha</Label>
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-6">
                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                    <div className="space-y-2">
                      <Label htmlFor="register-fullname">Nome Completo</Label>
                      <Input
                        id="register-fullname"
                        type="text"
                        placeholder="João Silva"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  {/* Dados da Clínica */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dados da Clínica</h3>
                    <div className="space-y-2">
                      <Label htmlFor="register-clinic">Nome da Clínica</Label>
                      <Input
                        id="register-clinic"
                        type="text"
                        placeholder="Clínica Veterinária Exemplo"
                        value={registerData.clinicName}
                        onChange={(e) => setRegisterData({ ...registerData, clinicName: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="register-cnpj">CNPJ (opcional)</Label>
                        <Input
                          id="register-cnpj"
                          type="text"
                          placeholder="00.000.000/0000-00"
                          value={registerData.cnpj}
                          onChange={(e) => setRegisterData({ ...registerData, cnpj: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="register-phone">Telefone</Label>
                        <Input
                          id="register-phone"
                          type="tel"
                          placeholder="(11) 99999-9999"
                          value={registerData.phone}
                          onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-address">Endereço (opcional)</Label>
                      <Input
                        id="register-address"
                        type="text"
                        placeholder="Rua, número, bairro, cidade"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Seleção de Plano */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Escolha seu Plano</h3>
                    {loadingPlans ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                      </div>
                    ) : (
                      <RadioGroup value={selectedPlanId} onValueChange={setSelectedPlanId}>
                        <div className="space-y-3">
                          {plans.map((plan) => (
                            <div
                              key={plan.id}
                              className={`
                                flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-all
                                ${selectedPlanId === plan.id ? "border-primary bg-primary/5" : "border-muted"}
                              `}
                              onClick={() => setSelectedPlanId(plan.id)}
                            >
                              <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                              <div className="flex-1">
                                <Label htmlFor={plan.id} className="cursor-pointer">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="font-semibold">{plan.name}</span>
                                      {plan.is_trial && (
                                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                          14 dias grátis
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      {plan.price === 0 ? (
                                        <span className="text-lg font-bold text-green-600">Grátis</span>
                                      ) : (
                                        <span className="text-lg font-bold">
                                          R$ {plan.price.toFixed(2)}/mês
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {plan.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {plan.description}
                                    </p>
                                  )}
                                </Label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </RadioGroup>
                    )}
                    
                    {isTrialPlan && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                        <strong>Plano Trial:</strong> Você terá 14 dias grátis para testar todas as funcionalidades. 
                        Não é necessário cartão de crédito.
                      </div>
                    )}
                  </div>

                  {/* Termos */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="accept-terms"
                      checked={registerData.acceptTerms}
                      onCheckedChange={(checked) => 
                        setRegisterData({ ...registerData, acceptTerms: checked === true })
                      }
                    />
                    <Label htmlFor="accept-terms" className="text-sm cursor-pointer">
                      Eu aceito os{" "}
                      <a href="#" className="text-primary hover:underline">
                        Termos de Serviço
                      </a>{" "}
                      e{" "}
                      <a href="#" className="text-primary hover:underline">
                        Política de Privacidade
                      </a>
                    </Label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-primary"
                    disabled={isLoading || !registerData.acceptTerms || !selectedPlanId}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Já tem uma conta?{" "}
          <Link to="/auth" className="text-primary hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
