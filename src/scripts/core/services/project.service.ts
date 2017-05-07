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
import {Logger} from "../../util/logger";
import {ETConstants} from "../../util/constants";
import {ETFontType} from "../../models/font-type.enum";
import * as fs from "fs-extra";
import moment = require("moment");

@Injectable()
export class ProjectService {

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
        if (fs.existsSync(ETConstants.PROJECTS_SAVE_FILE_PATH)) {
            let data = fs.readFileSync(ETConstants.PROJECTS_SAVE_FILE_PATH, 'utf8');
            let projects;

            try {
                projects = JSON.parse(data);
            } catch (err) {
                Logger.logError("Could not read projects file: " + err);
                this.saveProjects({}).subscribe(
                    () => this.projects.next({})
                );
                return;
            }

            this.projects.next(projects);
        } else {
            Logger.logInfo("Projects file does not exist. Creating...");
            this.saveProjects({}).subscribe(
                () => this.projects.next({})
            );
        }
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
    public renameProject(currentName: string, newName: string): Observable<ETProject> {
        Logger.logInfo("Renaming project " + currentName + " to " + newName);
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
                                project.dataPath = path.join(ETConstants.PROJECT_DATA_DIR_PATH, project.name);
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
    public saveNewProject(projectName: string, fontFilePath: string, fontType: ETFontType): Observable<ETProject> {
        projectName = projectName.trim();

        return Observable.create(listener => {
            // Check the project name uniqueness.
            this.isProjectNameUnique(projectName).subscribe(
                unique => {
                    if (!unique) { // The name is already taken.
                        listener.error("A project with this name already exists.");
                    } else { // The name is available.

                        // Fill out the new project.
                        let newProject: ETProject = {};
                        newProject.name = projectName;
                        newProject.dataPath = path.join(ETConstants.PROJECT_DATA_DIR_PATH, newProject.name);
                        newProject.fontPath = path.join(newProject.dataPath, ETConstants.PROJECT_FONT_NAME);
                        newProject.fontType = fontType;

                        try {
                            // Make sure the main data directory exists.
                            if (!fs.existsSync(ETConstants.PROJECT_DATA_DIR_PATH))
                                fs.mkdirSync(ETConstants.PROJECT_DATA_DIR_PATH);

                            // Create a data directory for the project.
                            fs.mkdirSync(newProject.dataPath);

                            // Copy the font file to the data directory.
                            fs.copySync(fontFilePath, newProject.fontPath);
                        } catch (err) {
                            listener.error(err);
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
    public saveProject(project: ETProject): Observable<ETProject> {
        Logger.logInfo("Saving project: " + project.name);

        return Observable.create(listener => {
            this.projects.take(1).subscribe(
                projects => {
                    projects[project.name] = project;
                    project.lastModified = moment().toISOString();
                    this.saveProjects(projects).subscribe(
                        saved => listener.next(project),
                        err => listener.error(err),
                        () => listener.complete()
                    );
                });
        });
    }

    /**
     * Saves the projects dictionary to the disk.
     * @param projects The projects to save.
     * @returns An Observable that will emit once the projects have been saved (or may emit an error if the saving failed.)
     */
    private saveProjects(projects: ETProjects): Observable<void> {
        return Observable.create(listener => {
            if (projects != null) {
                fs.writeFile(ETConstants.PROJECTS_SAVE_FILE_PATH, JSON.stringify(projects), {encoding: 'utf8'},
                    err => {
                        if (err) {
                            listener.error(err.message);
                            console.log("Error while saving Projects: " + err);
                        } else {
                            this.loadProjects();
                            listener.next();
                            listener.complete();
                        }
                    });
            } else {
                listener.error("Invalid Argument: Projects are null.");
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
            if (ETConstants.PROJECT_RESERVED_NAMES.includes(projectName.toUpperCase())) {
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