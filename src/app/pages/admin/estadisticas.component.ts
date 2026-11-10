import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { etiquetaEstado } from '../../core/etiquetas';
import { mensajeDeError } from '../../core/mensajes';
import { Estadisticas } from '../../core/modelos';

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  template: `
    <div class="dashboard-section">
      <div class="section-heading">
        <div>
          <h4>Estadísticas</h4>
          <p>Resumen de los reportes recibidos.</p>
        </div>
      </div>

      @if (error()) {
        <div class="alert alert-danger" role="alert">{{ error() }}</div>
      }
      @if (datos(); as s) {
        <h4 class="subtitulo">Total de reportes: {{ s.total }}</h4>
        @if ((s.sinRespuesta ?? 0) > 0) {
          <div class="alert alert-warning py-2" role="alert">
            <i class="fa fa-clock-o me-2" aria-hidden="true"></i>
            <strong>{{ s.sinRespuesta }} reporte(s) sin respuesta</strong> (emergencias más de 30 min; los demás, más de 48 h).
            Contacte a la entidad responsable o escale el caso; el sistema no garantiza la atención.
          </div>
        }
        <h5 class="mt-3">Por estado</h5>
        @for (fila of porEstado(); track fila.nombre) {
          <div class="fila-barra">
            <span>{{ fila.nombre }}</span>
            <div><i [style.width.%]="fila.porcentaje"></i></div>
            <strong>{{ fila.valor }}</strong>
          </div>
        } @empty {
          <p class="text-muted">Aún no hay reportes.</p>
        }
        <h5 class="mt-4">Por tipo de incidente</h5>
        @for (fila of porTipo(); track fila.nombre) {
          <div class="fila-barra">
            <span>{{ fila.nombre }}</span>
            <div><i [style.width.%]="fila.porcentaje"></i></div>
            <strong>{{ fila.valor }}</strong>
          </div>
        }
      } @else if (!error()) {
        <p class="text-muted">Cargando...</p>
      }
    </div>
  `,
})
export class EstadisticasComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly datos = signal<Estadisticas | null>(null);
  readonly error = signal('');

  readonly porEstado = computed(() => this.filas(this.datos()?.porEstado ?? {}, etiquetaEstado));
  readonly porTipo = computed(() => this.filas(this.datos()?.porTipo ?? {}, (n) => n));

  ngOnInit(): void {
    this.api.estadisticas().subscribe({
      next: (s) => this.datos.set(s),
      error: (e) => this.error.set(mensajeDeError(e)),
    });
  }

  private filas(datos: Record<string, number>, etiqueta: (n: string) => string) {
    const maximo = Math.max(1, ...Object.values(datos));
    return Object.entries(datos).map(([nombre, valor]) => ({
      nombre: etiqueta(nombre),
      valor,
      porcentaje: (valor / maximo) * 100,
    }));
  }
}
