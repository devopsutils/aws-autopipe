#!/usr/bin/env bash

# Parameters
Mode=$1
AWSCredentialsProfile=$2
CodeCommitRepoName=$3
ArtifactBucketName=$4
BranchName=$4

# Common variables
ManagementStackName="pipeline-management-$CodeCommitRepoName"
PipelineStackName="pieline-branch-$BranchName"

# Retrieve CodeCommit repository Arn
CodeCommitRepoArn=$(aws codecommit get-repository \
                        --repository-name "$CodeCommitRepoName" \
                        --output=text \
                        --query='repositoryMetadata.Arn' \
                        --profile "$AWSCredentialsProfile"
                      )

case "$Mode" in
  install)
    # Create company-wide S3 bucket for artifacts (doesn't do anything if already existing)
    aws s3api create-bucket \
              --bucket "$ArtifactBucketName" \
              --region us-east-1 \
              --profile "$AWSCredentialsProfile"

    # Install Lambda dependencies
    cd management/lambda && npm install && npm ci && cd ../..

    # Deploy management stack
    aws cloudformation package \
                       --template-file management/management.yaml \
                       --output-template-file management/management-output.yaml \
                       --s3-bucket "$ArtifactBucketName" \
                       --s3-prefix "$CodeCommitRepoName" \
                       --profile "$AWSCredentialsProfile"
    aws cloudformation deploy \
                       --template-file management/management-output.yaml \
                       --stack-name "$ManagementStackName" \
                       --parameter-overrides \
                         ArtifactBucketName="$ArtifactBucketName" \
                         CodeCommitRepoArn="$CodeCommitRepoArn" \
                       --capabilities CAPABILITY_NAMED_IAM \
                       --profile "$AWSCredentialsProfile"
    rm management/management-output.yaml

    # Let CodeCommit repository trigger the management stack
    LambdaArn=$(aws cloudformation describe-stacks \
                       --stack-name "$ManagementStackName" \
                       --query="Stacks[0].Outputs[?OutputKey=='LambdaArn'].OutputValue" \
                       --output=text \
                       --profile "$AWSCredentialsProfile"
                     )
    aws codecommit put-repository-triggers \
                   --repository-name "$CodeCommitRepoName" \
                   --triggers name=NewBranch,destinationArn="$LambdaArn",branches=[],events=createReference \
                   name=DeleteBranch,destinationArn="$LambdaArn",branches=[],events=deleteReference \
                   name=UpdateBranch,destinationArn="$LambdaArn",branches=[],events=updateReference\
                   --profile "$AWSCredentialsProfile"
    ;;

  create)
    # TODO create it
    # TODO add triggers
    ;;

  delete)
    if test -z "$BranchName"
    then
      # No branch specified, tear down management stack
      echo "Deleting management stack $ManagementStackName"
      aws cloudformation delete-stack \
                         --stack-name "$ManagementStackName"\
                         --profile "$AWSCredentialsProfile"
      aws codecommit put-repository-triggers \
                     --repository-name "$CodeCommitRepoName" \
                     --triggers [] \
                     --profile "$AWSCredentialsProfile"
    else
      # Branch specified, tear down that branch pipeline
      echo "Deleting branch pipeline $PipelineStackName"
      aws cloudformation delete-stack \
                   --stack-name "$PipelineStackName"\
                   --profile "$AWSCredentialsProfile"
      # TODO remove the triggers https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-notify-delete.html#how-to-notify-delete-cli
    fi
    ;;

  *)
    echo $"Usage: $0 {install|create|delete}"
    exit 1
esac