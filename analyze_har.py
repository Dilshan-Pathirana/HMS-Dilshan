import json
import sys

# Read HAR file
with open('localhost.har', 'r', encoding='utf-8') as f:
    har_data = json.load(f)

entries = har_data['log']['entries']

print(f"\n=== HAR FILE ANALYSIS ===")
print(f"Total entries: {len(entries)}")
print(f"\n=== Top 30 Slowest Requests ===\n")

# Sort by time (descending)
sorted_entries = sorted(entries, key=lambda x: x.get('time', 0), reverse=True)[:30]

for i, entry in enumerate(sorted_entries, 1):
    url = entry['request']['url']
    if len(url) > 80:
        url = url[:77] + '...'
    
    time_ms = entry.get('time', 0)
    wait = entry['timings'].get('wait', 0)
    blocked = entry['timings'].get('blocked', 0)
    
    print(f"{i}. {entry['request']['method']} {url}")
    print(f"   Total: {time_ms:.2f}ms | Wait: {wait:.2f}ms | Blocked: {blocked:.2f}ms")
    print()

# Group by domain
print("\n=== Requests by Domain ===\n")
domains = {}
for entry in entries:
    url = entry['request']['url']
    if '://' in url:
        domain = url.split('://')[1].split('/')[0]
    else:
        domain = 'unknown'
    
    if domain not in domains:
        domains[domain] = {'count': 0, 'total_time': 0}
    
    domains[domain]['count'] += 1
    domains[domain]['total_time'] += entry.get('time', 0)

for domain, data in sorted(domains.items(), key=lambda x: x[1]['total_time'], reverse=True)[:15]:
    print(f"{domain}: {data['count']} requests, {data['total_time']:.2f}ms total")

print("\n=== Page Timings ===\n")
for page in har_data['log']['pages']:
    print(f"Page: {page['title']}")
    print(f"  DOMContentLoaded: {page['pageTimings']['onContentLoad']/1000:.2f}s")
    print(f"  Load: {page['pageTimings']['onLoad']/1000:.2f}s")
    print()
