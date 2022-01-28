import fs from 'fs';

const WINDOW_SIZE = 128;
const OVERLAP_PERCENT = 0.5;
const OVERLAP_WINDOW_SIZE = WINDOW_SIZE * OVERLAP_PERCENT;
const TRAIN_FILE_NAME = 'gaitlogs/y_train.csv';
const SUBJECT_FILE_NAME = 'gaitlogs/subject.csv';

function getFileName(prefix) {
  return `gaitlogs/data/acc_${prefix}_data.csv`;
}

const buckets = {
  ax: [],
  ay: [],
  az: [],
  gx: [],
  gy: [],
  gz: [],
};

function fillBucket(serialData, subjectId, gaitClassId) {
  const motionData = serialData.trim().split(',');

  Object.keys(buckets).forEach((bucketKey, index) => {
    const bucket = buckets[bucketKey];

    if (bucket.length < WINDOW_SIZE) {
      bucket.push(motionData[index]);
    } else if (bucket.length === WINDOW_SIZE) {
      let data = bucket.join();

      data = data.concat('\n');
      fs.appendFile(getFileName(bucketKey), data, function (err) {
        if (err) {
          console.error(err);
        }
      });
      buckets[bucketKey] = bucket.slice(parseInt(OVERLAP_WINDOW_SIZE));
      // bucket = [];
      // bucket.concat(overlapWindowData);
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
  });
}

export const parseSaveAccelData = (subjectId, gaitClassId) => {
  const folder = 'gaitlogs/data';

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  return function (serialData) {
    fillBucket(serialData, subjectId, gaitClassId);
  };
};
