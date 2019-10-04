'use strict';

const cfn = require('cfn');

async function createOrUpdateBranch(record) {
  try {
    console.log('Creating or updating branch', record);
    console.log('CodeCommit Info:', JSON.stringify(record.codecommit.references));
    const stackName = 'pipeline-branch-' + record.codecommit.references[0].ref.split('/')[2];
    console.log('Stackname:', stackName);
    await cfn({
      name: stackName,
      template: 'templates/pipeline-default.yaml',
      cfParams: {},
      /*
      tags: {
        app: 'my app',
        department: 'accounting',
      },
       */
      awsConfig: {
        region: 'us-east-1', // TODO
      },
      capabilities: ['CAPABILITY_NAMED_IAM', 'CAPABILITY_AUTO_EXPAND'],
      checkStackInterval: 5000,
    });
  } catch (error) {
    console.error('Got error: ', error);
  }
}

async function deleteBranch(record) {
  try {
    console.log('Deleting a branch', record);
    console.log('CodeCommit Info:', JSON.stringify(record.codecommit.references));
    const stackName = 'pipeline-branch-' + record.codecommit.references[0].ref.split('/')[2];
    console.log('Stackname:', stackName);
    await cfn.delete(stackName);
  } catch (error) {
    console.error('Got error: ', error);
  }
}

exports.handler = async (event) => {
  console.log(event);
  await Promise.all(
    [
      ...(event.Records.filter((record) => record.eventTriggerName === "NewBranch").map(createOrUpdateBranch)),
      ...(event.Records.filter((record) => record.eventTriggerName === "UpdateBranch").map(createOrUpdateBranch)),
      ...(event.Records.filter((record) => record.eventTriggerName === "DeleteBranch").map(deleteBranch))
    ]
  ).catch(console.error);
};
