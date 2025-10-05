# 🔐 Checklist de rotación de credenciales IOpeer

> Referencia operativa para rotar secretos sin comprometer ambientes. No almacenar llaves reales en el repositorio; usar `.env.local`, `env.example` o gestores de secretos externos.

## Frecuencia sugerida
- 🔄 **Mensual**: claves Supabase (anon/service role) y tokens Slack.
- 🔄 **Trimestral**: credenciales OAuth (Gmail) y tokens de despliegue (Vercel, GitHub PAT).
- 🔄 **Ante incidente**: cualquier exposición o alerta de seguridad.

## Pasos generales
1. Inventariar secretos activos y validar responsables.
2. Generar nuevas credenciales en el proveedor correspondiente.
3. Actualizar `env.example` con placeholders representativos (sin credenciales reales).
4. Rotar valores en los entornos gestionados (Supabase, Vercel, GitHub Actions, Slack, etc.).
5. Invalidar las claves anteriores y documentar fecha/hora de cambio.
6. Ejecutar smoke tests y monitorear métricas/alertas durante al menos 30 minutos.

## Elementos a rotar
- Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE`.
- Gmail OAuth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`.
- Slack: `SLACK_WEBHOOK_URL`, tokens de bots y apps internas.
- Vercel: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
- GitHub: PAT para CI/CD y automatizaciones (`ACTIONS_DEPLOY_TOKEN`, etc.).

## Buenas prácticas
- Documentar el responsable y la fecha de la última rotación en un registro interno.
- Usar un gestor centralizado (1Password, Vault, Doppler, etc.) para distribuir secretos.
- Implementar alertas sobre accesos inusuales o uso de llaves revocadas.
- Mantener `env.example` como fuente de verdad de variables esperadas.
- Validar que ninguna credencial queda en logs, commits o archivos temporales.

## Connection.secret_ref
- Los modelos `Connection` deben almacenar referencias (`secret_ref`) que se resuelven en el servidor desde `process.env` o un KV seguro.
- **No** persistir secretos planos en la base de datos.
- TODO: evaluar cifrado en reposo/`KMS` para futuras iteraciones.

## Post-rotación
- Notificar al equipo por el canal de seguridad.
- Registrar incidencias o aprendizajes en el runbook.
- Programar la próxima revisión automática (cron, ticket, etc.).
