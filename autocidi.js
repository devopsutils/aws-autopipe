#! /usr/bin/env node
const yargs = require('yargs');
const shell = require('shelljs');

const argv = yargs
  .usage('Usage: $0 <command> [options]')
  .command('install', 'Install the management stack', yargs => {
    yargs
      .usage('Usage: $0 install -r <Repository-Name> -b <Bucket-Name> -p <AWS-Credentials-Profile>')
      .example('$0 install -r my-repo -b My-Company-Bucket-0815 -p default')
      .alias('r', 'repositoryName')
      .nargs('r', 1)
      .describe('r', 'Name of the CodeCommit repository')
      .alias('b', 'bucket')
      .nargs('b', 1)
      .describe('b', 'S3 Bucket for all artifacts')
      .alias('p', 'profile')
      .nargs('p', 1)
      .describe('p', 'AWS credentials profile, e.g. \'default\'')
      .demandOption(['r', 'b', 'p']);
  })
  .command('create', 'Create a branch pipeline', yargs => {
    yargs
      .usage('Usage: $0 create -r <Repository-Name> -b <Branch-Name> -p <AWS-Credentials-Profile>')
      .example('$0 create -r my-repo -b My-Branch-0815 -p default')
      .alias('r', 'repositoryName')
      .nargs('r', 1)
      .describe('r', 'Name of the CodeCommit repository')
      .alias('b', 'branch')
      .nargs('b', 1)
      .describe('b', 'The branch for which a pipeline shall be created')
      .alias('p', 'profile')
      .nargs('p', 1)
      .describe('p', 'AWS credentials profile, e.g. \'default\'')
      .demandOption(['r', 'b', 'p']);
  })
  .command('delete', 'Delete a branch pipeline or the management stack', yargs => {
    yargs
      .usage('Usage: $0 delete -r <Repository-Name> [-b <Branch-Name>] -p <AWS-Credentials-Profile>')
      .example('$0 delete -r my-repo -b My-Branch-0815 -p default')
      .alias('r', 'repositoryName')
      .nargs('r', 1)
      .describe('r', 'Name of the CodeCommit repository')
      .alias('b', 'branch')
      .nargs('b', 1)
      .describe('b', 'The branch for which a pipeline shall be deleted')
      .alias('p', 'profile')
      .nargs('p', 1)
      .describe('p', 'AWS credentials profile, e.g. \'default\'')
      .demandOption(['r', 'p']);
  })
  .help('h')
  .alias('h', 'help')
  .argv;

async function main() {
  console.log(`This is autocidi!`);
  shell.cd('node_modules/@rimesime/aws-autocidi');
  if (argv._.includes('install')) {
    shell.exec(`./autocidi.sh install ${argv.profile} ${argv.repositoryName} ${argv.bucket}`);
  } else if (argv._.includes('create')) {
    shell.exec(`./autocidi.sh create ${argv.profile} ${argv.repositoryName} ${argv.branch}`);
  } else if (argv._.includes('delete')) {
    shell.exec(`./autocidi.sh delete ${argv.profile} ${argv.repositoryName} ${argv.branch ? argv.branch : ''}`);
  } else {
    yargs.showHelp();
  }
}

// Run this tool
main().then();
