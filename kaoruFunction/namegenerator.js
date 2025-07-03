const fs = require('fs');

// Load data JSON (cukup arahkan langsung tanpa path.join)
const maleNames = JSON.parse(fs.readFileSync('kaoruFunction/data/male.json', 'utf-8'));
const femaleNames = JSON.parse(fs.readFileSync('kaoruFunction/data/female.json', 'utf-8'));
const lastNames = JSON.parse(fs.readFileSync('kaoruFunction/data/lastname.json', 'utf-8'));

// Fungsi untuk ambil elemen acak dari array
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Fungsi untuk generate nama
function generateName(gender = 'random') {
  let firstName;

  if (gender === 'male') {
    firstName = getRandom(maleNames);
  } else if (gender === 'female') {
    firstName = getRandom(femaleNames);
  } else {
    const combined = [...maleNames, ...femaleNames];
    firstName = getRandom(combined);
  }

  const lastName = getRandom(lastNames);
  return `${firstName} ${lastName}`;
}

// Export fungsi untuk digunakan di file lain
module.exports = generateName;
