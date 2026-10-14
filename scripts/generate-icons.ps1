Add-Type -AssemblyName System.Drawing

$sizes = @(72, 96, 128, 192, 256, 384, 512)
$outDir = "d:\VS_CODE\edu\web\bookswap\public\icons"

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    # Background gradient: Rich indigo to deep violet
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $color1 = [System.Drawing.Color]::FromArgb(255, 99, 102, 241) # Indigo 500
    $color2 = [System.Drawing.Color]::FromArgb(255, 30, 27, 75)   # Indigo 950
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $color1, $color2, 45.0
    $g.FillRectangle($brush, $rect)

    # Draw stylized book pages shape
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $goldBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
    $tealBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 16, 185, 129))

    # Center book spine & pages
    $cx = $size / 2.0
    $cy = $size / 2.0
    $bw = $size * 0.55
    $bh = $size * 0.45

    # Left page
    $leftRect = New-Object System.Drawing.RectangleF ($cx - $bw/2), ($cy - $bh/2), ($bw * 0.46), $bh
    $g.FillRectangle($whiteBrush, $leftRect)

    # Right page
    $rightRect = New-Object System.Drawing.RectangleF ($cx + $bw*0.04), ($cy - $bh/2), ($bw * 0.46), $bh
    $g.FillRectangle($whiteBrush, $rightRect)

    # Spine line
    $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 79, 70, 229)), ([Math]::Max(2, $size * 0.03))
    $g.DrawLine($pen, [float]$cx, [float]($cy - $bh/2), [float]$cx, [float]($cy + $bh/2))

    # Ribbon bookmark (Gold)
    $ribbonPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 245, 158, 11)), ([Math]::Max(3, $size * 0.04))
    $g.DrawLine($ribbonPen, [float]($cx + $bw*0.15), [float]($cy - $bh/2), [float]($cx + $bw*0.15), [float]($cy + $bh*0.65))

    # Accent bottom exchange dots
    $dotR = [Math]::Max(3, $size * 0.035)
    $g.FillEllipse($tealBrush, [float]($cx - $bw*0.3), [float]($cy + $bh*0.65), [float]$dotR*2, [float]$dotR*2)
    $g.FillEllipse($goldBrush, [float]($cx + $bw*0.2), [float]($cy + $bh*0.65), [float]$dotR*2, [float]$dotR*2)

    $outPath = Join-Path $outDir "icon-$size`x$size.png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated clean icon-$size`x$size.png"
}
