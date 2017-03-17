const child = require('child_process');
const inquirer = require('inquirer');

const formatting = '{"head": %(HEAD), "refname": %(refname:short), "objectname": %(objectname:short), "subject": %(contents:subject), "author": %(authorname), "committerdate": %(committerdate:relative)}';

function doGit(args) {
    return new Promise((resolve, reject) => {
        const git = child.spawn('git', args, {cwd: process.cwd()});
        var output = '';
        git.stdout.on('data', data => {
            output += data.toString();
        });
        git.stdout.on('close', data => {
            resolve(output.toString().trim());
        });
        git.stderr.on('data', (e) => {
            reject(e);
        });
    });
}

function getGitName() {
    return doGit(['config', 'user.name']);
}

function getHeads() {
    const args = ['for-each-ref', '--sort=committerdate', 'refs/heads/', `--format=${formatting}`, '--tcl'];
    return doGit(args).then(formatRefs);
}

function getRemotes() {
    const args = ['for-each-ref', '--sort=committerdate', 'refs/remotes/origin/', `--format=${formatting}`, '--tcl'];
    return doGit(args).then(formatRefs);
}

function writeOut(d) {
    const data = d.toString();
    process.stdout.write(data);
}

function writeOutErr(d) {
    const data = d.toString();
    process.stderr.write(data);
}

function formatRefs(output) {
    const ret = output.split('\n')
        .map(i => JSON.parse(i));
        // .reduce((sum, i, index) => {
        //     if (index === 0) {
        //         sum.head = i;
        //     }
        //     else if (index === 1) {
        //         sum.name = i;
        //         sum.value = i;
        //         sum.short = i;
        //     }
        //     else if (index === 2) {
        //         sum.name += ` ${i}`;
        //     };
        //     return {};
        // }, {}))
        // .filter(i => i.value);
    return Promise.resolve(ret);
}

const promises = [getGitName(), getHeads(), getRemotes()];

Promise.all(promises).then(values => {
    const [gitName, heads, remotes] = values;
    // console.log(heads)
    const localBranches = heads.map(i => i.refname);
    const myRemotes = remotes
        .filter(i => i.author === gitName)
        .map(i =>
            Object.assign(i, {
                displayName: i.refname
                    .replace(/^heads\/origin\//, '')
                    .replace(/^remotes\/origin\//, '')
                    .replace(/^origin\//, '')
            })
        )
        .filter(i => !localBranches.includes(i.displayName));
    const choices = heads.concat(myRemotes).reverse();
    console.log(choices)
}).catch(writeOutErr)

// git.on('close', function(code, signal) {
//     var branchNames = refs.map(i => i.value).reverse();
//
//     refs.push(new inquirer.Separator());
//     refs.push({
//         name: 'Add new branch'
//     });
//     const choices = refs.reverse()
//
//     inquirer.prompt([{
//         type: 'list',
//         name: "name",
//         message: "Choose a branch",
//         default: 1,
//         choices
//     }]).then(choice => {
//         if (choice.name === 'Add new branch') {
//             newBranch(branchNames);
//         } else {
//             gitSpawn(['checkout', choice.name]);
//         }
//     });
// });
//
// function gitSpawn(args) {
//     return new Promise((resolve, reject) => {
//         const spawnedProcess = child.spawn('git', args, {cwd: process.cwd()});
//         spawnedProcess.stdout.on('data', writeOut);
//         spawnedProcess.stderr.on('data', writeOutErr);
//         spawnedProcess.on('close', resolve);
//     });
// }
//
// function newBranch(branchNames) {
//     inquirer.prompt([{
//         type: 'list',
//         name: "name",
//         message: "Choose a branch to branch from",
//         choices: branchNames
//     }]).then(branch => {
//         inquirer.prompt([{
//             type: 'input',
//             name: "name",
//             message: "Choose a name for your new branch"
//         }]).then(choice => {
//             inquirer.prompt([{
//                 type: 'confirm',
//                 name: "confirm",
//                 message: `Fetch and merge ${branch.name} first? [git fetch origin ${branch.name}:${branch.name}]`
//             }]).then(fetch => {
//                 if (fetch.confirm) {
//                     gitSpawn(['fetch', 'origin', `${branch.name}:${branch.name}`]).then(() => {
//                         gitSpawn(['checkout', '-b', choice.name, branch.name]);
//                     });
//                 } else {
//                     gitSpawn(['checkout', '-b', choice.name, branch.name]);
//                 }
//             })
//         });
//     })
// }
