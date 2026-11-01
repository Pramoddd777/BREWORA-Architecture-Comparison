
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("monolith", "microservices")]
    [string]$Architecture,

    [Parameter(Mandatory = $true)]
    [int[]]$ProcessIds,

    [int]$DurationSeconds = 40
)

$OutputDir = Join-Path $PSScriptRoot "..\resource-monitoring"
New-Item -ItemType Directory -Force $OutputDir | Out-Null

$OutputFile = Join-Path $OutputDir "$Architecture-resources-corrected.csv"

$logicalCores = (Get-CimInstance Win32_ComputerSystem).NumberOfLogicalProcessors

$results = [System.Collections.Generic.List[object]]::new()

Write-Host "======================================"
Write-Host "BREWORA RESOURCE MONITORING"
Write-Host "======================================"
Write-Host "Architecture: $Architecture"
Write-Host "Processes: $($ProcessIds.Count)"
Write-Host "Duration: $DurationSeconds seconds"
Write-Host "Logical processors: $logicalCores"
Write-Host "======================================"

$previousCpu = @{}
$previousTime = [System.Diagnostics.Stopwatch]::StartNew()
$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()

while ($stopwatch.Elapsed.TotalSeconds -lt $DurationSeconds) {

    $currentTime = Get-Date
    $elapsedSeconds = $previousTime.Elapsed.TotalSeconds

    $processes = @(
        Get-Process -Id $ProcessIds -ErrorAction SilentlyContinue
    )

    $totalMemory = 0
    $totalCpu = 0

    foreach ($process in $processes) {

        $totalMemory += $process.WorkingSet64
        $id = $process.Id
        $currentCpu = [double]$process.CPU

        if ($previousCpu.ContainsKey($id)) {
            $difference = $currentCpu - $previousCpu[$id]
            $totalCpu += [math]::Max(0, $difference)
        }

        $previousCpu[$id] = $currentCpu
    }

    $cpuPercent = 0

    if ($elapsedSeconds -gt 0 -and $logicalCores -gt 0) {
        $cpuPercent = ($totalCpu / $elapsedSeconds / $logicalCores) * 100
    }

    $results.Add([PSCustomObject]@{
        Timestamp = $currentTime.ToString("yyyy-MM-dd HH:mm:ss.fff")
        Architecture = $Architecture
        CPU_Percent = [math]::Round($cpuPercent, 3)
        Memory_MB = [math]::Round($totalMemory / 1MB, 2)
        Process_Count = $processes.Count
    })

    $previousTime.Restart()
    Start-Sleep -Milliseconds 1000
}

$stopwatch.Stop()

$results | Export-Csv -Path $OutputFile -NoTypeInformation

Write-Host ""
Write-Host "MONITORING COMPLETED"
Write-Host "Samples collected: $($results.Count)"
Write-Host "Expected processes: $($ProcessIds.Count)"
Write-Host "Output: $OutputFile"
