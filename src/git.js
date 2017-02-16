const Git = require('nodegit');

const findRepoPath = () => {
    // TODO: cross-platform?
    return Git.Repository.discover('.', 0, '/');
};

const openRepo = (path) => {
    return Git.Repository.open(path);
};

const getRemoteBranches = () => {
    return findRepoPath()
        .then(openRepo)
        .then(repo => {
            return repo.getReferences(Git.Reference.TYPE.LISTALL)
                .then(refs => {
                    var promises = refs
                        .filter(i => i.isRemote())
                        .map(i => ({
                            short: i.toString(),
                            value: i.toString(),
                            oid: i.target(),
                            ref: i
                        }))
                        .map(i => {
                            return Git.Commit.lookup(repo, i.oid).then(commit => {
                                return Object.assign(i, {
                                    date: commit.date(),
                                    author: commit.author().name(),
                                    message: commit.message()
                                });
                            });
                        });
                    return Promise.all(promises).then(branches => {
                        return Object.assign({branches, repo});
                    });
                });
            }).catch(console.error);
};

const getBranches = () => {
    return findRepoPath()
        .then(openRepo)
        .then(repo => {
            return repo.getReferences(Git.Reference.TYPE.LISTALL)
                .then(refs => {
                    var promises = refs
                        .filter(i => i.isBranch())
                        .map(i => ({
                            short: i.shorthand(),
                            value: i.shorthand(),
                            oid: i.target(),
                            ref: i
                        }))
                        .map(i => {
                            return Git.Commit.lookup(repo, i.oid).then(commit => {
                                return Object.assign(i, {
                                    date: commit.date(),
                                    author: commit.author().name(),
                                    message: commit.message()
                                });
                            });
                        });
                    return Promise.all(promises).then(branches => {
                        return Object.assign({branches, repo});
                    });
                });
            }).catch(console.error);
};

const checkout = (repo, ref) => {
    if (ref.isRemote()) {
        console.log('is remote');
        return repo.getBranchCommit(ref.toString()).then(commit => {
            // console.log(commit)
            repo.createBranch(ref.shorthand(), commit, false).then(newRef => {
                checkout(repo, newRef).then(() => {
                    // setUpstream
                    Git.Branch.setUpstream(ref.shorthand(), 'origin');
                });
            });
        });
    }
    return repo.checkoutBranch(ref.toString(), {
        checkoutStrategy: Git.Checkout.STRATEGY.SAFE,
        notifyFlags: Git.Checkout.NOTIFY.CONFLICT
    }).catch(console.error).done(console.error);
};

const createBranch = (repo, name, headCommit) => {
    return repo.createBranch(name, headCommit, false).then(ref => {
        checkout(repo, ref);
    }).catch(console.error);
};

// function test() {
//     getBranches()
//         .then(console.log)
//         .catch(console.error);
// }
// test();

module.exports = {
    getBranches,
    getRemoteBranches,
    checkout,
    createBranch
};
