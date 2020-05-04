const { parentPort, workerData } = require('worker_threads');

const { segment: numbers } = workerData;

const fact = numbers.reduce((acc, val) => acc * val, 1);

parentPort.postMessage(fact);
