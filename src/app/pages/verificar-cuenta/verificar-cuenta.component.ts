import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { mensajeDeError } from '../../core/mensajes';
import { FondoAccesoComponent } from '../../shared/fondo-acceso.component';

const ESPERA_REENVIO_S = 30;

/** Paso obligatorio después del registro: la cuenta del ciudadano no se activa hasta confirmar el código recibido por correo. */
@Component({
  selector: 'app-verificar-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, FondoAccesoComponent],
  template: `
    <app-fondo-acceso>
      <h1>Verificar cuenta</h1>
      <p>
        Enviamos un código de 6 dígitos a <strong>{{ correo }}</strong
        >. Ingréselo para activar su cuenta. Mientras no la verifique, no podrá enviar reportes.
      </p>

      @if (verificada()) {
        <div class="alert alert-success text-center" role="status">
          <i class="fa fa-check-circle me-2" aria-hidden="true"></i>Cuenta verificada. Ingresando...
        </div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="verificar()" novalidate>
          <div class="input-group login-input">
            <span class="input-group-text"><i class="fa fa-shield" aria-hidden="true"></i></span>
            <label for="codigo" class="visually-hidden">Código de verificación</label>
            <input
              id="codigo"
              class="form-control"
              placeholder="Código de 6 dígitos"
              formControlName="codigo"
              inputmode="numeric"
              maxlength="6"
              autocomplete="one-time-code"
            />
          </div>

          <button type="submit" class="btn btn-primary login-btn" [disabled]="form.invalid || cargando()">
            <i class="fa fa-check me-2" aria-hidden="true"></i>
            {{ cargando() ? 'Verificando...' : 'Verificar cuenta' }}
          </button>

          <div class="login-help">
            ¿No llegó el código?
            <button type="button" class="btn btn-link p-0 align-baseline" (click)="reenviar()" [disabled]="espera() > 0">
              Reenviar{{ espera() > 0 ? ' (' + espera() + ' s)' : '' }}
            </button>
            <br />
            <a routerLink="/login">Volver al inicio de sesión</a>
          </div>

          @if (aviso()) {
            <div class="alert alert-info text-center mt-3" role="status">{{ aviso() }}</div>
          }
          @if (error()) {
            <div class="alert alert-danger text-center mt-3" role="alert">{{ error() }}</div>
          }
        </form>
        <div class="alert alert-secondary small mt-3 mb-0" role="note">
          Prototipo: en el sistema el código llega al correo y vence a los 15 minutos. Aquí use <strong>123456</strong>.
        </div>
      }
    </app-fondo-acceso>
  `,
})
export class VerificarCuentaComponent implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);
  private temporizador: ReturnType<typeof setInterval> | null = null;

  readonly usuario = this.ruta.snapshot.queryParamMap.get('usuario') ?? '';
  readonly correo = this.ruta.snapshot.queryParamMap.get('correo') || 'su correo registrado';

  readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });
  readonly error = signal('');
  readonly aviso = signal('');
  readonly cargando = signal(false);
  readonly verificada = signal(false);
  readonly espera = signal(0);

  verificar(): void {
    if (this.form.invalid) return;
    this.cargando.set(true);
    this.error.set('');
    this.auth.verificarCuenta(this.usuario, this.form.getRawValue().codigo).subscribe({
      next: (r) => {
        this.verificada.set(true);
        setTimeout(() => {
          this.auth.abrirSesion(r);
          void this.router.navigate([this.auth.rutaInicio()]);
        }, 1600);
      },
      error: (e) => {
        this.error.set(mensajeDeError(e));
        this.cargando.set(false);
      },
    });
  }

  reenviar(): void {
    this.error.set('');
    this.auth.reenviarCodigo(this.usuario).subscribe({
      next: () => {
        this.aviso.set('Enviamos un código nuevo a su correo.');
        this.espera.set(ESPERA_REENVIO_S);
        this.temporizador = setInterval(() => {
          this.espera.update((s) => Math.max(0, s - 1));
          if (this.espera() === 0 && this.temporizador) {
            clearInterval(this.temporizador);
            this.temporizador = null;
          }
        }, 1000);
      },
      error: (e) => this.error.set(mensajeDeError(e)),
    });
  }

  ngOnDestroy(): void {
    if (this.temporizador) clearInterval(this.temporizador);
  }
}
