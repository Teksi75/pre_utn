# GGA — Instalación multi-PC

GGA (Gentleman Guardian Angel) corre automáticamente en `pre-commit` y aplica las reglas definidas en `AGENTS.md` antes de cada commit. La instalación es **por máquina**: ni el binario ni el hook se guardan en el repo. Cada PC de desarrollo debe instalarlos por su cuenta.

> El archivo `.gga` (configuración) sí vive en el repo: provee provider, file patterns y reglas. El binario y el hook son locales a la máquina.

## Requisitos previos

- `git` instalado y autenticado.
- `bash` (Git Bash en Windows, bash nativo en macOS/Linux).
- Acceso a internet para clonar el repo de GGA o usar Homebrew.
- Si vas a usar `opencode:openai/gpt-5.4-mini` como provider: `opencode` CLI autenticado y el modelo disponible en el endpoint Zen.

## macOS

```bash
brew install gentleman-programming/tap/gga
```

Verificación rápida:

```bash
which gga      # debe imprimir un path
gga version    # debe reportar 2.8.x
```

Si `which gga` no devuelve nada tras instalar por Homebrew, asegurate de que tu shell use un `PATH` que incluya los binarios de Homebrew (`brew --prefix` te lo muestra). En Apple Silicon suele ser `/opt/homebrew/bin`; en Intel, `/usr/local/bin`.

## Linux

Opción A — Homebrew (recomendado en Linux):

```bash
brew install gentleman-programming/tap/gga
```

Opción B — clonar el repo y correr el instalador:

```bash
git clone https://github.com/Gentleman-Programming/gentleman-guardian-angel.git
cd gentleman-guardian-angel
./install.sh
```

El instalador coloca el binario en `~/.local/bin/gga` (o `~/bin/gga` según plataforma). Si al terminar `which gga` no encuentra nada, agregá el directorio a tu `PATH`:

```bash
# bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# zsh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

## Windows (Git Bash)

```bash
git clone https://github.com/Gentleman-Programming/gentleman-guardian-angel.git
cd gentleman-guardian-angel
bash install.sh
```

Si `gga` no queda en `PATH`, agregalo al `~/.bashrc` de Git Bash y recargá:

```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

Verificación:

```bash
which gga
gga version
```

Desde la raíz del repo, registramos el hook una sola vez por checkout:

```bash
gga install
```

Este paso crea/actualiza `.git/hooks/pre-commit`. Como el directorio `.git/` no se commitea, **este comando se debe correr en cada PC de desarrollo después de clonar el repo**.

## Verificación end-to-end

Tras instalar en una máquina nueva:

```bash
# 1. binario
gga version        # 2.8.x
gga config         # PROVIDER=opencode:openai/gpt-5.4-mini, RULES_FILE=AGENTS.md, STRICT_MODE=true

# 2. hook
ls -l .git/hooks/pre-commit   # debe existir y ser ejecutable

# 3. smoke run contra un cambio trivial
echo "test" > /tmp/gga-smoke.txt
git add /tmp/gga-smoke.txt    # o un cambio real staged
gga run                       # el provider debe responder

# 4. limpieza
git restore --staged /tmp/gga-smoke.txt
```

## Escape hatch

Si necesitás commitear sin que GGA revise (emergencias), usá el flag nativo de Git:

```bash
git commit --no-verify
```

**Usalo con criterio.** Si lo usás, dejá un comentario en el PR explicando por qué se salteó el gate.

## Troubleshooting

| Síntoma | Causa probable | Fix |
|---------|----------------|-----|
| `gga: command not found` | `PATH` no apunta a `~/.local/bin` | Agregar export a `~/.bashrc` y `source` |
| `gga version` falla con `'\r': command not found` | Scripts con CRLF | `sed -i 's/\r$//' ~/.local/bin/gga ~/.local/share/gga -r` |
| `gga run` se cuelga hasta timeout | Provider no autenticado o sin red | Verificar `opencode` login y conexión a internet |
| Hook no bloquea | `.git/hooks/pre-commit` no es ejecutable | `chmod +x .git/hooks/pre-commit` |
| Hook instalado pero no dispara | `git commit --no-verify` usado | Revisar flags; sin `--no-verify` el hook siempre corre |

## ¿Por qué per-máquina?

- El binario `gga` es un script bash que **no** se commitea: instalarlo en el repo añadiría ruido y dependencias de plataforma.
- El directorio `.git/` es local a cada checkout.
- Engram memory no es portable entre PCs; por eso la config canónica vive en el repo (`.gga` + `AGENTS.md`), no en la memoria de un agente.

Si una nueva PC se suma al proyecto: instalá GGA, corré `gga install` una vez, y el gate queda activo para siempre en esa máquina.
