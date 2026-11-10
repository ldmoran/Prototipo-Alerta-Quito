# Alerta Quito: prototipo de la interfaz

Prototipo de la interfaz del sistema **Alerta Quito** (reporte de incidentes viales y de seguridad en Quito).

Es solo la parte visual: **no hay servidor ni base de datos**. Todas las llamadas que haría la interfaz las responde una
maqueta (`src/app/core/maqueta.interceptor.ts`) con datos de ejemplo que viven en el navegador. Al recargar la página los
datos vuelven a su estado inicial.

> Esta rama (`dev`) contiene **solo el prototipo de la interfaz** y no tiene relación con `main`.
> La versión con servicio y bases de datos está en la rama `main` y esta rama no la modifica.

## Cómo verlo

Requisitos: Node.js 20 o superior.

```bash
npm install
npm start
```

Se abre en http://localhost:4200.

## Usuarios de ejemplo

Cualquier contraseña sirve (no vacía).

| Usuario | Rol | Qué se puede ver |
|---|---|---|
| `ciudadano.demo` | Ciudadano | Nuevo reporte y Mis reportes |
| `func.epmmop` | Funcionario (EPMMOP) | Bandeja de su entidad y detalle del reporte |
| `func.policia` | Funcionario (Policía) | Bandeja de su entidad |
| `admin` | Administrador | Estadísticas, entidades, tipos de incidente, funcionarios, usuarios y auditoría |

## Pantallas

1. Inicio de sesión, registro y recuperación de contraseña.
2. Ciudadano: **Nuevo reporte** (tipo de incidente, ubicación en el mapa, foto y descripción) y **Mis reportes**.
3. Funcionario: **Bandeja** de reportes de su entidad (emergencias primero) y **detalle** con historial y cierre con evidencia.
4. Administrador: **estadísticas**, **mantenimiento** (entidades, tipos de incidente y funcionarios), **usuarios** y **auditoría**.

## Qué es de ejemplo

- Los reportes, funcionarios, entidades y la auditoría son datos ficticios.
- Los cambios que se hagan (crear un reporte, cambiar un estado, dar de baja a un funcionario) solo se ven mientras la página
  siga abierta.
- No se envían correos ni se guardan fotos.
- El mapa usa OpenStreetMap, por lo que necesita conexión a internet.

## Tecnologías

Angular 19, Bootstrap 5, Font Awesome 4.7, Leaflet y SweetAlert2.
