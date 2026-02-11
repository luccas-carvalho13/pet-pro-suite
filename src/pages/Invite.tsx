import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PawPrint, Dog, Cat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { getMe, inviteUser } from "@/lib/api";

const Invite = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMe().then((me) => {
      if (cancelled) return;
      setCheckingAuth(false);
      if (!me) {
        navigate("/login", { replace: true });
        return;
      }
      if (!me.is_admin) {
        toast.error("Acesso restrito a administradores.");
        navigate("/dashboard", { replace: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setIsLoading(true);
    try {
      await inviteUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      toast.success("Usuário convidado com sucesso!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Erro ao convidar. Tente novamente.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-hero">
      {/* Painel esquerdo - branding (igual Login) */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary text-primary-foreground flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 p-8 flex flex-col min-h-screen">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl text-white">
              Pet Pro <span className="text-white/90">Suite</span>
            </span>
          </Link>
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

      {/* Painel direito - formulário de convite */}
      <div className="flex-1 flex flex-col min-h-screen justify-center">
        <div className="w-full max-w-md mx-auto px-6 py-8">
          <Card className="border-border/60 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle>Convidar usuário</CardTitle>
              <CardDescription>
                Preencha os dados para criar um usuário na sua empresa.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="full_name" className="text-sm font-medium">
                    Nome
                  </label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="Nome completo"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefone
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-11"
                    autoComplete="tel"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Mín. 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading ? "Convidando..." : "Convidar"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                <Link to="/dashboard" className="text-primary font-medium hover:underline">
                  ← Voltar ao painel
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Invite;
