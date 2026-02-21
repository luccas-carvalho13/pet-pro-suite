import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Dog, Cat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
      toast.success("Login realizado com sucesso!");
      const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Erro ao entrar. Verifique e-mail e senha.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-hero">
      {/* Painel esquerdo - branding */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary text-primary-foreground flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 p-8 flex flex-col min-h-screen">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">FourPet Pro</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-white/80">Gestão inteligente para negócios de quatro patas.</p>
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-3xl bg-white/95 p-10 flex flex-col items-center justify-center gap-6 shadow-2xl border border-white/50">
              <div className="flex items-center justify-center gap-6">
                <Dog className="h-14 w-14 text-primary shrink-0" />
                <PawPrint className="h-20 w-20 text-primary shrink-0" strokeWidth={2} />
                <Cat className="h-14 w-14 text-primary shrink-0" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center text-white/80 text-sm">
            <div className="h-8 w-8 rounded bg-white/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <Link to="#" className="hover:underline hover:text-white transition-colors">
              Privacidade
            </Link>
            <span className="text-white/50">–</span>
            <Link to="#" className="hover:underline hover:text-white transition-colors">
              Termos
            </Link>
          </div>
        </div>
      </div>

      {/* Painel direito - formulário */}
      <div className="flex-1 flex flex-col min-h-screen justify-center">
        <div className="w-full max-w-md mx-auto px-6 py-8">
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Entrar na sua conta</CardTitle>
              <CardDescription>
                Digite seu e-mail e senha para acessar o sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="current-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <div className="space-y-3 text-center text-sm text-muted-foreground">
                <p>
                  Ainda não tem conta?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Criar conta
                  </Link>
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Link to="/" className="hover:text-foreground">
                    ← Voltar ao início
                  </Link>
                  <Link to="/logs" className="hover:text-foreground">
                    Ver logs
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
