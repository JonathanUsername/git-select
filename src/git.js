const Git = require('nodegit');

// var Repository;

const refsHeadsRegex = /^refs\/heads\//;

const findRepoPath = () => {
    return Git.Repository.discover('.', 0, '/');
};

const openRepo = (path) => {
    return Git.Repository.open(path)
};

const getRefs = (repo) => {
    return repo.getReferenceNames(Git.Reference.TYPE.LISTALL);
};

const getBranches = () => {
    return findRepoPath()
        .then(openRepo)
        .then(repo => {
            return repo.getReferences(Git.Reference.TYPE.LISTALL).then(refs => {
                var ret = refs.map(i => ({
                    name: i.shorthand(),
                    oid: i.target()
                }));
                var promises = ret.map(i => {
                    return Git.Commit.lookup(repo, i.oid).then(commit => {
                        return Object.assign(i, {
                            date: commit.date(),
                            author: commit.author().name()
                        });
                    })
                })
                return Promise.all(promises);
            });
        })
}

function test() {
    var ret = getBranches()
        .then(console.log)
        .catch(console.error)
}
test()

module.exports = {
    getBranches
};
