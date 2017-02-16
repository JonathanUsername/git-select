const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const git = require('./git');

var output = '';
var refs;

git.getBranches().then(promptBranches).catch(console.error);

function promptBranches({repo, branches}) {
    var choices = branches
        .sort((a, b) => a.date - b.date)
        .map(formatChoices);

    choices.push(new inquirer.Separator());
    choices.push({
        name: 'Add new branch'
    });

    choices.reverse();

    inquirer.prompt([{
        type: 'list',
        name: 'branch',
        value: 'short',
        message: 'Choose a branch',
        default: 1,
        choices
    }]).then(choice => {
        if (choice.branch === 'Add new branch') {
            // newBranch(choices);
        } else {
            // gitSpawn(['checkout', choice.branch]);
            git.checkout(repo, choice.branch).then(i => {
                console.log(i, 'checkout complete')
            }).catch(e => {
                process.stderr.write(e);
            });
        }
    });
}

function formatChoices(branch) {
    var ret = Object.assign(branch, {
        formatted: {
            name: chalk.white(`${branch.short}`),
            author: chalk.yellow(`${branch.author}`),
            date: chalk.blue(`(${moment(branch.date).fromNow()})`)
        }
    });
    ret.name = `${ret.formatted.name} ${ret.formatted.author} ${ret.formatted.date}`;
    return ret;
}

// const formatting = '%(HEAD)__SEP%(refname:short)__SEP%(color:red)%(objectname:short)%(color:reset) - %(color:yellow)%(contents:subject)%(color:reset) - %(color:blue)%(authorname)%(color:reset) (%(color:green)%(committerdate:relative)%(color:reset))';
// const args = ['for-each-ref', '--sort=committerdate', 'refs/heads/', `--format=${formatting}`];
//
// const git = child.spawn('git', args, {cwd: process.cwd()});

// function writeOut(d) {
//     const data = d.toString();
//     process.stdout.write(data);
// }
//
// function writeOutErr(d) {
//     const data = d.toString();
//     process.stderr.write(data);
// }
//
// git.stdout.on('data', (d) => {
//     const data = d.toString();
//     output += data;
// });
//
// git.stderr.on('data', writeOutErr);

// git.on('close', function(){
//     refs = output.split('\n')
//         .map(i => i.split('__SEP')
//         .reduce((sum, i, index) => {
//             if (index === 0) {
//                 sum.head = i;
//             }
//             else if (index === 1) {
//                 sum.name = i;
//                 sum.value = i;
//                 sum.short = i;
//             }
//             else if (index === 2) {
//                 sum.name += ` ${i}`;
//             }
//             return sum;
//         }, {}))
//         .filter(i => i.value);
//
//     var branchNames = refs.map(i => i.value).reverse();
//
//     refs.push(new inquirer.Separator());
//     refs.push({
//         name: 'Add new branch'
//     });
//     const choices = refs.reverse();
//
//     inquirer.prompt([{
//         type: 'list',
//         name: 'name',
//         message: 'Choose a branch',
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

// function gitSpawn(args) {
//     return new Promise((resolve) => {
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
//         name: 'name',
//         message: 'Choose a branch to branch from',
//         choices: branchNames
//     }]).then(branch => {
//         inquirer.prompt([{
//             type: 'input',
//             name: 'name',
//             message: 'Choose a name for your new branch'
//         }]).then(choice => {
//             inquirer.prompt([{
//                 type: 'confirm',
//                 name: 'confirm',
//                 message: `Fetch and merge ${branch.name} first? [git fetch origin ${branch.name}:${branch.name}]`
//             }]).then(fetch => {
//                 if (fetch.confirm) {
//                     gitSpawn(['fetch', 'origin', `${branch.name}:${branch.name}`]).then(() => {
//                         gitSpawn(['checkout', '-b', choice.name, branch.name]);
//                     });
//                 } else {
//                     gitSpawn(['checkout', '-b', choice.name, branch.name]);
//                 }
//             });
//         });
//     });
// }
