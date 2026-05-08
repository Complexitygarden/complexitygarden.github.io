const COMMUNITY_CONFIG = {
    token : "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    //this is probbably fine to commit, the AWS isn't necessary because this is so niche and small scale
    //and also the scope of permissions is so small
    owner : "Complexitygarden",
    repo : "dataset",
    branch : "community"
};

/**
 * Create a branch from main dataset
 * go to settings and add branch protection rule
 * require a pull request before merging for main, restrict who can push to only the admin account
 * 
 * create a personal access token, only select repositories, permissions, set to read and write
 * 
 * either this, or set up cloudflare workers/aws and basically do this but on AWS
 * 
 */