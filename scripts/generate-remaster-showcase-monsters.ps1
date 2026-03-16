param(
  [string]$ExamplesRoot = "public/game-assets/remaster/examples"
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path $ExamplesRoot
$monsterConfigs = @(
  @{
    Base = "anim_monster_slime"
    Family = "slime"
    Primary = [System.Drawing.Color]::FromArgb(255, 214, 91, 75)
    Secondary = [System.Drawing.Color]::FromArgb(255, 244, 138, 116)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 255, 193, 182)
    Accent = [System.Drawing.Color]::FromArgb(255, 31, 26, 27)
    Glow = [System.Drawing.Color]::FromArgb(64, 255, 131, 111)
  },
  @{
    Base = "anim_monster_bog"
    Family = "slime"
    Primary = [System.Drawing.Color]::FromArgb(255, 111, 157, 86)
    Secondary = [System.Drawing.Color]::FromArgb(255, 143, 199, 114)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 215, 255, 208)
    Accent = [System.Drawing.Color]::FromArgb(255, 26, 31, 22)
    Glow = [System.Drawing.Color]::FromArgb(60, 150, 219, 126)
  },
  @{
    Base = "anim_monster_spider"
    Family = "spider"
    Primary = [System.Drawing.Color]::FromArgb(255, 70, 101, 75)
    Secondary = [System.Drawing.Color]::FromArgb(255, 154, 196, 140)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 247, 245, 236)
    Accent = [System.Drawing.Color]::FromArgb(255, 25, 32, 18)
    Glow = [System.Drawing.Color]::FromArgb(48, 142, 221, 151)
  },
  @{
    Base = "anim_monster_wolf"
    Family = "wolf"
    Primary = [System.Drawing.Color]::FromArgb(255, 139, 143, 150)
    Secondary = [System.Drawing.Color]::FromArgb(255, 207, 214, 220)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 247, 245, 236)
    Accent = [System.Drawing.Color]::FromArgb(255, 23, 26, 31)
    Glow = [System.Drawing.Color]::FromArgb(44, 179, 206, 255)
  },
  @{
    Base = "anim_monster_orc"
    Family = "orc"
    Primary = [System.Drawing.Color]::FromArgb(255, 125, 160, 78)
    Secondary = [System.Drawing.Color]::FromArgb(255, 198, 217, 139)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 243, 235, 220)
    Accent = [System.Drawing.Color]::FromArgb(255, 27, 18, 16)
    Glow = [System.Drawing.Color]::FromArgb(50, 188, 227, 122)
  },
  @{
    Base = "anim_monster_boar"
    Family = "boar"
    Primary = [System.Drawing.Color]::FromArgb(255, 126, 86, 56)
    Secondary = [System.Drawing.Color]::FromArgb(255, 243, 223, 197)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 255, 245, 236)
    Accent = [System.Drawing.Color]::FromArgb(255, 36, 21, 17)
    Glow = [System.Drawing.Color]::FromArgb(48, 255, 177, 134)
  },
  @{
    Base = "anim_monster_wisp"
    Family = "wisp"
    Primary = [System.Drawing.Color]::FromArgb(255, 123, 214, 255)
    Secondary = [System.Drawing.Color]::FromArgb(255, 223, 248, 255)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
    Accent = [System.Drawing.Color]::FromArgb(255, 105, 221, 255)
    Glow = [System.Drawing.Color]::FromArgb(82, 132, 221, 255)
  },
  @{
    Base = "anim_monster_dragon"
    Family = "dragon"
    Primary = [System.Drawing.Color]::FromArgb(255, 184, 75, 64)
    Secondary = [System.Drawing.Color]::FromArgb(255, 255, 216, 184)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 255, 243, 228)
    Accent = [System.Drawing.Color]::FromArgb(255, 40, 15, 17)
    Glow = [System.Drawing.Color]::FromArgb(56, 255, 147, 114)
  },
  @{
    Base = "anim_monster_rock_golem"
    Family = "golem"
    Primary = [System.Drawing.Color]::FromArgb(255, 116, 123, 114)
    Secondary = [System.Drawing.Color]::FromArgb(255, 170, 216, 226)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 233, 248, 255)
    Accent = [System.Drawing.Color]::FromArgb(255, 28, 29, 27)
    Glow = [System.Drawing.Color]::FromArgb(48, 162, 221, 234)
  },
  @{
    Base = "anim_monster_skeleton"
    Family = "skeleton"
    Primary = [System.Drawing.Color]::FromArgb(255, 230, 226, 215)
    Secondary = [System.Drawing.Color]::FromArgb(255, 141, 111, 73)
    Tertiary = [System.Drawing.Color]::FromArgb(255, 255, 250, 240)
    Accent = [System.Drawing.Color]::FromArgb(255, 23, 23, 23)
    Glow = [System.Drawing.Color]::FromArgb(44, 239, 228, 206)
  }
)

function New-PointF([double]$x, [double]$y) {
  return New-Object System.Drawing.PointF([float]$x, [float]$y)
}

function Get-FacingVector([string]$direction) {
  switch ($direction) {
    "n" { return @{ X = 0.0; Y = -1.0; } }
    "ne" { return @{ X = 0.75; Y = -0.7; } }
    "e" { return @{ X = 1.0; Y = -0.1; } }
    "se" { return @{ X = 0.75; Y = 0.75; } }
    "s" { return @{ X = 0.0; Y = 1.0; } }
    "sw" { return @{ X = -0.75; Y = 0.75; } }
    "w" { return @{ X = -1.0; Y = -0.1; } }
    "nw" { return @{ X = -0.75; Y = -0.7; } }
    default { return @{ X = 0.0; Y = 1.0; } }
  }
}

function Get-FrameEntries([string]$frameOrderPath) {
  return @(
    Get-Content $frameOrderPath |
      Where-Object { $_ -and -not $_.StartsWith("#") } |
      ForEach-Object {
        $parts = $_ -split "\s+", 2
        if ($parts.Length -eq 2) {
          [string]$parts[1]
        }
      }
  )
}

foreach ($config in $monsterConfigs) {
  $base = $config.Base
  $sampleDir = Join-Path $root $base
  $frameOrderPath = Join-Path $sampleDir "frame-order.txt"
  if (!(Test-Path $frameOrderPath)) {
    Write-Warning "Skipping $base because frame-order.txt is missing."
    continue
  }

  $entries = Get-FrameEntries $frameOrderPath
  if ($entries.Count -eq 0) {
    Write-Warning "Skipping $base because no frame entries were found."
    continue
  }

  $frameSize = 128
  $columns = 4
  $rows = [int][Math]::Ceiling($entries.Count / [double]$columns)
  $width = [int]($columns * $frameSize)
  $height = [int]($rows * $frameSize)

  $bitmap = New-Object System.Drawing.Bitmap($width, $height)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $graphics.Clear([System.Drawing.Color]::Transparent)

  for ($i = 0; $i -lt $entries.Count; $i++) {
    [string]$entry = $entries[$i]
    if ($entry -notmatch "^${base}_(idle|walk|attack)_(n|ne|e|se|s|sw|w|nw)_([0-9]+)$") {
      continue
    }

    [string]$state = $Matches[1]
    [string]$direction = $Matches[2]
    [int]$frame = [int]$Matches[3]
    [int]$x = ($i % $columns) * $frameSize
    [int]$y = [int][Math]::Floor($i / $columns) * $frameSize
    [double]$cx = $x + 64
    [double]$cy = $y + 74
    $vector = Get-FacingVector $direction
    [double]$faceX = [double]$vector.X
    [double]$faceY = [double]$vector.Y
    [double]$phase =
      if ($state -eq "walk") { ($frame / 4.0) * [Math]::PI * 2.0 }
      elseif ($state -eq "attack") { ($frame / 4.0) * [Math]::PI }
      else { ($frame / 2.0) * [Math]::PI }
    [double]$bob =
      if ($state -eq "walk") { [Math]::Sin($phase) * 2.8 }
      elseif ($state -eq "attack") { -[Math]::Sin($phase) * 2.0 }
      else { [Math]::Sin($phase) * 1.2 }
    $cy += $bob
    [double]$swing =
      if ($state -eq "walk") { [Math]::Sin($phase) * 8.0 }
      elseif ($state -eq "attack") { 9.0 - ($frame * 2.3) }
      else { [Math]::Sin($phase) * 1.6 }
    [double]$reach =
      if ($state -eq "attack") { 12.0 + ($frame * 3.0) }
      else { 0.0 }

    $glowAlpha =
      if ($state -eq "attack") { 82 }
      elseif ($state -eq "walk") { 62 }
      else { 48 }
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($glowAlpha, $config.Glow.R, $config.Glow.G, $config.Glow.B))
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(84, 0, 0, 0))
    $graphics.FillEllipse($glowBrush, [float]($cx - 26), [float]($cy - 26), 52, 52)
    $graphics.FillEllipse($shadowBrush, [float]($cx - 24), [float]($cy + 30), 48, 12)

    switch ($config.Family) {
      "slime" {
        $blobRect = New-Object System.Drawing.RectangleF([float]($cx - 22), [float]($cy - 14), 44, 34)
        $blobBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($blobRect, $config.Secondary, $config.Primary, 90.0)
        $blobPen = New-Object System.Drawing.Pen($config.Tertiary, 2)
        $graphics.FillEllipse($blobBrush, $blobRect)
        $graphics.DrawEllipse($blobPen, $blobRect)
        $graphics.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(84, $config.Tertiary.R, $config.Tertiary.G, $config.Tertiary.B))), [float]($cx - 14), [float]($cy - 10), 18, 10)
        $eyeBrush = New-Object System.Drawing.SolidBrush($config.Accent)
        $graphics.FillEllipse($eyeBrush, [float]($cx - 9 + ($faceX * 2)), [float]($cy - 1), 5, 7)
        $graphics.FillEllipse($eyeBrush, [float]($cx + 4 + ($faceX * 2)), [float]($cy - 1), 5, 7)
        if ($state -eq "attack") {
          $tongueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(190, 250, 176, 160))
          $graphics.FillPie($tongueBrush, [float]($cx - 8 + ($faceX * 5)), [float]($cy + 4), 16, 14, 10, 160)
          $tongueBrush.Dispose()
        }
        $blobBrush.Dispose()
        $blobPen.Dispose()
        $eyeBrush.Dispose()
      }
      "spider" {
        $legPen = New-Object System.Drawing.Pen($config.Secondary, 4)
        foreach ($side in @(-1, 1)) {
          foreach ($offset in @(-10, -2, 6, 14)) {
            $graphics.DrawLine(
              $legPen,
              [float]($cx + ($side * 8)),
              [float]($cy + $offset),
              [float]($cx + ($side * (24 + ($frame * 1.2))) + ($faceX * 3)),
              [float]($cy + $offset + ($side * 4))
            )
          }
        }
        $bodyBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $thoraxBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillEllipse($bodyBrush, [float]($cx - 16), [float]($cy - 6), 32, 26)
        $graphics.FillEllipse($thoraxBrush, [float]($cx - 10), [float]($cy - 18), 20, 16)
        $eyeBrush = New-Object System.Drawing.SolidBrush($config.Tertiary)
        $graphics.FillEllipse($eyeBrush, [float]($cx - 6 + ($faceX * 2)), [float]($cy - 14), 4, 4)
        $graphics.FillEllipse($eyeBrush, [float]($cx + 2 + ($faceX * 2)), [float]($cy - 14), 4, 4)
        $legPen.Dispose()
        $bodyBrush.Dispose()
        $thoraxBrush.Dispose()
        $eyeBrush.Dispose()
      }
      "wolf" {
        $bodyBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $furBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillEllipse($bodyBrush, [float]($cx - 22), [float]($cy - 4), 44, 24)
        $graphics.FillEllipse($furBrush, [float]($cx - 10 + ($faceX * 6)), [float]($cy - 18), 24, 18)
        $earPoints = @(
          (New-PointF ($cx - 2 + ($faceX * 5)) ($cy - 20)),
          (New-PointF ($cx + 4 + ($faceX * 5)) ($cy - 34)),
          (New-PointF ($cx + 9 + ($faceX * 5)) ($cy - 18))
        )
        $graphics.FillPolygon($furBrush, $earPoints)
        $legPen = New-Object System.Drawing.Pen($config.Accent, 4)
        $graphics.DrawLine($legPen, [float]($cx - 12), [float]($cy + 10), [float]($cx - 16 - ($swing * 0.3)), [float]($cy + 34))
        $graphics.DrawLine($legPen, [float]($cx + 8), [float]($cy + 10), [float]($cx + 12 + ($swing * 0.3)), [float]($cy + 34))
        $tailPen = New-Object System.Drawing.Pen($config.Primary, 5)
        $graphics.DrawArc($tailPen, [float]($cx - 34), [float]($cy - 4), 20, 22, 210, 120)
        if ($state -eq "attack") {
          $jawPen = New-Object System.Drawing.Pen($config.Tertiary, 2)
          $graphics.DrawLine($jawPen, [float]($cx + 14 + ($faceX * 8)), [float]($cy - 6), [float]($cx + 24 + ($faceX * 9) + $reach), [float]($cy + 2))
          $jawPen.Dispose()
        }
        $bodyBrush.Dispose()
        $furBrush.Dispose()
        $legPen.Dispose()
        $tailPen.Dispose()
      }
      "orc" {
        $torsoBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $chestRect = New-Object System.Drawing.RectangleF([float]($cx - 18), [float]($cy - 12), 36, 34)
        $graphics.FillEllipse($torsoBrush, $chestRect)
        $headBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillEllipse($headBrush, [float]($cx - 13 + ($faceX * 2)), [float]($cy - 28), 26, 22)
        $tuskBrush = New-Object System.Drawing.SolidBrush($config.Tertiary)
        $graphics.FillEllipse($tuskBrush, [float]($cx - 12 + ($faceX * 3)), [float]($cy - 5), 6, 10)
        $graphics.FillEllipse($tuskBrush, [float]($cx + 6 + ($faceX * 3)), [float]($cy - 5), 6, 10)
        $clubPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 119, 84, 40), 5)
        $graphics.DrawLine($clubPen, [float]($cx + 16), [float]($cy + 4), [float]($cx + 26 + $reach), [float]($cy - 18 - $reach))
        $graphics.FillEllipse((New-Object System.Drawing.SolidBrush($config.Accent)), [float]($cx + 20 + $reach), [float]($cy - 28 - $reach), 14, 14)
        $torsoBrush.Dispose()
        $headBrush.Dispose()
        $tuskBrush.Dispose()
        $clubPen.Dispose()
      }
      "boar" {
        $bodyBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $graphics.FillEllipse($bodyBrush, [float]($cx - 24), [float]($cy - 2), 48, 26)
        $snoutBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillEllipse($snoutBrush, [float]($cx + 8 + ($faceX * 6)), [float]($cy + 2), 18, 14)
        $tuskPen = New-Object System.Drawing.Pen($config.Tertiary, 2)
        $graphics.DrawArc($tuskPen, [float]($cx + 13 + ($faceX * 6)), [float]($cy + 6), 8, 8, 200, 130)
        $spinePen = New-Object System.Drawing.Pen($config.Accent, 3)
        $graphics.DrawLine($spinePen, [float]($cx - 10), [float]($cy - 2), [float]($cx + 16), [float]($cy - 10))
        $bodyBrush.Dispose()
        $snoutBrush.Dispose()
        $tuskPen.Dispose()
        $spinePen.Dispose()
      }
      "wisp" {
        $coreBrush = New-Object System.Drawing.SolidBrush($config.Tertiary)
        $midBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillEllipse($midBrush, [float]($cx - 18), [float]($cy - 18), 36, 36)
        $graphics.FillEllipse($coreBrush, [float]($cx - 10), [float]($cy - 10), 20, 20)
        $trailPen = New-Object System.Drawing.Pen($config.Accent, 4)
        $graphics.DrawArc($trailPen, [float]($cx - 20), [float]($cy + 6), 42, 32, [float](30 + ($frame * 10)), 120)
        if ($state -eq "attack") {
          $sparkPen = New-Object System.Drawing.Pen($config.Tertiary, 3)
          $graphics.DrawLine($sparkPen, [float]($cx + 10), [float]($cy - 8), [float]($cx + 24 + $reach), [float]($cy - 18 - $reach))
          $sparkPen.Dispose()
        }
        $coreBrush.Dispose()
        $midBrush.Dispose()
        $trailPen.Dispose()
      }
      "dragon" {
        $wingBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $bodyBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $graphics.FillPie($wingBrush, [float]($cx - 34), [float]($cy - 24), 28, 34, 110, 150)
        $graphics.FillPie($wingBrush, [float]($cx + 6), [float]($cy - 24), 28, 34, -80, 150)
        $graphics.FillEllipse($bodyBrush, [float]($cx - 18), [float]($cy - 6), 36, 30)
        $graphics.FillEllipse($wingBrush, [float]($cx - 8 + ($faceX * 8)), [float]($cy - 24), 24, 20)
        $hornPen = New-Object System.Drawing.Pen($config.Tertiary, 2)
        $graphics.DrawLine($hornPen, [float]($cx - 3 + ($faceX * 6)), [float]($cy - 21), [float]($cx - 8 + ($faceX * 8)), [float]($cy - 33))
        $graphics.DrawLine($hornPen, [float]($cx + 8 + ($faceX * 6)), [float]($cy - 21), [float]($cx + 13 + ($faceX * 8)), [float]($cy - 33))
        if ($state -eq "attack") {
          $flameBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(184, 255, 186, 98))
          $graphics.FillPie($flameBrush, [float]($cx + 18 + ($faceX * 10)), [float]($cy - 4), 24 + $reach, 18, -20, 120)
          $flameBrush.Dispose()
        }
        $wingBrush.Dispose()
        $bodyBrush.Dispose()
        $hornPen.Dispose()
      }
      "golem" {
        $rockBrush = New-Object System.Drawing.SolidBrush($config.Primary)
        $highlightBrush = New-Object System.Drawing.SolidBrush($config.Secondary)
        $graphics.FillRectangle($rockBrush, [float]($cx - 18), [float]($cy - 8), 36, 28)
        $graphics.FillRectangle($rockBrush, [float]($cx - 12), [float]($cy - 28), 24, 18)
        $graphics.FillEllipse($highlightBrush, [float]($cx - 7), [float]($cy - 20), 6, 6)
        $graphics.FillEllipse($highlightBrush, [float]($cx + 1), [float]($cy - 20), 6, 6)
        $armPen = New-Object System.Drawing.Pen($config.Primary, 8)
        $graphics.DrawLine($armPen, [float]($cx - 16), [float]($cy + 2), [float]($cx - 28 - ($faceX * 4)), [float]($cy + 18))
        $graphics.DrawLine($armPen, [float]($cx + 16), [float]($cy + 2), [float]($cx + 28 + ($faceX * 4) + $reach), [float]($cy - 2 - $reach))
        $rockBrush.Dispose()
        $highlightBrush.Dispose()
        $armPen.Dispose()
      }
      "skeleton" {
        $bonePen = New-Object System.Drawing.Pen($config.Primary, 4)
        $graphics.DrawLine($bonePen, [float]$cx, [float]($cy - 10), [float]$cx, [float]($cy + 20))
        $graphics.DrawLine($bonePen, [float]($cx - 14), [float]($cy), [float]($cx + 14 + $reach), [float]($cy - 6 - $reach * 0.3))
        $graphics.DrawLine($bonePen, [float]($cx - 6), [float]($cy + 20), [float]($cx - 14 - ($swing * 0.3)), [float]($cy + 40))
        $graphics.DrawLine($bonePen, [float]($cx + 6), [float]($cy + 20), [float]($cx + 14 + ($swing * 0.3)), [float]($cy + 40))
        $skullBrush = New-Object System.Drawing.SolidBrush($config.Tertiary)
        $graphics.FillEllipse($skullBrush, [float]($cx - 12 + ($faceX * 2)), [float]($cy - 28), 24, 22)
        $eyeBrush = New-Object System.Drawing.SolidBrush($config.Accent)
        $graphics.FillEllipse($eyeBrush, [float]($cx - 7 + ($faceX * 2)), [float]($cy - 20), 4, 5)
        $graphics.FillEllipse($eyeBrush, [float]($cx + 3 + ($faceX * 2)), [float]($cy - 20), 4, 5)
        $bladePen = New-Object System.Drawing.Pen($config.Secondary, 3)
        $graphics.DrawLine($bladePen, [float]($cx + 16), [float]($cy - 2), [float]($cx + 26 + $reach), [float]($cy - 24 - $reach))
        $bonePen.Dispose()
        $skullBrush.Dispose()
        $eyeBrush.Dispose()
        $bladePen.Dispose()
      }
    }

    if ($state -eq "attack") {
      $trailPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(70, $config.Tertiary.R, $config.Tertiary.G, $config.Tertiary.B), 3)
      $graphics.DrawArc($trailPen, [float]($cx - 18), [float]($cy - 30), 46, 34, [float](260 - ($frame * 14)), 72)
      $trailPen.Dispose()
    }

    $glowBrush.Dispose()
    $shadowBrush.Dispose()
  }

  $outputPath = Join-Path $sampleDir "atlas.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Host "Generated $outputPath"
}
