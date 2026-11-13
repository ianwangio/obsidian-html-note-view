import { FrontMatterCache } from 'obsidian';
import { t } from './i18n';
import { HtmlNoteViewSettings, STATUS_DISPLAY_MAP } from './types';

const BADGE_BLOCK_RE = /\n<!-- VAULT-BADGE:START -->[\s\S]*?<!-- VAULT-BADGE:END -->/g;
const BRIDGE_BLOCK_RE = /\n<!-- VAULT-BRIDGE:START -->[\s\S]*?<!-- VAULT-BRIDGE:END -->/g;
const BODY_OPEN_RE = /(<body\b[^>]*>)/i;
const BODY_CLOSE_RE = /(<\/body\s*>)/i;
const HTML_TAG_OPEN_RE = /<html\b([^>]*)>/i;

export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function extractNormalizedTags(fm?: FrontMatterCache | Record<string, unknown> | null): string[] {
  if (!fm) return [];
  const raw = fm.tags;
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? [raw] : [];
  return list
    .map((t) => String(t).replace(/^#/, '').trim())
    .filter(Boolean);
}

export function buildCornerBadgeHtml(
  fm: FrontMatterCache | Record<string, unknown>,
  settings: HtmlNoteViewSettings
): string {
  const statusRaw = typeof fm.status === 'string' ? fm.status.trim() : '';
  const statusLabel = statusRaw ? escapeHtml(STATUS_DISPLAY_MAP[statusRaw] || statusRaw) : '';
  const tags = extractNormalizedTags(fm);
  const dateVal = fm.updated
    ? String(fm.updated).slice(0, 10)
    : fm.created
      ? String(fm.created).slice(0, 10)
      : '';

  const statusSpan = statusLabel ? `<span class="vb-status">${statusLabel}</span>` : '';
  const tagSpans = tags.map((t) => `<span class="vb-tag">#${escapeHtml(t)}</span>`).join('');
  const dateSpan = dateVal ? `<span class="vb-date">${escapeHtml(dateVal)}</span>` : '';

  const offset = Math.max(8, Number(settings.badgeOffsetPx) || 64);
  const verticalPosCss =
    settings.badgePosition === 'bottom-right' ? `bottom: 20px;` : `top: ${offset}px;`;
  const i18n = t(settings.language);

  return `<!-- VAULT-BADGE:START -->
<style id="vault-corner-badge-style">
  #vault-corner-badge {
    position: fixed;
    ${verticalPosCss}
    right: 22px;
    z-index: 9999;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 6px 12px;
    border-radius: 999px;
    font-family: "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.2;
    background: rgba(15, 23, 42, 0.86);
    color: #e2e8f0;
    border: 1px solid rgba(148, 163, 184, 0.34);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.28);
    user-select: none;
  }
  html[data-theme="light"] #vault-corner-badge {
    background: rgba(255, 255, 255, 0.92);
    color: #0f172a;
    border-color: rgba(100, 116, 139, 0.28);
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.08);
  }
  #vault-corner-badge.vb-collapsed .vb-body { display: none; }
  #vault-corner-badge .vb-body { display: inline-flex; align-items: center; gap: 7px; flex-wrap: wrap; }
  #vault-corner-badge .vb-status {
    font-weight: 700;
    color: #fb923c;
    padding-right: 6px;
    border-right: 1px solid rgba(148, 163, 184, 0.28);
  }
  html[data-theme="light"] #vault-corner-badge .vb-status { color: #ea580c; }
  #vault-corner-badge .vb-tag {
    background: rgba(16, 185, 129, 0.16);
    color: #34d399;
    border: 1px solid rgba(16, 185, 129, 0.35);
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
  }
  html[data-theme="light"] #vault-corner-badge .vb-tag {
    background: rgba(5, 150, 105, 0.1);
    color: #059669;
  }
  #vault-corner-badge .vb-date { color: #94a3b8; font-size: 11px; }
  #vault-corner-badge .vb-toggle {
    border: none;
    background: transparent;
    color: #94a3b8;
    cursor: pointer;
    font-size: 12px;
    padding: 0 2px;
    line-height: 1;
  }
  #vault-corner-badge .vb-toggle:hover { color: #f8fafc; }
  html[data-theme="light"] #vault-corner-badge .vb-toggle:hover { color: #0f172a; }
</style>
<aside id="vault-corner-badge" aria-label="${escapeHtml(i18n.badgeAriaLabel)}">
  <span class="vb-body">${statusSpan}${tagSpans}${dateSpan}</span>
  <button class="vb-toggle" type="button" title="${escapeHtml(i18n.badgeToggleTitle)}" onclick="const p=this.parentElement;p.classList.toggle('vb-collapsed');this.textContent=p.classList.contains('vb-collapsed')?'🏷️':'×';">×</button>
</aside>
<!-- VAULT-BADGE:END -->`;
}

/**
 * Injects a lightweight runtime bridge inside srcdoc iframes so:
 *  1. #hash TOC / anchor clicks smoothly scroll inside the iframe instead of failing Electron about:srcdoc navigation
 *  2. External http(s)/mailto links open cleanly in the user's default browser
 *  3. Relative vault links open via Obsidian's workspace router
 */
export function buildIframeBridgeHtml(): string {
  return `<!-- VAULT-BRIDGE:START -->
<script id="vault-iframe-link-bridge">
(function () {
  if (window.__vaultLinkBridgeInstalled) return;
  window.__vaultLinkBridgeInstalled = true;

  function findAnchor(evt) {
    if (typeof evt.composedPath === 'function') {
      var hit = evt.composedPath().find(function (el) {
        return el && el.tagName && el.tagName.toUpperCase() === 'A' && el.hasAttribute('href');
      });
      if (hit) return hit;
    }
    var node = evt.target;
    if (node && node.nodeType !== 1) node = node.parentElement;
    return node && typeof node.closest === 'function' ? node.closest('a[href]') : null;
  }

  document.addEventListener('click', function (evt) {
    if (evt.defaultPrevented) return;
    var a = findAnchor(evt);
    if (!a) return;
    var rawHref = (a.getAttribute('href') || '').trim();
    if (!rawHref || /^javascript:/i.test(rawHref)) return;

    if (rawHref.charAt(0) === '#') {
      evt.preventDefault();
      var targetId = rawHref.slice(1);
      try {
        targetId = decodeURIComponent(targetId);
      } catch (_) {}

      if (!targetId) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      var targetEl = document.getElementById(targetId) || document.getElementsByName(targetId)[0];
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        var listRoot = a.closest('ul, ol, nav');
        if (listRoot && listRoot.querySelector('a.active')) {
          listRoot.querySelectorAll('a.active').forEach(function (el) {
            el.classList.remove('active');
          });
          a.classList.add('active');
        }
      }
      return;
    }

    if (/^(https?:|mailto:|tel:)/i.test(rawHref)) {
      evt.preventDefault();
      window.parent.postMessage(
        { __vaultHtmlBridge: true, action: 'open-external', url: rawHref },
        '*'
      );
      return;
    }

    if (!/^(data:|blob:)/i.test(rawHref)) {
      evt.preventDefault();
      window.parent.postMessage(
        {
          __vaultHtmlBridge: true,
          action: 'open-internal',
          link: rawHref,
          newLeaf: Boolean(evt.metaKey || evt.ctrlKey),
        },
        '*'
      );
    }
  });
})();
</script>
<!-- VAULT-BRIDGE:END -->`;
}

export function prepareHtmlSrcdoc(
  rawHtml: string,
  fm: FrontMatterCache | Record<string, unknown> | undefined,
  isObsidianDark: boolean,
  settings: HtmlNoteViewSettings
): string {
  let htmlOut = rawHtml.replace(BADGE_BLOCK_RE, '').replace(BRIDGE_BLOCK_RE, '');

  if (settings.syncTheme) {
    const targetTheme = isObsidianDark ? 'dark' : 'light';
    if (HTML_TAG_OPEN_RE.test(htmlOut)) {
      htmlOut = htmlOut.replace(HTML_TAG_OPEN_RE, (_full, attrs: string) => {
        if (/data-theme\s*=/i.test(attrs)) {
          return `<html${attrs.replace(/data-theme=["'][^"']*["']/i, `data-theme="${targetTheme}"`)}>`;
        }
        return `<html${attrs} data-theme="${targetTheme}">`;
      });
    }
  }

  const meta = fm || {};
  const hasBadgeData = Boolean(meta.status || extractNormalizedTags(meta).length > 0);
  if (settings.showCornerBadge && hasBadgeData) {
    const badgeHtml = buildCornerBadgeHtml(meta, settings);
    const bodyMatch = BODY_OPEN_RE.exec(htmlOut);
    if (bodyMatch) {
      const pos = bodyMatch.index + bodyMatch[0].length;
      htmlOut = htmlOut.slice(0, pos) + '\n' + badgeHtml + htmlOut.slice(pos);
    } else {
      htmlOut = badgeHtml + '\n' + htmlOut;
    }
  }

  const bridgeHtml = buildIframeBridgeHtml();
  const bodyCloseMatch = BODY_CLOSE_RE.exec(htmlOut);
  if (bodyCloseMatch) {
    htmlOut =
      htmlOut.slice(0, bodyCloseMatch.index) +
      '\n' +
      bridgeHtml +
      '\n' +
      htmlOut.slice(bodyCloseMatch.index);
  } else {
    htmlOut = htmlOut + '\n' + bridgeHtml;
  }

  return htmlOut;
}
