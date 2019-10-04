#! /usr/bin/env node
const yargs = require('yargs');
const shell = require('shelljs');

const argv = yargs
  .command('create', 'Create the management stack or a branch pipeline', yargs => {
    yargs
      .option('s', {
        alias: 'bucket',
        type: 'string',
        nargs: 1,
        describe: 'S3 Bucket for all artifacts'
      })
      .option('b', {
        alias: 'branch',
        type: 'string',
        nargs: 1,
        describe: 'The branch where the pipeline shall be created or updated.'
      })
      .conflicts('s', 'b')
      .check(function (argv) {
        if(!(argv.bucket || argv.branch)) {
          throw('One of the arguments has to be set: b, s');
        }
        return true;
      });
  })
  .command('delete', 'Delete the management stack or a branch pipeline', yargs => {
    yargs
      .option('b', {
        alias: 'branch',
        type: 'string',
        nargs: 1,
        describe: 'The branch where the pipeline shall be deleted.'
      })
  })
  .option('r', {
    global: true,
    alias: 'repositoryName',
    type: 'string',
    demand: 'Please specify the name of the repository.',
    nargs: 1,
    describe: 'The name of the repository.',
    demandOption: true // TODO
  })
  .option('p', {
    global: true,
    alias: 'profile',
    type: 'string',
    demand: 'Please specify the AWS credentials profile',
    nargs: 1,
    default: 'default',
    describe: 'The name of the AWS credentials profile that shall be used. Refers to your .aws/credentials file.'
  })
  .demandCommand(1, 1)
  .help('h')
  .alias('h', 'help')
  .argv;

async function main() {
  console.log(`This is autopipe!`);

  shell.cd('node_modules/@rimesime/aws-autopipe');
  if (argv._.includes('create')) {
    if (argv.bucket) {
      const cmd = `./autopipe.sh create-management ${argv.profile} ${argv.repositoryName} ${argv.bucket}`;
      console.log(cmd);
      shell.exec(cmd);
    } else {
      const cmd = `./autopipe.sh create-branch ${argv.profile} ${argv.repositoryName} ${argv.branch}`;
      console.log(cmd);
      shell.exec(cmd);
    }
  } else if (argv._.includes('delete')) {
    if (argv.branch) {
      const cmd = `./autopipe.sh delete-branch ${argv.profile} ${argv.repositoryName} ${argv.branch}`;
      console.log(cmd);
      shell.exec(cmd);
    } else {
      const cmd = `./autopipe.sh delete-management ${argv.profile} ${argv.repositoryName}`;
      console.log(cmd);
      shell.exec(cmd);
    }
  } else {
    yargs.showHelp();
  }
}

// Run this tool
main().then();
