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
  .help('h')
  .alias('h', 'help')
  .argv;

async function main() {
  if (argv._.includes('install')) {
    console.log(`This is autocidi!`);
    shell.cd('node_modules/@rimesime/aws-autocidi');
    shell.exec(`./install.sh ${argv.repositoryName} ${argv.bucket} ${argv.profile}`);
  } else {
    yargs.showHelp();
  }
}

// Run this tool
main().then();
