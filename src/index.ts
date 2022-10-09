#!/usr/bin/env node

import {buildCommand} from "./commands/build_command";
import {serveCommand} from "./commands/serve_command";

const {Command} = require('commander');

const program = new Command()
    .name('dev-press')
    .description('Simple static blog generator');

program
    .command('build')
    .description('Generates static blog')
    .action(async () => {
        await buildCommand();
    });
program
    .command('serve')
    .description('Starts local server')
    .action(async () => {
        await serveCommand();
    });

let argv = process.argv;
console.log(`argv: ${argv}`);

program.parse();
