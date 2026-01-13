import fs from "fs";
import { buildActionContract } from "./contract";

function findListCandidates(node: any, results: any[] = []) {
  if (!node.children) return results;

  if (node.children.length >= 3) {
    const texts = node.children
      .map((c: any) => (c.text || "").trim())
      .filter((t: string) => t.length > 0 && t.length < 120);

    if (texts.length >= 3) {
      results.push({
        childCount: node.children.length,
        sampleTexts: texts.slice(0, 5),
      });
    }
  }

  for (const child of node.children) {
    findListCandidates(child, results);
  }

  return results;
}


// function findLikelyList(node: any): any | null {
//   if (!node.children || node.children.length < 3) return null;

//   // Heuristic: many children with short text (task titles)
//   const shortTextChildren = node.children.filter((c: any) => {
//     const t = (c.text || "").trim();
//     return t.length > 0 && t.length < 100;
//   });

//   if (shortTextChildren.length >= 3) {
//     return node;
//   }

//   for (const child of node.children) {
//     const found = findLikelyList(child);
//     if (found) return found;
//   }

//   return null;
// }


// function flatten(node: any, acc: any[] = []) {
//   const isLeaf = !node.children || node.children.length === 0;
//   const text = (node.text || "").trim();

//   if (isLeaf && text.length > 0 && text.length < 80) {
//     acc.push({
//       tag: node.tag,
//       text,
//       role: node.role,
//       ariaLabel: node.ariaLabel,
//     });
//   }

//   for (const child of node.children || []) {
//     flatten(child, acc);
//   }

//   return acc;
// }

// function findNodeByText(node: any, matcher: (text: string) => boolean): any | null {
//   const text = (node.text || "").toLowerCase();
//   if (matcher(text)) return node;

//   for (const child of node.children || []) {
//     const found = findNodeByText(child, matcher);
//     if (found) return found;
//   }

//   return null;
// }


// function diffTrees(before: any, after: any) {
//   const a = flatten(before);
//   const b = flatten(after);

//   return b.filter(
//     bn =>
//       !a.some(
//         an =>
//           an.tag === bn.tag &&
//           an.text === bn.text &&
//           an.role === bn.role
//       )
//   );
// }

function findNodesContainingText(root: any, text: string) {
  const results: any[] = [];

  function walk(node: any) {
    if ((node.text || "").includes(text)) {
      results.push({
        tag: node.tag,
        role: node.role,
        ariaLabel: node.ariaLabel,
        text: node.text,
        childCount: node.children?.length ?? 0
      });
    }

    for (const child of node.children || []) {
      walk(child);
    }
  }

  walk(root);
  return results;
}


// function main() {
//   const raw = JSON.parse(
//     fs.readFileSync("generated/raw.json", "utf-8")
//   );

//   const beforeRoot = raw.pages.projects.tree;
//   const afterRoot = raw.pages.projects_after_add_task.tree;

//   const before = findLikelyList(beforeRoot);

//   const after = findLikelyList(afterRoot);

//   if (!before || !after) {
//     console.error("Task container not found");
//     return;
//   }

//   const added = diffTrees(before, after);

//   console.log("Added nodes:", added);
// }

function main() {
  const raw = JSON.parse(
    fs.readFileSync("generated/raw.json", "utf-8")
  );

    const after = raw.pages.projects_after_add_task.tree;

    const matches = findNodesContainingText(after, "Agent test task");

    console.log("TASK NODE MATCHES:");
    console.log(matches);


  const root = raw.pages.projects_after_add_task.tree;

  const candidates = findListCandidates(root);

  console.log("LIST CANDIDATES (top 10):");
  console.log(candidates.slice(0, 10));
  const actionInput = raw.actionLog.find(a => a.action === "ADD_TASK");
  const contract = buildActionContract(raw.pages.projects_before_add_task.tree,raw.pages.projects_after_add_task.tree, actionInput?.input);
  

// const contract = buildActionContract(
//   raw.pages.projects_before_add_task.tree,
//   raw.pages.projects_after_add_task.tree,
//   actionInput?.input
// );
  console.log("ACTION CONTRACT:");
  console.log(JSON.stringify(contract, null, 2));
}


main();
