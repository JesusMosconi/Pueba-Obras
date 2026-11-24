# Dashboard de obras

Demo de Next.js para analizar las 148 obras de `Obras para KPI.xlsx`. Los montos se muestran en millones de pesos. Los datos están incorporados en `data/obras.json`, con latitud y longitud convertidas a números.

## Desarrollo

```bash
npm install
npm run dev
```

Abrir <http://localhost:3000>.

## Despliegue en Vercel

Importar este directorio como proyecto en Vercel. El framework se detecta como Next.js; el comando de build es `npm run build`. No requiere variables de entorno. La configuración genera una exportación estática en `out/`.

Los mosaicos del mapa se cargan desde OpenStreetMap y requieren conexión a internet. Para actualizar las obras, regenerar `data/obras.json` desde la planilla y volver a desplegar.
