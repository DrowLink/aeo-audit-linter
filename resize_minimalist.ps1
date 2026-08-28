
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('C:\\Users\\paulo\\.gemini\\antigravity-ide\\brain\\e6effe7d-e7bb-4c1f-9db7-6ed203156cbe\\aeo_minimalist_icon_1787888997551.jpg')
foreach ($size in @(16, 48, 128)) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $outPath = "C:\\Users\\paulo\\OneDrive\\Documents\\repos\\aeo-audit-linter\\extension\\icons\\icon" + $size + ".png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}
$src.Dispose()
Write-Host "Minimalist icons updated successfully"
