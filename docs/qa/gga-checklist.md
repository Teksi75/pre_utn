# GGA — Manual smoke checklist

Usá este checklist después de instalar GGA en una máquina nueva, o cuando algo en el gate se comporta raro.

## Pre-flight

- [ ] `AGENTS.md` existe en la raíz del repo y define reglas concretas.
- [ ] `.gga` existe en la raíz del repo y referencia `RULES_FILE=AGENTS.md`.

## Sanity del binario

- [ ] `gga version` devuelve `2.8.x` (la versión actual es 2.8.1).
- [ ] `which gga` (o `command -v gga`) devuelve un path (ej. `C:\Users\pablo\.local\bin\gga` o `/home/pablo/.local/bin/gga`).
- [ ] `gga --help` lista los comandos: `init`, `install`, `run`, `uninstall`, `config`, `cache`.
- [ ] `gga config` muestra:
  - `PROVIDER=opencode:openai/gpt-5.4-mini`
  - `RULES_FILE=AGENTS.md`
  - `STRICT_MODE=true`
  - `FILE_PATTERNS=*.ts,*.tsx,*.js,*.jsx`
  - `EXCLUDE_PATTERNS=*.test.ts,*.spec.ts,*.test.tsx,*.spec.tsx,*.d.ts`

## Provider reachable

- [ ] Stagear un cambio trivial (un espacio, una línea en un `.md`) y correr:
  ```bash
  gga run
  ```
  Debe devolver un veredicto (pass/fail) sin colgarse hasta timeout.
- [ ] `gga run` no termina con error de provider (sin auth, sin red, etc.).

## Hook activo

- [ ] `.git/hooks/pre-commit` existe y es ejecutable:
  ```bash
  ls -l .git/hooks/pre-commit   # en bash / Git Bash
  ```
  Permisos esperados: `755` o `777`. En Windows con `core.fileMode=false`, validar que el contenido incluya la línea `gga run || exit 1`.
- [ ] El contenido del hook incluye el bloque:
  ```
  # ======== GGA START ========
  gga run || exit 1
  # ======== GGA END ========
  ```
- [ ] Stagear un cambio en un `*.ts` y correr `git commit -m "smoke"`:
  - GGA debe ejecutarse y bloquear o pasar según las reglas.
  - Salida no-cero = bloqueo; salida 0 = pasó la review.

## Sample commit review

- [ ] Crear un cambio que **viola** `AGENTS.md` (por ejemplo: `const x: any = 1;` dentro de `src/domain/`).
- [ ] `git commit -m "test gga"` debe **bloquear** el commit con un mensaje de violación.
- [ ] `git restore` el cambio. No commitear la violación.

## Escape hatch documentado

- [ ] `git commit --no-verify` permite commitear sin ejecutar el hook (uso excepcional).
- [ ] En el PR queda un comentario si se usó `--no-verify` explicando por qué.

## Re-instalación (multi-PC)

- [ ] En una PC nueva: clonar repo, instalar `gga` (ver [`gga-setup.md`](./gga-setup.md)), correr `gga install`.
- [ ] No hay que re-correr `gga install` cada vez que se hace `git pull` — el hook solo se reescribe cuando el binario o `.gga` cambian.

## Señales de drift

- [ ] `gga config` no muestra el provider esperado → revisar `.gga` y verificar que no fue sobreescrito por un merge.
- [ ] Hook presente pero inactivo → revisar permisos de ejecución.
- [ ] Provider timeouts recurrentes → revisar auth de `opencode` y conectividad.
