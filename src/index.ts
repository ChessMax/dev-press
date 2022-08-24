// #!/usr/bin/env node

import {buildCommand} from "./commands/build_command";

const {Command} = require('commander');

const program = new Command()
    .name('dev-press')
    .description('Simple static blog generator');

program
    .command('build', 'Generates static blog')
    .action(async () => {
        await buildCommand();
    });


program.parse();
