#!/usr/bin/env node

import {buildCommand} from "./commands/build_command";
import {serveCommand} from "./commands/serve_command";
import {deployCommand} from "./commands/deploy_command";
import {dump} from "js-yaml";

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

program
    .command('deploy')
    .description('Build and deploy site')
    .option('--dry', 'Run in dry mode')
    .action(async (args: { dry?: boolean }) => {
        await deployCommand({
            dry: args.dry,
        });
    });

let argv = process.argv;
console.log(`argv: ${argv}`);

program.parse();

let options = program.opts();
dump(options);
