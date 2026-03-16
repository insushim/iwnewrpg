param(
  [string]$ExamplesRoot = "public/game-assets/remaster/examples"
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path $ExamplesRoot
$indexPath = Join-Path $root "index.json"
if (!(Test-Path $indexPath)) {
  Write-Error "Missing $indexPath. Run npm run generate:remaster-atlas-sample first."
  exit 1
}

$index = Get-Content $indexPath -Raw | ConvertFrom-Json
$frameSize = 128
$columns = 4

foreach ($unit in $index.units) {
  $base = $unit.base
  $sampleDir = Join-Path $root $base
  $frameOrderPath = Join-Path $sampleDir "frame-order.txt"
  if (!(Test-Path $frameOrderPath)) {
    Write-Warning "Skipping $base because frame-order.txt is missing."
    continue
  }

  $entries = @(
    Get-Content $frameOrderPath |
      Where-Object { $_ -and -not $_.StartsWith("#") } |
      ForEach-Object {
        $parts = $_ -split "\s+", 2
        if ($parts.Length -eq 2) {
          [string]$parts[1]
        }
      }
  )

  if ($entries.Count -eq 0) {
    Write-Warning "Skipping $base because no frame entries were found."
    continue
  }

  $rows = [int][Math]::Ceiling($entries.Count / [double]$columns)
  $width = [int]($columns * $frameSize)
  $height = [int]($rows * $frameSize)

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $bg = [System.Drawing.Color]::FromArgb(255, 7, 10, 16)
  $panel = [System.Drawing.Color]::FromArgb(255, 15, 20, 32)
  $grid = [System.Drawing.Color]::FromArgb(255, 44, 54, 75)
  $cross = [System.Drawing.Color]::FromArgb(255, 70, 80, 104)
  $shadow = [System.Drawing.Color]::FromArgb(120, 0, 0, 0)
  $label = [System.Drawing.Color]::FromArgb(255, 242, 230, 200)
  $indexColor = [System.Drawing.Color]::FromArgb(255, 210, 180, 124)

  $graphics.Clear($bg)
  $fontLabel = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Regular)
  $fontIndex = New-Object System.Drawing.Font("Consolas", 8, [System.Drawing.FontStyle]::Bold)
  $panelBrush = New-Object System.Drawing.SolidBrush($panel)
  $gridPen = New-Object System.Drawing.Pen($grid, 1)
  $innerPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 255, 255), 1)
  $crossPen = New-Object System.Drawing.Pen($cross, 1)

  for ($i = 0; $i -lt $entries.Count; $i++) {
    [string]$entry = $entries[$i]
    [int]$x = ($i % $columns) * $frameSize
    [int]$y = [Math]::Floor($i / $columns) * $frameSize

    $rect = New-Object System.Drawing.Rectangle($x, $y, $frameSize, $frameSize)
    $inner = New-Object System.Drawing.Rectangle(([int]($x + 8)), ([int]($y + 8)), ([int]($frameSize - 16)), ([int]($frameSize - 16)))
    $graphics.FillRectangle($panelBrush, $rect)
    $graphics.DrawRectangle($gridPen, $rect)
    $graphics.DrawRectangle($innerPen, $inner)
    $graphics.DrawLine($crossPen, ([int]($x + ($frameSize / 2))), ([int]($y + 18)), ([int]($x + ($frameSize / 2))), ([int]($y + $frameSize - 18)))
    $graphics.DrawLine($crossPen, ([int]($x + 18)), ([int]($y + ($frameSize / 2))), ([int]($x + $frameSize - 18)), ([int]($y + ($frameSize / 2))))

    $shadowBrush = New-Object System.Drawing.SolidBrush($shadow)
    $graphics.FillEllipse($shadowBrush, $x + 42, $y + 98, 44, 12)

    $accent =
      if ($entry -like "*_idle_*") { [System.Drawing.Color]::FromArgb(90, 122, 162, 255) }
      elseif ($entry -like "*_walk_*") { [System.Drawing.Color]::FromArgb(90, 114, 215, 150) }
      else { [System.Drawing.Color]::FromArgb(90, 242, 196, 107) }
    $accentBrush = New-Object System.Drawing.SolidBrush($accent)
    $graphics.FillEllipse($accentBrush, $x + 52, $y + 30, 24, 24)
    $graphics.FillRectangle($accentBrush, $x + 50, $y + 54, 28, 30)

    $indexBrush = New-Object System.Drawing.SolidBrush($indexColor)
    $labelBrush = New-Object System.Drawing.SolidBrush($label)
    $graphics.DrawString($i.ToString("000"), $fontIndex, $indexBrush, $x + 8, $y + 8)

    $labelText = ($entry -replace "^" + [regex]::Escape($base) + "_", "").Replace("_", " ").ToUpperInvariant()
    $graphics.DrawString($labelText, $fontLabel, $labelBrush, $x + 8, $y + 108)

    $shadowBrush.Dispose()
    $accentBrush.Dispose()
    $indexBrush.Dispose()
    $labelBrush.Dispose()
  }

  $outputPath = Join-Path $sampleDir "atlas.placeholder.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

  $panelBrush.Dispose()
  $gridPen.Dispose()
  $innerPen.Dispose()
  $crossPen.Dispose()
  $fontLabel.Dispose()
  $fontIndex.Dispose()
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Host "Generated $outputPath"
}
