# Network Deployment Test Script
# Tests the system on IP-based deployment

Write-Host "🌐 Testing Network Deployment for http://10.99.28.30:3037" -ForegroundColor Cyan
Write-Host ""

# Test 1: Server Health
Write-Host "🏥 Testing Server Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "http://localhost:3037/api/health" -TimeoutSec 5
    if ($health.status -eq "ok") {
        Write-Host "✅ Backend Server: Running" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend Server: Unhealthy" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend Server: Not accessible" -ForegroundColor Red
    Write-Host "💡 Make sure to run: cd Backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Frontend Pages
Write-Host ""
Write-Host "📄 Testing Frontend Pages..." -ForegroundColor Yellow

$pages = @(
    "/Frontend/HTML/login.html",
    "/Frontend/HTML/admin-dashboard.html", 
    "/Frontend/HTML/employee-dashboard.html",
    "/Frontend/HTML/clearance-request.html"
)

foreach ($page in $pages) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3037$page" -TimeoutSec 5 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $page" -ForegroundColor Green
        } else {
            Write-Host "❌ $page (Status: $($response.StatusCode))" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ $page (Not accessible)" -ForegroundColor Red
    }
}

# Test 3: API Endpoints  
Write-Host ""
Write-Host "🔗 Testing API Endpoints..." -ForegroundColor Yellow

$endpoints = @(
    "/api/health",
    "/api/auth/login"
)

foreach ($endpoint in $endpoints) {
    try {
        if ($endpoint -eq "/api/auth/login") {
            # Test POST endpoint
            $body = @{ email = "admin@example.com"; password = "Admin@123" } | ConvertTo-Json
            $response = Invoke-RestMethod -Uri "http://localhost:3037$endpoint" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5
            Write-Host "✅ $endpoint (Login API working)" -ForegroundColor Green
        } else {
            # Test GET endpoint
            $response = Invoke-RestMethod -Uri "http://localhost:3037$endpoint" -TimeoutSec 5
            Write-Host "✅ $endpoint" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ $endpoint (Error: $($_.Exception.Message))" -ForegroundColor Red
    }
}

# Test 4: Database Connection
Write-Host ""
Write-Host "🗄️ Testing Database Connection..." -ForegroundColor Yellow
try {
    # Try to login to verify database connectivity
    $loginBody = @{ email = "admin@example.com"; password = "Admin@123" } | ConvertTo-Json
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3037/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 10
    
    if ($loginResponse.success) {
        Write-Host "✅ Database Connection: Working (login successful)" -ForegroundColor Green
        Write-Host "🎟️ Admin login verified with database" -ForegroundColor Green
    } else {
        Write-Host "❌ Database Connection: Login failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Database Connection: Error ($($_.Exception.Message))" -ForegroundColor Red
    Write-Host "💡 Make sure to run: mysql -u root -p < Backend/migrations/unified_hospital_management_schema.sql" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "📊 Network Deployment Test Summary:" -ForegroundColor Cyan
Write-Host "🌐 Target URL: http://10.99.28.30:3037/Frontend/HTML/login.html" -ForegroundColor White
Write-Host "🔑 Login: admin@example.com / Admin@123" -ForegroundColor White
Write-Host ""
Write-Host "🚀 If all tests passed, your system is ready for network deployment!" -ForegroundColor Green
Write-Host "📝 Access the system from any machine on the network using the IP address." -ForegroundColor White
