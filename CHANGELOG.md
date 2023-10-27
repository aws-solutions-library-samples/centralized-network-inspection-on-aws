# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2023-10-27
### Updated
- Library updates to address [Babel vulnerable to arbitrary code execution when compiling specifically crafted malicious code](https://nvd.nist.gov/vuln/detail/CVE-2023-45133)
- Library updates to address [xml2js vulnerable to improperly Controlled Modification of Object Prototype Attributes ('Prototype Pollution')](https://nvd.nist.gov/vuln/detail/CVE-2023-0842)

## [1.0.2] - 2022-12-19
### Updated
- Name change to Firewall Automation for Network Traffic on AWS
- Upgrade to CDK v2
- Fix NPM security warnings
- Fix SonarQube bugs and increase unit test coverage

## [1.0.1] - 2021-04-10
### Updated
- Updated default branch name to 'main'. [Change branch settings in your 
  existing AWS CodeCommit repository.](https://docs.aws.amazon.com/codecommit/latest/userguide/how-to-change-branch.html)

## [1.0.0] - 2021-02-24
### Added
- New solution AWS Network Firewall Deployment Automations for AWS Transit Gateway, initial version
