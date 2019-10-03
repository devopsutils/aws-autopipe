'use strict';

async function processRecord(record) {
  try {
    console.log('Acting on', record.eventName)
  } catch (error) {
    console.error('Got error: ', error);
  }
}

exports.handler = async (event) => {
  console.log(event);
  await Promise.all(event.Records.map(processRecord)).catch(console.error);
};
