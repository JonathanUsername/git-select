const Git = require('nodegit');

const findRepoPath = () => {
    // TODO: cross-platform?
    return Git.Repository.discover('.', 0, '/');
};

const openRepo = (path) => {
    return Git.Repository.open(path);
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
                                author: commit.author().name()
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
    return repo.checkoutBranch(ref, {
        checkoutStrategy: Git.Checkout.STRATEGY.SAFE_CREATE,
        notifyFlags: Git.Checkout.NOTIFY.CONFLICT
    }).catch(console.error);
};

const createBranch = (repo, name) => {
    return repo.getHeadCommit().then(commit => {
        return repo.createBranch(name, commit, false).then(i => {
            checkout(repo, i.toString());
        });
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
    checkout,
    createBranch
};
