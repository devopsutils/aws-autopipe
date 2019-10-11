'use strict';

const fs = require("fs");
const cfn = require('cfn');
const AWS = require('aws-sdk');
const codeCommit = new AWS.CodeCommit();

const CodeCommitRepoName = process.env.CodeCommitRepoName;

async function getFileBlobFromRepo(commitSpecifier, filePath) {
  return new Promise((resolve, reject) => {
    const params = {
      filePath,
      repositoryName: CodeCommitRepoName,
      commitSpecifier
    };
    codeCommit.getFile(params, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data.fileContent);
      }
    });
  });
}

async function getPipelineConfiguration(commitSpecifier, record) {
  return new Promise(async (resolve, reject) => {
    // Retrieve the configuration from inside of that branch
    const configFileBlob = await getFileBlobFromRepo(commitSpecifier, 'autopipe.config.json');
    const pipelines = JSON.parse(configFileBlob).pipelines;

    // Find what we want, order matters here
    const branchMatches = pipelines
      .filter((p) => p.branch === commitSpecifier.split('/')[2])
      .concat(pipelines.filter((p) => p.branch === ''));

    // Is there an entry that matches the criteria?
    if (branchMatches[0]) {
      // Found a definition
      const pipelineFilePath = branchMatches[0].pipeline;
      const cfParams = branchMatches[0].parameters || {};
      const tags = branchMatches[0].tags || {};

      // Is a template file specified? Or is it empty?
      if (pipelineFilePath === '') {
        // Branch is im- or explicitly mentioned but empty template file, do not deploy anything
        console.log('No template defined. Deploying nothing.');

        if (branchMatches[0].branch !== '') {
          // Branch is explicitly defined, but template is empty, delete stack if present
          console.log('Branch explicitly configured to have no pipeline stack, deleting pipeline stack if present now.');
          await deleteBranch(record);
        }
        resolve({ template: null, cfParams: null, tags: null });
        return;
      }

      // Retrieve that template file
      const templateFileBlob = await getFileBlobFromRepo(commitSpecifier, pipelineFilePath);

      // Save it locally in this lambda
      const template = `/tmp/template-${commitSpecifier.split('/').join('-')}.yaml`;
      fs.writeFileSync(template, templateFileBlob, 'base64', function (err) {
        console.log(err);
        reject(err);
      });

      resolve({ template, cfParams, tags });
      return;
    }
  });
}

async function createOrUpdateBranch(record) {
  try {
    console.log('Creating or updating branch, CodeCommit Info:', JSON.stringify(record));

    // Extract the commit specifier from this record
    const commitSpecifier = record.codecommit.references[0].ref;

    // Is there a template definition for this branch?
    const { template, cfParams, tags } = await getPipelineConfiguration(commitSpecifier, record);
    if (!template) {
      // No :(
      return;
    }

    // Deploy template
    await cfn({
      name: 'pipeline-branch-' + commitSpecifier.split('/')[2],
      template,
      cfParams,
      tags,
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
    console.log('Deleting a branch, CodeCommit Info:', JSON.stringify(record));
    const stackName = 'pipeline-branch-' + record.codecommit.references[0].ref.split('/')[2];
    console.log('Deleting Stack now:', stackName);
    await cfn.delete(stackName);
  } catch (error) {
    console.error('Got error: ', error);
  }
}

exports.handler = async (event) => {
  await Promise.all(
    [
      ...(event.Records.filter((record) => record.eventTriggerName === "NewBranch").map(createOrUpdateBranch)),
      ...(event.Records.filter((record) => record.eventTriggerName === "UpdateBranch").map(createOrUpdateBranch)),
      ...(event.Records.filter((record) => record.eventTriggerName === "DeleteBranch").map(deleteBranch))
    ]
  ).catch(console.error);
};
