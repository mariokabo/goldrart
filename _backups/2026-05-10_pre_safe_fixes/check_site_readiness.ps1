# GoldrArt Site Checker - فحص جاهزية الموقع لـ Google Ads
# Run: pwsh check_site_readiness.ps1

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "   GoldrArt Site Readiness Checker" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$issues = @()
$passed = @()

# Check 1: ads.txt
Write-Host "[1/10] Checking ads.txt..." -ForegroundColor White
if (Test-Path "ads.txt") {
    $adsContent = Get-Content "ads.txt" -Raw
    if ($adsContent -match "pub-xxxxxxxxxxxxxxxx") {
        $issues += "❌ ads.txt: Publisher ID not updated (still placeholder)"
    } else {
        $passed += "✅ ads.txt: Found and configured"
    }
} else {
    $issues += "❌ ads.txt: File not found"
}

# Check 2: robots.txt
Write-Host "[2/10] Checking robots.txt..." -ForegroundColor White
if (Test-Path "robots.txt") {
    $passed += "✅ robots.txt: Found"
} else {
    $issues += "❌ robots.txt: File not found"
}

# Check 3: sitemap.xml
Write-Host "[3/10] Checking sitemap.xml..." -ForegroundColor White
if (Test-Path "sitemap.xml") {
    $passed += "✅ sitemap.xml: Found"
} else {
    $issues += "❌ sitemap.xml: File not found"
}

# Check 4: .htaccess
Write-Host "[4/10] Checking .htaccess..." -ForegroundColor White
if (Test-Path ".htaccess") {
    $htaccessContent = Get-Content ".htaccess" -Raw
    if ($htaccessContent -match "X-XSS-Protection") {
        $passed += "✅ .htaccess: Security headers configured"
    } else {
        $issues += "⚠️ .htaccess: Missing security headers"
    }
} else {
    $issues += "❌ .htaccess: File not found"
}

# Check 5: Privacy Policy
Write-Host "[5/10] Checking Privacy Policy..." -ForegroundColor White
if (Test-Path "pages/privacy.html") {
    $passed += "✅ Privacy Policy: Found"
} else {
    $issues += "❌ Privacy Policy: Not found at pages/privacy.html"
}

# Check 6: Terms of Service
Write-Host "[6/10] Checking Terms of Service..." -ForegroundColor White
if (Test-Path "pages/terms.html") {
    $passed += "✅ Terms of Service: Found"
} else {
    $issues += "❌ Terms of Service: Not found at pages/terms.html"
}

# Check 7: Contact Page
Write-Host "[7/10] Checking Contact Page..." -ForegroundColor White
if (Test-Path "pages/contact.html") {
    $passed += "✅ Contact Page: Found"
} else {
    $issues += "❌ Contact Page: Not found at pages/contact.html"
}

# Check 8: About Page
Write-Host "[8/10] Checking About Page..." -ForegroundColor White
if (Test-Path "pages/about.html") {
    $passed += "✅ About Page: Found"
} else {
    $issues += "❌ About Page: Not found at pages/about.html"
}

# Check 9: Index.html Meta Tags
Write-Host "[9/10] Checking index.html Meta Tags..." -ForegroundColor White
if (Test-Path "index.html") {
    $indexContent = Get-Content "index.html" -Raw
    $metaChecks = 0
    if ($indexContent -match 'name="description"') { $metaChecks++ }
    if ($indexContent -match 'name="keywords"') { $metaChecks++ }
    if ($indexContent -match 'name="robots"') { $metaChecks++ }
    if ($indexContent -match 'X-Content-Type-Options') { $metaChecks++ }
    if ($indexContent -match 'X-Frame-Options') { $metaChecks++ }
    if ($indexContent -match '@type.*Organization') { $metaChecks++ }
    
    if ($metaChecks -ge 5) {
        $passed += "✅ index.html: Meta tags and security configured ($metaChecks/6)"
    } else {
        $issues += "⚠️ index.html: Missing some meta tags ($metaChecks/6)"
    }
} else {
    $issues += "❌ index.html: File not found"
}

# Check 10: External Links
Write-Host "[10/10] Checking for suspicious external links..." -ForegroundColor White
if (Test-Path "index.html") {
    $indexContent = Get-Content "index.html" -Raw
    $suspiciousLinks = @()
    
    # Check for common suspicious patterns
    if ($indexContent -match 'http://(?!wa\.me|api\.whatsapp)') {
        if ($indexContent -match 'iblogger\.org') {
            $suspiciousLinks += "iblogger.org"
        }
        if ($indexContent -match 'profreehost\.com') {
            $suspiciousLinks += "profreehost.com"
        }
    }
    
    if ($suspiciousLinks.Count -eq 0) {
        $passed += "✅ External Links: No suspicious links found"
    } else {
        $issues += "❌ External Links: Found suspicious links: $($suspiciousLinks -join ', ')"
    }
}

# Display Results
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "           RESULTS" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ PASSED ($($passed.Count)):" -ForegroundColor Green
foreach ($p in $passed) {
    Write-Host "   $p" -ForegroundColor Green
}

Write-Host ""
Write-Host "❌ ISSUES ($($issues.Count)):" -ForegroundColor Red
foreach ($i in $issues) {
    Write-Host "   $i" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan

# Calculate score
$totalChecks = $passed.Count + $issues.Count
$score = [math]::Round(($passed.Count / $totalChecks) * 100)

Write-Host "   READINESS SCORE: $score%" -ForegroundColor $(if ($score -ge 80) { "Green" } elseif ($score -ge 60) { "Yellow" } else { "Red" })
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

if ($score -ge 90) {
    Write-Host "🎉 Excellent! Your site is ready for Google Ads submission." -ForegroundColor Green
    Write-Host "   Next steps:" -ForegroundColor White
    Write-Host "   1. Update ads.txt with your real Publisher ID" -ForegroundColor White
    Write-Host "   2. Upload all files to your server" -ForegroundColor White
    Write-Host "   3. Submit to Google Search Console" -ForegroundColor White
    Write-Host "   4. Wait 48 hours, then apply to Google Ads" -ForegroundColor White
} elseif ($score -ge 70) {
    Write-Host "⚠️ Good, but needs minor fixes before submission." -ForegroundColor Yellow
    Write-Host "   Please address the issues listed above." -ForegroundColor White
} else {
    Write-Host "❌ Not ready yet. Please fix all issues before submission." -ForegroundColor Red
    Write-Host "   Review REJECTION_SOLUTIONS.md for detailed guidance." -ForegroundColor White
}

Write-Host ""
