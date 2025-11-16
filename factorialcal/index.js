const factorial = require("./factorial");

const numbers = [5, 7, 10];

numbers.forEach(num => {
  const result = factorial(num);
  console.log(`Factorial of ${num} is: ${result}`);
});
