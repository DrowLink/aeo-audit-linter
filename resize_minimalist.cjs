const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcPath = 'C:\\Users\\paulo\\.gemini\\antigravity-ide\\brain\\e6effe7d-e7bb-4c1f-9db7-6ed203156cbe\\aeo_minimalist_icon_1787888997551.jpg';
const destDir = path.join(__dirname, 'extension', 'icons');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const psScript = `
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('${srcPath.replace(/\\/g, '\\\\')}')
foreach ($size in @(16, 48, 128)) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($src, 0, 0, $size, $size)
    $outPath = "${destDir.replace(/\\/g, '\\\\')}\\\\icon" + $size + ".png"
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}
$src.Dispose()
Write-Host "Minimalist icons updated successfully"
`;

fs.writeFileSync(path.join(__dirname, 'resize_minimalist.ps1'), psScript);
execSync('powershell -ExecutionPolicy Bypass -File resize_minimalist.ps1', { stdio: 'inherit' });
fs.unlinkSync(path.join(__dirname, 'resize_minimalist.ps1'));
