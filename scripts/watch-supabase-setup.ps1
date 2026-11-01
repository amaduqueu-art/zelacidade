# Monitor da configuração do Supabase para o ZelaCidade.
# Fase 1: espera a tabela public.reports (schema-core.sql).
# Fase 2: copia storage.sql para a área de transferência e abre o SQL Editor.
# Fase 3: espera o bucket report-images e roda a validação ponta a ponta.

$ErrorActionPreference = 'SilentlyContinue'
$key = 'sb_publishable_7DkEEAaGFLhhGLOlBdJ1LQ_7e14FaRi'
$base = 'https://popnwxhpzfnqqqfbvuph.supabase.co'
$project = 'C:\Users\user\zelacidade'
$headers = @{ apikey = $key }

function Test-Reports {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri "$base/rest/v1/reports?select=id&limit=1" -TimeoutSec 15
    return ($r.StatusCode -eq 200)
  } catch { return $false }
}

function Test-Bucket {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Headers $headers -Uri "$base/storage/v1/bucket/report-images" -TimeoutSec 15
    return ($r.StatusCode -eq 200)
  } catch { return $false }
}

function Wait-For([scriptblock]$check, [int]$minutes, [string]$label) {
  $deadline = (Get-Date).AddMinutes($minutes)
  while ((Get-Date) -lt $deadline) {
    if (& $check) { return $true }
    Start-Sleep -Seconds 5
  }
  Write-Output "TIMEOUT: $label"
  return $false
}

Write-Output "AGUARDANDO: tabela public.reports (execute schema-core.sql)"

if (-not (Wait-For ${function:Test-Reports} 5 'public.reports')) { exit 2 }

Write-Output "CORE OK: public.reports detectada em $(Get-Date -Format o)"

# Fase 2: prepara o storage.sql para o usuário colar.
$storageSql = Get-Content "$project\supabase\storage.sql" -Raw
Set-Clipboard -Value $storageSql
Start-Process 'https://supabase.com/dashboard/project/popnwxhpzfnqqqfbvuph/sql/new'
Write-Output "STORAGE PRONTO: storage.sql copiado ($($storageSql.Length) caracteres) e SQL Editor aberto."
Write-Output "AGUARDANDO: bucket report-images"

if (-not (Wait-For ${function:Test-Bucket} 90 'bucket report-images')) { exit 3 }

Write-Output "BUCKET OK: report-images detectado em $(Get-Date -Format o)"
Write-Output "RODANDO VALIDACAO..."

Set-Location $project
npm run validate:supabase
Write-Output "VALIDACAO EXIT CODE: $LASTEXITCODE"
exit $LASTEXITCODE
