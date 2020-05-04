const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require('worker_threads');

if (isMainThread) {
  let completed = 0;
  const startTime = Date.now();
  const numberOfElements = 1e9;
  const numberOfCpu = 1;
  const sharedBuffer = new SharedArrayBuffer(
    Int32Array.BYTES_PER_ELEMENT * numberOfElements
  );

  const arr = new Int32Array(sharedBuffer);
  const numberOfElementsPerThread = Math.floor(numberOfElements / numberOfCpu);
  for (let i = 0; i < numberOfElements; i++) {
    arr[i] = i + 2;
  }

  // const endTime = Date.now();
  // console.log(arr);
  // console.log('Seconds: ', (endTime - startTime) / 1000)

  for (let idx = 1; idx <= numberOfCpu; idx++) {
    const start = (idx - 1) * numberOfElementsPerThread;
    const end = start + numberOfElementsPerThread;
    const worker = new Worker(__filename, {
      workerData: {
        start,
        end,
        arr,
        threadId: idx
      }
    });

    worker.on('message', (done) => {
      console.log(done);
      completed += 1;
      if (completed === numberOfCpu) {
        console.log('Done filling the array');
        console.log(arr);
        const endTime = Date.now();
        console.log('Seconds: ', (endTime - startTime) / 1000)

      }
    });
  }
} else {
  const { start, end, arr, threadId } = workerData;
  for (let idx = start; idx < end; idx++) {
    arr[idx] = idx + 2;
  }
  parentPort.postMessage(`Completed ${threadId}`);
}

// without worker threads: measure: 431.776ms