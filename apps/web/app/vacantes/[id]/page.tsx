import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vacancies } from "@/lib/mock-data";

export default async function VacancyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vacancy = vacancies.find((item) => item.id === id);

  if (!vacancy) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <Card className="border-border/70 bg-white/90">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{vacancy.modality}</Badge>
            <Badge variant="outline">{vacancy.type}</Badge>
          </div>
          <CardTitle className="mt-4 text-3xl">{vacancy.title}</CardTitle>
          <p className="text-muted-foreground">{vacancy.company}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-muted-foreground">{vacancy.summary}</p>
          <div className="grid gap-4 rounded-2xl border border-border/70 bg-secondary/30 p-5 md:grid-cols-2">
            <p><span className="font-medium">Ubicacion:</span> {vacancy.location}</p>
            <p><span className="font-medium">Salario:</span> {vacancy.salary}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button>Postular a vacante</Button>
            <Button asChild variant="outline">
              <Link href="/">Volver al listado</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
