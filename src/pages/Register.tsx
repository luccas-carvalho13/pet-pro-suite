import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PawPrint, Send, Sparkles, Dog, Cat } from "lucide-react";
import { toast } from "sonner";
import { signUp, checkEmailAvailable } from "@/lib/api";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterStep = "company" | "cnpj" | "company_phone" | "address" | "name" | "user_phone" | "email" | "password";
type ChatMessage = { role: "assistant" | "user"; content: string };

const REGISTER_PROMPTS: Record<RegisterStep, string> = {
  company: "Qual o nome da sua empresa ou clínica? 🏢",
  cnpj: "Informe o CNPJ da empresa (apenas números ou com pontuação) 📋",
  company_phone: "Qual o telefone da empresa? 📞",
  address: "Endereço completo (rua, número, bairro, cidade). Pode pular digitando - 📍",
  name: "Agora informe seu nome (responsável pela empresa) ✨",
  user_phone: "Qual seu telefone (do responsável)? 📱",
  email: "Informe seu melhor e-mail 📧",
  password: "Por último, crie uma senha segura (mín. 6 caracteres) 🔐",
};

const TYPING_DELAY_MS = 700;

const Register = () => {
  const navigate = useNavigate();
  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [registerStep, setRegisterStep] = useState<RegisterStep>("company");
  const [registerChatHistory, setRegisterChatHistory] = useState<ChatMessage[]>([
    { role: "assistant", content: "Cadastre sua empresa e sua conta" },
    { role: "assistant", content: REGISTER_PROMPTS.company },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerPayload, setRegisterPayload] = useState<{
    company_name: string;
    company_cnpj: string;
    company_phone: string;
    company_address: string;
    full_name: string;
    user_phone: string;
    email: string;
  }>({
    company_name: "",
    company_cnpj: "",
    company_phone: "",
    company_address: "",
    full_name: "",
    user_phone: "",
    email: "",
  });
  const [fieldError, setFieldError] = useState<string>("");
  const [checkingEmail, setCheckingEmail] = useState(false);

  useEffect(() => {
    scrollBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [registerChatHistory, isTyping, registerStep]);

  useEffect(() => {
    if (!isTyping) {
      const t = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [registerStep, isTyping]);

  const pushUserAndNextAssistant = (
    userContent: string,
    nextPrompt: string,
    nextStep: RegisterStep
  ) => {
    setFieldError("");
    if (nextStep === "cnpj") setRegisterPayload((p) => ({ ...p, company_name: userContent }));
    if (nextStep === "company_phone") setRegisterPayload((p) => ({ ...p, company_cnpj: userContent }));
    if (nextStep === "address") setRegisterPayload((p) => ({ ...p, company_phone: userContent }));
    if (nextStep === "name") setRegisterPayload((p) => ({ ...p, company_address: userContent === "-" ? "" : userContent }));
    if (nextStep === "user_phone") setRegisterPayload((p) => ({ ...p, full_name: userContent }));
    if (nextStep === "email") setRegisterPayload((p) => ({ ...p, user_phone: userContent }));
    if (nextStep === "password") setRegisterPayload((p) => ({ ...p, email: userContent }));
    setRegisterChatHistory((h) => [...h, { role: "user", content: userContent === "-" ? "Pular" : userContent }]);
    setCompanyName("");
    setCnpj("");
    setCompanyPhone("");
    setAddress("");
    setName("");
    setUserPhone("");
    setEmail("");
    setPassword("");
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setRegisterChatHistory((h) => [...h, { role: "assistant", content: nextPrompt }]);
      setRegisterStep(nextStep);
    }, TYPING_DELAY_MS);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldError("");

    if (registerStep === "company") {
      const v = companyName.trim();
      if (!v) {
        setFieldError("Informe o nome da empresa.");
        return;
      }
      if (v.length < 2) {
        setFieldError("Nome da empresa deve ter pelo menos 2 caracteres.");
        return;
      }
      pushUserAndNextAssistant(v, REGISTER_PROMPTS.cnpj, "cnpj");
      return;
    }
    if (registerStep === "cnpj" && cnpj.trim()) {
      pushUserAndNextAssistant(cnpj.trim(), REGISTER_PROMPTS.company_phone, "company_phone");
      return;
    }
    if (registerStep === "company_phone") {
      const v = companyPhone.trim();
      if (!v) {
        setFieldError("Informe o telefone da empresa.");
        return;
      }
      pushUserAndNextAssistant(v, REGISTER_PROMPTS.address, "address");
      return;
    }
    if (registerStep === "address") {
      const val = address.trim() || "-";
      pushUserAndNextAssistant(val, REGISTER_PROMPTS.name, "name");
      return;
    }
    if (registerStep === "name") {
      const v = name.trim();
      if (!v) {
        setFieldError("Informe seu nome.");
        return;
      }
      if (v.length < 2) {
        setFieldError("Nome deve ter pelo menos 2 caracteres.");
        return;
      }
      pushUserAndNextAssistant(v, REGISTER_PROMPTS.user_phone, "user_phone");
      return;
    }
    if (registerStep === "user_phone") {
      const v = userPhone.trim();
      if (!v) {
        setFieldError("Informe seu telefone.");
        return;
      }
      pushUserAndNextAssistant(v, REGISTER_PROMPTS.email, "email");
      return;
    }
    if (registerStep === "email") {
      const v = email.trim().toLowerCase();
      if (!v) {
        setFieldError("Informe seu e-mail.");
        return;
      }
      if (!EMAIL_REGEX.test(v)) {
        setFieldError("Digite um e-mail válido (ex: seu@email.com).");
        return;
      }
      setCheckingEmail(true);
      try {
        const available = await checkEmailAvailable(v);
        if (!available) {
          setFieldError("Este e-mail já está em uso. Digite outro.");
          return;
        }
        pushUserAndNextAssistant(v, REGISTER_PROMPTS.password, "password");
      } finally {
        setCheckingEmail(false);
      }
      return;
    }
    if (registerStep === "password") {
      if (!password) {
        setFieldError("Crie uma senha.");
        return;
      }
      if (password.length < 6) {
        setFieldError("A senha deve ter no mínimo 6 caracteres.");
        return;
      }
      if (!registerPayload.email.trim()) {
        setFieldError("E-mail inválido.");
        return;
      }
      if (!registerPayload.full_name.trim()) {
        setFieldError("Nome inválido.");
        return;
      }
      if (!registerPayload.company_name.trim()) {
        setFieldError("Nome da empresa inválido.");
        return;
      }
      setIsCreatingAccount(true);
      setRegisterChatHistory((h) => [...h, { role: "user", content: "••••••••" }]);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setRegisterChatHistory((h) => [
          ...h,
          { role: "assistant", content: "Perfeito! Criando sua empresa e conta... ✨" },
        ]);
      }, TYPING_DELAY_MS);
      setIsLoading(true);
      setFieldError("");
      try {
        await signUp({
          company_name: registerPayload.company_name.trim(),
          company_cnpj: registerPayload.company_cnpj.trim(),
          company_phone: registerPayload.company_phone.trim(),
          company_address: registerPayload.company_address.trim(),
          full_name: registerPayload.full_name.trim(),
          user_phone: registerPayload.user_phone.trim(),
          email: registerPayload.email.trim(),
          password,
        });
        toast.success("Empresa e conta criadas com sucesso!");
        navigate("/dashboard");
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message: string }).message)
            : "Erro ao criar conta.";
        const isEmailInUse = /já está em uso|em uso|already in use/i.test(msg);
        if (isEmailInUse) {
          setRegisterStep("email");
          setEmail(registerPayload.email.trim());
          setFieldError("Este e-mail já está em uso. Digite outro e-mail.");
          setRegisterChatHistory((h) => [
            ...h.slice(0, -2),
            { role: "assistant", content: "Este e-mail já está em uso. Por favor, informe outro e-mail. 📧" },
          ]);
          toast.error("E-mail já em uso. Digite outro e-mail.");
        } else {
          toast.error(msg);
        }
      } finally {
        setIsLoading(false);
        setIsCreatingAccount(false);
      }
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-hero">
      {/* Painel esquerdo */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary text-primary-foreground flex-col relative overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative z-10 p-8 flex flex-col h-full">
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

      {/* Painel direito - chat de cadastro: scroll só na área do chat */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex flex-col h-full max-w-lg w-full mx-auto px-6 py-6 overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-lg backdrop-blur">
          <div className="flex items-center gap-3 mb-4 shrink-0">
            <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                <PawPrint className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-foreground">Pet Pro Assistente</p>
              <p className="text-sm text-muted-foreground">Criação de conta</p>
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 pr-2 -mr-2">
            <div className="space-y-4 pb-4">
              {registerChatHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
                >
                  {msg.role === "assistant" ? (
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 text-sm text-foreground max-w-[85%]">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 text-sm max-w-[85%]">
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 flex gap-1.5 items-center min-h-[2.75rem]">
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
                    <span className="typing-dot w-2 h-2 rounded-full bg-muted-foreground/70" />
                  </div>
                </div>
              )}
            </div>
            <div ref={scrollBottomRef} />
          </ScrollArea>

          <div
            key={registerStep}
            className="pt-4 space-y-2 flex-shrink-0"
          >
            {!isCreatingAccount && (
              <form onSubmit={handleRegister} className="space-y-4">
                {registerStep === "company" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Ex: Clínica Pet Feliz"
                        value={companyName}
                        onChange={(e) => { setCompanyName(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!companyName.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "cnpj" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="00.000.000/0001-00 ou apenas números"
                        value={cnpj}
                        onChange={(e) => { setCnpj(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!cnpj.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "company_phone" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="tel"
                        placeholder="Telefone da empresa — (11) 3456-7890"
                        value={companyPhone}
                        onChange={(e) => { setCompanyPhone(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!companyPhone.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "user_phone" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="tel"
                        placeholder="Seu telefone — (11) 98765-4321"
                        value={userPhone}
                        onChange={(e) => { setUserPhone(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!userPhone.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "address" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Rua, número, bairro, cidade. Ou - para pular"
                        value={address}
                        onChange={(e) => { setAddress(e.target.value); setFieldError(""); }}
                        className="flex-1 h-11"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "name" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="text"
                        placeholder="Digite seu nome"
                        value={name}
                        onChange={(e) => { setName(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!name.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "email" && (
                  <div className="space-y-1.5">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="email"
                        placeholder="Digite seu e-mail (ex: seu@email.com)"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setFieldError(""); }}
                        className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                        disabled={!email.trim() || checkingEmail}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                    {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                  </div>
                )}
                {registerStep === "password" && (
                  <div className="space-y-2">
                    <div className="space-y-1.5">
                      <div className="flex gap-2">
                        <Input
                          ref={inputRef}
                          type="password"
                          placeholder="Mín. 6 caracteres"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setFieldError(""); }}
                          className={`flex-1 h-11 ${fieldError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="h-11 w-11 shrink-0 bg-primary hover:bg-primary/90"
                          disabled={isLoading}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                      {fieldError && <p className="text-sm text-destructive">{fieldError}</p>}
                      {password.length > 0 && password.length < 6 && (
                        <p className="text-xs text-muted-foreground">Faltam {6 - password.length} caracteres (mín. 6)</p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-muted-foreground text-sm h-auto py-1 hover:bg-muted hover:text-foreground"
                      onClick={() => { setRegisterStep("email"); setFieldError(""); }}
                    >
                      Voltar
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ao criar uma conta você concorda com nossos{" "}
                  <Link to="#" className="text-primary hover:underline underline-offset-2">
                    Termos de Uso
                  </Link>{" "}
                  e{" "}
                  <Link to="#" className="text-primary hover:underline underline-offset-2">
                    Política de Privacidade
                  </Link>
                  .
                </p>
                <p className="text-sm text-muted-foreground">
                  Já tem conta?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Entrar
                  </Link>
                </p>
                <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground mt-2">
                  ← Voltar ao início
                </Link>
              </form>
            )}
            {isCreatingAccount && (
              <div className="py-3 text-center text-sm text-muted-foreground">
                Criando sua conta...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
