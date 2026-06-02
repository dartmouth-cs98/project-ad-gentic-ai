"""Normalize and validate user-supplied URLs (SSRF-safe)."""

from __future__ import annotations

import ipaddress
import socket
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse, urlunparse


class BrandImportUrlError(ValueError):
    """URL rejected for safety or format reasons."""


@dataclass(frozen=True)
class ValidatedUrl:
    original: str
    normalized: str
    hostname: str


_BLOCKED_HOSTNAMES = frozenset(
    {
        "localhost",
        "localhost.localdomain",
        "metadata.google.internal",
    }
)


def _is_blocked_ip(addr: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        addr.is_private
        or addr.is_loopback
        or addr.is_link_local
        or addr.is_multicast
        or addr.is_reserved
        or addr.is_unspecified
    )


def _resolve_hostname_ips(hostname: str) -> list[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise BrandImportUrlError(f"Could not resolve hostname {hostname!r}") from exc
    addrs: list[ipaddress.IPv4Address | ipaddress.IPv6Address] = []
    for info in infos:
        ip_str = info[4][0]
        try:
            addrs.append(ipaddress.ip_address(ip_str))
        except ValueError:
            continue
    if not addrs:
        raise BrandImportUrlError(f"No IP addresses found for {hostname!r}")
    return addrs


def validate_public_http_url(raw: str) -> ValidatedUrl:
    """Return a normalized https? URL safe to fetch server-side."""
    text = (raw or "").strip()
    if not text:
        raise BrandImportUrlError("URL is required")
    if not text.startswith(("http://", "https://")):
        text = f"https://{text}"

    parsed = urlparse(text)
    if parsed.scheme not in ("http", "https"):
        raise BrandImportUrlError("Only http and https URLs are allowed")
    hostname = (parsed.hostname or "").strip().lower()
    if not hostname:
        raise BrandImportUrlError("URL must include a hostname")
    if hostname in _BLOCKED_HOSTNAMES or hostname.endswith(".localhost"):
        raise BrandImportUrlError("URL hostname is not allowed")
    if parsed.username or parsed.password:
        raise BrandImportUrlError("URLs with embedded credentials are not allowed")

    # Block literal IPs in URL (re-checked after DNS below).
    try:
        literal = ipaddress.ip_address(hostname)
        if _is_blocked_ip(literal):
            raise BrandImportUrlError("URL points to a private or reserved address")
    except ValueError:
        pass

    for addr in _resolve_hostname_ips(hostname):
        if _is_blocked_ip(addr):
            raise BrandImportUrlError("URL resolves to a private or reserved address")

    port = parsed.port
    if port is not None and port not in (80, 443, 8080, 8443):
        raise BrandImportUrlError(f"URL port {port} is not allowed")

    path = parsed.path or "/"
    normalized = urlunparse(
        (
            parsed.scheme,
            hostname if port is None else f"{hostname}:{port}",
            path,
            "",
            parsed.query,
            "",
        )
    )
    return ValidatedUrl(original=raw.strip(), normalized=normalized, hostname=hostname)


def same_registrable_domain(url_a: str, url_b: str) -> bool:
    """True when both URLs share the same hostname (MVP same-site rule)."""
    return urlparse(url_a).hostname == urlparse(url_b).hostname


def absolutize(base_url: str, href: str) -> str | None:
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    return urljoin(base_url, href)
