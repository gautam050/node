function factorial(n) {
  if (typeof n !== "number") {
    return "Error: Input must be a number.";
  }

  if (n < 0) {
    return "Error: Factorial is not defined for negative numbers.";
  }

  if (n === 0 || n === 1) {
    return 1;
  }

  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }

  return result;
}

module.exports = factorial;
