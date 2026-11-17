param(
    [Parameter(Mandatory=$true)]
    [string]$PdfPath
)

try {
    [Windows.Media.Ocr.OcrEngine, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
    [Windows.Graphics.Imaging.BitmapDecoder, Windows.Foundation, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.InMemoryRandomAccessStream, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
    [Windows.Storage.Streams.DataWriter, Windows.Storage.Streams, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Pdf.PdfDocument, Windows.Data.Pdf, ContentType = WindowsRuntime] | Out-Null
    [Windows.Data.Pdf.PdfPageRenderOptions, Windows.Data.Pdf, ContentType = WindowsRuntime] | Out-Null
    Add-Type -AssemblyName System.Runtime.WindowsRuntime

    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' 
    })[0]

    $asTaskAction = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { 
        $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncAction' 
    })[0]

    function Invoke-AwaitGeneric($asyncOp, $type) {
        $m = $asTaskGeneric.MakeGenericMethod($type)
        $task = $m.Invoke($null, @($asyncOp))
        $task.Wait()
        return $task.Result
    }

    function Invoke-AwaitAction($asyncAction) {
        $task = $asTaskAction.Invoke($null, @($asyncAction))
        $task.Wait()
    }

    $fullPath = [System.IO.Path]::GetFullPath($PdfPath)
    $bytes = [System.IO.File]::ReadAllBytes($fullPath)

    $stream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
    $writer = [Windows.Storage.Streams.DataWriter]::new($stream)
    $writer.WriteBytes($bytes)
    
    $storeOp = $writer.StoreAsync()
    $storeTask = [System.WindowsRuntimeSystemExtensions]::AsTask($storeOp)
    $storeTask.Wait()
    $stream.Seek(0)

    $doc = Invoke-AwaitGeneric ([Windows.Data.Pdf.PdfDocument]::LoadFromStreamAsync($stream)) ([Windows.Data.Pdf.PdfDocument])

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
    if ($null -eq $engine) {
        $lang = [Windows.Globalization.Language]::new("en-US")
        $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    }

    $allLines = [System.Collections.Generic.List[string]]::new()
    for ($i = 0; $i -lt $doc.PageCount; $i++) {
        $page = $doc.GetPage($i)
        $pageStream = [Windows.Storage.Streams.InMemoryRandomAccessStream]::new()
        $renderOptions = [Windows.Data.Pdf.PdfPageRenderOptions]::new()
        $renderOptions.DestinationWidth = [uint32]($page.Size.Width * 2.5)
        $renderOptions.DestinationHeight = [uint32]($page.Size.Height * 2.5)

        Invoke-AwaitAction ($page.RenderToStreamAsync($pageStream, $renderOptions))
        $pageStream.Seek(0)

        $decoder = Invoke-AwaitGeneric ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($pageStream)) ([Windows.Graphics.Imaging.BitmapDecoder])
        $softwareBitmap = Invoke-AwaitGeneric ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

        $ocrResult = Invoke-AwaitGeneric ($engine.RecognizeAsync($softwareBitmap)) ([Windows.Media.Ocr.OcrResult])
        if ($ocrResult -and $ocrResult.Lines) {
            foreach ($line in $ocrResult.Lines) {
                if ($line.Text) {
                    $allLines.Add($line.Text)
                }
            }
        }
    }

    Write-Output ([string]::Join("`n", $allLines))
} catch {
    Write-Error $_.Exception.ToString()
}
