/**
 * Paths the user has excluded or re-included. A rule applies to the path itself and
 * everything under it, and the deepest matching rule wins, so a file can be re-included
 * inside an excluded folder.
 */
export interface ExclusionRules {
  excluded: Set<string>;
  included: Set<string>;
}

export const EMPTY_RULES: ExclusionRules = { excluded: new Set(), included: new Set() };

function matches(rule: string, path: string): boolean {
  return rule === path || path.startsWith(rule + "/");
}

export function isPathExcluded(path: string, rules: ExclusionRules): boolean {
  let deepestRule = "";
  let excluded = false;
  for (const ep of rules.excluded) {
    if (matches(ep, path) && ep.length > deepestRule.length) {
      deepestRule = ep;
      excluded = true;
    }
  }
  for (const ip of rules.included) {
    if (matches(ip, path) && ip.length > deepestRule.length) {
      deepestRule = ip;
      excluded = false;
    }
  }
  return excluded;
}

/** Returns new rules with the path flipped between excluded and included. */
export function toggleExclusion(path: string, rules: ExclusionRules): ExclusionRules {
  const excluded = new Set(rules.excluded);
  const included = new Set(rules.included);
  if (isPathExcluded(path, rules)) {
    included.add(path);
    excluded.delete(path);
  } else {
    excluded.add(path);
    included.delete(path);
  }
  return { excluded, included };
}
