Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Hyper\.gemini\antigravity-ide\brain\23b8138d-7ee8-4dd7-8fbe-b865316165a4\.user_uploaded\media_1791979424540.png"
$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$w = $srcImg.Width
$h = $srcImg.Height

# 1. Save transparent backup
$srcImg.Save("d:\VS_CODE\edu\web\bookswap\public\images\logo-transparent.png", [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Create Master White-BG Logo (1024x1024)
$masterWhiteBmp = New-Object System.Drawing.Bitmap($w, $h)
$gMaster = [System.Drawing.Graphics]::FromImage($masterWhiteBmp)
$gMaster.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMaster.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gMaster.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gMaster.Clear([System.Drawing.Color]::White)
$gMaster.DrawImage($srcImg, 0, 0, $w, $h)
$gMaster.Dispose()

$masterWhiteBmp.Save("d:\VS_CODE\edu\web\bookswap\public\images\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$masterWhiteBmp.Save("d:\VS_CODE\edu\web\bookswap\public\icons\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$masterWhiteBmp.Save("d:\VS_CODE\edu\web\bookswap\public\images\logo-white.png", [System.Drawing.Imaging.ImageFormat]::Png)
$masterWhiteBmp.Dispose()
Write-Output "Master White-BG Logo saved to public/images/logo.png and public/icons/logo.png"

# 3. Generate all PWA Icon sizes with White Background
$sizes = @(72, 96, 128, 192, 256, 384, 512)
foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $g.Dispose()
    
    $outPath = "d:\VS_CODE\edu\web\bookswap\public\icons\icon-$($size)x$($size).png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated White-BG Icon: $outPath"
}

# 4. Generate Favicons with White Background
$favBmp = New-Object System.Drawing.Bitmap(64, 64)
$gFav = [System.Drawing.Graphics]::FromImage($favBmp)
$gFav.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFav.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFav.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$gFav.Clear([System.Drawing.Color]::White)
$gFav.DrawImage($srcImg, 0, 0, 64, 64)
$gFav.Dispose()

$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\src\app\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\icons\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()

$srcImg.Dispose()
Write-Output "All White-BG Logo, Favicon, and PWA assets successfully generated!"
