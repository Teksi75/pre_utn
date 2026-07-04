<#
.SYNOPSIS
  Sincroniza fuentes canónicas locales (PDF) hacia material_canonico/utn-frm.

.DESCRIPTION
  Script versionable que copia PDFs desde una raíz externa (OneDrive u otra)
  hacia la estructura local no versionada material_canonico/utn-frm, según
  las reglas de clasificación del usuario.

  - No borra destino.
  - No sobrescribe silenciosamente: si existe con distinto contenido -> warning + omitir.
  - Si existe con mismo hash SHA256 -> omitir.
  - Crea carpetas si no existen.
  - No depende de paquetes externos.
  - Institution es dimensión de las fuentes, NO identidad de la App.

.PARAMETER SourceRoot
  Raíz absoluta donde viven los PDFs canónicos. OBLIGATORIO para no hardcodear rutas.

.EXAMPLE
  ./sync-material-canonico.ps1 -SourceRoot "D:\Materiales\PreUTN\2025"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Raíz absoluta de los PDFs canónicos")]
    [string]$SourceRoot
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceRoot -PathType Container)) {
    Write-Error "SourceRoot no existe o no es una carpeta: $SourceRoot"
    exit 1
}

# Destino relativo al script: scripts/local -> repo root -> material_canonico/utn-frm
$repoRoot   = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$destRoot   = Join-Path $repoRoot "material_canonico\utn-frm"
$mathRoot   = Join-Path $destRoot "matematica"
$fisicaRoot = Join-Path $destRoot "fisica"

# --- Scaffold de carpetas --------------------------------------------------
$mathUnits  = 1..6
$fisicaUnits = 0..5
$subdirs    = @("teoria","practica","examenes","resoluciones")

foreach ($u in $mathUnits) {
    $unit = "unidad-{0:D2}" -f $u
    foreach ($s in $subdirs) {
        New-Item -ItemType Directory -Path (Join-Path $mathRoot "$unit\$s") -Force | Out-Null
    }
}
foreach ($u in $fisicaUnits) {
    $unit = "unidad-{0:D2}" -f $u
    foreach ($s in $subdirs) {
        New-Item -ItemType Directory -Path (Join-Path $fisicaRoot "$unit\$s") -Force | Out-Null
    }
}

# --- Utilidades ------------------------------------------------------------
function Normalize([string]$s) {
    # quita diacríticos y pasa a minúsculas para matching
    $n = $s.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $n.ToCharArray()) {
        if ([Globalization.UnicodeCategory]::NonSpacingMark -ne [Globalization.CharUnicodeInfo]::GetUnicodeCategory($c)) {
            [void]$sb.Append($c)
        }
    }
    return $sb.ToString().ToLowerInvariant()
}

function PadUnit([int]$n) { return "unidad-{0:D2}" -f $n }

# Detecta número de unidad en el nombre (arabico). Soporta "UNIDAD1", "UNIDAD 1", "U1", "U 1".
function ExtractUnit([string]$norm) {
    if ($norm -match "unidad\s*0*([1-9])") { return [int]$Matches[1] }
    if ($norm -match "\bu0*([1-9])\b")     { return [int]$Matches[1] }
    return -1
}

# --- Contadores -----------------------------------------------------------
$copied   = New-Object System.Collections.Generic.List[string]
$omitted  = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]
$dudas    = New-Object System.Collections.Generic.List[string]

function CopyTo([string]$src, [string]$destDir, [string]$reason) {
    $name = Split-Path -Leaf $src
    $dest = Join-Path $destDir $name
    if (Test-Path -LiteralPath $dest) {
        $srcHash = (Get-FileHash -LiteralPath $src -Algorithm SHA256).Hash
        $dstHash = (Get-FileHash -LiteralPath $dest -Algorithm SHA256).Hash
        if ($srcHash -eq $dstHash) {
            $omitted.Add("OMIT (mismo contenido): $name -> $destDir [$reason]")
        } else {
            $warnings.Add("WARN (existe con distinto contenido, no se sobrescribe): $name -> $destDir (src=$srcHash dst=$dstHash) [$reason]")
        }
        return
    }
    Copy-Item -LiteralPath $src -Destination $dest -Force
    $copied.Add("COPIED: $name -> $destDir [$reason]")
}

# --- Clasificación -------------------------------------------------------
$pdfs = Get-ChildItem -LiteralPath $SourceRoot -Recurse -File -Filter *.pdf -ErrorAction SilentlyContinue

foreach ($f in $pdfs) {
    $name = $f.Name
    $norm = Normalize $name
    $src  = $f.FullName

    $isMath    = $norm -match "matem"
    $isFisica  = $norm -match "fisica"

    # Física por keywords de teoría aunque no diga "fisica"
    $kwU1 = $norm -match "vectores|cantidades|magnitudes"
    $kwU2 = $norm -match "cinematica"
    $kwU3 = $norm -match "dinamica"
    $kwU4 = $norm -match "estatica"
    $kwU5 = $norm -match "trabajo|energia|potencia"
    if (-not $isFisica -and ($kwU1 -or $kwU2 -or $kwU3 -or $kwU4 -or $kwU5)) {
        $isFisica = $true
    }

    # Empate improbable: priorizar física si hay keyword físico claro
    if ($isMath -and $isFisica) {
        if ($kwU1 -or $kwU2 -or $kwU3 -or $kwU4 -or $kwU5) { $isMath = $false }
    }

    $resKw   = $norm -match "respuestas|resolucion|resuelto|resultad"
    $examKw = $norm -match "examen"

    # --- Patrones matemáticos sin la palabra literal "matemática" -----------
    # Práctica UTN: 01_ej_utn .. 06_ej_utn (sin subject en el nombre)
    if ($norm -match "^(\d{1,2})_ej_utn") {
        $n = [int]$Matches[1]
        if ($n -ge 1 -and $n -le 6) {
            CopyTo $src (Join-Path $mathRoot (PadUnit $n) "practica") "mat-practica"
            continue
        }
    }
    # Teoría "UNIDAD N ... TEORÍA" (2025) y "UNIDAda_matemática", excluyendo resoluciones/exámenes
    if (-not $isFisica -and ($norm -match "unidad\s*0*([1-9])") -and ($norm -match "matem|teor") -and -not $resKw -and -not $examKw) {
        $n = ExtractUnit $norm
        if ($n -ge 1 -and $n -le 6) {
            CopyTo $src (Join-Path $mathRoot (PadUnit $n) "teoria") "mat-teoria"
            continue
        }
    }

    $matched = $false

    # ===================== MATEMÁTICA =====================
    if ($isMath) {
        # exámenes: examen + matemática -> unidad-03/examenes
        if ($examKw) {
            CopyTo $src (Join-Path $mathRoot (PadUnit 3) "examenes") "mat-examen"
            $matched = $true
        }
        # resoluciones: respuestas/resolucion/resuelto/resultados + matemática
        if ($resKw) {
            $n = ExtractUnit $norm
            $reason = "mat-resolucion"
            if ($n -lt 1) {
                # \btema\b evita match falso dentro de "matematica"
                if ($norm -match "\btema\b") { $n = 3; $reason = "mat-resolucion (TEMA->unidad-03)" }
                else { $n = 1; $dudas.Add("DUDA: resolucion matematica transversal sin unidad -> unidad-01 por defecto: $name"); $reason = "mat-resolucion (transversal->unidad-01 DUDA)" }
            }
            CopyTo $src (Join-Path $mathRoot (PadUnit $n) "resoluciones") $reason
            $matched = $true
        }
        if (-not $matched) {
            $dudas.Add("DUDA: PDF matematico sin regla clara, NO copiado: $name")
        }
        continue
    }

    # ===================== FÍSICA =====================
    if ($isFisica) {
        $unit = -1
        $reason = "fisica"
        # teoría por keyword
        if ($kwU1)       { $unit = 1; $reason = "fis-teoria U1" }
        elseif ($kwU2)   { $unit = 2; $reason = "fis-teoria U2" }
        elseif ($kwU3)   { $unit = 3; $reason = "fis-teoria U3" }
        elseif ($kwU4)   { $unit = 4; $reason = "fis-teoria U4" }
        elseif ($kwU5)   { $unit = 5; $reason = "fis-teoria U5" }

        if ($unit -ge 1) {
            CopyTo $src (Join-Path $fisicaRoot (PadUnit $unit) "teoria") $reason
            $matched = $true
        }

        # práctica transversal -> unidad-00/practica
        if (-not $matched -and ($norm -match "complementarios|guia de problemas|problemas a resolver")) {
            CopyTo $src (Join-Path $fisicaRoot (PadUnit 0) "practica") "fis-practica U0"
            $matched = $true
        }

        # exámenes de física (sin unidad) -> unidad-00/examenes
        if (-not $matched -and ($norm -match "examen")) {
            CopyTo $src (Join-Path $fisicaRoot (PadUnit 0) "examenes") "fis-examen U0"
            $matched = $true
        }

        # resoluciones de física (respuestas/resolucion) -> unidad-00/resoluciones
        if (-not $matched -and ($norm -match "respuestas|resolucion|resuelto")) {
            CopyTo $src (Join-Path $fisicaRoot (PadUnit 0) "resoluciones") "fis-resolucion U0"
            $matched = $true
        }

        if (-not $matched) {
            $dudas.Add("DUDA: PDF fisico sin regla clara, NO copiado: $name")
        }
        continue
    }

    # ===================== AMBIGUO =====================
    $dudas.Add("DUDA: materia no identificable (ni matematica ni fisica), NO copiado: $name")
}

# --- Resumen -------------------------------------------------------------
Write-Host ""
Write-Host "===== RESUMEN sync-material-canonico =====" -ForegroundColor Cyan
Write-Host "SourceRoot : $SourceRoot"
Write-Host "DestRoot   : $destRoot"
Write-Host "Copiados   : $($copied.Count)"
Write-Host "Omitidos   : $($omitted.Count)"
Write-Host "Warnings   : $($warnings.Count)"
Write-Host "Dudas      : $($dudas.Count)"
Write-Host ""

if ($copied.Count -gt 0) {
    Write-Host "----- COPIADOS -----" -ForegroundColor Green
    $copied | ForEach-Object { Write-Host "  $_" }
}
if ($omitted.Count -gt 0) {
    Write-Host "----- OMITIDOS -----" -ForegroundColor DarkGray
    $omitted | ForEach-Object { Write-Host "  $_" }
}
if ($warnings.Count -gt 0) {
    Write-Host "----- WARNINGS -----" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  $_" }
}
if ($dudas.Count -gt 0) {
    Write-Host "----- DUDAS (requieren decision humana) -----" -ForegroundColor Magenta
    $dudas | ForEach-Object { Write-Host "  $_" }
}
Write-Host "============================================" -ForegroundColor Cyan
