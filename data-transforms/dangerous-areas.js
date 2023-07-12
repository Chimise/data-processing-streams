import {Transform} from 'node:stream';

class DangerousAreas extends Transform {
    constructor(limit = 3, options = {}) {
        super({...options, objectMode: true});
        this.limit = limit;
        this.crimeLocations = new Map();
    }

    _transform(crime, enc, cb) {
        const borough = crime.borough;
        if(!borough) {
            return cb();
        }

        let crimeCount = this.crimeLocations.has(borough) ? this.crimeLocations.get(borough) : 0;
        crimeCount += parseInt(crime.value) ?? 0;
        this.crimeLocations.set(borough, crimeCount);
        cb();
    }

    _flush(cb) {
        const data = this._process();
        this.push('\nDangerous areas to live in\n');
        this.push(data);
        cb();
    }

    _process() {
        const sortedCrimeLocations = Array.from(this.crimeLocations.entries()).sort((crimeA, crimeB) => {
            return crimeB[1] - crimeA[1];
        })

        const firstThreeCrime = sortedCrimeLocations.slice(0, this.limit);
        firstThreeCrime.unshift(['Borough', 'Crime-Count']);
        const formatToString = firstThreeCrime.reduce((acc, prev) => {
            const format = prev.join('\t').concat('\n');
            return acc + format;
        }, '');

        return formatToString;
    }

}

export default DangerousAreas;