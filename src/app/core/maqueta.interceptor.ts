/**
 * MAQUETA DEL SERVICIO (solo para el prototipo).
 *
 * Esta interfaz es una copia de la de Alerta Quito, pero en lugar de llamar a un servicio real,
 * este interceptor responde las llamadas a /api con datos de ejemplo que viven en el navegador.
 * No hay servidor ni base de datos: al recargar la página los datos vuelven a su estado inicial.
 */
import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { from, Observable, of, throwError } from 'rxjs';
import { delay, switchMap } from 'rxjs/operators';
import {
  EstadoReporte,
  Estadisticas,
  Funcionario,
  EntidadAdmin,
  FilaAuditoria,
  HistorialEstado,
  EvidenciaReporte,
  TipoIncidenteAdmin,
} from './modelos';

// ----------------------------------------------------------------------------- utilidades
const HORA = 3_600_000;
const hace = (horas: number): string => new Date(Date.now() - horas * HORA).toISOString();
const FOTOS = ['images/imagen1.jpg', 'images/imagen2.jpg', 'images/imagen3.jpg', 'images/imagen4.jpg', 'images/imagen5.jpg'];

const SIGUIENTES: Record<EstadoReporte, EstadoReporte[]> = {
  REGISTRADO: ['EN_REVISION', 'EN_ATENCION', 'RECHAZADO'],
  EN_REVISION: ['EN_ATENCION', 'RECHAZADO'],
  EN_ATENCION: ['RESUELTO'],
  RESUELTO: [],
  RECHAZADO: [],
};

// ----------------------------------------------------------------------------- datos de ejemplo
interface UsuarioMaqueta {
  id: number;
  usuario: string;
  nombre: string;
  perfil: 'CIUDAD' | 'FUNCIO' | 'ADMINI';
  entidad?: string;
}

const USUARIOS: UsuarioMaqueta[] = [
  { id: 1, usuario: 'admin', nombre: 'Administrador del Sistema', perfil: 'ADMINI' },
  { id: 2, usuario: 'func.epmmop', nombre: 'Funcionario EPMMOP', perfil: 'FUNCIO', entidad: 'EPMMOP' },
  { id: 3, usuario: 'ciudadano.demo', nombre: 'Ciudadano de Prueba', perfil: 'CIUDAD' },
  { id: 4, usuario: 'func.policia', nombre: 'Funcionario Policía', perfil: 'FUNCIO', entidad: 'POLICIA' },
];

const entidades: EntidadAdmin[] = [
  { id: 1, codigo: 'EPMMOP', nombre: 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', descripcion: 'Calles, señalización y semáforos', estado: 'A', tiposActivos: 3, funcionariosActivos: 1 },
  { id: 2, codigo: 'AMT', nombre: 'Agencia Metropolitana de Tránsito', descripcion: 'Tránsito y accidentes', estado: 'A', tiposActivos: 1, funcionariosActivos: 0 },
  { id: 3, codigo: 'EEQ', nombre: 'Empresa Eléctrica Quito', descripcion: 'Alumbrado público', estado: 'A', tiposActivos: 1, funcionariosActivos: 0 },
  { id: 4, codigo: 'POLICIA', nombre: 'Policía Nacional / ECU 911', descripcion: 'Robos y asaltos', estado: 'A', tiposActivos: 1, funcionariosActivos: 1 },
  { id: 5, codigo: 'BOMBEROS', nombre: 'Cuerpo de Bomberos de Quito', descripcion: 'Árboles caídos y obstrucciones', estado: 'A', tiposActivos: 1, funcionariosActivos: 0 },
];

const tipos: TipoIncidenteAdmin[] = [
  { id: 1, nombre: 'Accidente de tránsito', idEntidad: 2, entidadCodigo: 'AMT', entidadNombre: 'Agencia Metropolitana de Tránsito', prioridadBase: 1, esEmergencia: true, estado: 'A', reportes: 1 },
  { id: 2, nombre: 'Alumbrado público dañado', idEntidad: 3, entidadCodigo: 'EEQ', entidadNombre: 'Empresa Eléctrica Quito', prioridadBase: 3, esEmergencia: false, estado: 'A', reportes: 1 },
  { id: 3, nombre: 'Bache', idEntidad: 1, entidadCodigo: 'EPMMOP', entidadNombre: 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', prioridadBase: 3, esEmergencia: false, estado: 'A', reportes: 2 },
  { id: 4, nombre: 'Robo o asalto', idEntidad: 4, entidadCodigo: 'POLICIA', entidadNombre: 'Policía Nacional / ECU 911', prioridadBase: 1, esEmergencia: true, estado: 'A', reportes: 1 },
  { id: 5, nombre: 'Semáforo dañado', idEntidad: 1, entidadCodigo: 'EPMMOP', entidadNombre: 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', prioridadBase: 2, esEmergencia: false, estado: 'A', reportes: 1 },
  { id: 6, nombre: 'Señal de tránsito rota o ausente', idEntidad: 1, entidadCodigo: 'EPMMOP', entidadNombre: 'Empresa Pública Metropolitana de Movilidad y Obras Públicas', prioridadBase: 3, esEmergencia: false, estado: 'A', reportes: 1 },
  { id: 7, nombre: 'Árbol caído u obstrucción', idEntidad: 5, entidadCodigo: 'BOMBEROS', entidadNombre: 'Cuerpo de Bomberos de Quito', prioridadBase: 2, esEmergencia: false, estado: 'A', reportes: 1 },
];

const funcionarios: Funcionario[] = [
  { id: 1, usuario: 'func.epmmop', nombreCompleto: 'Funcionario EPMMOP', cedula: '1712345678', correo: 'funcionario.epmmop@entidad.gob.ec', idEntidad: 1, entidadCodigo: 'EPMMOP', entidadNombre: entidades[0].nombre, cargo: 'Inspector vial', estado: 'A', fechaDesignacion: hace(24 * 12) },
  { id: 2, usuario: 'func.policia', nombreCompleto: 'Funcionario Policía', cedula: '1798765432', correo: 'funcionario.policia@entidad.gob.ec', idEntidad: 4, entidadCodigo: 'POLICIA', entidadNombre: entidades[3].nombre, cargo: 'Operador de despacho', estado: 'A', fechaDesignacion: hace(24 * 12) },
  { id: 3, usuario: 'func.amt', nombreCompleto: 'Funcionario AMT', cedula: '1701234567', correo: 'funcionario.amt@entidad.gob.ec', idEntidad: 2, entidadCodigo: 'AMT', entidadNombre: entidades[1].nombre, cargo: 'Agente de control', estado: 'I', fechaDesignacion: hace(24 * 8) },
];

interface ReporteMaqueta {
  id: number;
  tipoId: number;
  estado: EstadoReporte;
  descripcion: string;
  latitud: number;
  longitud: number;
  direccion: string;
  referencia: string | null;
  creado: string;
  actualizado: string;
  historial: HistorialEstado[];
  evidencias: (EvidenciaReporte & { foto: number; archivo?: File })[];
}

function nuevoHistorial(pasos: [EstadoReporte, string, number, string | null][]): HistorialEstado[] {
  const filas: HistorialEstado[] = [];
  let anterior: string | null = null;
  for (const [estado, usuario, horas, comentario] of pasos) {
    filas.push({ estadoAnterior: anterior, estadoNuevo: estado, usuario, comentario, fecha: hace(horas) });
    anterior = estado;
  }
  return filas;
}

const reportes: ReporteMaqueta[] = [
  {
    id: 1, tipoId: 5, estado: 'EN_ATENCION', descripcion: 'El semáforo está apagado y los autos no respetan el paso.',
    latitud: -0.2013, longitud: -78.4975, direccion: 'Av. 10 de Agosto y Colón', referencia: 'Frente a la gasolinera', creado: hace(30), actualizado: hace(6),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 30, null], ['EN_REVISION', 'func.epmmop', 24, 'Se revisará el controlador.'], ['EN_ATENCION', 'func.epmmop', 6, 'Cuadrilla en el sitio.']]),
    evidencias: [{ id: 1, tipo: 'CREACION', nombreArchivo: 'semaforo.jpg', subidoPor: 'ciudadano.demo', fecha: hace(30), foto: 0 }],
  },
  {
    id: 2, tipoId: 3, estado: 'EN_REVISION', descripcion: 'Bache grande en el carril derecho que ya dañó llantas.',
    latitud: -0.1807, longitud: -78.4836, direccion: 'Av. Amazonas y Naciones Unidas', referencia: null, creado: hace(52), actualizado: hace(20),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 52, null], ['EN_REVISION', 'func.epmmop', 20, 'Se programa visita.']]),
    evidencias: [{ id: 2, tipo: 'CREACION', nombreArchivo: 'bache.jpg', subidoPor: 'ciudadano.demo', fecha: hace(52), foto: 1 }],
  },
  {
    id: 3, tipoId: 4, estado: 'REGISTRADO', descripcion: 'Asaltaron a una persona en la parada del bus.',
    latitud: -0.249, longitud: -78.5215, direccion: 'Av. Maldonado y Cusubamba', referencia: 'Parada del trolebús', creado: hace(3), actualizado: hace(3),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 3, null]]),
    evidencias: [{ id: 3, tipo: 'CREACION', nombreArchivo: 'parada.jpg', subidoPor: 'ciudadano.demo', fecha: hace(3), foto: 2 }],
  },
  {
    id: 4, tipoId: 7, estado: 'REGISTRADO', descripcion: 'Árbol caído que obstruye medio carril.',
    latitud: -0.143, longitud: -78.495, direccion: 'Av. Occidental y Mariscal Sucre', referencia: null, creado: hace(8), actualizado: hace(8),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 8, null]]),
    evidencias: [{ id: 4, tipo: 'CREACION', nombreArchivo: 'arbol.jpg', subidoPor: 'ciudadano.demo', fecha: hace(8), foto: 3 }],
  },
  {
    id: 5, tipoId: 6, estado: 'RESUELTO', descripcion: 'La señal de pare está doblada y no se ve.',
    latitud: -0.215, longitud: -78.505, direccion: 'Av. Maldonado y Cusubamba', referencia: null, creado: hace(96), actualizado: hace(40),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 96, null], ['EN_REVISION', 'func.epmmop', 80, null], ['EN_ATENCION', 'func.epmmop', 60, 'Se repone la señal.'], ['RESUELTO', 'func.epmmop', 40, 'Señal repuesta.']]),
    evidencias: [
      { id: 5, tipo: 'CREACION', nombreArchivo: 'senal.jpg', subidoPor: 'ciudadano.demo', fecha: hace(96), foto: 4 },
      { id: 6, tipo: 'RESOLUCION', nombreArchivo: 'senal-repuesta.jpg', subidoPor: 'func.epmmop', fecha: hace(40), foto: 0 },
    ],
  },
  {
    id: 6, tipoId: 2, estado: 'EN_REVISION', descripcion: 'Tres luminarias apagadas en toda la cuadra.',
    latitud: -0.186, longitud: -78.481, direccion: 'Av. República y Eloy Alfaro', referencia: null, creado: hace(20), actualizado: hace(10),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 20, null], ['EN_REVISION', 'func.epmmop', 10, null]]),
    evidencias: [{ id: 7, tipo: 'CREACION', nombreArchivo: 'luminaria.jpg', subidoPor: 'ciudadano.demo', fecha: hace(20), foto: 1 }],
  },
  {
    id: 7, tipoId: 1, estado: 'EN_ATENCION', descripcion: 'Choque entre dos autos que bloquea el carril izquierdo.',
    latitud: -0.155, longitud: -78.46, direccion: 'Av. Simón Bolívar y Panamericana Norte', referencia: null, creado: hace(5), actualizado: hace(2),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 5, null], ['EN_ATENCION', 'func.epmmop', 2, 'Agentes en camino.']]),
    evidencias: [{ id: 8, tipo: 'CREACION', nombreArchivo: 'choque.jpg', subidoPor: 'ciudadano.demo', fecha: hace(5), foto: 2 }],
  },
  {
    id: 8, tipoId: 3, estado: 'RESUELTO', descripcion: 'Bache en la entrada del colegio.',
    latitud: -0.1795, longitud: -78.489, direccion: 'Calle Rumipamba', referencia: null, creado: hace(120), actualizado: hace(70),
    historial: nuevoHistorial([['REGISTRADO', 'ciudadano.demo', 120, null], ['EN_REVISION', 'func.epmmop', 100, null], ['EN_ATENCION', 'func.epmmop', 90, null], ['RESUELTO', 'func.epmmop', 70, 'Bache reparado.']]),
    evidencias: [
      { id: 9, tipo: 'CREACION', nombreArchivo: 'bache2.jpg', subidoPor: 'ciudadano.demo', fecha: hace(120), foto: 3 },
      { id: 10, tipo: 'RESOLUCION', nombreArchivo: 'reparado.jpg', subidoPor: 'func.epmmop', fecha: hace(70), foto: 4 },
    ],
  },
];

let contadorReportes = reportes.length;
let contadorEvidencias = 10;

const auditoria: FilaAuditoria[] = [
  { origen: 'NEGOCIO', id: 14, tabla: 'REPORTE', idRegistro: '7', accion: 'UPDATE', usuario: 'func.epmmop', fecha: hace(2), descripcion: 'Estado: Registrado → En atención' },
  { origen: 'NEGOCIO', id: 13, tabla: 'REPORTE', idRegistro: '7', accion: 'INSERT', usuario: 'ciudadano.demo', fecha: hace(5), descripcion: 'Reporte creado' },
  { origen: 'SEGURIDAD', id: 9, tabla: 'USUARIO', idRegistro: '4', accion: 'UPDATE', usuario: 'admin', fecha: hace(26), descripcion: 'Contraseña restablecida por el administrador' },
  { origen: 'NEGOCIO', id: 12, tabla: 'FUNCIONARIO', idRegistro: '3', accion: 'UPDATE', usuario: 'admin', fecha: hace(30), descripcion: 'Funcionario dado de baja' },
  { origen: 'NEGOCIO', id: 11, tabla: 'TIPO_INCIDENTE', idRegistro: '3', accion: 'UPDATE', usuario: 'admin', fecha: hace(48), descripcion: 'Prioridad base: 4 → 3' },
  { origen: 'SEGURIDAD', id: 8, tabla: 'USUARIO', idRegistro: '5', accion: 'INSERT', usuario: 'admin', fecha: hace(120), descripcion: 'Usuario creado' },
  { origen: 'NEGOCIO', id: 10, tabla: 'ENTIDAD', idRegistro: '5', accion: 'UPDATE', usuario: 'admin', fecha: hace(140), descripcion: 'Descripción actualizada' },
  { origen: 'NEGOCIO', id: 9, tabla: 'FUNCIONARIO', idRegistro: '3', accion: 'INSERT', usuario: 'admin', fecha: hace(190), descripcion: 'Funcionario designado' },
];

// ----------------------------------------------------------------------------- piezas comunes
function usuarioActual(): UsuarioMaqueta | null {
  try {
    const sesion = JSON.parse(sessionStorage.getItem('alerta-quito.sesion') ?? 'null') as { usuario?: string } | null;
    return USUARIOS.find((u) => u.usuario === sesion?.usuario) ?? null;
  } catch {
    return null;
  }
}

function tipoDe(id: number): TipoIncidenteAdmin {
  return tipos.find((t) => t.id === id) ?? tipos[0];
}

function resumen(r: ReporteMaqueta) {
  const tipo = tipoDe(r.tipoId);
  return {
    id: r.id,
    codigo: `RQ-2026-${String(r.id).padStart(6, '0')}`,
    tipoIncidente: tipo.nombre,
    entidad: tipo.entidadCodigo,
    prioridad: tipo.prioridadBase,
    estado: r.estado,
    descripcion: r.descripcion,
    latitud: r.latitud,
    longitud: r.longitud,
    direccion: r.direccion,
    fechaCreacion: r.creado,
    fechaActualizacion: r.actualizado,
  };
}

function detalle(r: ReporteMaqueta) {
  const tipo = tipoDe(r.tipoId);
  return {
    reporte: resumen(r),
    referencia: r.referencia,
    ciudadano: 'Ciudadano de Prueba',
    entidadNombre: tipo.entidadNombre,
    historial: r.historial,
    evidencias: r.evidencias.map(({ id, tipo: t, nombreArchivo, subidoPor, fecha }) => ({ id, tipo: t, nombreArchivo, subidoPor, fecha })),
  };
}

function recalcular(): void {
  for (const e of entidades) {
    e.tiposActivos = tipos.filter((t) => t.idEntidad === e.id && t.estado === 'A').length;
    e.funcionariosActivos = funcionarios.filter((f) => f.idEntidad === e.id && f.estado === 'A').length;
  }
  for (const t of tipos) {
    t.reportes = reportes.filter((r) => r.tipoId === t.id).length;
  }
}

function claveTemporal(): string {
  const letras = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let c = '';
  for (let i = 0; i < 10; i++) c += letras[Math.floor(Math.random() * letras.length)];
  return c + '*7';
}

function ok<T>(cuerpo: T, estado = 200): Observable<HttpEvent<unknown>> {
  return of(new HttpResponse({ status: estado, body: cuerpo })).pipe(delay(120));
}

function fallo(estado: number, mensaje: string, codigo?: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status: estado, error: { mensaje, codigo } }));
}

function auditar(tabla: string, idRegistro: number, accion: 'INSERT' | 'UPDATE' | 'DELETE', descripcion: string, origen: 'NEGOCIO' | 'SEGURIDAD' = 'NEGOCIO'): void {
  auditoria.unshift({ origen, id: auditoria.length + 20, tabla, idRegistro: String(idRegistro), accion, usuario: usuarioActual()?.usuario ?? 'admin', fecha: new Date().toISOString(), descripcion });
}

function leerFormulario(req: HttpRequest<unknown>): FormData | null {
  return req.body instanceof FormData ? req.body : null;
}

// ----------------------------------------------------------------------------- el interceptor
export const maquetaInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith('/api')) return next(req);
  const ruta = req.url.replace(/^\/api/, '');
  const metodo = req.method;
  const yo = usuarioActual();
  let m: RegExpMatchArray | null;

  // ----- autenticación
  if (metodo === 'POST' && ruta === '/auth/login') {
    const { usuario, password } = req.body as { usuario: string; password: string };
    const u = USUARIOS.find((x) => x.usuario === (usuario ?? '').trim().toLowerCase());
    if (!u || !password) return fallo(401, 'Usuario y/o contraseña incorrectos.');
    return ok({ idUsuario: u.id, usuario: u.usuario, nombre: u.nombre, perfiles: [u.perfil], token: `prototipo.${u.usuario}`, expiraEnSegundos: 7200, debeCambiarPassword: false });
  }
  if (metodo === 'POST' && ruta === '/auth/registro') return ok(null, 201);
  if (metodo === 'POST' && ruta === '/auth/olvide-password') return ok({ mensaje: 'Si la cuenta existe, le enviaremos un enlace a su correo.' }, 202);
  if (metodo === 'POST' && ruta === '/auth/restablecer-password') return ok({ mensaje: 'Contraseña actualizada.' });
  if (metodo === 'POST' && ruta === '/auth/cambiar-password' && yo) {
    return ok({ idUsuario: yo.id, usuario: yo.usuario, nombre: yo.nombre, perfiles: [yo.perfil], token: `prototipo.${yo.usuario}`, expiraEnSegundos: 7200, debeCambiarPassword: false });
  }

  // ----- catálogos
  if (metodo === 'GET' && ruta === '/tipos-incidente') {
    return ok(tipos.filter((t) => t.estado === 'A').map((t) => ({ id: t.id, nombre: t.nombre, entidadCodigo: t.entidadCodigo, entidadNombre: t.entidadNombre, prioridad: t.prioridadBase, esEmergencia: t.esEmergencia })));
  }
  if (metodo === 'GET' && ruta === '/entidades') {
    return ok(entidades.filter((e) => e.estado === 'A').map((e) => ({ id: e.id, codigo: e.codigo, nombre: e.nombre, descripcion: e.descripcion ?? '' })));
  }

  // ----- reportes
  if (metodo === 'GET' && ruta === '/reportes/mios') {
    return ok([...reportes].sort((a, b) => b.creado.localeCompare(a.creado)).map(resumen));
  }
  if (metodo === 'GET' && ruta === '/reportes/bandeja') {
    const cerrados = req.params.get('incluirCerrados') === 'true';
    const lista = reportes
      .filter((r) => !yo?.entidad || tipoDe(r.tipoId).entidadCodigo === yo.entidad)
      .filter((r) => cerrados || (r.estado !== 'RESUELTO' && r.estado !== 'RECHAZADO'))
      .map(resumen)
      .sort((a, b) => a.prioridad - b.prioridad || b.fechaCreacion.localeCompare(a.fechaCreacion));
    return ok(lista);
  }
  if (metodo === 'GET' && (m = ruta.match(/^\/reportes\/(\d+)$/))) {
    const r = reportes.find((x) => x.id === +m![1]);
    return r ? ok(detalle(r)) : fallo(404, 'No se encontró el reporte.');
  }
  if (metodo === 'GET' && (m = ruta.match(/^\/reportes\/(\d+)\/evidencias\/(\d+)\/archivo$/))) {
    const r = reportes.find((x) => x.id === +m![1]);
    const e = r?.evidencias.find((x) => x.id === +m![2]);
    if (!e) return fallo(404, 'No se encontró la evidencia.');
    if (e.archivo) return ok(e.archivo);
    return from(fetch(FOTOS[e.foto % FOTOS.length]).then((resp) => resp.blob())).pipe(switchMap((blob) => ok(blob)));
  }
  if (metodo === 'POST' && ruta === '/reportes') {
    const form = leerFormulario(req);
    const datosBlob = form?.get('datos');
    const foto = form?.get('foto');
    if (!(datosBlob instanceof Blob)) return fallo(400, 'Faltan los datos del reporte.');
    if (!(foto instanceof File)) return fallo(400, 'La foto del incidente es obligatoria.');
    return from(datosBlob.text()).pipe(
      switchMap((texto) => {
        const d = JSON.parse(texto) as { idTipoIncidente: number; descripcion: string; latitud: number; longitud: number; direccion: string; referencia: string };
        contadorReportes += 1;
        contadorEvidencias += 1;
        const nuevo: ReporteMaqueta = {
          id: contadorReportes, tipoId: d.idTipoIncidente, estado: 'REGISTRADO', descripcion: d.descripcion || '(sin detalle)', latitud: d.latitud, longitud: d.longitud,
          direccion: d.direccion || 'Ubicación marcada en el mapa', referencia: d.referencia || null, creado: new Date().toISOString(), actualizado: new Date().toISOString(),
          historial: [{ estadoAnterior: null, estadoNuevo: 'REGISTRADO', usuario: yo?.usuario ?? 'ciudadano.demo', comentario: null, fecha: new Date().toISOString() }],
          evidencias: [{ id: contadorEvidencias, tipo: 'CREACION', nombreArchivo: foto.name, subidoPor: yo?.usuario ?? 'ciudadano.demo', fecha: new Date().toISOString(), foto: 0, archivo: foto }],
        };
        reportes.push(nuevo);
        recalcular();
        return ok(detalle(nuevo), 201);
      }),
    );
  }
  if (metodo === 'POST' && (m = ruta.match(/^\/reportes\/(\d+)\/estado$/))) {
    const r = reportes.find((x) => x.id === +m![1]);
    const form = leerFormulario(req);
    if (!r || !form) return fallo(404, 'No se encontró el reporte.');
    const nuevoEstado = String(form.get('estado')) as EstadoReporte;
    const comentario = (form.get('comentario') as string | null) || null;
    const foto = form.get('foto');
    if (!SIGUIENTES[r.estado].includes(nuevoEstado)) return fallo(400, `No se puede pasar de ${r.estado} a ${nuevoEstado}.`);
    if (nuevoEstado === 'RESUELTO' && !(foto instanceof File)) return fallo(400, 'Para resolver el reporte debe adjuntar una foto de evidencia.');
    r.historial.push({ estadoAnterior: r.estado, estadoNuevo: nuevoEstado, usuario: yo?.usuario ?? 'func.epmmop', comentario, fecha: new Date().toISOString() });
    r.estado = nuevoEstado;
    r.actualizado = new Date().toISOString();
    if (foto instanceof File) {
      contadorEvidencias += 1;
      r.evidencias.push({ id: contadorEvidencias, tipo: 'RESOLUCION', nombreArchivo: foto.name, subidoPor: yo?.usuario ?? 'func.epmmop', fecha: new Date().toISOString(), foto: 0, archivo: foto });
    }
    return ok(detalle(r));
  }

  // ----- administración
  if (ruta === '/admin/estadisticas' && metodo === 'GET') {
    const est: Estadisticas = { total: reportes.length, porEstado: {}, porTipo: {} };
    for (const r of reportes) {
      est.porEstado[r.estado] = (est.porEstado[r.estado] ?? 0) + 1;
      const n = tipoDe(r.tipoId).nombre;
      est.porTipo[n] = (est.porTipo[n] ?? 0) + 1;
    }
    return ok(est);
  }

  if (ruta === '/admin/funcionarios') {
    if (metodo === 'GET') return ok(funcionarios);
    if (metodo === 'POST') {
      const d = req.body as { nombreCompleto: string; cedula: string; correo: string; usuario: string; password?: string; idEntidad: number; cargo: string };
      if (funcionarios.some((f) => f.usuario === d.usuario)) return fallo(409, 'Ya existe un usuario con ese nombre.');
      const e = entidades.find((x) => x.id === d.idEntidad) ?? entidades[0];
      const f: Funcionario = { id: funcionarios.length + 1, usuario: d.usuario, nombreCompleto: d.nombreCompleto, cedula: d.cedula, correo: d.correo, idEntidad: e.id, entidadCodigo: e.codigo, entidadNombre: e.nombre, cargo: d.cargo, estado: 'A', fechaDesignacion: new Date().toISOString() };
      funcionarios.push(f);
      recalcular();
      auditar('FUNCIONARIO', f.id, 'INSERT', 'Funcionario designado');
      return ok({ funcionario: f, passwordTemporal: d.password || claveTemporal(), correoEnviado: false }, 201);
    }
  }
  if ((m = ruta.match(/^\/admin\/funcionarios\/(\d+)$/))) {
    const f = funcionarios.find((x) => x.id === +m![1]);
    if (!f) return fallo(404, 'No se encontró al funcionario.');
    if (metodo === 'PUT') {
      const d = req.body as { nombreCompleto: string; cedula: string; correo: string; idEntidad: number; cargo: string };
      const e = entidades.find((x) => x.id === d.idEntidad) ?? entidades[0];
      Object.assign(f, { nombreCompleto: d.nombreCompleto, cedula: d.cedula, correo: d.correo, cargo: d.cargo, idEntidad: e.id, entidadCodigo: e.codigo, entidadNombre: e.nombre });
      recalcular();
      auditar('FUNCIONARIO', f.id, 'UPDATE', 'Datos del funcionario actualizados');
      return ok(f);
    }
    if (metodo === 'DELETE') {
      f.estado = 'I';
      recalcular();
      return ok(null, 204);
    }
  }
  if (metodo === 'PATCH' && (m = ruta.match(/^\/admin\/funcionarios\/(\d+)\/estado$/))) {
    const f = funcionarios.find((x) => x.id === +m![1]);
    if (!f) return fallo(404, 'No se encontró al funcionario.');
    f.estado = (req.body as { activo: boolean }).activo ? 'A' : 'I';
    recalcular();
    auditar('FUNCIONARIO', f.id, 'UPDATE', f.estado === 'A' ? 'Funcionario dado de alta' : 'Funcionario dado de baja');
    return ok(f);
  }

  if (ruta === '/admin/mantenimiento/entidades') {
    if (metodo === 'GET') return ok(entidades);
    if (metodo === 'POST') {
      const d = req.body as { codigo: string; nombre: string; descripcion: string };
      const e: EntidadAdmin = { id: entidades.length + 1, codigo: d.codigo.toUpperCase(), nombre: d.nombre, descripcion: d.descripcion, estado: 'A', tiposActivos: 0, funcionariosActivos: 0 };
      entidades.push(e);
      auditar('ENTIDAD', e.id, 'INSERT', 'Entidad creada');
      return ok(e, 201);
    }
  }
  if ((m = ruta.match(/^\/admin\/mantenimiento\/entidades\/(\d+)(\/estado)?$/))) {
    const e = entidades.find((x) => x.id === +m![1]);
    if (!e) return fallo(404, 'No se encontró la entidad.');
    if (metodo === 'PUT') {
      const d = req.body as { codigo: string; nombre: string; descripcion: string };
      Object.assign(e, { codigo: d.codigo.toUpperCase(), nombre: d.nombre, descripcion: d.descripcion });
      auditar('ENTIDAD', e.id, 'UPDATE', 'Datos de la entidad actualizados');
      return ok(e);
    }
    if (metodo === 'PATCH') {
      e.estado = (req.body as { activo: boolean }).activo ? 'A' : 'I';
      auditar('ENTIDAD', e.id, 'UPDATE', e.estado === 'A' ? 'Entidad activada' : 'Entidad desactivada');
      return ok(e);
    }
  }

  if (ruta === '/admin/mantenimiento/tipos-incidente') {
    if (metodo === 'GET') return ok(tipos);
    if (metodo === 'POST') {
      const d = req.body as { nombre: string; idEntidad: number; prioridadBase: number; esEmergencia: boolean };
      const e = entidades.find((x) => x.id === d.idEntidad) ?? entidades[0];
      const t: TipoIncidenteAdmin = { id: tipos.length + 1, nombre: d.nombre, idEntidad: e.id, entidadCodigo: e.codigo, entidadNombre: e.nombre, prioridadBase: d.prioridadBase, esEmergencia: d.esEmergencia, estado: 'A', reportes: 0 };
      tipos.push(t);
      recalcular();
      auditar('TIPO_INCIDENTE', t.id, 'INSERT', 'Tipo de incidente creado');
      return ok(t, 201);
    }
  }
  if ((m = ruta.match(/^\/admin\/mantenimiento\/tipos-incidente\/(\d+)(\/estado)?$/))) {
    const t = tipos.find((x) => x.id === +m![1]);
    if (!t) return fallo(404, 'No se encontró el tipo de incidente.');
    if (metodo === 'PUT') {
      const d = req.body as { nombre: string; idEntidad: number; prioridadBase: number; esEmergencia: boolean };
      const e = entidades.find((x) => x.id === d.idEntidad) ?? entidades[0];
      Object.assign(t, { nombre: d.nombre, idEntidad: e.id, entidadCodigo: e.codigo, entidadNombre: e.nombre, prioridadBase: d.prioridadBase, esEmergencia: d.esEmergencia });
      recalcular();
      auditar('TIPO_INCIDENTE', t.id, 'UPDATE', 'Datos del tipo de incidente actualizados');
      return ok(t);
    }
    if (metodo === 'PATCH') {
      t.estado = (req.body as { activo: boolean }).activo ? 'A' : 'I';
      recalcular();
      auditar('TIPO_INCIDENTE', t.id, 'UPDATE', t.estado === 'A' ? 'Tipo activado' : 'Tipo desactivado');
      return ok(t);
    }
  }

  if (metodo === 'GET' && ruta === '/admin/auditoria') {
    const tabla = req.params.get('tabla') ?? '';
    const accion = req.params.get('accion') ?? '';
    const usuario = (req.params.get('usuario') ?? '').toLowerCase();
    const pagina = Number(req.params.get('pagina') ?? 0);
    const filtradas = auditoria.filter((f) => (!tabla || f.tabla === tabla) && (!accion || f.accion === accion) && (!usuario || (f.usuario ?? '').toLowerCase().includes(usuario)));
    const porPagina = 10;
    return ok({ items: filtradas.slice(pagina * porPagina, (pagina + 1) * porPagina), pagina, totalPaginas: Math.max(1, Math.ceil(filtradas.length / porPagina)), total: filtradas.length, tablas: ['ENTIDAD', 'FUNCIONARIO', 'REPORTE', 'TIPO_INCIDENTE', 'USUARIO'] });
  }
  if (metodo === 'GET' && ruta === '/admin/auditoria/historial') {
    const id = req.params.get('idRegistro') ?? '1';
    return ok([
      { id_hist: 1, operacion: 'INSERT', usuario_accion: 'admin', fecha_accion: hace(190), id_registro: id, estado: 'A', cargo: 'Inspector' },
      { id_hist: 2, operacion: 'UPDATE', usuario_accion: 'admin', fecha_accion: hace(30), id_registro: id, estado: 'A', cargo: 'Inspector vial' },
    ]);
  }

  if (metodo === 'POST' && (m = ruta.match(/^\/admin\/usuarios\/([^/]+)\/desbloquear$/))) return ok(null, 204);
  if (metodo === 'POST' && (m = ruta.match(/^\/admin\/usuarios\/([^/]+)\/restablecer-password$/))) {
    return ok({ usuario: decodeURIComponent(m[1]), passwordTemporal: claveTemporal(), correoEnviado: false });
  }

  return fallo(404, 'Esta función no está disponible en el prototipo.');
};
