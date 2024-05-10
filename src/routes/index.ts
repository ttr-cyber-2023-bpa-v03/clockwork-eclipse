import express from "express";

import path from "path";
import * as paths from "@src/paths";

import { Route, Static, Endpoint } from "@logic/server";

@Static("/", path.join(paths.staticDir, "EnglishDesigns"))
export default class RootRoute {}