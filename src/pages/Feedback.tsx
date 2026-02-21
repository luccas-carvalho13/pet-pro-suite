import { FormEvent, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquareHeart } from "lucide-react";
import { toast } from "sonner";

const Feedback = () => {
  const [topic, setTopic] = useState("ux");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (message.trim().length < 10) {
      toast.error("Descreva o feedback com pelo menos 10 caracteres.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Fluxo temporario local ate integrar endpoint dedicado.
      await new Promise((resolve) => setTimeout(resolve, 300));
      toast.success("Feedback enviado. Obrigado por ajudar a melhorar o sistema.");
      setMessage("");
      setEmail("");
      setTopic("ux");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Feedback</h1>
          <p className="text-muted-foreground">Compartilhe sugestoes, pontos de melhoria ou problemas encontrados.</p>
        </div>

        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquareHeart className="h-5 w-5 text-primary" />
              Enviar feedback
            </CardTitle>
            <CardDescription>Seu retorno ajuda a priorizar os proximos ajustes.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topic">Tipo</Label>
                  <Select value={topic} onValueChange={setTopic}>
                    <SelectTrigger id="topic">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ux">Experiencia de uso</SelectItem>
                      <SelectItem value="bug">Erro ou comportamento inesperado</SelectItem>
                      <SelectItem value="feature">Nova funcionalidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-email">E-mail (opcional)</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">Mensagem</Label>
                <Textarea
                  id="feedback-message"
                  placeholder="Descreva com detalhes o que voce encontrou e como melhorar."
                  className="min-h-32"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? "Enviando..." : "Enviar feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Feedback;
