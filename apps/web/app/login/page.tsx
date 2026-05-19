import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-xl px-6 py-14">
      <Card className="w-full border-border/70 bg-white/90">
        <CardHeader>
          <CardTitle>Ingreso a la plataforma</CardTitle>
          <p className="text-sm text-muted-foreground">
            Pantalla base para autenticacion con JWT, lista para conectar con la API de NestJS.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input type="email" placeholder="correo@empresa.com" />
          <Input type="password" placeholder="Contrasena" />
          <Button className="w-full">Iniciar sesion</Button>
        </CardContent>
      </Card>
    </main>
  );
}
