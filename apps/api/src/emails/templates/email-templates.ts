type BaseTemplateInput = {
  previewText: string;
  title: string;
  eyebrow: string;
  intro: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footer?: string;
};

type VerificationTemplateInput = {
  name: string;
  verificationUrl: string;
};

type PasswordResetTemplateInput = {
  name: string;
  resetUrl: string;
  expiresInMinutes: number;
};

type ApplicationSubmittedTemplateInput = {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  dashboardUrl: string;
};

type NewApplicationTemplateInput = {
  recruiterName: string;
  candidateName: string;
  jobTitle: string;
  dashboardUrl: string;
};

type JobPublishedTemplateInput = {
  recipientName: string;
  jobTitle: string;
  companyName: string;
  publicJobUrl?: string;
  dashboardUrl: string;
};

export function renderVerificationTemplate(input: VerificationTemplateInput) {
  return renderEmailLayout({
    previewText: "Verifica tu correo para activar AIDLABORAL",
    eyebrow: "Verificacion de correo",
    title: "Activa tu cuenta en AIDLABORAL",
    intro: `Hola ${input.name}, ya casi esta lista tu cuenta.`,
    bodyHtml:
      "<p>Confirma tu correo para proteger tu acceso, recuperar tu contrasena y recibir notificaciones del ATS.</p>",
    ctaLabel: "Verificar correo",
    ctaUrl: input.verificationUrl,
    footer: "Si no creaste esta cuenta, puedes ignorar este mensaje.",
  });
}

export function renderPasswordResetTemplate(input: PasswordResetTemplateInput) {
  return renderEmailLayout({
    previewText: "Restablece tu contrasena de AIDLABORAL",
    eyebrow: "Seguridad de cuenta",
    title: "Recupera el acceso a tu cuenta",
    intro: `Hola ${input.name}, recibimos una solicitud para restablecer tu contrasena.`,
    bodyHtml:
      `<p>Usa el siguiente enlace seguro para definir una nueva contrasena. Por seguridad, el enlace expira en ${input.expiresInMinutes} minutos.</p>`,
    ctaLabel: "Restablecer contrasena",
    ctaUrl: input.resetUrl,
    footer: "Si no solicitaste este cambio, te recomendamos revisar la seguridad de tu correo.",
  });
}

export function renderApplicationSubmittedTemplate(input: ApplicationSubmittedTemplateInput) {
  return renderEmailLayout({
    previewText: `Tu postulacion a ${input.jobTitle} fue registrada`,
    eyebrow: "Postulacion registrada",
    title: "Tu candidatura ya esta en proceso",
    intro: `Hola ${input.candidateName}, tu postulacion a ${input.jobTitle} fue enviada a ${input.companyName}.`,
    bodyHtml:
      "<p>Desde tu panel podras seguir el timeline, revisar compatibilidad ATS y estar al tanto de cualquier cambio de estado.</p>",
    ctaLabel: "Ver mis postulaciones",
    ctaUrl: input.dashboardUrl,
  });
}

export function renderNewApplicationTemplate(input: NewApplicationTemplateInput) {
  return renderEmailLayout({
    previewText: `Nuevo candidato para ${input.jobTitle}`,
    eyebrow: "Nuevo postulante",
    title: "Tienes una nueva postulacion",
    intro: `Hola ${input.recruiterName}, ${input.candidateName} acaba de postularse a ${input.jobTitle}.`,
    bodyHtml:
      "<p>Entra al dashboard para revisar compatibilidad, experiencia y timeline de la candidatura.</p>",
    ctaLabel: "Revisar postulacion",
    ctaUrl: input.dashboardUrl,
  });
}

export function renderJobPublishedTemplate(input: JobPublishedTemplateInput) {
  const publicLink = input.publicJobUrl
    ? `<p>Puedes revisar la vacante publicada aqui: <a href="${input.publicJobUrl}" style="color:#0f766e;text-decoration:none;">${input.publicJobUrl}</a></p>`
    : "";

  return renderEmailLayout({
    previewText: `${input.jobTitle} ya esta publicada`,
    eyebrow: "Vacante publicada",
    title: "Tu vacante ya esta visible",
    intro: `Hola ${input.recipientName}, la vacante ${input.jobTitle} de ${input.companyName} ya fue publicada.`,
    bodyHtml:
      `<p>Desde el panel de empresa puedes seguir rendimiento, postulantes y estado del plan.</p>${publicLink}`,
    ctaLabel: "Abrir panel empresa",
    ctaUrl: input.dashboardUrl,
  });
}

function renderEmailLayout(input: BaseTemplateInput) {
  const ctaBlock =
    input.ctaLabel && input.ctaUrl
      ? `<div style="margin:32px 0 24px;"><a href="${input.ctaUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:14px 24px;border-radius:14px;text-decoration:none;font-weight:600;">${input.ctaLabel}</a></div>`
      : "";

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f7f8;font-family:Arial,sans-serif;color:#12202a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.previewText)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:28px;overflow:hidden;box-shadow:0 16px 45px rgba(15,23,42,0.10);">
            <tr>
              <td style="padding:32px;background:linear-gradient(135deg,#0f766e,#164e63);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.82;">AIDLABORAL S.A.S</div>
                <h1 style="margin:12px 0 0;font-size:32px;line-height:1.15;">${escapeHtml(input.title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <div style="display:inline-block;padding:6px 12px;border-radius:999px;background:#ecfeff;color:#155e75;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
                <p style="margin:24px 0 0;font-size:18px;line-height:1.6;color:#0f172a;">${escapeHtml(input.intro)}</p>
                <div style="margin-top:20px;font-size:15px;line-height:1.8;color:#334155;">${input.bodyHtml}</div>
                ${ctaBlock}
                <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;line-height:1.7;color:#64748b;">
                  ${escapeHtml(input.footer ?? "Este correo fue generado automaticamente por AIDLABORAL.")}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
