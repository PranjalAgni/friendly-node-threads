const os = require('os');
const { Worker } = require('worker_threads');
const inquirer = require('inquirer');
const ora = require('ora');
const path = require('path');

const numCpu = os.cpus().length;
const workerPath = path.resolve('factorial-worker.js');

const getFactorialWithWorker = (number) => {
  if (number === 0) return 1;
  const numbers = [];
  for (let i = 1n; i <= number; i++) {
    numbers.push(i);
  }

  const segmentSize = Math.ceil(numbers.length / numCpu);
  const segments = [];
  for (let segmentIdx = 0; segmentIdx < numCpu; segmentIdx++) {
    const start = segmentIdx * segmentSize;
    const end = start + segmentSize;
    const segment = numbers.slice(start, end);
    segments.push(segment);
  }

  const promises = segments.map((segment) => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(workerPath, {
        workerData: {
          segment,
        },
      });

      worker.on('message', resolve);
      worker.on('error', reject);
      worker.on('exit', (code) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });
    });
  });

  return Promise.all(promises).then((results) => {
    return results.reduce((acc, val) => acc * val, 1n);
  });
};

const getFactorial = (number) => {
  const numbers = [];
  for (let i = 1n; i <= number; i++) {
    numbers.push(i);
  }

  return numbers.reduce((acc, val) => acc * val, 1n);
};

const benchMarkFactorial = async (number, factFn, label) => {
  const spinner = ora(`Calculating with ${label}`).start();
  const startTime = process.hrtime.bigint();
  await factFn(BigInt(number));
  const endTime = process.hrtime.bigint();
  const time = endTime - startTime;
  spinner.succeed(`${label} result done in: ${time}`);
  return time;
};

const promptInput = async () => {
  const number = await inquirer.prompt([
    {
      type: 'input',
      name: 'number',
      message: 'Enter number to calculate factorial',
    },
  ]);

  return number;
};

const main = async () => {
  const { number } = await promptInput();
  const timeWorker = await benchMarkFactorial(
    number,
    getFactorialWithWorker,
    'Worker'
  );
  const timeLocal = await benchMarkFactorial(number, getFactorial, 'Local');

  const diff = timeLocal - timeWorker;
  console.log(`Difference between local and worker: ${diff / BigInt(1e6)}ms`);
};

main();
