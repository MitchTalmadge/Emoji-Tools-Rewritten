/*
 * Emoji Tools
 * Copyright (C) 2015-2017 Mitch Talmadge (https://MitchTalmadge.com)
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Injectable} from "@angular/core";
import {ReplaySubject} from "rxjs/ReplaySubject";
import {ETProject} from "../../models/project.model";
import {Observable} from "rxjs/Observable";
import * as path from "path";
import {ETProjects} from "../../models/projects.model";
import moment = require("moment");
const {remote} = require('electron');
const userDataPath = remote.app.getPath('userData');
const fs = require("fs-extra");

@Injectable()
export class ProjectService {

    /**
     * Names that are reserved for Windows. These names will not work.
     */
    private static readonly RESERVED_NAMES = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];

    /**
     * The path to the projects file.
     */
    private static readonly PROJECTS_FILE_PATH = path.join(userDataPath, "projects.json");

    /**
     * The path to the main data directory.
     */
    private static readonly DATA_DIR_PATH = path.join(userDataPath, "data");

    /**
     * Emits an array containing the user's saved projects.
     */
    private projects = new ReplaySubject<ETProjects>(1);

    constructor() {
        this.loadProjects();
    }

    /**
     * Loads the projects from the disk. Additionally, creates the projects file if it does not exist.
     */
    public loadProjects(): void {
        fs.exists(ProjectService.PROJECTS_FILE_PATH, exists => {
            if (exists) {
                fs.readFile(ProjectService.PROJECTS_FILE_PATH, 'utf8', (err, data) => {
                    if (err) {
                        console.log(err);
                        this.projects.next({});
                    } else {
                        try {
                            let projects = JSON.parse(data);
                            this.projects.next(projects);
                        } catch (err2) {
                            this.saveProjects({}).subscribe(
                                () => this.projects.next({})
                            );
                        }
                    }
                });
            } else {
                this.projects.next({});
            }
        });
    }

    /**
     * @returns A ReplaySubject that emits an array of saved projects.
     */
    public getProjects(): ReplaySubject<ETProjects> {
        return this.projects;
    }

    /**
     * Gets a project by its name.
     * @param name The name of the project to get.
     * @returns An Observable that returns the project if found, or throws an error if not found.
     */
    public getProjectByName(name: string): Observable<ETProject> {
        return Observable.create(listener => {
            this.projects.take(1).subscribe(
                projects => {
                    let project = projects[name];
                    if (project == null)
                        listener.error("No project found by the name: " + name);
                    else
                        listener.next(project);
                    listener.complete();
                }
            )
        });
    }

    /**
     * Renames a project.
     * @param currentName The current name of the project.
     * @param newName The new name of the project.
     * @returns An Observable that returns the saved project, or throws an error if saving did not succeed.
     */
    renameProject(currentName: string, newName: string): Observable<ETProject> {
        newName = newName.trim();

        return Observable.create(listener => {
            // Find the project with the name provided.
            this.getProjectByName(currentName).subscribe(
                project => {
                    // Check project name uniqueness
                    this.isProjectNameUnique(newName, project).subscribe(
                        unique => {
                            if (!unique) { // The name is already taken.
                                listener.error("A project with this name already exists.");
                                listener.complete();
                            } else { // The name is available.
                                project.name = newName;

                                // Change data directory name
                                let oldDataPath: string = project.dataPath;
                                project.dataPath = path.join(ProjectService.DATA_DIR_PATH, project.name);
                                try {
                                    fs.moveSync(oldDataPath, project.dataPath);
                                } catch (err) {
                                    listener.error(err);
                                    listener.complete();
                                    return;
                                }

                                // Change the font path to the new data directory.
                                project.fontPath = path.join(project.dataPath, "font.ttf");

                                // Save the project.
                                this.projects.take(1).subscribe(
                                    projects => {
                                        delete projects[currentName];
                                        projects[project.name] = project;
                                        this.saveProjects(projects).subscribe(
                                            saved => listener.next(project),
                                            err => listener.error(err),
                                            () => listener.complete()
                                        );
                                    });
                            }
                        }
                    );
                },
                err => { // Project not found.
                    listener.error(err);
                    listener.complete();
                }
            )
        });
    }

    /**
     * Saves a new project to the disk.
     * @returns An Observable that returns the saved project, or an error if it could not be saved.
     */
    public saveNewProject(projectName: string, fontFilePath: string): Observable<ETProject> {
        projectName = projectName.trim();

        return Observable.create(listener => {
            // Check the project name uniqueness.
            this.isProjectNameUnique(projectName).subscribe(
                unique => {
                    if (!unique) { // The name is already taken.
                        listener.error("A project with this name already exists.");
                        listener.complete();
                    } else { // The name is available.

                        // Fill out the new project.
                        let newProject: ETProject = {};
                        newProject.name = projectName;
                        newProject.dataPath = path.join(ProjectService.DATA_DIR_PATH, newProject.name);
                        newProject.fontPath = path.join(newProject.dataPath, "font.ttf");
                        newProject.lastModified = moment();

                        try {
                            // Make sure the main data directory exists.
                            if (!fs.existsSync(ProjectService.DATA_DIR_PATH))
                                fs.mkdirSync(ProjectService.DATA_DIR_PATH);

                            // Create a data directory for the project.
                            fs.mkdirSync(newProject.dataPath);

                            // Copy the font file to the data directory.
                            fs.copySync(fontFilePath, newProject.fontPath);
                        } catch (err) {
                            listener.error(err);
                            listener.complete();
                            return;
                        }

                        // Save the project.
                        this.saveProject(newProject).subscribe(
                            project => listener.next(project),
                            err => listener.error(err),
                            () => listener.complete()
                        );
                    }
                }
            )
        });
    }

    /**
     * Saves a single project to the disk.
     * @param project The project to save.
     * @returns An Observable that will emit the saved project once it has been saved (or may emit an error if the saving failed.)
     */
    private saveProject(project: ETProject): Observable<ETProject> {
        return Observable.create(listener => {
            this.projects.take(1).subscribe(
                projects => {
                    projects[project.name] = project;
                    this.saveProjects(projects).subscribe(
                        saved => listener.next(project),
                        err => listener.error(err),
                        () => listener.complete()
                    );
                });
        });
    }

    /**
     * Saves the array of projects to the disk.
     * @param projects The projects to save.
     * @returns An Observable that will emit once the projects have been saved (or may emit an error if the saving failed.)
     */
    private saveProjects(projects: ETProjects): Observable<void> {
        return Observable.create(listener => {
            if (projects != null) {
                fs.writeFile(ProjectService.PROJECTS_FILE_PATH, JSON.stringify(projects), {encoding: 'utf8'},
                    err => {
                        if (err) {
                            listener.error(err.message);
                            console.log("Error while saving Projects: " + err);
                        } else {
                            this.projects.next(projects);
                            listener.next();
                        }
                        listener.complete();
                    });
            } else {
                listener.error("Invalid Argument: Projects are null.");
                listener.complete();
            }
        });
    }

    /**
     * Determines if the project name is unique (not already used). Case-insensitive matching.
     * @param projectName The name of the project to check.
     * @param excludedProject A project which is excluded from checking.
     * @returns An Observable that returns true if the project name is unique, false if not.
     */
    private isProjectNameUnique(projectName: string, excludedProject?: ETProject): Observable<boolean> {
        return Observable.create(listener => {
            // Check reserved names.
            if (ProjectService.RESERVED_NAMES.includes(projectName.toUpperCase())) {
                listener.error("This name is reserved and cannot be used.");
                listener.complete();
                return;
            }

            this.projects.take(1).subscribe(
                projects => {
                    for (let name in projects) {
                        //noinspection JSUnfilteredForInLoop
                        if (projects[name].name.toLowerCase() === projectName.toLowerCase())
                            if (excludedProject == null || name !== excludedProject.name) {
                                listener.next(false);
                                listener.complete();
                                break;
                            }
                    }

                    listener.next(true);
                    listener.complete();
                }
            )
        });
    }

}