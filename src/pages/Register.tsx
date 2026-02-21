import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PawPrint, Dog, Cat, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { checkEmailAvailable, signUp } from "@/lib/api";

const phoneSchema = z
  .string()
  .min(8, "Telefone é obrigatório.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 13;
  }, "Telefone inválido.");

const registerSchema = z
  .object({
    company_name: z.string().min(2, "Nome da empresa é obrigatório."),
    company_cnpj: z
      .string()
      .optional()
      .refine((value) => {
        if (!value) return true;
        const digits = value.replace(/\D/g, "");
        return digits.length === 14;
      }, "CNPJ inválido."),
    company_phone: phoneSchema,
    company_address: z.string().optional(),
    full_name: z.string().min(2, "Seu nome é obrigatório."),
    user_phone: phoneSchema,
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirm_password: z.string().min(6, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirm_password, {
    path: ["confirm_password"],
    message: "As senhas não conferem.",
  });

type RegisterForm = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      company_name: "",
      company_cnpj: "",
      company_phone: "",
      company_address: "",
      full_name: "",
      user_phone: "",
      email: "",
      password: "",
      confirm_password: "",
    },
  });

  const onSubmit = async (values: RegisterForm) => {
    setIsLoading(true);
    try {
      const available = await checkEmailAvailable(values.email);
      if (!available) {
        setError("email", { message: "Este e-mail já está em uso." });
        setIsLoading(false);
        return;
      }
      await signUp({
        company_name: values.company_name.trim(),
        company_cnpj: values.company_cnpj?.trim() ?? "",
        company_phone: values.company_phone.trim(),
        company_address: values.company_address?.trim() ?? "",
        full_name: values.full_name.trim(),
        user_phone: values.user_phone.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });
      toast.success("Empresa e conta criadas com sucesso!");
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Erro ao criar conta.";
      const field =
        err && typeof err === "object" && "field" in err ? String((err as { field?: string }).field ?? "") : "";
      const validFields: Array<keyof RegisterForm> = [
        "company_name",
        "company_cnpj",
        "company_phone",
        "company_address",
        "full_name",
        "user_phone",
        "email",
        "password",
        "confirm_password",
      ];
      if (field && validFields.includes(field as keyof RegisterForm)) {
        setError(field as keyof RegisterForm, { message: msg });
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-[45%] xl:w-[50%] bg-primary text-primary-foreground flex-col relative overflow-hidden shrink-0">
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

      <div className="flex-1 flex flex-col bg-background min-h-screen justify-center">
        <div className="w-full max-w-2xl mx-auto px-6 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Criar conta</h1>
            <p className="text-muted-foreground mt-1">Preencha os dados da empresa e do responsável.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company_name">Nome da empresa</Label>
                <Input id="company_name" {...register("company_name")} />
                {errors.company_name && <p className="text-sm text-destructive">{errors.company_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_cnpj">CNPJ</Label>
                <Input
                  id="company_cnpj"
                  inputMode="numeric"
                  placeholder="00.000.000/0000-00"
                  {...register("company_cnpj")}
                />
                {errors.company_cnpj && <p className="text-sm text-destructive">{errors.company_cnpj.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="company_phone">Telefone da empresa</Label>
                <Input
                  id="company_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  {...register("company_phone")}
                />
                {errors.company_phone && <p className="text-sm text-destructive">{errors.company_phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company_address">Endereço</Label>
                <Input id="company_address" {...register("company_address")} />
                {errors.company_address && <p className="text-sm text-destructive">{errors.company_address.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Seu nome</Label>
                <Input id="full_name" {...register("full_name")} />
                {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user_phone">Seu telefone</Label>
                <Input
                  id="user_phone"
                  type="tel"
                  inputMode="tel"
                  placeholder="(11) 99999-9999"
                  {...register("user_phone")}
                />
                {errors.user_phone && <p className="text-sm text-destructive">{errors.user_phone.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" {...register("email")} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirmar senha</Label>
              <Input id="confirm_password" type="password" autoComplete="new-password" {...register("confirm_password")} />
              {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "Criando..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Entrar
            </Link>
          </p>
          <p className="text-center mt-4 flex items-center justify-center gap-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← Voltar ao início
            </Link>
            <Link to="/logs" className="text-sm text-muted-foreground hover:text-foreground">
              Ver logs
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
