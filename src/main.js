const child = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const moment = require('moment');

const jsonFormat = '{"head": %(HEAD), "refname": %(refname:short), "objectname": %(objectname:short), "subject": %(contents:subject), "author": %(authorname), "committerdate": %(committerdate)}';

function doGit(args) {
    return new Promise((resolve, reject) => {
        const git = child.spawn('git', args, {cwd: process.cwd()});
        var output = '';
        git.stdout.on('data', data => {
            output += data.toString();
        });
        git.stdout.on('close', () => {
            resolve(output.toString().trim());
        });
        git.stderr.on('data', (e) => {
            process.stderr.write(`Running "git ${args.join(' ')}": ${e}`);
            reject(e);
        });
    });
}

function formatChoices(branch) {
    var formatted = {
        name: chalk.white(`${branch.refname}`),
        message: chalk.cyan(`${branch.subject.trim()}`),
        author: chalk.yellow(`${branch.author}`),
        date: chalk.blue(`(${moment(branch.committerdate).fromNow()})`)
    };
    formatted.message = formatted.message.replace(/\n/g, ' ');
    branch.name = `${formatted.name} ${formatted.message} ${formatted.author} ${formatted.date}`;
    return branch;
}

function getGitName() {
    return doGit(['config', 'user.name']);
}

function getHeads() {
    const args = ['for-each-ref', '--sort=committerdate', 'refs/heads/', `--format=${jsonFormat}`, '--tcl'];
    return doGit(args).then(formatRefs);
}

function getRemotes() {
    const args = ['for-each-ref', '--sort=committerdate', 'refs/remotes/origin/', `--format=${jsonFormat}`, '--tcl'];
    return doGit(args).then(formatRefs);
}

function absName(refname) {
    return refname
        .replace(/^heads\/origin\//, '')
        .replace(/^remotes\/origin\//, '')
        .replace(/^origin\//, '');
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
        .map(i => JSON.parse(i))
        .map(i =>
            Object.assign(i, {
                displayName: absName(i.refname),
                committerdate: new Date(i.committerdate)
            })
        );
    return Promise.resolve(ret);
}

const byDate = (a, b) => b.committerdate - a.committerdate;
const uniq = (value, index, self) => self.indexOf(value) === index;

const promises = [getGitName(), getHeads(), getRemotes()];

Promise.all(promises).then(values => {
    const [gitName, heads, remotes] = values;

    const localBranches = heads.map(i => i.refname);
    const myRemotes = remotes
        .filter(i => i.author === gitName)
        .filter(i => !localBranches.includes(i.displayName));
    const choices = heads.concat(myRemotes).sort(byDate);
    const formattedChoices = choices.map(formatChoices);

    var menu = formattedChoices.concat();

    menu.unshift(new inquirer.Separator());
    menu.unshift({
        name: 'Add new branch'
    });

    inquirer.prompt([{
        type: 'list',
        name: 'name',
        message: 'Choose a branch',
        default: 1,
        choices: menu
    }]).then(choice => {
        const chosen = formattedChoices.find(i => i.name === choice.name);
        if (choice.name === 'Add new branch') {
            const branchChoices = heads
                .sort(byDate)
                .map(i => absName(i.refname))
                .filter(uniq);

            newBranch(branchChoices);
        } else {
            doGit(['checkout', chosen.displayName]).then(writeOut).catch(writeOutErr);
        }
    });
}).catch(writeOutErr);

function fetchPrompt(branch) {
    return inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Fetch and merge ${branch.name} first? [git fetch origin ${branch.name}:${branch.name}]`
    }]).then(response => response.confirm);
}

function branchNamePrompt() {
    return inquirer.prompt([{
        type: 'input',
        name: 'name',
        message: 'Choose a name for your new branch'
    }])
}

function checkout(branch, choice) {
    return fetchPrompt(branch)
        .then(confirm => {
            if (confirm) {
                doGit(['fetch', 'origin', `${branch.name}:${branch.name}`]).then(() => {
                    doGit(['checkout', '-b', choice.name, branch.name]).catch(writeOutErr);
                }).catch(e => {
                    process.stderr.write(`${e}`);
                    checkout(branch);
                });
            } else {
                doGit(['checkout', '-b', choice.name, branch.name]).catch(writeOutErr);
            }
        }).catch(writeOutErr);
}

// TODO: tidy this up
function newBranch(branchNames) {
    inquirer.prompt([{
        type: 'list',
        name: 'name',
        message: 'Choose a branch to branch from',
        choices: branchNames
    }]).then(branch => {
        branchNamePrompt().then(choice => {
            checkout(branch, choice);
        });
    });
}
