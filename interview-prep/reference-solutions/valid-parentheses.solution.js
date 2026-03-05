/**
 * Stack pattern:
 * - push left brackets
 * - on right bracket, top must match
 * - stack must end empty
 */
function solve(s) {
  const stack = [];
  const pairs = {
    ")": "(",
    "]": "[",
    "}": "{"
  };

  for (const ch of s) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
      continue;
    }
    const top = stack.pop();
    if (pairs[ch] !== top) return false;
  }

  return stack.length === 0;
}

module.exports = solve;

