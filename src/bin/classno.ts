#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { render } from "stylus";
import { Project } from "ts-morph";
import { collectStylus } from "../lib/utilities";

const config = JSON.parse(readFileSync(".classno").toString());

const project = new Project();

project.addSourceFilesAtPaths(config.paths);

const css = render(collectStylus(project.getSourceFiles()));

writeFileSync(config.out, css);
