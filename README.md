# WORK IN PROGRESS - DO NOT USE YET

![Diagram](graphics/autopipe-logo.svg)

### autopipe - Automatic CI/CD for AWS
Automatically manage branch-level [AWS CodePipelines](https://aws.amazon.com/codepipeline/).

- Maintain deployment infrastructure inside the application repository
- Full automatic branch handling
- Stay flexible with custom pipelines
- Let DevOps & developers work in the same domain
- Leverage AWS CI/CD toolchain, save costs on the way

_autopipe_ ...
- ... _**creates**_ a pipeline for every new branch
- ... _**updates**_ that pipeline on every branch push if necessary
- ... _**executes**_ that pipeline on every branch push
- ... _**deletes**_ that pipeline on branch deletion
- ... _**removes**_ all deployed application stacks on branch deletion

The definition(s) of the pipeline(s) must be self-managed (i.e. custom) 
by the project itself. You can work on the pipeline definition in a 
branch, and that branch's pipeline will automatically get updated upon 
a push to that branch with the new pipeline.

Yes, that _**is**_ awesome - I know. You're welcome. ;)

![Diagram](graphics/autopipe-gitflow.svg)

### Prerequisites
Must:
- [AWS CodeCommit](https://aws.amazon.com/codecommit/) project repository
    - ```npm init``` was run
- [AWS CLI](https://aws.amazon.com/cli/) installed and configured
- Sufficient permissions in your AWS account :)

Optional (but probably really useful):
- ```buildspec.yml``` is configured (see [AWS CodeBuild](https://aws.amazon.com/codebuild/))

### Setup
1. ```npm install --save-dev @rimesime/aws-autopipe```

1. Deploy the management stack for this repository:
    - ```autopipe create -r <repository-name> -s <bucket-name> [-p <profile>]```
        - ```<repository-name>``` is the name of your AWS CodeCommit repository
        - ```<bucket-name>``` is your AWS S3 bucket for all artifacts (will be 
          created if not existing)

    You just deployed your management stack for this repository:
    ![Diagram](graphics/autopipe-management-stack.svg)

1. Setup your custom pipeline definitions, see section 
   _Your Custom Pipelines Definitions_.
   
### More Commands
If you need to setup a branch pipeline for a branch that existed before 
installing _autopipe_ and you do not want to push to that branch now (this 
would automatically setup a branch pipeline), run:
- ```autopipe create -r <repository-name> -b <branch-name> [-p <profile>]```
    
To manually tear down a pipeline (gets redeployed on branch push), run:
- ```autopipe delete -r <repository-name> -b <branch-name> [-p <profile>]```
    
To manually tear down the management stack for this repository, run:
- ```autopipe delete -r <repository-name> [-p <profile>]```

### Your Custom Pipeline Definition(s)
Create a file called ```autopipe.config.json``` for a mapping of your 
custom pipeline templates to branches.
<details>
  <summary>Example:</summary>
  
```
{
  "pipelines": [
    {
      "branch": "master",
      "pipeline": "pipelines/master.yaml",
      "description": "Custom pipeline for master branch without parameters and tags"
    },
    {
      "branch": "develop",
      "pipeline": "pipelines/develop.yaml",
      "description": "Custom pipeline for develop branch",
      "parameters": {
        "TheAnswer": "42"
      },
      "tags": {
        "project": "find-the-question"
      }
    },
    {
      "branch": "",
      "pipeline": "pipelines/default.yaml",
      "description": "Custom default pipeline for all (other) branches",
      "parameters": {
        "TheAnswer": "42"
      },
      "tags": {
        "project": "find-the-question"
      }
    },
    {
      "branch": "no-pipe-branch",
      "pipeline": "",
      "description": "Do not deploy a pipeline for this branch"
    }
  ]
}
```
</details>

##### Remarks:
- If you need to define a custom default pipeline, use an empty branch name. 
- If you need to exclude a branch from _autopipe_, use an empty pipeline attribute.

##### Which Pipeline Definition Gets Used
1. If an entry in ```autopipe.config.json``` for that branch name is found:
    1. If the pipeline attribute is set to a template, that custom pipeline will be used.
    1. If the pipeline attribute is empty, no pipeline is deployed.
1. Else if a custom default pipeline template is found in ```autopipe.config.json```, 
   that custom default pipeline template is used.
1. Otherwise nothing happens.

_Note_, if there was a custom pipeline template defined for a branch and 
that definition changed to **no** custom pipeline, the old pipeline gets destroyed.
