import { Transform } from "node:stream";

class CrimeCounter extends Transform {
  constructor(searchText, options = {}) {
    super({
      ...options,
      objectMode: true,
    });
    this.search = searchText;
    this.crimes = new Map();
  }

  _transform(chunk, enc, cb) {
    const year = parseInt(chunk.year);

    if (!year || isNaN(year)) {
      return cb();
    }

    let crimeCount = this.crimes.has(year) ? this.crimes.get(year) : 0;
    if (this.regex) {
      let isMatch = false;
      const majorCrime = chunk.major_category;
      const minorCrime = chunk.minor_category;

      if (majorCrime) {
        isMatch = this.regex.test(majorCrime);
      }

      if (minorCrime && !isMatch) {
        isMatch = this.regex.test(minorCrime);
      }

      if (isMatch) {
        crimeCount += parseInt(chunk.value) ?? 0;
        this.crimes.set(year, crimeCount);
      }
    } else {
      crimeCount += parseInt(chunk.value) ?? 0;
      this.crimes.set(year, crimeCount);
    }

    cb();
  }

  _flush(cb) {
    const report = this.processData();
    this.push("Report on crime per year\n");
    this.push(report);
    this.push("\n");
    cb();
  }

  processData() {
    const sortedCrimeEntries = Array.from(this.crimes.entries()).sort(
      ([yearA], [yearB]) => {
        return yearA - yearB;
      }
    );
    console.table(sortedCrimeEntries);
    const crimesPerYear = sortedCrimeEntries.map(([, crime]) => crime);
    return this.computeCrimeProgress(crimesPerYear);
  }

  computeCrimeProgress(crimesPerYear) {
    const totalYears = crimesPerYear.length;
    let type = "";

    // If the first two and the last two elements
    // of the array are in increasing order
    if (
      crimesPerYear[0] <= crimesPerYear[1] &&
      crimesPerYear[totalYears - 2] <= crimesPerYear[totalYears - 1]
    )
      type = "Crime Increasing per year";
    // If the first two and the last two elements
    // of the array are in decreasing order
    else if (
      crimesPerYear[0] >= crimesPerYear[1] &&
      crimesPerYear[totalYears - 2] >= crimesPerYear[totalYears - 1]
    )
      type = "Crime Decreasing per year";
    // If the first two elements of the array are in
    // increasing order and the last two elements
    // of the array are in decreasing order
    else if (
      crimesPerYear[0] <= crimesPerYear[1] &&
      crimesPerYear[totalYears - 2] >= crimesPerYear[totalYears - 1]
    )
      type = "Crime Increased then decreased per year";
    // If the first two elements of the array are in
    // decreasing order and the last two elements
    // of the array are in increasing order
    else if (
      crimesPerYear[0] >= crimesPerYear[1] &&
      crimesPerYear[totalYears - 2] <= crimesPerYear[totalYears - 1]
    )
      type = "Crime Decreased then increased per year";
    else type = "Crime did not change per year";
    return type;
  }
}


export default CrimeCounter;
