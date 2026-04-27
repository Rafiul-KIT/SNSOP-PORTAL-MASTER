#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const sourceArg = process.argv[2] ?? 'Update_SNSOP_USER_Manual.html';
const outputJsonArg = process.argv[3] ?? 'public/help-desk/manual-content.json';
const outputImageDirArg = process.argv[4] ?? 'public/help-desk/manual-images';

const sourcePath = path.resolve(rootDir, sourceArg);
const outputJsonPath = path.resolve(rootDir, outputJsonArg);
const outputImageDir = path.resolve(rootDir, outputImageDirArg);

const ENTITY_MAP = new Map([
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['nbsp', ' '],
  ['ndash', '-'],
  ['mdash', '-'],
  ['hellip', '...']
]);

function fail(message) {
  console.error(`\n[extract-user-manual] ${message}`);
  process.exit(1);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function decodeEntities(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#(\d+);/g, (_, num) => {
      const code = Number.parseInt(num, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&([a-z]+);/gi, (full, name) => ENTITY_MAP.get(name.toLowerCase()) ?? full);
}

function stripTags(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

function normalizeText(text) {
  return decodeEntities(text)
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractAssignedObject(scriptText, variableName) {
  const markerRe = new RegExp(`\\bvar\\s+${escapeRegExp(variableName)}\\s*=`);
  const markerMatch = markerRe.exec(scriptText);
  if (!markerMatch) {
    fail(`Could not find variable assignment: ${variableName}`);
  }

  let i = markerMatch.index + markerMatch[0].length;
  while (i < scriptText.length && /\s/.test(scriptText[i])) {
    i += 1;
  }

  if (scriptText[i] !== '{') {
    fail(`Expected object literal for ${variableName}`);
  }

  const objectStart = i;
  let depth = 0;
  let inString = null;
  let isEscaped = false;

  for (; i < scriptText.length; i += 1) {
    const char = scriptText[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (char === '\\') {
        isEscaped = true;
      } else if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      inString = char;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const objectLiteral = scriptText.slice(objectStart, i + 1);
        try {
          return JSON.parse(objectLiteral);
        } catch (error) {
          fail(`Failed to parse JSON for ${variableName}: ${error.message}`);
        }
      }
    }
  }

  fail(`Could not determine the end of object literal for ${variableName}`);
}

function getAttribute(openTag, attributeName) {
  const attrRe = new RegExp(`\\b${attributeName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
  const match = openTag.match(attrRe);
  return match ? match[1] ?? match[2] ?? match[3] ?? null : null;
}

function extractBalancedDiv(html, openTagStart) {
  const openTagEnd = html.indexOf('>', openTagStart);
  if (openTagEnd < 0) {
    fail(`Malformed <div> tag near index ${openTagStart}`);
  }

  let depth = 1;
  const tagRe = /<\/?div\b[^>]*>/gi;
  tagRe.lastIndex = openTagEnd + 1;

  for (let match = tagRe.exec(html); match; match = tagRe.exec(html)) {
    const token = match[0];

    if (token.startsWith('</')) {
      depth -= 1;
    } else if (!token.endsWith('/>')) {
      depth += 1;
    }

    if (depth === 0) {
      return {
        outerStart: openTagStart,
        outerEnd: tagRe.lastIndex,
        openTag: html.slice(openTagStart, openTagEnd + 1),
        innerHtml: html.slice(openTagEnd + 1, match.index)
      };
    }
  }

  fail(`Could not close <div> block near index ${openTagStart}`);
}

function findFirstDivByClass(html, className) {
  const classRe = new RegExp(
    `<div\\b[^>]*\\bclass\\s*=\\s*["'][^"']*\\b${escapeRegExp(className)}\\b[^"']*["'][^>]*>`,
    'i'
  );

  const match = classRe.exec(html);
  if (!match) {
    return null;
  }

  return extractBalancedDiv(html, match.index);
}

function sanitizeSectionHtml(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(iframe|object|embed|link|meta)\b[^>]*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .replace(/\s+loading\s*=\s*("[^"]*"|'[^']*')/gi, '')
    .trim();
}

function mimeToExtension(mimeType) {
  const lower = mimeType.toLowerCase();
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'jpg';
  if (lower === 'image/png') return 'png';
  if (lower === 'image/gif') return 'gif';
  if (lower === 'image/webp') return 'webp';
  if (lower === 'image/bmp') return 'bmp';
  if (lower === 'image/svg+xml') return 'svg';

  const slash = lower.indexOf('/');
  return slash > -1 ? lower.slice(slash + 1).replace(/[^a-z0-9]+/g, '') : 'bin';
}

async function rewriteImages(sectionHtml, imageWriteCache) {
  const imgTagRe = /<img\b[^>]*>/gi;
  let replaced = sectionHtml;
  let embeddedCount = 0;

  for (let match = imgTagRe.exec(sectionHtml); match; match = imgTagRe.exec(sectionHtml)) {
    const imgTag = match[0];
    const srcAttr = imgTag.match(/\bsrc\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);

    if (!srcAttr) {
      continue;
    }

    const srcValue = srcAttr[2] ?? srcAttr[3] ?? srcAttr[4] ?? '';
    const dataUriMatch = srcValue.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/i);

    if (!dataUriMatch) {
      continue;
    }

    embeddedCount += 1;

    const mimeType = dataUriMatch[1].toLowerCase();
    const base64Data = dataUriMatch[2].replace(/\s+/g, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const hash = createHash('sha1').update(buffer).digest('hex');
    const extension = mimeToExtension(mimeType);
    const fileName = `${hash}.${extension}`;
    const filePath = path.join(outputImageDir, fileName);

    if (!imageWriteCache.has(fileName)) {
      await fs.writeFile(filePath, buffer);
      imageWriteCache.add(fileName);
    }

    const staticSrc = `help-desk/manual-images/${fileName}`;
    let newTag = imgTag.replace(srcAttr[0], `src=\"${staticSrc}\"`);

    replaced = replaced.replace(imgTag, newTag);
  }

  return { html: replaced, embeddedCount };
}

function parseSectionsFromPane(paneHtml, navByIndex, roleId) {
  const sections = [];
  const accTagRe = /<div\b[^>]*\bclass\s*=\s*["'][^"']*\bacc\b[^"']*["'][^>]*\bdata-sec\s*=\s*["']?(\d+)["']?[^>]*>/gi;

  for (let match = accTagRe.exec(paneHtml); match; match = accTagRe.exec(paneHtml)) {
    const secIndex = Number.parseInt(match[1], 10);
    const block = extractBalancedDiv(paneHtml, match.index);

    const titleDiv = findFirstDivByClass(block.innerHtml, 'acc-t');
    const bodyDiv = findFirstDivByClass(block.innerHtml, 'acc-in');

    const titleText = normalizeText(stripTags(titleDiv?.innerHtml ?? ''));
    const fallbackTitle = navByIndex.get(secIndex) ?? `Section ${secIndex}`;
    const sectionTitle = titleText || fallbackTitle;

    const sectionBody = sanitizeSectionHtml(bodyDiv?.innerHtml ?? '');

    sections.push({
      index: Number.isFinite(secIndex) ? secIndex : null,
      title: sectionTitle,
      bodyHtml: sectionBody,
      roleId
    });

    accTagRe.lastIndex = block.outerEnd;
  }

  return sections;
}

async function main() {
  let sourceHtml;

  try {
    sourceHtml = await fs.readFile(sourcePath, 'utf-8');
  } catch (error) {
    fail(`Cannot read source file: ${sourcePath} (${error.message})`);
  }

  const roleNav = extractAssignedObject(sourceHtml, 'roleNav');
  const roleInfo = extractAssignedObject(sourceHtml, 'roleInfo');

  const rolePanes = new Map();
  const paneTagRe = /<div\b[^>]*\bclass\s*=\s*["'][^"']*\brole-pane\b[^"']*["'][^>]*>/gi;

  for (let match = paneTagRe.exec(sourceHtml); match; match = paneTagRe.exec(sourceHtml)) {
    const block = extractBalancedDiv(sourceHtml, match.index);
    const paneId = getAttribute(block.openTag, 'id');

    if (paneId?.startsWith('pane-')) {
      rolePanes.set(paneId.slice('pane-'.length), block.innerHtml);
    }

    paneTagRe.lastIndex = block.outerEnd;
  }

  await fs.rm(outputImageDir, { recursive: true, force: true });
  await fs.mkdir(outputImageDir, { recursive: true });

  const roleIds = [...new Set([...Object.keys(roleInfo), ...Object.keys(roleNav), ...rolePanes.keys()])];
  const imageWriteCache = new Set();

  const roles = [];
  let totalSections = 0;
  let totalEmbeddedImages = 0;

  for (const roleId of roleIds) {
    const info = roleInfo[roleId] ?? {
      icon: '📘',
      name: roleId,
      color: '#1565c0'
    };

    const nav = (roleNav[roleId] ?? []).map((item) => ({
      index: Number.parseInt(String(item.idx), 10),
      title: normalizeText(String(item.title ?? ''))
    }));

    const navByIndex = new Map(nav.map((item) => [item.index, item.title]));
    const paneHtml = rolePanes.get(roleId) ?? '';
    const rawSections = parseSectionsFromPane(paneHtml, navByIndex, roleId);

    const sections = [];

    for (const section of rawSections) {
      const rewritten = await rewriteImages(section.bodyHtml, imageWriteCache);
      totalEmbeddedImages += rewritten.embeddedCount;

      const mergedText = `${section.title} ${stripTags(rewritten.html)}`;
      const searchText = normalizeText(mergedText).toLowerCase();

      sections.push({
        index: section.index,
        title: section.title,
        bodyHtml: rewritten.html,
        searchText
      });
    }

    totalSections += sections.length;

    roles.push({
      id: roleId,
      name: normalizeText(String(info.name ?? roleId)),
      icon: String(info.icon ?? '📘'),
      color: String(info.color ?? '#1565c0'),
      nav,
      sections
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: path.relative(rootDir, sourcePath).replace(/\\/g, '/'),
    roles
  };

  await fs.mkdir(path.dirname(outputJsonPath), { recursive: true });
  await fs.writeFile(outputJsonPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8');

  console.log('[extract-user-manual] Complete');
  console.log(`[extract-user-manual] Source: ${payload.source}`);
  console.log(`[extract-user-manual] Roles: ${roles.length}`);
  console.log(`[extract-user-manual] Sections: ${totalSections}`);
  console.log(`[extract-user-manual] Embedded image refs processed: ${totalEmbeddedImages}`);
  console.log(`[extract-user-manual] Unique image files written: ${imageWriteCache.size}`);
  console.log(`[extract-user-manual] JSON written: ${path.relative(rootDir, outputJsonPath)}`);
}

main().catch((error) => {
  fail(error instanceof Error ? error.stack ?? error.message : String(error));
});
