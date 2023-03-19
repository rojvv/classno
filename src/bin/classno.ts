#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { Project } from "ts-morph";
import { buildCSS } from "../lib/builder";

const config = JSON.parse(readFileSync(".classno").toString());

const project = new Project();

project.addSourceFilesAtPaths(config.paths);

const css = buildCSS(project.getSourceFiles());

writeFileSync(config.out, css);
