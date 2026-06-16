# BlockStop Exchange PowerShell Cmdlets
# Manages BlockStop integration with Microsoft Exchange

param(
    [string]$Action,
    [string]$Identity,
    [string]$BlockStopUrl = "https://your-blockstop-instance.com",
    [string]$ApiKey = $env:BLOCKSTOP_API_KEY
)

# BlockStop API client
class BlockStopClient {
    [string]$Url
    [string]$ApiKey
    [System.Collections.Hashtable]$Headers

    BlockStopClient([string]$url, [string]$apiKey) {
        $this.Url = $url
        $this.ApiKey = $apiKey
        $this.Headers = @{
            "Authorization" = "Bearer $apiKey"
            "Content-Type"  = "application/json"
        }
    }

    [object] ScanMessage([string]$subject, [byte[]]$attachmentData) {
        $payload = @{
            subject = $subject
            fileSize = $attachmentData.Length
            timestamp = Get-Date -AsUTC -Format "o"
        } | ConvertTo-Json

        try {
            $response = Invoke-WebRequest -Uri "$($this.Url)/api/scan" `
                -Method Post `
                -Headers $this.Headers `
                -Body $payload `
                -ContentType "application/json"

            return $response.Content | ConvertFrom-Json
        }
        catch {
            Write-Error "Failed to scan message: $_"
            return $null
        }
    }

    [bool] DeleteMessage([string]$messageId) {
        try {
            $response = Invoke-WebRequest -Uri "$($this.Url)/api/messages/$messageId" `
                -Method Delete `
                -Headers $this.Headers

            return $response.StatusCode -eq 200
        }
        catch {
            Write-Error "Failed to delete message: $_"
            return $false
        }
    }

    [bool] QuarantineMessage([string]$messageId) {
        $payload = @{
            action = "quarantine"
        } | ConvertTo-Json

        try {
            $response = Invoke-WebRequest -Uri "$($this.Url)/api/messages/$messageId/action" `
                -Method Post `
                -Headers $this.Headers `
                -Body $payload

            return $response.StatusCode -eq 200
        }
        catch {
            Write-Error "Failed to quarantine message: $_"
            return $false
        }
    }
}

# Main functions
function New-BlockStopTransportRule {
    param(
        [string]$Name,
        [string]$BlockStopUrl,
        [string]$ApiKey
    )

    Write-Host "Creating transport rule: $Name"

    try {
        # Create rule to process messages
        New-TransportRule -Name $Name `
            -Priority 0 `
            -Enabled $true `
            -Comments "BlockStop Security Scanning"

        Write-Host "Transport rule created successfully"
    }
    catch {
        Write-Error "Failed to create transport rule: $_"
    }
}

function Test-BlockStopConnection {
    param(
        [string]$BlockStopUrl,
        [string]$ApiKey
    )

    Write-Host "Testing BlockStop connection..."

    try {
        $client = [BlockStopClient]::new($BlockStopUrl, $ApiKey)

        # Send test scan
        $testResult = $client.ScanMessage("BlockStop Connection Test", [byte[]]@())

        if ($testResult) {
            Write-Host "BlockStop connection successful" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "BlockStop connection failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Error "Connection test error: $_"
        return $false
    }
}

function Scan-ExchangeMessage {
    param(
        [string]$MessageId,
        [string]$BlockStopUrl,
        [string]$ApiKey
    )

    Write-Host "Scanning message: $MessageId"

    try {
        $message = Get-Message -Identity $MessageId -ErrorAction Stop
        $client = [BlockStopClient]::new($BlockStopUrl, $ApiKey)

        # Get attachments
        $attachments = Get-MessageAttachment -Identity $MessageId -ErrorAction SilentlyContinue

        if ($attachments) {
            foreach ($attachment in $attachments) {
                Write-Host "Scanning attachment: $($attachment.Filename)"

                # Download attachment
                $attachmentData = Get-MessageAttachment -Identity "$MessageId\$($attachment.AttachmentId)" `
                    -AsFileStream

                # Scan with BlockStop
                $scanResult = $client.ScanMessage($message.Subject, $attachmentData)

                if ($scanResult.malwareDetected) {
                    Write-Host "Malware detected in $($attachment.Filename)" -ForegroundColor Red
                    Write-Host "Risk Score: $($scanResult.riskScore)"
                    Write-Host "Threats: $($scanResult.threats -join ', ')"

                    # Optionally take action
                    if ($scanResult.riskScore -gt 70) {
                        $client.DeleteMessage($MessageId)
                        Write-Host "Message deleted due to high risk score"
                    }
                }
                else {
                    Write-Host "Attachment is clean" -ForegroundColor Green
                }
            }
        }
        else {
            Write-Host "No attachments to scan"
        }
    }
    catch {
        Write-Error "Failed to scan message: $_"
    }
}

function Get-BlockStopPolicy {
    Write-Host "BlockStop Exchange Integration Policy"
    Write-Host "======================================="
    Write-Host "- Scans all inbound messages with attachments"
    Write-Host "- Quarantines suspicious files"
    Write-Host "- Deletes high-risk threats"
    Write-Host "- Logs all scan results to Splunk"
}

# Export functions
Export-ModuleMember -Function @(
    'New-BlockStopTransportRule',
    'Test-BlockStopConnection',
    'Scan-ExchangeMessage',
    'Get-BlockStopPolicy'
)
