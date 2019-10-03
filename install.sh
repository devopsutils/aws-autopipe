#!/usr/bin/env bash

ArtifactBucketName=$1
AWSCredentialsProfile=$2

# Install Lambda dependencies
cd management/lambda && npm install && npm ci && cd ../..

# Retrieve this CodeCommit repository name and Arn
CodeCommitRepoName=$(basename $(dirname $(dirname $(dirname $(pwd)))))
CodeCommitRepoArn=$(aws codecommit get-repository \
                        --repository-name "$CodeCommitRepoName" \
                        --output=text \
                        --query='repositoryMetadata.Arn' \
                        --profile "$AWSCredentialsProfile"
                      )

# Create company-wide S3 bucket for artifacts (doesn't do anything if already existing)
aws s3api create-bucket \
          --bucket "$ArtifactBucketName" \
          --region us-east-1 \
          --profile "$AWSCredentialsProfile"

# Deploy management
StackName=pipeline-management-"$CodeCommitRepoName"
aws cloudformation package \
                   --template-file management/management.yaml \
                   --output-template-file management/management-output.yaml \
                   --s3-bucket "$ArtifactBucketName" \
                   --s3-prefix "$CodeCommitRepoName" \
                   --profile "$AWSCredentialsProfile"
aws cloudformation deploy \
                   --template-file management/management-output.yaml \
                   --stack-name "$StackName" \
                   --parameter-overrides \
                     ArtifactBucketName="$ArtifactBucketName" \
                     CodeCommitRepoArn="$CodeCommitRepoArn" \
                   --capabilities CAPABILITY_NAMED_IAM \
                   --profile "$AWSCredentialsProfile"
rm management/management-output.yaml

# Let CodeCommit repository trigger the management lambda
LambdaArn=$(aws cloudformation describe-stacks \
                   --stack-name "$StackName" \
                   --query="Stacks[0].Outputs[?OutputKey=='LambdaArn'].OutputValue" \
                   --output=text \
                   --profile "$AWSCredentialsProfile"
                 )
aws codecommit put-repository-triggers \
               --repository-name "$CodeCommitRepoName" \
               --triggers name=Branching,destinationArn="$LambdaArn",branches=[],events=createReference,deleteReference\
               --profile "$AWSCredentialsProfile"