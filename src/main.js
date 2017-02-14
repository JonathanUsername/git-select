const child = require('child_process');
const inquirer = require('inquirer');

const formatting = '%(HEAD)__SEP%(refname:short)__SEP%(color:red)%(objectname:short)%(color:reset) - %(color:yellow)%(contents:subject)%(color:reset) - %(color:blue)%(authorname)%(color:reset) (%(color:green)%(committerdate:relative)%(color:reset))';
const args = ['for-each-ref', '--sort=committerdate', 'refs/heads/', `--format=${formatting}`];

const git = child.spawn('git', args, {cwd: process.cwd()});

var output = '';
var refs;

function writeOut(d) {
    const data = d.toString();
    process.stdout.write(data);
}

function writeOutErr(d) {
    const data = d.toString();
    process.stderr.write(data);
}

git.stdout.on('data', (d) => {
    const data = d.toString();
    output += data;
});

git.stderr.on('data', writeOutErr);

git.on('close', function(code, signal){
    refs = output.split('\n')
        .map(i => i.split('__SEP')
        .reduce((sum, i, index) => {
            if (index === 0) {
                sum.head = i;
            }
            else if (index === 1) {
                sum.name = i;
                sum.value = i;
                sum.short = i;
            }
            else if (index === 2) {
                sum.name += ` ${i}`;
            };
            return sum;
        }, {}))
        .filter(i => i.value);

    refs.push(new inquirer.Separator());
    refs.push({
        name: 'Add new branch'
    });
    const choices = refs.reverse()

    inquirer.prompt([{
        type: 'list',
        name: "name",
        message: "Choose a branch",
        default: 1,
        choices
    }]).then(choice => {
        if (choice.name === 'Add new branch') {
            newBranch();
        } else {
            gitSpawn(['checkout', choice.name]);
        }
    });
});

function gitSpawn(args) {
    return new Promise((resolve, reject) => {
        const spawnedProcess = child.spawn('git', args, {cwd: process.cwd()});
        spawnedProcess.stdout.on('data', writeOut);
        spawnedProcess.stderr.on('data', writeOutErr);
        spawnedProcess.on('close', resolve);
    });
}

function newBranch() {
    inquirer.prompt([{
        type: 'input',
        name: "name",
        message: "Choose a branch name (will be branched from master)"
    }]).then(choice => {
        inquirer.prompt([{
            type: 'confirm',
            name: "confirm",
            message: "Fetch and merge master first?"
        }]).then(fetch => {
            if (fetch.confirm) {
                gitSpawn(['fetch', 'origin', 'master:master']).then(() => {
                    gitSpawn(['checkout', '-b', choice.name]);
                });
            } else {
                gitSpawn(['checkout', '-b', choice.name]);
            }
        })
    });
}
