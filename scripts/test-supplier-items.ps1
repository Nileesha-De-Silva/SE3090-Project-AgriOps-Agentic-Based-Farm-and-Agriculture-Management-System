param([string]$BaseUrl = 'http://127.0.0.1:5289')
$ErrorActionPreference = 'Stop'

function Request($Method, $Path, $Body, $Expected) {
    $arguments = @{ Uri = "$BaseUrl$Path"; Method = $Method; NoProxy = $true; SkipHttpErrorCheck = $true }
    if ($null -ne $Body) {
        $arguments.ContentType = 'application/json'
        $arguments.Body = $Body | ConvertTo-Json -Compress
    }
    $response = Invoke-WebRequest @arguments
    if ($response.StatusCode -ne $Expected) {
        throw "$Method $Path expected $Expected, received $($response.StatusCode): $($response.Content)"
    }
    if ($response.Content) { return $response.Content | ConvertFrom-Json }
}

$supplier = $null
$item = $null
$linkPath = $null
try {
    $supplier = Request POST '/api/suppliers' @{ name = 'Supplier link verification' } 201
    $item = Request POST '/api/inventory' @{
        name = 'Supplier link verification'; category = 'Test'; unitOfMeasurement = 'kg'
        minimumStockLevel = 10; unitCost = 1
    } 201
    $listPath = "/api/suppliers/$($supplier.id)/items"
    $linkPath = "$listPath/$($item.id)"
    $empty = @(Request GET $listPath $null 200)
    if ($empty.Count -ne 0) { throw 'Expected empty supplier catalogue' }
    $body = @{ unitPrice = 12.50; leadTimeDays = 3; isAvailable = $true }
    $link = Request POST $linkPath $body 201
    if ($link.supplierId -ne $supplier.id -or $link.inventoryItemId -ne $item.id) { throw 'Incorrect relationship' }
    $before = Request GET $linkPath $null 200
    $listed = @(Request GET $listPath $null 200)
    if ($listed.Count -ne 1 -or $listed[0].id -ne $link.id) { throw 'Catalogue mismatch' }
    $null = Request POST $linkPath $body 409
    foreach ($bad in @(
        @{ unitPrice = -1; leadTimeDays = 3; isAvailable = $true },
        @{ unitPrice = 1.234; leadTimeDays = 3; isAvailable = $true },
        @{ unitPrice = 100000000; leadTimeDays = 3; isAvailable = $true },
        @{ unitPrice = 1; leadTimeDays = -1; isAvailable = $true },
        @{ leadTimeDays = 3; isAvailable = $true },
        @{ unitPrice = 1; isAvailable = $true },
        @{ unitPrice = 1; leadTimeDays = 3 }
    )) { $null = Request PUT $linkPath $bad 400 }
    $unchanged = Request GET $linkPath $null 200
    if ($unchanged.unitPrice -ne 12.50 -or $unchanged.leadTimeDays -ne 3) { throw 'Rejected update changed data' }
    $null = Request PUT $linkPath @{ unitPrice = 0; leadTimeDays = 0; isAvailable = $false } 200
    $after = Request GET $linkPath $null 200
    if ($after.unitPrice -ne 0 -or $after.leadTimeDays -ne 0 -or $after.isAvailable -ne $false -or $after.createdAt -ne $before.createdAt) { throw 'Updated values or timestamp mismatch' }
    $null = Request DELETE "/api/suppliers/$($supplier.id)" $null 409
    $null = Request DELETE "/api/inventory/$($item.id)" $null 409
    $null = Request GET $linkPath $null 200
    $missing = '11111111-1111-1111-1111-111111111111'
    $null = Request POST "$listPath/$missing" $body 404
    $null = Request GET "/api/suppliers/$missing/items" $null 404
    $null = Request POST "/api/suppliers/$missing/items/$($item.id)" $body 404
    $null = Request DELETE $linkPath $null 204
    $null = Request GET $linkPath $null 404
    $null = Request PUT $linkPath $body 404
    $null = Request DELETE $linkPath $null 404
    'PASS: create/list/get/update/unlink, duplicate rejection, validation, missing parents, and deletion protection.'
} finally {
    if ($linkPath) {
        $result = Invoke-WebRequest "$BaseUrl$linkPath" -Method Delete -NoProxy -SkipHttpErrorCheck
        if ($result.StatusCode -notin @(204, 404)) { throw 'Test link cleanup failed' }
    }
    if ($supplier) { $null = Request DELETE "/api/suppliers/$($supplier.id)" $null 204 }
    if ($item) { $null = Request DELETE "/api/inventory/$($item.id)" $null 204 }
    'Temporary test records removed.'
}
