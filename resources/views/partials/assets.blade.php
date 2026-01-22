<?php
$manifestPath = public_path('build/.vite/manifest.json');
$manifest = null;
if (file_exists($manifestPath)) {
    $raw = file_get_contents($manifestPath);
    $manifest = json_decode($raw, true);
}
?>

@if (!$manifest)
    {{-- Fallback to static references if manifest not found --}}
    <link rel="icon" href="/favicon.ico">
    <link rel="stylesheet" href="/build/assets/index-B6vU30-d.css" crossorigin>
    <script type="module" src="/build/assets/index-i1ZQSKZ3.js" crossorigin></script>
@else
    <link rel="icon" href="/favicon.ico">
    @php $entry = $manifest['index.html'] ?? null; @endphp
    @if ($entry && !empty($entry['css']))
        @foreach ($entry['css'] as $css)
            <link rel="stylesheet" href="/build/{{ $css }}" crossorigin>
        @endforeach
    @endif
    @if ($entry && !empty($entry['file']))
        <script type="module" src="/build/{{ $entry['file'] }}" crossorigin></script>
    @endif
@endif
