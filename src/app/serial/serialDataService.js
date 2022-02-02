import fs from 'fs';

const WINDOW_SIZE = 128;
const TRAIN_FILE_NAME = 'gaitlogs/y_train.csv';
const SUBJECT_FILE_NAME = 'gaitlogs/subject.csv';

function getFileName(prefix, label) {
  return `gaitlogs/${label}/acc_${prefix}_data.csv`;
}

function getFolderName(label) {
  return `gaitlogs/${label}`;
}

const OVERLAP_LABELS = {
  10: 'data_90_overlap',
  20: 'data_80_overlap',
  30: 'data_70_overlap',
  40: 'data_60_overlap',
  50: 'data_50_overlap',
  60: 'data_40_overlap',
  70: 'data_30_overlap',
  80: 'data_20_overlap',
  90: 'data_10_overlap',
  100: 'data_0_overlap',
};
const OVERLAP_PERCENTS = Object.keys(OVERLAP_LABELS);
const BUCKET_KEYS = ['ax', 'ay', 'az', 'gx', 'gy', 'gz'];

function getBucket(overlapPercent) {
  return {
    ax: [],
    ay: [],
    az: [],
    gx: [],
    gy: [],
    gz: [],
    overlapPercent,
  };
}

const overlappingBuckets = OVERLAP_PERCENTS.map((overlapPercent) => getBucket(overlapPercent));

export function makeDataFolderIfNotExist() {
  const dirs = OVERLAP_PERCENTS.map((overlapPercent) => getFolderName(OVERLAP_LABELS[overlapPercent]));

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function fillBucket(serialData, subjectId, gaitClassId) {
  const motionData = serialData.trim().split(',');

  for (let i = 0; i < BUCKET_KEYS.length; i++) {
    const bucketKey = BUCKET_KEYS[i];

    for (let j = 0; j < OVERLAP_PERCENTS.length; j++) {
      const overlapPercent = OVERLAP_PERCENTS[j];
      const buckets = overlappingBuckets[j];
      const bucket = buckets[bucketKey];

      if (bucket.length < WINDOW_SIZE) {
        bucket.push(motionData[i]);
      } else if (bucket.length === WINDOW_SIZE) {
        let data = bucket.join();

        data = data.concat('\n');
        fs.appendFile(getFileName(bucketKey, OVERLAP_LABELS[overlapPercent]), data, function (err) {
          if (err) {
            console.error(err);
          }
        });
        buckets[bucketKey] = bucket.slice(parseInt(WINDOW_SIZE * overlapPercent * 0.01));
        // Write only once
        if (bucketKey === 'ax') {
          fs.appendFile(TRAIN_FILE_NAME, subjectId + '\n', function (err) {
            if (err) {
              console.error(err);
            }
          });
          fs.appendFile(SUBJECT_FILE_NAME, gaitClassId + '\n', function (err) {
            if (err) {
              console.error(err);
            }
          });
        }
      }
    }
  }
  // Object.keys(buckets).forEach(bucke);
}

// const buckets = {
//   ax: [],
//   ay: [],
//   az: [],
//   gx: [],
//   gy: [],
//   gz: [],
// };

// function fillBucket(serialData, subjectId, gaitClassId) {
//   const motionData = serialData.trim().split(',');

//   Object.keys(buckets).forEach((bucketKey, index) => {
//     const bucket = buckets[bucketKey];

//     if (bucket.length < WINDOW_SIZE) {
//       bucket.push(motionData[index]);
//     } else if (bucket.length === WINDOW_SIZE) {
//       let data = bucket.join();

//       data = data.concat('\n');
//       fs.appendFile(getFileName(bucketKey), data, function (err) {
//         if (err) {
//           console.error(err);
//         }
//       });
//       buckets[bucketKey] = bucket.slice(parseInt(OVERLAP_WINDOW_SIZE));
//       // bucket = [];
//       // bucket.concat(overlapWindowData);
//       // Write only once
//       if (bucketKey === 'ax') {
//         fs.appendFile(TRAIN_FILE_NAME, subjectId + '\n', function (err) {
//           if (err) {
//             console.error(err);
//           }
//         });
//         fs.appendFile(SUBJECT_FILE_NAME, gaitClassId + '\n', function (err) {
//           if (err) {
//             console.error(err);
//           }
//         });
//       }
//     }
//   });
// }

export const parseSaveAccelData = (subjectId, gaitClassId) => {
  // const folder = 'gaitlogs/data';

  // if (!fs.existsSync(folder)) {
  //   fs.mkdirSync(folder);
  // }

  return function (serialData) {
    fillBucket(serialData, subjectId, gaitClassId);
  };
};
