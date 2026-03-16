param(
  [string]$ExamplesRoot = "public/game-assets/remaster/examples"
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path $ExamplesRoot
$playerConfigs = @(
  @{
    Base = "anim_player_guardian"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 235, 215, 148)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 111, 86, 38)
    Accent = [System.Drawing.Color]::FromArgb(255, 194, 41, 32)
    Cape = [System.Drawing.Color]::FromArgb(228, 122, 26, 31)
    GlowIdle = [System.Drawing.Color]::FromArgb(54, 125, 161, 226)
    GlowWalk = [System.Drawing.Color]::FromArgb(64, 96, 181, 255)
    GlowAttack = [System.Drawing.Color]::FromArgb(88, 246, 203, 111)
    Weapon = "blade"
    Offhand = "shield"
  },
  @{
    Base = "anim_player_ranger"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 199, 232, 154)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 53, 97, 47)
    Accent = [System.Drawing.Color]::FromArgb(255, 119, 84, 36)
    Cape = [System.Drawing.Color]::FromArgb(214, 49, 78, 42)
    GlowIdle = [System.Drawing.Color]::FromArgb(54, 104, 174, 120)
    GlowWalk = [System.Drawing.Color]::FromArgb(68, 122, 215, 144)
    GlowAttack = [System.Drawing.Color]::FromArgb(84, 195, 234, 115)
    Weapon = "bow"
    Offhand = "none"
  },
  @{
    Base = "anim_player_arcanist"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 230, 197, 255)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 92, 48, 138)
    Accent = [System.Drawing.Color]::FromArgb(255, 129, 84, 201)
    Cape = [System.Drawing.Color]::FromArgb(212, 49, 30, 92)
    GlowIdle = [System.Drawing.Color]::FromArgb(58, 178, 140, 255)
    GlowWalk = [System.Drawing.Color]::FromArgb(74, 208, 132, 255)
    GlowAttack = [System.Drawing.Color]::FromArgb(92, 252, 203, 255)
    Weapon = "staff"
    Offhand = "orb"
  },
  @{
    Base = "anim_player_sovereign"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 242, 223, 152)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 127, 78, 22)
    Accent = [System.Drawing.Color]::FromArgb(255, 183, 132, 39)
    Cape = [System.Drawing.Color]::FromArgb(220, 106, 23, 20)
    GlowIdle = [System.Drawing.Color]::FromArgb(54, 214, 171, 86)
    GlowWalk = [System.Drawing.Color]::FromArgb(64, 241, 195, 102)
    GlowAttack = [System.Drawing.Color]::FromArgb(90, 255, 221, 122)
    Weapon = "blade"
    Offhand = "none"
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

foreach ($config in $playerConfigs) {
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
      if ($state -eq "walk") { [Math]::Sin($phase) * 3.0 }
      elseif ($state -eq "attack") { -[Math]::Sin($phase) * 2.0 }
      else { [Math]::Sin($phase) * 1.2 }
    $cy += $bob

    [double]$stanceX = $faceX * 4.5
    [double]$lean = $faceX * 3.0
    [double]$swing =
      if ($state -eq "walk") { [Math]::Sin($phase) * 8.0 }
      elseif ($state -eq "attack") { 10.0 - ($frame * 2.6) }
      else { [Math]::Sin($phase) * 1.8 }
    [double]$reach =
      if ($state -eq "attack") { 12.0 + ($frame * 3.0) }
      else { 0.0 }

    $glowColor =
      if ($state -eq "attack") { $config.GlowAttack }
      elseif ($state -eq "walk") { $config.GlowWalk }
      else { $config.GlowIdle }
    $glowBrush = New-Object System.Drawing.SolidBrush($glowColor)
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(86, 0, 0, 0))
    $graphics.FillEllipse($glowBrush, [float]($cx - 26), [float]($cy - 26), 52, 52)
    $graphics.FillEllipse($shadowBrush, [float]($cx - 22), [float]($cy + 31), 44, 12)

    $capePoints = @(
      (New-PointF ($cx - 12 - ($faceX * 3)) ($cy - 6)),
      (New-PointF ($cx + 14 - ($faceX * 4)) ($cy - 6)),
      (New-PointF ($cx + 22 - ($faceX * 10) + ([Math]::Sin($phase) * 4)) ($cy + 34)),
      (New-PointF ($cx - 18 - ($faceX * 2) - ([Math]::Cos($phase) * 3)) ($cy + 30))
    )
    $capeBrush = New-Object System.Drawing.SolidBrush($config.Cape)
    $graphics.FillPolygon($capeBrush, $capePoints)

    $legBackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 62, 70, 86), 5)
    $legFrontPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 103, 113, 136), 6)
    $graphics.DrawLine($legBackPen, [float]($cx - 6 + $stanceX), [float]($cy + 18), [float]($cx - 10 + $stanceX - ($swing * 0.35)), [float]($cy + 40))
    $graphics.DrawLine($legFrontPen, [float]($cx + 6 + $stanceX), [float]($cy + 16), [float]($cx + 9 + $stanceX + ($swing * 0.35)), [float]($cy + 42))

    $torsoRect = New-Object System.Drawing.RectangleF([float]($cx - 15 + $lean), [float]($cy - 12), 30, 32)
    $armorBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($torsoRect, $config.ArmorLight, $config.ArmorDark, 90.0)
    $armorEdgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 246, 227, 182), 2)
    $graphics.FillEllipse($armorBrush, $torsoRect)
    $graphics.DrawEllipse($armorEdgePen, $torsoRect)

    $beltBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 65, 37, 20))
    $graphics.FillRectangle($beltBrush, [float]($cx - 14 + $lean), [float]($cy + 6), 28, 6)

    $shoulderBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 180, 151, 90))
    $graphics.FillEllipse($shoulderBrush, [float]($cx - 19 + $lean), [float]($cy - 10), 11, 12)
    $graphics.FillEllipse($shoulderBrush, [float]($cx + 8 + $lean), [float]($cy - 10), 11, 12)

    $armBackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(210, 92, 101, 122), 4)
    $armFrontPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 196, 175, 118), 5)
    $graphics.DrawLine($armBackPen, [float]($cx - 10 + $lean), [float]($cy - 1), [float]($cx - 24 + $lean - ($faceX * 4)), [float]($cy + 15 - ($faceY * 2)))
    $graphics.DrawLine($armFrontPen, [float]($cx + 10 + $lean), [float]($cy - 1), [float]($cx + 22 + $lean + ($faceX * 4) + $reach), [float]($cy + 10 + ($faceY * 2) - ($reach * 0.08)))

    $headRect = New-Object System.Drawing.RectangleF([float]($cx - 11 + ($faceX * 1.8)), [float]($cy - 28), 22, 22)
    $headBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $headRect,
      [System.Drawing.Color]::FromArgb(255, 244, 223, 173),
      [System.Drawing.Color]::FromArgb(255, 155, 126, 76),
      90.0
    )
    $graphics.FillEllipse($headBrush, $headRect)
    $graphics.DrawEllipse($armorEdgePen, $headRect)

    $crestPoints = @(
      (New-PointF ($cx - 10 + ($faceX * 1.4)) ($cy - 20)),
      (New-PointF ($cx + 10 + ($faceX * 1.4)) ($cy - 20)),
      (New-PointF ($cx + 5 + ($faceX * 3.2)) ($cy - 34)),
      (New-PointF ($cx - 5 + ($faceX * 3.2)) ($cy - 34))
    )
    $crestBrush = New-Object System.Drawing.SolidBrush($config.Accent)
    $graphics.FillPolygon($crestBrush, $crestPoints)

    $visorPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(190, 37, 26, 18), 2)
    $graphics.DrawArc($visorPen, [float]($cx - 8 + ($faceX * 1.8)), [float]($cy - 22), 16, 9, 8, 164)

    if ($config.Offhand -eq "shield") {
      $shieldRect = New-Object System.Drawing.RectangleF([float]($cx - 30 - ($faceX * 10)), [float]($cy - 2), 18, 24)
      $shieldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $shieldRect,
        [System.Drawing.Color]::FromArgb(255, 120, 69, 36),
        [System.Drawing.Color]::FromArgb(255, 61, 33, 19),
        90.0
      )
      $shieldPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 233, 191, 108), 2)
      $graphics.FillEllipse($shieldBrush, $shieldRect)
      $graphics.DrawEllipse($shieldPen, $shieldRect)
      $graphics.DrawLine($shieldPen, [float]($cx - 21 - ($faceX * 10)), [float]($cy + 1), [float]($cx - 21 - ($faceX * 10)), [float]($cy + 19))
      $shieldBrush.Dispose()
      $shieldPen.Dispose()
    }

    if ($config.Offhand -eq "orb") {
      $orbGlowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(76, 177, 145, 255))
      $orbBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 239, 255))
      $orbPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 208, 168, 255), 1.5)
      $graphics.FillEllipse($orbGlowBrush, [float]($cx - 31 - ($faceX * 7)), [float]($cy - 3), 22, 22)
      $graphics.FillEllipse($orbBrush, [float]($cx - 28 - ($faceX * 7)), [float]($cy), 16, 16)
      $graphics.DrawEllipse($orbPen, [float]($cx - 28 - ($faceX * 7)), [float]($cy), 16, 16)
      $orbGlowBrush.Dispose()
      $orbBrush.Dispose()
      $orbPen.Dispose()
    }

    switch ($config.Weapon) {
      "blade" {
        $bladePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 208, 225, 255), 3)
        $bladePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
        $bladePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
        $hiltPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 227, 171, 85), 4)
        [double]$weaponStartX = $cx + 24 + $lean + ($faceX * 4)
        [double]$weaponStartY = $cy + 8 - ($faceY * 2)
        [double]$weaponEndX = $weaponStartX + (18 * [Math]::Sign(($faceX + 0.001))) + $reach
        [double]$weaponEndY = $weaponStartY - 24 + ($faceY * 5) - ($reach * 0.16)
        if ([Math]::Abs($faceX) -lt 0.2) {
          $weaponEndX = $weaponStartX + 10
          $weaponEndY = $weaponStartY - 30 - $reach
        }
        $graphics.DrawLine($bladePen, [float]$weaponStartX, [float]$weaponStartY, [float]$weaponEndX, [float]$weaponEndY)
        $graphics.DrawLine($hiltPen, [float]($weaponStartX - 3), [float]($weaponStartY + 2), [float]($weaponStartX + 5), [float]($weaponStartY - 2))
        if ($state -eq "attack") {
          $trailPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(92, 246, 211, 134), 4)
          $graphics.DrawArc($trailPen, [float]($cx - 10), [float]($cy - 30), 56, 44, [float](300 - ($frame * 12)), 72)
          $trailPen.Dispose()
        }
        $bladePen.Dispose()
        $hiltPen.Dispose()
      }
      "bow" {
        $bowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 129, 84, 36), 3)
        $stringPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 242, 229, 186), 1.5)
        [double]$bowX = $cx + 22 + $lean + ($faceX * 3)
        [double]$bowY = $cy + 6
        $graphics.DrawArc($bowPen, [float]($bowX - 6), [float]($bowY - 18), 16, 38, -72, 144)
        $graphics.DrawLine($stringPen, [float]$bowX, [float]($bowY - 17), [float]$bowX, [float]($bowY + 19))
        if ($state -eq "attack") {
          $arrowPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 233, 233, 222), 2)
          $trailPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(92, 182, 255, 197), 3)
          $graphics.DrawLine($arrowPen, [float]($bowX - 1), [float]($bowY + 2), [float]($bowX + 24 + $reach), [float]($bowY - 10 - ($faceY * 4)))
          $graphics.DrawLine($trailPen, [float]($bowX + 12), [float]($bowY - 4), [float]($bowX + 38 + $reach), [float]($bowY - 16 - ($faceY * 5)))
          $arrowPen.Dispose()
          $trailPen.Dispose()
        }
        $bowPen.Dispose()
        $stringPen.Dispose()
      }
      "staff" {
        $staffPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 122, 83, 45), 4)
        $gemBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 177, 145, 255))
        $gemPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(225, 238, 224, 255), 1.5)
        [double]$staffStartX = $cx + 23 + $lean + ($faceX * 3)
        [double]$staffStartY = $cy + 12
        [double]$staffEndX = $staffStartX + 8 + ($faceX * 3)
        [double]$staffEndY = $staffStartY - 34 - $reach
        $graphics.DrawLine($staffPen, [float]$staffStartX, [float]$staffStartY, [float]$staffEndX, [float]$staffEndY)
        $graphics.FillEllipse($gemBrush, [float]($staffEndX - 6), [float]($staffEndY - 8), 12, 12)
        $graphics.DrawEllipse($gemPen, [float]($staffEndX - 6), [float]($staffEndY - 8), 12, 12)
        if ($state -eq "attack") {
          $spellPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(96, 208, 179, 255), 3)
          $graphics.DrawArc($spellPen, [float]($cx - 4), [float]($cy - 34), 48, 36, [float](220 - ($frame * 10)), 110)
          $spellPen.Dispose()
        }
        $staffPen.Dispose()
        $gemBrush.Dispose()
        $gemPen.Dispose()
      }
    }

    $shineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(115, 255, 247, 225))
    $graphics.FillEllipse($shineBrush, [float]($cx - 3 + $lean), [float]($cy - 8), 8, 8)

    $glowBrush.Dispose()
    $shadowBrush.Dispose()
    $capeBrush.Dispose()
    $legBackPen.Dispose()
    $legFrontPen.Dispose()
    $armorBrush.Dispose()
    $armorEdgePen.Dispose()
    $beltBrush.Dispose()
    $shoulderBrush.Dispose()
    $armBackPen.Dispose()
    $armFrontPen.Dispose()
    $headBrush.Dispose()
    $crestBrush.Dispose()
    $visorPen.Dispose()
    $shineBrush.Dispose()
  }

  $outputPath = Join-Path $sampleDir "atlas.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Host "Generated $outputPath"
}
