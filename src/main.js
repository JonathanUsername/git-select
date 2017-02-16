const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');
const git = require('./git');


git.getBranches().then(promptBranches);

function promptBranches({repo, branches}) {
    var sortedBranches = branches
        .sort((a, b) => a.date - b.date)
        .map(formatChoices);

    var choices = sortedBranches.concat();

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
            newBranch(repo, sortedBranches);
        } else {
            const branch = choices.find(i => i.short === choice.branch);
            if (!branch) {
                new Error(`cannot find branch ${choice.short} in ${choices.map(i => i.short).join(' ')}`);
            }
            git.checkout(repo, branch.ref.toString());
        }
    });
}

function formatChoices(branch) {
    var formatted = {
        name: chalk.white(`${branch.short}`),
        message: chalk.cyan(`${branch.message.trim()}`),
        author: chalk.yellow(`${branch.author}`),
        date: chalk.blue(`(${moment(branch.date).fromNow()})`)
    };
    formatted.message = formatted.message.replace(/\n/g, ' ')
    branch.name = `${formatted.name} ${formatted.message} ${formatted.author} ${formatted.date}`;
    return branch;
}

function newBranch(repo, choices) {
    inquirer.prompt([{
        type: 'list',
        name: 'name',
        message: 'Choose a branch to branch from',
        choices: choices
    }]).then(branch => {
        const headCommit = choices.find(i => i.short === branch.name).oid;
        inquirer.prompt([{
            type: 'input',
            name: 'name',
            message: 'Choose a name for your new branch'
        }]).then(choice => {
            inquirer.prompt([{
                type: 'confirm',
                name: 'confirm',
                message: `Fetch and merge ${branch.name} first? [git fetch origin ${branch.name}:${branch.name}]`
            }]).then(fetch => {
                if (fetch.confirm) {
                    console.log('fetching not yet supported');
                    git.createBranch(repo, choice.name, headCommit);
                    // gitSpawn(['fetch', 'origin', `${branch.name}:${branch.name}`]).then(() => {
                    //     gitSpawn(['checkout', '-b', choice.name, branch.name]);
                    // });
                } else {
                    git.createBranch(repo, choice.name, headCommit);
                }
            });
        });
    });
}
