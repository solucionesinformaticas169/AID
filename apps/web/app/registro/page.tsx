import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const roles = ["Candidato", "EmpresaAdmin", "Reclutador", "AdministradorSistema"];

export default function RegisterPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <div className="mb-8 space-y-2">
        <h2 className="text-3xl font-semibold">Registro inicial</h2>
        <p className="text-muted-foreground">
          Flujo base para alta de usuarios y asignacion de rol principal en la plataforma.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="border-border/70 bg-white/90">
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Input placeholder="Nombres" />
            <Input placeholder="Apellidos" />
            <Input type="email" placeholder="Correo electronico" />
            <Input placeholder="Telefono" />
            <div className="md:col-span-2">
              <Input type="password" placeholder="Contrasena" />
            </div>
            <div className="md:col-span-2">
              <Button>Registrar usuario</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-gradient-to-br from-white to-accent/30">
          <CardHeader>
            <CardTitle>Roles iniciales</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {roles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
