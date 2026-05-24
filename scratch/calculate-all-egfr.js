// No imports needed

// Note: since the project is in typescript, we can just run a quick inline calculation or import ts-node.
// Since we don't have ts-node running easily, let's write the formula in JS directly or run it.
function calculateEGFR_JS(creatinine, age, sex) {
  const kappa = sex === 'F' ? 0.7 : 0.9;
  const alpha = sex === 'F' ? -0.241 : -0.302;
  const sexMultiplier = sex === 'F' ? 1.012 : 1.0;

  const scrKappaRatio = creatinine / kappa;
  const minTerm = Math.pow(Math.min(scrKappaRatio, 1), alpha);
  const maxTerm = Math.pow(Math.max(scrKappaRatio, 1), -1.200);
  const ageTerm = Math.pow(0.9938, age);

  const eGFR = 142 * minTerm * maxTerm * ageTerm * sexMultiplier;
  return Math.round(eGFR * 10) / 10;
}

const pts = [
  { id: 1, name: 'Patient 1', age: 65, sex: 'M', creatinine: 2.1, currentEGFR: 31.2 },
  { id: 2, name: 'Patient 2', age: 58, sex: 'F', creatinine: 0.9, currentEGFR: 82 },
  { id: 3, name: 'Patient 3', age: 78, sex: 'M', creatinine: 1.4, currentEGFR: 48 },
  { id: 5, name: 'Patient 5', age: 62, sex: 'M', creatinine: 4.8, currentEGFR: 12 },
  { id: 7, name: 'Patient 7', age: 35, sex: 'F', creatinine: 3.2, currentEGFR: 18 },
  { id: 8, name: 'Patient 8', age: 68, sex: 'M', creatinine: 1.1, currentEGFR: 62 },
  { id: 9, name: 'Patient 9', age: 55, sex: 'M', creatinine: 1.0, currentEGFR: 72 },
];

pts.forEach(p => {
  const calc = calculateEGFR_JS(p.creatinine, p.age, p.sex);
  console.log(`${p.name} (${p.sex}, Age ${p.age}, Cr ${p.creatinine}): Current eGFR in file = ${p.currentEGFR}, Calculated = ${calc}`);
});
