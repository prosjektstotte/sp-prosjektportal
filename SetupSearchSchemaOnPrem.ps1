Param(
    [string]$SSAName = "Search Service Application"
)

if((Get-PSSnapin -Name Microsoft.SharePoint.PowerShell -ErrorAction SilentlyContinue) -eq $null){
    Add-PSSnapin Microsoft.SharePoint.PowerShell
}

Function Map-ManagedProperty ([string]$ManagedPropertyName, [string]$CrawledPropertyName, $SSA)
{
    $MetadataCategory = Get-SPEnterpriseSearchMetadataCategory -SearchApplication $SSA -Identity "SharePoint"
    $cct = Get-SPEnterpriseSearchMetadataCrawledProperty -SearchApplication $SSA -Name $CrawledPropertyName -Category $MetadataCategory

    New-SPEnterpriseSearchMetadataMapping -SearchApplication $SSA -CrawledProperty $cct -ManagedProperty $ManagedPropertyName
}

$SSA = Get-SPEnterpriseSearchServiceApplication -Identity $SSAName
if ($SSA -ne $null) {
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString50" -CrawledPropertyName "ows_GtProjectOwner" 
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString51" -CrawledPropertyName "ows_GtProjectManager"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString52" -CrawledPropertyName "ows_GtProjectPhase"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString53" -CrawledPropertyName "ows_GtProjectServiceArea"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString54" -CrawledPropertyName "ows_GtProjectType"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString55" -CrawledPropertyName "ows_GtStatusBudget"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString56" -CrawledPropertyName "ows_GtStatusRisk"
    Map-ManagedProperty -SSA $SSA -ManagedPropertyName "RefinableString57" -CrawledPropertyName "ows_GtStatusTime" 
} else {
    Write-Error "Could not find Search Service Application with name $SSAName. Aborting."
}

Write-Host "Property mapping completed" -ForegroundColor Green