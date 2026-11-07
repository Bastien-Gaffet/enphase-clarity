/* eslint-disable no-console */
/**
 * Layout audit — catches the class of defect that only shows up once rendered:
 * content escaping or crowding its container, SVG drawings clipped by their
 * own box, and horizontal page overflow.
 *
 * Reviewing screenshots by eye misses these; measuring boxes does not.
 *
 *   node scripts/layout-audit.js [--url http://localhost:8099] [--json]
 *
 * Exits non-zero when any rule fails, so CI can gate on it.
 */

const { chromium } = require("playwright");

const URL = argValue("--url") || process.env.AUDIT_URL || "http://localhost:8099";
const AS_JSON = process.argv.includes("--json");

/** Tab labels to visit, in order. The first screen is whatever loads initially. */
const SCREENS = ["Direct", "Gains", "Charge", "Simuler", "Réglages"];
const VIEWPORTS = [
  { name: "360x800", width: 360, height: 800 },
  { name: "390x844", width: 390, height: 844 },
];

/** Minimum breathing room between content and the inner edge of its card. */
const EDGE_MIN_PX = 3;
/** Overlap smaller than this is rounding noise, not a real collision. */
const OVERLAP_TOLERANCE_PX = 2;

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : null;
}

/**
 * Runs inside the page. Returns plain data only — nothing here may reference
 * Node scope.
 */
function collectViolations({ edgeMin, overlapTolerance }) {
  const out = [];
  const seen = new Set();

  const describe = (el) => {
    const text = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 42);
    return text ? `${el.tagName.toLowerCase()} "${text}"` : el.tagName.toLowerCase();
  };

  const push = (rule, detail, el) => {
    const key = `${rule}|${detail}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ rule, detail, element: el ? describe(el) : undefined });
  };

  const isVisible = (el) => {
    if (typeof el.checkVisibility === "function" && !el.checkVisibility()) return false;
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  // 1. The page must never scroll sideways.
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    push("horizontal-overflow", `scrollWidth ${de.scrollWidth} > viewport ${de.clientWidth}`);
  }

  // 2. An SVG must contain its own drawing. react-native-svg does not clip by
  //    default, so a chart drawn past its box silently loses strokes.
  //
  //    Measured in screen pixels, not user units: getBBox() reports viewBox
  //    coordinates and ignores stroke width, so comparing it against the
  //    rendered size flags every scaled icon as broken.
  for (const svg of document.querySelectorAll("svg")) {
    if (!isVisible(svg)) continue;
    const box = svg.getBoundingClientRect();
    if (box.width === 0 || box.height === 0) continue;

    const shapes = [...svg.querySelectorAll("path, rect, circle, line, polyline, polygon, text")];
    if (shapes.length === 0) continue;

    let union = null;
    for (const shape of shapes) {
      const r = shape.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      union = union
        ? {
            left: Math.min(union.left, r.left),
            top: Math.min(union.top, r.top),
            right: Math.max(union.right, r.right),
            bottom: Math.max(union.bottom, r.bottom),
          }
        : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    }
    if (!union) continue;

    const over = {
      left: box.left - union.left,
      top: box.top - union.top,
      right: union.right - box.right,
      bottom: union.bottom - box.bottom,
    };
    for (const [side, amount] of Object.entries(over)) {
      if (amount > 0.5) {
        push(
          "svg-clipped",
          `drawing exceeds its ${Math.round(box.width)}x${Math.round(box.height)} box by ${amount.toFixed(1)}px on the ${side}`,
          svg
        );
      }
    }
  }

  // Cards: elements that paint a surface. Their inner edge is the boundary
  // content must respect.
  const cards = [...document.querySelectorAll("div")].filter((el) => {
    const cs = getComputedStyle(el);
    const hasFill = cs.backgroundColor && !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    const rounded = parseFloat(cs.borderTopLeftRadius) >= 8;
    const r = el.getBoundingClientRect();
    return hasFill && rounded && r.width > 80 && r.height > 40;
  });


  for (const card of cards) {
    const cr = card.getBoundingClientRect();
    const cs = getComputedStyle(card);
    const inner = {
      left: cr.left + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth),
      right: cr.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth),
      top: cr.top + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth),
      bottom: cr.bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth),
    };

    // Leaf content only: a wrapper legitimately fills its parent edge to edge.
    const leaves = [...card.querySelectorAll("div, span, svg, input")].filter(
      (el) => el.children.length === 0 && (el.textContent || "").trim().length > 0 || el.tagName === "SVG"
    );

    for (const leaf of leaves) {
      if (!isVisible(leaf)) continue;
      // Only judge against the closest card, or nested cards double-report.
      if (leaf.closest("div[data-card], div") && leaf.parentElement) {
        const nearestCard = cards.find((c) => c !== card && c.contains(leaf) && card.contains(c));
        if (nearestCard) continue;
      }
      const lr = leaf.getBoundingClientRect();
      if (lr.width === 0 || lr.height === 0) continue;

      // 3. Content must not escape its card.
      const escapes = {
        left: inner.left - lr.left,
        right: lr.right - inner.right,
        top: inner.top - lr.top,
        bottom: lr.bottom - inner.bottom,
      };
      for (const [side, amount] of Object.entries(escapes)) {
        if (amount > edgeMin) {
          push("escapes-card", `overflows the card's ${side} inner edge by ${amount.toFixed(1)}px`, leaf);
        }
      }
    }
  }

  // 4. Siblings laid out in a column must not overlap each other.
  for (const parent of document.querySelectorAll("div")) {
    const kids = [...parent.children].filter((el) => el instanceof HTMLElement && isVisible(el));
    if (kids.length < 2) continue;
    const cs = getComputedStyle(parent);
    if (cs.position === "absolute" || cs.flexDirection === "row" || cs.flexWrap === "wrap") continue;

    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i].getBoundingClientRect();
      const b = kids[i + 1].getBoundingClientRect();
      if (getComputedStyle(kids[i]).position === "absolute") continue;
      if (getComputedStyle(kids[i + 1]).position === "absolute") continue;
      const overlap = a.bottom - b.top;
      if (overlap > overlapTolerance && a.height > 0 && b.height > 0) {
        push(
          "sibling-overlap",
          `overlaps the next block by ${overlap.toFixed(1)}px`,
          kids[i]
        );
      }
    }
  }

  return out;
}

async function auditScreen(page, screen, viewport, edgeMin, overlapTolerance) {
  const violations = await page.evaluate(collectViolations, { edgeMin, overlapTolerance });
  return violations.map((v) => ({ ...v, screen, viewport }));
}

(async () => {
  // CHROMIUM_PATH covers sandboxes with a preinstalled browser; otherwise
  // Playwright resolves the one it installed itself.
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
  });
  const findings = [];

  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      colorScheme: "dark",
    });
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2500);

    for (const screen of SCREENS) {
      if (screen !== SCREENS[0]) {
        const tab = page.locator(`text=${screen}`).last();
        await tab.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
      findings.push(...(await auditScreen(page, screen, vp.name, EDGE_MIN_PX, OVERLAP_TOLERANCE_PX)));

      // Scroll through the screen so blocks below the fold are measured too.
      for (let i = 0; i < 4; i++) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        await page.mouse.wheel(0, 600);
        await page.waitForTimeout(350);
        findings.push(...(await auditScreen(page, screen, vp.name, EDGE_MIN_PX, OVERLAP_TOLERANCE_PX)));
      }
      await page.mouse.wheel(0, -4000);
      await page.waitForTimeout(350);
    }
    await page.close();
  }

  await browser.close();

  // Collapse duplicates seen while scrolling.
  const unique = [];
  const seen = new Set();
  for (const f of findings) {
    const key = `${f.viewport}|${f.rule}|${f.detail}|${f.element ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(f);
  }

  if (AS_JSON) {
    console.log(JSON.stringify(unique, null, 2));
  } else if (unique.length === 0) {
    console.log("Audit de mise en page : aucun problème détecté.");
  } else {
    console.log(`Audit de mise en page : ${unique.length} problème(s).\n`);
    for (const f of unique) {
      console.log(`  [${f.rule}] ${f.screen} @ ${f.viewport}`);
      console.log(`    ${f.detail}`);
      if (f.element) console.log(`    sur ${f.element}`);
    }
  }

  process.exit(unique.length === 0 ? 0 : 1);
})().catch((err) => {
  console.error("Audit failed to run:", err);
  process.exit(2);
});
