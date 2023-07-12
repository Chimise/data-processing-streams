import { Transform } from "node:stream";

class CommonCrimePerArea extends Transform {
  constructor(options = {}) {
    super({
      ...options,
      objectMode: true,
    });
    this.data = new Map();
  }

  _transform({ borough, major_category, value }, enc, cb) {
    if (!borough || !major_category) {
      return cb();
    }
    // Group crimes by borough, assign each borough a map that consists of crimes committed and their count
    const category = this.data.get(borough) ?? new Map();
    let crimeCount = category.get(major_category) ?? 0;
    crimeCount += parseInt(value) || 0;
    category.set(major_category, crimeCount);
    this.data.set(borough, category);
    cb();
  }

  _flush(cb) {
    this.push("\nCommon Crime per Area\n");
    const crime = this._process();
    this.push(crime);
    this.push("\n");
    cb();
  }

  _process() {
    let crimes = [];
    let ratedCrimes = {};
    let highestCrime = { rating: Number.MAX_SAFE_INTEGER, crime: null };

    for (const value of this.data.values()) {
      // Assign a ranking to the crimes after sorting starting from the highest
      let valueEntries = Array.from(value.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([crime], index) => [crime, index + 1]);
      crimes = crimes.concat(valueEntries);
    }

    for (const [crime, rating] of crimes) {
      let weightedRating = ratedCrimes[crime] ?? 0;
      weightedRating += rating;
      ratedCrimes[crime] = weightedRating;
      if (weightedRating < highestCrime.rating) {
        highestCrime.rating = weightedRating;
        highestCrime.crime = crime;
      }
    }

    return highestCrime.crime;
  }
}

export default CommonCrimePerArea;
