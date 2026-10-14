Add-Type -AssemblyName System.Drawing

$srcPath = "C:\Users\Hyper\.gemini\antigravity-ide\brain\23b8138d-7ee8-4dd7-8fbe-b865316165a4\.user_uploaded\media_1791979424540.png"
$destLogo = "d:\VS_CODE\edu\web\bookswap\public\images\logo.png"
$destLogoIcons = "d:\VS_CODE\edu\web\bookswap\public\icons\logo.png"

# Ensure directories exist
New-Item -ItemType Directory -Force -Path "d:\VS_CODE\edu\web\bookswap\public\images" | Out-Null
New-Item -ItemType Directory -Force -Path "d:\VS_CODE\edu\web\bookswap\public\icons" | Out-Null

# Copy master logo
Copy-Item -Path $srcPath -Destination $destLogo -Force
Copy-Item -Path $srcPath -Destination $destLogoIcons -Force
Write-Output "Copied master logo to public/images/logo.png and public/icons/logo.png"

$srcImg = [System.Drawing.Image]::FromFile($srcPath)
$sizes = @(72, 96, 128, 192, 256, 384, 512)

foreach ($size in $sizes) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($srcImg, 0, 0, $size, $size)
    $g.Dispose()
    
    $outPath = "d:\VS_CODE\edu\web\bookswap\public\icons\icon-$($size)x$($size).png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Generated: $outPath"
}

# Favicon 64x64 and 32x32
$favBmp = New-Object System.Drawing.Bitmap(64, 64)
$gFav = [System.Drawing.Graphics]::FromImage($favBmp)
$gFav.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gFav.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gFav.Clear([System.Drawing.Color]::Transparent)
$gFav.DrawImage($srcImg, 0, 0, 64, 64)
$gFav.Dispose()

$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\src\app\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\favicon.ico", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Save("d:\VS_CODE\edu\web\bookswap\public\icons\favicon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$favBmp.Dispose()

$srcImg.Dispose()
Write-Output "SUCCESS: All WARAQ logo and PWA icon assets generated successfully!"
