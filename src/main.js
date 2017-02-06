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
    const choices = refs.reverse()

    inquirer.prompt([{
        type: 'list',
        name: "name",
        message: "Choose a branch",
        choices
    }]).then(choice => {
        const changing = child.spawn('git', ['checkout', choice.name], {cwd: process.cwd()});
        changing.stdout.on('data', writeOut)
        changing.stderr.on('data', writeOutErr);
    });
});
