# WORK IN PROGRESS - DO NOT USE YET

### autocidi - Automatic CI/CD for AWS
Automatically manage branch-level [AWS CodePipelines](https://aws.amazon.com/codepipeline/).

- Complete deployment infrastructure inside the application repository
- Out-of-the-box default pipeline configuration
- Stay flexible with custom pipelines
- Let DevOps & developers work in the same domain
- Leverage AWS CI/CD toolchain, save costs on the way

### Prerequisites
- [AWS CodeCommit](https://aws.amazon.com/codecommit/) project repository
    - ```npm init``` was run
    - ```buildspec.yml``` is configured (see [AWS CodeBuild](https://aws.amazon.com/codebuild/))
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- Sufficient permissions in your AWS account :)

### Setup
1. ```npm install --save-dev @rimesime/aws-autocidi```

1. Deploy the management stack for this repository:
    - ```autocidi install -r <repository-name> -b <bucket> -p <profile>```
        - ```<repository-name>``` is the name of your AWS CodeCommit repository
        - ```<bucket>``` is your AWS S3 bucket for all artifacts (will be 
          created if not existing)
        - ```<profile>``` is your AWS credentials profile (e.g. 
          ```default```, see ```.aws/credentials``` in your home folder)
    
That's it. From now on: _autocidi_ will...
- _**create**_ a separate pipeline for every new branch
- _**update**_ this pipeline on a push to that branch
- _**delete**_ this pipeline on branch deletion

The definition(s) of the pipeline(s) can be self-managed (i.e. custom) 
by the project itself, or a default pipeline provided by _autocidi_ is 
used. If you use (a) custom pipeline(s), you can work on the 
pipeline definition in a branch, and that branch's pipeline will 
automatically get updated upon a push to that branch with the new
pipeline.

Yes, that _**is**_ awesome - I know. You're welcome. ;)

### More Commands
To manually setup a pipeline for a branch that existed prior to the 
install of _autocidi_ (e.g. the one you are working in right now), run:
- ```autocidi create -b <branch-name> -r <repository-name> -p <profile>```
    
To manually tear down a pipeline, run:
- ```autocidi delete -b <branch-name> -r <repository-name> -p <profile>```
    - ```<branch-name>``` is the branch the pipeline shall be deployed for
    
To manually tear down the management stack for this repository, run:
- ```autocidi delete -r <repository-name> -p <profile>```

### Pipeline Configuration
#### The Default Pipeline
If no custom pipelines are configured in your repository or if no entry 
can be found in your repository configuration that matches the branch 
name whos pipeline shall be created or updated, _autocidi_ will use 
a default pipeline template.

This default pipeline template can be found here: [management/lambda/templates/pipeline-default.yaml](management/lambda/templates/pipeline-default.yaml)

#### Your Custom Pipelines
Create a file called ```autocidi.config.json``` for a mapping of your 
custom pipeline templates to branches, e.g.:
```
{
  "pipelines": [
    {
      "branch": "master",
      "pipeline": "pipelines/master.yaml"
    },
    {
      "branch": "develop",
      "pipeline": "pipelines/develop.yaml"
    }
  ]
}
```

If you need to define a custom default pipeline, use an empty branch 
name, i.e.: 
```
{
  "pipelines": [
    {
      "branch": "",
      "pipeline": "pipelines/default.yaml"
    }
  ]
}
```

#### Which Pipeline Definition Gets Used
- If a custom pipeline template for that branch name is found in 
  your repository, that custom pipeline will be used.
- Else if a default pipeline template is found in your repository, 
  that default pipeline template is used.
- Otherwise a default pipeline template provided by _autocidi_ is used.