# WORK IN PROGRESS - DO NOT USE YET

# Automatic CI/CD for AWS

Automatically create/update/delete AWS CodePipelines on CodeCommit branches.

# Setup Instructions
1. Create a CodeCommit repository for your application and clone it, then run:
    - ```npm init```
    - ```npm install --save-dev @rimesime/aws-autocidi```

1. Then prepare your build pipeline:
    - Create your build definition for CodeBuild: ```<repo>/buildspec.yml```
    - Create your autocidi configuration file: ```<repo>/autocidi.config.json```

1. Deploy the pipeline management stack:
    - ```autocidi install -b <bucket> -p <profile>```
        - ```<bucket>``` is your S3 bucket for all artifacts
        - ```<profile>``` is your AWS credentials profile (e.g. ```default```, see ```.aws/credentials``` in your home folder)
    
    This is what happens now: AWS will...
    - _**create**_ a separate CodePipeline for every new branch
    - _**update**_ this CodePipeline on a push to that branch using the configuration from within that branch
    - _**delete**_ this CodePipeline on branch deletion
    
    Yes, this is awesome - I know. You're welcome. ;)

1. To manually setup a pipeline for a branch that existed prior to the install of autocidi (e.g. the one you are working in right now), run:
    - ```autocidi create```

# Configuration file
- Create a file called ```autocidi.config.json``` for a mapping of your custom templates to branches. 

# How It Works
Creates a AWS Cloudformation stack called ```pipeline-management-<repository-name>``` 
which gets triggered upon every branch create/delete/push operation and will 
then deploy/delete/update a Cloudformation stack called ```pipeline-branch-<branch-name>``` 
using the custom branch template defined by you in your project (see section on config file) 
or the default template provided by this lib. If the template changes (e.g. because you have 
to change your build pipeline), the deployed pipeline gets updated upon branch push, since 
the changed template resides in the same branch, hence, you can change the pipeline that got 
already deployed for your branch by just pushing the changed template to that branch).
