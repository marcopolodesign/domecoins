#!/bin/bash

echo "🔍 Network Diagnostics for api.pokemontcg.io"
echo "=============================================="
echo ""

# 1. DNS Resolution
echo "1️⃣  DNS Resolution:"
nslookup api.pokemontcg.io 2>&1 | grep -A 3 "Name:"
echo ""

# 2. Ping Test
echo "2️⃣  Ping Test (ICMP):"
ping -c 3 api.pokemontcg.io 2>&1 | tail -3
echo ""

# 3. Port 443 (HTTPS) connectivity
echo "3️⃣  Port 443 (HTTPS) Test:"
nc -zv -w 5 api.pokemontcg.io 443 2>&1
echo ""

# 4. TLS/SSL Handshake
echo "4️⃣  TLS/SSL Handshake Test:"
timeout 10 openssl s_client -connect api.pokemontcg.io:443 -servername api.pokemontcg.io < /dev/null 2>&1 | grep -E "^(CONNECTED|SSL-Session|Verify return code)" || echo "Timeout or failed"
echo ""

# 5. HTTP GET with curl (verbose)
echo "5️⃣  HTTP GET Test (curl verbose):"
curl -v -m 5 "https://api.pokemontcg.io/v2/sets" 2>&1 | grep -E "^(\*|<|>)" | head -20
echo ""

# 6. Try different IP addresses
echo "6️⃣  Testing different Cloudflare IPs:"
for ip in 104.26.0.99 104.26.1.99 172.67.74.42; do
    echo -n "  Testing $ip: "
    curl -m 5 -s -o /dev/null -w "%{http_code}" "https://$ip/v2/sets" -H "Host: api.pokemontcg.io" 2>&1 || echo "Failed"
    echo ""
done
echo ""

# 7. Check for proxy settings
echo "7️⃣  Proxy Settings:"
echo "  HTTP_PROXY: ${HTTP_PROXY:-Not set}"
echo "  HTTPS_PROXY: ${HTTPS_PROXY:-Not set}"
echo "  NO_PROXY: ${NO_PROXY:-Not set}"
echo ""

# 8. Check firewall (macOS)
echo "8️⃣  Firewall Status:"
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>&1
echo ""

# 9. Try with different DNS
echo "9️⃣  Testing with Google DNS (8.8.8.8):"
curl -m 5 --dns-servers 8.8.8.8 "https://api.pokemontcg.io/v2/sets" 2>&1 | head -5 || echo "Failed"
echo ""

# 10. Check if it's IPv6 issue
echo "🔟 IPv6 Test:"
curl -6 -m 5 "https://api.pokemontcg.io/v2/sets" 2>&1 | head -3 || echo "IPv6 not available or failed"
echo ""

echo "=============================================="
echo "Diagnostics complete!"
