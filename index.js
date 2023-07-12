import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import {pipeline} from 'node:stream/promises';
import unzipper from "unzipper";
import CrimeCounter from "./data-transforms/crime-counter.js";
import DangerousAreas from "./data-transforms/dangerous-areas.js";
import CommonCrimePerArea from "./data-transforms/common-crime-perarea.js";
import LeastCrime from "./data-transforms/least-crime.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const fileStream = createReadStream(join(__dirname, "archive.zip"));
  const csvParser = parse({ columns: true });
  csvParser.setMaxListeners(15);

  const dataPipelines = [
    CrimeCounter,
    DangerousAreas,
    CommonCrimePerArea,
    LeastCrime,
  ];

  const promises = [];
  const filePipelinePromise = pipeline(fileStream, unzipper.ParseOne(), csvParser);
  promises.push(filePipelinePromise);

  let completed = 0;

  for (const Pipeline of dataPipelines) {
    const transform = new Pipeline();

    transform.on("end", () => {
      if (++completed === dataPipelines.length) {
        process.stdout.end();
      }
    });

    // Create a the processing pipeline but don't start it yet
    const transformPipelinePromise = pipeline(csvParser, transform, process.stdout, {end: false});
    promises.push(transformPipelinePromise);
  }

  // Start processing pipeline
  await Promise.all(promises);

}

main().catch((err) => console.log(err));
