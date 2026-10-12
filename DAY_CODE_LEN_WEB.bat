@echo off
chcp 65001 > nul
title ĐẨY TOÀN BỘ CODE MỚI LÊN WEB CNHP CHALLENGE 2026
echo =====================================================================
echo    🚀 ĐANG TIẾN HÀNH ĐẨY CODE LÊN GITHUB ĐỂ VERCEL TỰ ĐỘNG PHÁT HÀNH
echo =====================================================================
echo.
cd /d "C:\Users\admin\.gemini\antigravity\scratch\cnhp-challenge-2026"
echo [1/2] Đang kết nối và gửi 14 bản cập nhật mới lên GitHub...
echo.
echo * Lưu ý: Nếu màn hình hiện bảng đăng nhập GitHub (GitHub Login),
echo   anh hãy bấm nút "Sign in with your browser" để hoàn tất nhé!
echo.
git push origin main
if %ERRORLEVEL% EQU 0 (
    echo.
    echo =====================================================================
    echo    🎉 THÀNH CÔNG RỰC RỠ!
    echo    Toàn bộ code mới đã được gửi lên GitHub.
    echo    Vercel đang tự động triển khai lên website:
    echo    https://cnhp-challenge-2026.vercel.app
    echo =====================================================================
) else (
    echo.
    echo =====================================================================
    echo    ⚠️ Có lỗi hoặc đang chờ xác thực quyền truy cập GitHub.
    echo =====================================================================
)
echo.
pause
