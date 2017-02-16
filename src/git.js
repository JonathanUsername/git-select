const Git = require('nodegit');

const findRepoPath = () => {
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
                        oid: i.target()
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
        });
};

const checkout = (repo, branch) => {

};

// function test() {
//     getBranches()
//         .then(console.log)
//         .catch(console.error);
// }
// test();

module.exports = {
    getBranches,
    checkout
};
