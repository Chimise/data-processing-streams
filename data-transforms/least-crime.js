import {Transform} from 'node:stream';

class LeastCrime extends Transform {
    constructor(options = {}) {
        super({
            ...options,
            objectMode: true
        })

        this.crimes = new Map();
    }

    _transform({major_category, value}, enc, cb) {
        if(!major_category) {
            return cb();
        }

        let crimeCount = this.crimes.get(major_category) ?? 0;
        crimeCount += parseInt(value) ?? 0;
        this.crimes.set(major_category, crimeCount);
        cb();
    }

    _flush(cb) {
        this.push('\nLeast Crime\n');
        const leastCrime = this._process();
        this.push(leastCrime);
        this.push('\n');
        cb();
    }

    _process() {
        let lowestCrimeCount = Number.MAX_SAFE_INTEGER;
        let lowestCrime;
        for (const [crime, crimeCount] of this.crimes.entries()) {
            if(crimeCount < lowestCrimeCount) {
                lowestCrimeCount = crimeCount;
                lowestCrime = crime;
            }
        }
        
        return lowestCrime;
    }

}

export default LeastCrime;