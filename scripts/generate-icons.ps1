Add-Type -AssemblyName System.Drawing

function Create-AppIcon([int]$size, [string]$outputPath) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

    # Background gradient
    $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        $rect,
        [System.Drawing.Color]::FromArgb(255, 255, 87, 34),
        [System.Drawing.Color]::FromArgb(255, 234, 88, 12),
        [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
    )
    $g.FillRectangle($brush, $rect)

    # Rounded inner ring
    $innerPad = [int]($size * 0.08)
    $innerSize = $size - ($innerPad * 2)
    $innerRect = New-Object System.Drawing.Rectangle $innerPad, $innerPad, $innerSize, $innerSize
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 255, 255, 255), [float]($size * 0.02))
    $g.DrawEllipse($borderPen, $innerRect)

    # Fonts
    $fontFamily = [System.Drawing.FontFamily]::GenericSansSerif
    $cnhpFontSize = [float]($size * 0.22)
    $cnhpFont = New-Object System.Drawing.Font $fontFamily, $cnhpFontSize, ([System.Drawing.FontStyle]::Bold)
    $whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $y1 = [float]($size * 0.20)
    $h1 = [float]($size * 0.35)
    $w = [float]$size
    $rectF1 = [System.Drawing.RectangleF]::new(0.0, $y1, $w, $h1)
    $g.DrawString("CNHP", $cnhpFont, $whiteBrush, $rectF1, $sf)

    $subFontSize = [float]($size * 0.12)
    $subFont = New-Object System.Drawing.Font $fontFamily, $subFontSize, ([System.Drawing.FontStyle]::Bold)
    $yellowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 254, 240, 138))
    
    $y2 = [float]($size * 0.55)
    $h2 = [float]($size * 0.25)
    $rectF2 = [System.Drawing.RectangleF]::new(0.0, $y2, $w, $h2)
    $g.DrawString("RUN 2026", $subFont, $yellowBrush, $rectF2, $sf)

    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Created $outputPath ($size x $size)"
}

Create-AppIcon 512 "public\icon-512.png"
Create-AppIcon 192 "public\icon-192.png"
Create-AppIcon 180 "public\apple-touch-icon.png"
