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
    """True for any address that is not globally routable on the public Internet."""
    return not addr.is_global


_NON_PUBLIC_ADDRESS_MSG = "non-public address"


def validate_connected_ip(ip_str: str) -> None:
    """Reject TCP peers that are not globally routable."""
    try:
        addr = ipaddress.ip_address(ip_str)
    except ValueError as exc:
        raise BrandImportUrlError(f"Connected to invalid address {ip_str!r}") from exc
    if _is_blocked_ip(addr):
        raise BrandImportUrlError(f"Connection resolved to a {_NON_PUBLIC_ADDRESS_MSG}")


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
            raise BrandImportUrlError(f"URL points to a {_NON_PUBLIC_ADDRESS_MSG}")
    except ValueError:
        pass

    for addr in _resolve_hostname_ips(hostname):
        if _is_blocked_ip(addr):
            raise BrandImportUrlError(f"URL resolves to a {_NON_PUBLIC_ADDRESS_MSG}")

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


def normalize_crawl_url(raw: str) -> str | None:
    """Return a normalized crawl URL when safe, else None."""
    try:
        return validate_public_http_url(raw).normalized
    except BrandImportUrlError:
        return None


def same_registrable_domain(url_a: str, url_b: str) -> bool:
    """True when both URLs share the same hostname (MVP same-site rule)."""
    return urlparse(url_a).hostname == urlparse(url_b).hostname


def is_canonical_host_redirect(submitted_host: str, final_host: str) -> bool:
    """True for common apex <-> www canonicalization on the seed URL only."""
    submitted = (submitted_host or "").lower().strip(".")
    final = (final_host or "").lower().strip(".")
    if not submitted or not final or submitted == final:
        return submitted == final
    return final == f"www.{submitted}" or submitted == f"www.{final}"


def redirect_allowed_for_crawl(
    *,
    request_url: str,
    page_url: str,
    submitted_host: str,
    crawl_origin: str,
    is_seed_page: bool,
) -> tuple[bool, str | None]:
    """
    Decide whether a post-redirect final URL may be crawled.

    Returns (allowed, new_crawl_host) where new_crawl_host is set only for an
    explicit seed-page canonical redirect (e.g. example.com -> www.example.com).
    """
    page_host = (urlparse(page_url).hostname or "").lower()
    if not page_host:
        return False, None
    if same_registrable_domain(crawl_origin, page_url):
        return True, None
    if is_seed_page and is_canonical_host_redirect(submitted_host, page_host):
        return True, page_host
    return False, None


def absolutize(base_url: str, href: str) -> str | None:
    if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
        return None
    return urljoin(base_url, href)
