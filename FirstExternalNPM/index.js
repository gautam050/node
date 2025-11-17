
const boxen = require("boxen");


const message = "Harryy!!!!\nI am using my first external module!!";
let message2='unicorns love rainbows'

const simpleBox = boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: "single"
});
console.log(simpleBox);


const doubleBox = boxen(message, {
    padding: 1,
    margin: 1,
    borderStyle: "double"
});
console.log(doubleBox);


const roundedColorBox = boxen(message2, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    backgroundColor: "cyan",
});
console.log(roundedColorBox);
