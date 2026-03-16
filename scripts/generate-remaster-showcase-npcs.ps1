param(
  [string]$ExamplesRoot = "public/game-assets/remaster/examples"
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path $ExamplesRoot
$npcConfigs = @(
  @{
    Base = "anim_npc_weapon"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 193, 220, 255)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 48, 82, 129)
    Accent = [System.Drawing.Color]::FromArgb(255, 201, 137, 73)
    Cape = [System.Drawing.Color]::FromArgb(214, 60, 42, 32)
    GlowIdle = [System.Drawing.Color]::FromArgb(48, 126, 166, 255)
    GlowWalk = [System.Drawing.Color]::FromArgb(58, 116, 194, 255)
    GlowAttack = [System.Drawing.Color]::FromArgb(82, 244, 202, 114)
    Weapon = "blade"
    Offhand = "none"
    Headgear = "band"
  },
  @{
    Base = "anim_npc_armor"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 196, 238, 227)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 41, 110, 98)
    Accent = [System.Drawing.Color]::FromArgb(255, 103, 177, 148)
    Cape = [System.Drawing.Color]::FromArgb(200, 23, 74, 71)
    GlowIdle = [System.Drawing.Color]::FromArgb(48, 125, 188, 171)
    GlowWalk = [System.Drawing.Color]::FromArgb(60, 121, 223, 176)
    GlowAttack = [System.Drawing.Color]::FromArgb(72, 217, 245, 178)
    Weapon = "none"
    Offhand = "none"
    Headgear = "hood"
  },
  @{
    Base = "anim_npc_magic"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 235, 210, 255)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 92, 58, 132)
    Accent = [System.Drawing.Color]::FromArgb(255, 159, 97, 230)
    Cape = [System.Drawing.Color]::FromArgb(204, 43, 24, 83)
    GlowIdle = [System.Drawing.Color]::FromArgb(56, 148, 130, 255)
    GlowWalk = [System.Drawing.Color]::FromArgb(66, 196, 133, 255)
    GlowAttack = [System.Drawing.Color]::FromArgb(90, 242, 215, 255)
    Weapon = "staff"
    Offhand = "orb"
    Headgear = "circlet"
  },
  @{
    Base = "anim_npc_inn"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 255, 216, 189)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 143, 86, 49)
    Accent = [System.Drawing.Color]::FromArgb(255, 196, 131, 68)
    Cape = [System.Drawing.Color]::FromArgb(188, 117, 54, 25)
    GlowIdle = [System.Drawing.Color]::FromArgb(42, 236, 176, 107)
    GlowWalk = [System.Drawing.Color]::FromArgb(54, 244, 196, 128)
    GlowAttack = [System.Drawing.Color]::FromArgb(68, 255, 222, 148)
    Weapon = "tray"
    Offhand = "none"
    Headgear = "none"
  },
  @{
    Base = "anim_npc_blacksmith"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 255, 200, 181)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 127, 70, 56)
    Accent = [System.Drawing.Color]::FromArgb(255, 228, 164, 92)
    Cape = [System.Drawing.Color]::FromArgb(198, 92, 28, 20)
    GlowIdle = [System.Drawing.Color]::FromArgb(44, 255, 151, 121)
    GlowWalk = [System.Drawing.Color]::FromArgb(58, 255, 173, 141)
    GlowAttack = [System.Drawing.Color]::FromArgb(82, 255, 211, 154)
    Weapon = "hammer"
    Offhand = "none"
    Headgear = "band"
  },
  @{
    Base = "anim_npc_default"
    ArmorLight = [System.Drawing.Color]::FromArgb(255, 246, 234, 176)
    ArmorDark = [System.Drawing.Color]::FromArgb(255, 118, 100, 42)
    Accent = [System.Drawing.Color]::FromArgb(255, 183, 160, 92)
    Cape = [System.Drawing.Color]::FromArgb(184, 92, 77, 31)
    GlowIdle = [System.Drawing.Color]::FromArgb(44, 224, 205, 113)
    GlowWalk = [System.Drawing.Color]::FromArgb(56, 233, 220, 129)
    GlowAttack = [System.Drawing.Color]::FromArgb(74, 255, 233, 150)
    Weapon = "none"
    Offhand = "none"
    Headgear = "none"
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

foreach ($config in $npcConfigs) {
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
      if ($state -eq "walk") { [Math]::Sin($phase) * 2.6 }
      elseif ($state -eq "attack") { -[Math]::Sin($phase) * 1.8 }
      else { [Math]::Sin($phase) * 1.0 }
    $cy += $bob

    [double]$stanceX = $faceX * 4.0
    [double]$lean = $faceX * 2.3
    [double]$swing =
      if ($state -eq "walk") { [Math]::Sin($phase) * 7.0 }
      elseif ($state -eq "attack") { 8.0 - ($frame * 2.2) }
      else { [Math]::Sin($phase) * 1.2 }
    [double]$reach =
      if ($state -eq "attack") { 10.0 + ($frame * 2.8) }
      else { 0.0 }

    $glowColor =
      if ($state -eq "attack") { $config.GlowAttack }
      elseif ($state -eq "walk") { $config.GlowWalk }
      else { $config.GlowIdle }
    $glowBrush = New-Object System.Drawing.SolidBrush($glowColor)
    $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(82, 0, 0, 0))
    $graphics.FillEllipse($glowBrush, [float]($cx - 24), [float]($cy - 24), 48, 48)
    $graphics.FillEllipse($shadowBrush, [float]($cx - 21), [float]($cy + 31), 42, 10)

    $coatPoints = @(
      (New-PointF ($cx - 12 - ($faceX * 2)) ($cy - 4)),
      (New-PointF ($cx + 12 - ($faceX * 3)) ($cy - 4)),
      (New-PointF ($cx + 18 - ($faceX * 7) + ([Math]::Sin($phase) * 3)) ($cy + 31)),
      (New-PointF ($cx - 16 - ($faceX * 2) - ([Math]::Cos($phase) * 2)) ($cy + 28))
    )
    $coatBrush = New-Object System.Drawing.SolidBrush($config.Cape)
    $graphics.FillPolygon($coatBrush, $coatPoints)

    $legBackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(214, 68, 72, 81), 4)
    $legFrontPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(244, 108, 116, 132), 5)
    $graphics.DrawLine($legBackPen, [float]($cx - 5 + $stanceX), [float]($cy + 18), [float]($cx - 8 + $stanceX - ($swing * 0.32)), [float]($cy + 39))
    $graphics.DrawLine($legFrontPen, [float]($cx + 5 + $stanceX), [float]($cy + 17), [float]($cx + 8 + $stanceX + ($swing * 0.32)), [float]($cy + 40))

    $torsoRect = New-Object System.Drawing.RectangleF([float]($cx - 14 + $lean), [float]($cy - 11), 28, 31)
    $armorBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($torsoRect, $config.ArmorLight, $config.ArmorDark, 90.0)
    $armorEdgePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 243, 222, 182), 2)
    $graphics.FillEllipse($armorBrush, $torsoRect)
    $graphics.DrawEllipse($armorEdgePen, $torsoRect)

    $beltBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 63, 39, 24))
    $graphics.FillRectangle($beltBrush, [float]($cx - 13 + $lean), [float]($cy + 6), 26, 5)

    $armBackPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(204, 88, 95, 112), 4)
    $armFrontPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(244, 198, 177, 121), 4)
    $graphics.DrawLine($armBackPen, [float]($cx - 9 + $lean), [float]($cy), [float]($cx - 22 + $lean - ($faceX * 4)), [float]($cy + 14 - ($faceY * 2)))
    $graphics.DrawLine($armFrontPen, [float]($cx + 9 + $lean), [float]($cy), [float]($cx + 20 + $lean + ($faceX * 3) + $reach), [float]($cy + 10 + ($faceY * 2) - ($reach * 0.08)))

    $headRect = New-Object System.Drawing.RectangleF([float]($cx - 10 + ($faceX * 1.6)), [float]($cy - 27), 21, 21)
    $headBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
      $headRect,
      [System.Drawing.Color]::FromArgb(255, 243, 220, 175),
      [System.Drawing.Color]::FromArgb(255, 158, 125, 85),
      90.0
    )
    $graphics.FillEllipse($headBrush, $headRect)
    $graphics.DrawEllipse($armorEdgePen, $headRect)

    switch ($config.Headgear) {
      "hood" {
        $hoodBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 29, 73, 68))
        $graphics.FillPie($hoodBrush, [float]($cx - 14 + ($faceX * 1.2)), [float]($cy - 31), 28, 20, 180, 180)
        $hoodBrush.Dispose()
      }
      "circlet" {
        $circletPen = New-Object System.Drawing.Pen($config.Accent, 2)
        $graphics.DrawArc($circletPen, [float]($cx - 8 + ($faceX * 1.2)), [float]($cy - 23), 16, 7, 5, 170)
        $circletPen.Dispose()
      }
      "band" {
        $bandBrush = New-Object System.Drawing.SolidBrush($config.Accent)
        $graphics.FillRectangle($bandBrush, [float]($cx - 9 + ($faceX * 1.2)), [float]($cy - 18), 18, 4)
        $bandBrush.Dispose()
      }
    }

    switch ($config.Weapon) {
      "blade" {
        $bladePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 212, 226, 255), 3)
        $hiltPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 225, 176, 92), 4)
        [double]$weaponStartX = $cx + 22 + $lean + ($faceX * 4)
        [double]$weaponStartY = $cy + 10 - ($faceY * 2)
        [double]$weaponEndX = $weaponStartX + (16 * [Math]::Sign(($faceX + 0.001))) + $reach
        [double]$weaponEndY = $weaponStartY - 22 + ($faceY * 5) - ($reach * 0.16)
        if ([Math]::Abs($faceX) -lt 0.2) {
          $weaponEndX = $weaponStartX + 9
          $weaponEndY = $weaponStartY - 28 - $reach
        }
        $graphics.DrawLine($bladePen, [float]$weaponStartX, [float]$weaponStartY, [float]$weaponEndX, [float]$weaponEndY)
        $graphics.DrawLine($hiltPen, [float]($weaponStartX - 3), [float]($weaponStartY + 2), [float]($weaponStartX + 4), [float]($weaponStartY - 2))
        $bladePen.Dispose()
        $hiltPen.Dispose()
      }
      "staff" {
        $staffPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 126, 84, 46), 4)
        $gemBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 182, 159, 255))
        $graphics.DrawLine($staffPen, [float]($cx + 22 + $lean), [float]($cy + 13), [float]($cx + 30 + $lean + ($faceX * 2)), [float]($cy - 24 - $reach))
        $graphics.FillEllipse($gemBrush, [float]($cx + 24 + $lean + ($faceX * 2)), [float]($cy - 30 - $reach), 11, 11)
        $staffPen.Dispose()
        $gemBrush.Dispose()
      }
      "hammer" {
        $handlePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 116, 73, 41), 4)
        $headBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 152, 155, 166))
        $graphics.DrawLine($handlePen, [float]($cx + 22 + $lean), [float]($cy + 14), [float]($cx + 30 + $lean + ($faceX * 3)), [float]($cy - 16 - $reach))
        $graphics.FillRectangle($headBrush, [float]($cx + 21 + $lean + ($faceX * 3)), [float]($cy - 24 - $reach), 18, 8)
        $handlePen.Dispose()
        $headBrush.Dispose()
      }
      "tray" {
        $trayBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 150, 102, 47))
        $cupBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 240, 223, 196))
        $graphics.FillEllipse($trayBrush, [float]($cx + 15 + $lean), [float]($cy + 5), 20, 8)
        $graphics.FillEllipse($cupBrush, [float]($cx + 20 + $lean), [float]($cy - 2), 6, 10)
        $graphics.FillEllipse($cupBrush, [float]($cx + 28 + $lean), [float]($cy - 1), 5, 9)
        $trayBrush.Dispose()
        $cupBrush.Dispose()
      }
    }

    if ($config.Offhand -eq "orb") {
      $orbGlowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(72, 182, 143, 255))
      $orbBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 247, 241, 255))
      $orbPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 209, 176, 255), 1.5)
      $graphics.FillEllipse($orbGlowBrush, [float]($cx - 30 - ($faceX * 7)), [float]($cy - 2), 20, 20)
      $graphics.FillEllipse($orbBrush, [float]($cx - 26 - ($faceX * 7)), [float]($cy + 1), 13, 13)
      $graphics.DrawEllipse($orbPen, [float]($cx - 26 - ($faceX * 7)), [float]($cy + 1), 13, 13)
      $orbGlowBrush.Dispose()
      $orbBrush.Dispose()
      $orbPen.Dispose()
    }

    if ($state -eq "attack" -and $config.Weapon -ne "none" -and $config.Weapon -ne "tray") {
      $trailPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(76, 250, 209, 142), 3)
      $graphics.DrawArc($trailPen, [float]($cx - 8), [float]($cy - 28), 48, 38, [float](300 - ($frame * 12)), 65)
      $trailPen.Dispose()
    }

    $shineBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(112, 255, 244, 225))
    $graphics.FillEllipse($shineBrush, [float]($cx - 2 + $lean), [float]($cy - 8), 7, 7)

    $glowBrush.Dispose()
    $shadowBrush.Dispose()
    $coatBrush.Dispose()
    $legBackPen.Dispose()
    $legFrontPen.Dispose()
    $armorBrush.Dispose()
    $armorEdgePen.Dispose()
    $beltBrush.Dispose()
    $armBackPen.Dispose()
    $armFrontPen.Dispose()
    $headBrush.Dispose()
    $shineBrush.Dispose()
  }

  $outputPath = Join-Path $sampleDir "atlas.png"
  $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
  Write-Host "Generated $outputPath"
}
