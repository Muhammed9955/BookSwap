$routes = @(
    '/',
    '/explore',
    '/stores',
    '/stores/diwan-bookstore',
    '/communities',
    '/communities/maadi-degla-bookworms',
    '/offers',
    '/events',
    '/books/add',
    '/transactions',
    '/notifications',
    '/messages',
    '/search',
    '/wishlist',
    '/profile',
    '/login',
    '/register',
    '/manifest.json',
    '/sw.js',
    '/icons/icon-192x192.png'
)
foreach ($r in $routes) {
    try {
        $res = Invoke-WebRequest -Uri "http://localhost:3000$r" -UseBasicParsing -TimeoutSec 10
        Write-Host "PASS $r -> $($res.StatusCode) (content-length: $($res.RawContentLength))"
    } catch {
        $statusCode = ''
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        Write-Host "FAIL $r -> $statusCode $($_.Exception.Message)"
    }
}
