function flatten(node: any, acc: any[] = []) {
  const text = (node.text || "").trim();

  if (text.length > 0 && text.length < 100) {
    acc.push({
      text,
      role: node.role,
      ariaLabel: node.ariaLabel,
    });
  }

  for (const c of node.children || []) {
    flatten(c, acc);
  }

  return acc;
}

const NOISE_PATTERNS = [
  "good morning",
  "my week",
  "tasks completed",
  "collaborators",
  "customize",
  "home",
  "today",
  "january"
];

function isNoise(text: string) {
  const t = text.toLowerCase();
  return NOISE_PATTERNS.some(p => t.includes(p));
}

export function buildActionContract(
  beforeTree: any,
  afterTree: any,
  actionInput?: any
) {
  const before = flatten(beforeTree);
  const after = flatten(afterTree);

  let added = after.filter(
    a =>
      !before.some(
        b =>
          b.text === a.text &&
          b.role === a.role &&
          b.ariaLabel === a.ariaLabel
      )
  ).filter(a => !isNoise(a.text));

  if (added.length === 0 && actionInput?.title) {
    added = [{ text: actionInput.title }];
  }

  return {
    action: "ADD_TASK",
    entity: "Task",
    fields: {
      title: added.map(a => a.text)
    }
  };
}

