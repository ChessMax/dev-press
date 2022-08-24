// #!/usr/bin/env node

const {Command} = require('commander');

const program = new Command()
    .name('dev-press')
    .description('Simple static blog generator');

program
    .command('build', 'Generates static blog')
    .action(() => {
        console.log('build');
    });


program.parse();
