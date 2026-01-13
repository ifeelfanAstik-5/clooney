import { RenderedNode } from "./types";

export const extractRenderedTree = async (page: any): Promise<RenderedNode> => {
  return await page.evaluate(`
    console.log('ROOT RECT', document.body.getBoundingClientRect());

    (function () {
      function isUseful(el, rect, styles) {
        if (styles.display === "none") return false;
        if (styles.visibility === "hidden") return false;
        if (rect.width < 4 || rect.height < 4) return false;

        const tag = el.tagName.toLowerCase();
        if (["script", "style", "link", "meta", "iframe"].includes(tag)) {
          return false;
        }
        return true;
      }

      function getNode(el, depth) {
        if (depth > 6) return null;

        const rect = el.getBoundingClientRect();
        const styles = window.getComputedStyle(el);

        if (depth !== 0 && !isUseful(el, rect, styles)) return null;

        const children = [];
        for (let i = 0; i < el.children.length; i++) {
          const child = getNode(el.children[i], depth + 1);
          if (child) children.push(child);
        }

        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || "").slice(0, 200),
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          },
          styles: {
            display: styles.display,
            position: styles.position,
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight,
            padding: styles.padding,
            margin: styles.margin,
            borderRadius: styles.borderRadius
          },
          className: el.className || undefined,
          id: el.id || undefined,
          role: el.getAttribute("role") || undefined,
          ariaLabel: el.getAttribute("aria-label") || undefined,
          children: children
        };
      }

      const root = document.querySelector('#asana_main_page') || document.querySelector('#asana_full_page') || document.querySelector('#asana') || document.body;

      return getNode(root, 0);
    })()
  `);
};

export const findLargeRegions = (node: any, regions: any = []) => {
  if (
    node.rect.width > 200 &&
    node.rect.height > 300 &&
    node.styles.display === "flex"
  ) {
    regions.push(node);
  }

  for (const child of node.children || []) {
    findLargeRegions(child, regions);
  }

  return regions;
}
