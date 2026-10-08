# AgriOps Component 2 - Security Vulnerability & OWASP Top 10 Test Harness
param (
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " AgriOps Component 2 - Automated API Security Test Suite  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Target Base URL: $BaseUrl" -ForegroundColor Cyan

$passed = 0
$failed = 0

function Assert-Security([string]$TestName, [bool]$Condition, [string]$Details = "") {
    if ($Condition) {
        Write-Host " [PASS] $TestName" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host " [FAIL] $TestName - $Details" -ForegroundColor Red
        $script:failed++
    }
}

# 1. SQL Injection Fuzzing on Tasks Query
Write-Host "`n[Category 1: SQL Injection (SQLi) Testing]" -ForegroundColor Yellow
$sqliPayloads = @(
    "' OR '1'='1",
    "'; DROP TABLE Tasks; --",
    "1 UNION SELECT null, null, null--",
    "admin'--"
)

foreach ($payload in $sqliPayloads) {
    try {
        $encoded = [System.Uri]::EscapeDataString($payload)
        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/tasks?status=$encoded" -Method Get -SkipHttpErrorCheck -TimeoutSec 5
        # Must not return 500 Internal Server Error (which indicates unhandled SQL syntax exception)
        Assert-Security "SQLi resilience on '?status=$payload'" ($resp.StatusCode -ne 500) "Returned status $($resp.StatusCode)"
    } catch {
        Assert-Security "SQLi connection exception" $false $_.Exception.Message
    }
}

# 2. Cross-Site Scripting (XSS) Sanitization on Input
Write-Host "`n[Category 2: Stored Cross-Site Scripting (XSS) Testing]" -ForegroundColor Yellow
$xssPayloads = @(
    "<script>alert('XSS-C2')</script>",
    "<img src=x onerror=alert(1)>",
    "javascript:void(0)"
)

foreach ($xss in $xssPayloads) {
    try {
        $body = @{
            fieldId = [Guid]::NewGuid().ToString()
            title = "XSS Test $xss"
            taskType = "PestInspection"
            priority = "Low"
            description = "Fuzzing payload: $xss"
        } | ConvertTo-Json

        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method Post -Body $body -ContentType "application/json" -SkipHttpErrorCheck -TimeoutSec 5
        # The backend must either accept as sanitized plain text (201) or reject bad input (400), never crash (500)
        Assert-Security "XSS payload handled gracefully ($xss)" ($resp.StatusCode -in 201, 400) "Returned status $($resp.StatusCode)"
    } catch {
        Assert-Security "XSS connection exception" $false $_.Exception.Message
    }
}

# 3. Broken Object Level Authorization (BOLA/IDOR) & Ghost ID Probing
Write-Host "`n[Category 3: Broken Object Level Authorization (IDOR) Testing]" -ForegroundColor Yellow
$ghostGuids = @(
    "00000000-0000-0000-0000-000000000000",
    "11111111-1111-1111-1111-111111111111",
    "deadbeef-dead-beef-dead-beefdeadbeef"
)

foreach ($guid in $ghostGuids) {
    try {
        $resp = Invoke-WebRequest -Uri "$BaseUrl/api/tasks/$guid" -Method Get -SkipHttpErrorCheck -TimeoutSec 5
        Assert-Security "IDOR non-existent task returns 404 ($guid)" ($resp.StatusCode -eq 404) "Expected 404, got $($resp.StatusCode)"
    } catch {
        Assert-Security "IDOR connection exception" $false $_.Exception.Message
    }
}

# 4. Security Headers Inspection
Write-Host "`n[Category 4: Security Headers & Transport Security]" -ForegroundColor Yellow
try {
    $headResp = Invoke-WebRequest -Uri "$BaseUrl/api/tasks" -Method Get -SkipHttpErrorCheck -TimeoutSec 5
    $headers = $headResp.Headers

    # Validate content type is application/json
    $contentType = $headers["Content-Type"]
    Assert-Security "Content-Type specifies json charset" ($contentType -like "*application/json*") "Got $contentType"
} catch {
    Assert-Security "Headers query failed" $false $_.Exception.Message
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " Security Test Summary: $passed Passed, $failed Failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host "==========================================================" -ForegroundColor Cyan
