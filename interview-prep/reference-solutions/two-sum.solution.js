/**
 * Hash map pattern:
 * map[value] = index
 * For current x, look for target - x.
 */
function solve(nums, target) {
  const seen = new Map();

  for (let i = 0; i < nums.length; i += 1) {
    const x = nums[i];
    const need = target - x;
    if (seen.has(need)) {
      return [seen.get(need), i];
    }
    seen.set(x, i);
  }

  return [];
}

module.exports = solve;

