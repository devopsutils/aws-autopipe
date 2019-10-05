'use strict';

const fs = require("fs");
const cfn = require('cfn');
const AWS = require('aws-sdk');
const codeCommit = new AWS.CodeCommit();

const CodeCommitRepoName = process.env.CodeCommitRepoName;

async function getPipelineConfiguration(commitSpecifier) {
  return new Promise((resolve, reject) => {
    const params = {
      filePath: 'pipeline-default.yaml', //TODO 'autopipe.config.json',
      repositoryName: CodeCommitRepoName,
      commitSpecifier
    };
    codeCommit.getFile(params, function (err, data) {
      if (err) {
        console.log(err, err.stack);
        reject(err);
      } else {
        console.log(data);

        const templatePath = `/tmp/template-${commitSpecifier.split('/').join('-')}.yaml`;
        console.log(templatePath);

        fs.writeFileSync(templatePath, data.fileContent, 'base64', function(err) {
          console.log(err);
          reject(err);
        });

        resolve(templatePath);
      }
    });
  });
}

async function createOrUpdateBranch(record) {
  try {
    console.log('Creating or updating branch', record);
    console.log('CodeCommit Info:', JSON.stringify(record.codecommit.references));
    const commitSpecifier = record.codecommit.references[0].ref;
    const stackName = 'pipeline-branch-' + commitSpecifier.split('/')[2];
    const templatePath = await getPipelineConfiguration(commitSpecifier);
    console.log('Stackname:', stackName);
    await cfn({
      name: stackName,
      template: templatePath,
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
