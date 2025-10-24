# Simple HTTP Server using PowerShell
$port = 8000
$path = Get-Location

Write-Host "Starting HTTP Server on port $port..."
Write-Host "Serving files from: $path"
Write-Host "Open your browser to: http://localhost:$port"
Write-Host "Press Ctrl+C to stop the server"

# Create HTTP listener
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        # Get the requested file path
        $requestedPath = $request.Url.LocalPath
        if ($requestedPath -eq "/") {
            $requestedPath = "/index.html"
        }
        
        $filePath = Join-Path $path $requestedPath.TrimStart('/')
        
        Write-Host "Request: $requestedPath -> $filePath"
        
        if (Test-Path $filePath -PathType Leaf) {
            # Determine content type
            $contentType = "text/html"
            $extension = [System.IO.Path]::GetExtension($filePath)
            switch ($extension) {
                ".html" { $contentType = "text/html" }
                ".css" { $contentType = "text/css" }
                ".js" { $contentType = "application/javascript" }
                ".json" { $contentType = "application/json" }
                ".png" { $contentType = "image/png" }
                ".jpg" { $contentType = "image/jpeg" }
                ".gif" { $contentType = "image/gif" }
            }
            
            # Read and serve the file
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.StatusCode = 200
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            # File not found
            $response.StatusCode = 404
            $errorContent = [System.Text.Encoding]::UTF8.GetBytes("404 - File Not Found")
            $response.OutputStream.Write($errorContent, 0, $errorContent.Length)
        }
        
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}