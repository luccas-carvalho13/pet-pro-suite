import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LifeBuoy, Mail, FileText, Bug } from "lucide-react";
import { Link } from "react-router-dom";

const SUPPORT_EMAIL = "suporte@fourpetpro.com";

const Support = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Suporte</h1>
          <p className="text-muted-foreground">Canal oficial para ajuda tecnica e acompanhamento de incidentes.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-primary" />
                Abrir atendimento
              </CardTitle>
              <CardDescription>Fale com o time de suporte via e-mail.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="font-medium">E-mail de suporte</p>
                <p className="text-muted-foreground">{SUPPORT_EMAIL}</p>
              </div>
              <Button asChild className="w-full sm:w-auto gap-2">
                <a href={`mailto:${SUPPORT_EMAIL}?subject=Suporte%20FourPet%20Pro`}>
                  <Mail className="h-4 w-4" />
                  Enviar e-mail
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Diagnostico rapido
              </CardTitle>
              <CardDescription>Informacoes uteis para abrir um chamado completo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2 rounded-lg border border-border p-3">
                <Bug className="mt-0.5 h-4 w-4 text-warning" />
                <div>
                  <p className="font-medium">Inclua o passo a passo do erro</p>
                  <p className="text-muted-foreground">Explique o que foi feito antes da falha e o resultado esperado.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Dica</Badge>
                <p className="text-muted-foreground">Anexar print da tela acelera a analise.</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto" asChild>
                <Link to="/logs">Ver logs do navegador</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Support;
