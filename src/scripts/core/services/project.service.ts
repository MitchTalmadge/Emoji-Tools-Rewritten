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
import moment = require("moment");
const {remote} = require('electron');
const userDataPath = remote.app.getPath('userData');
const fs = require("fs-extra");

@Injectable()
export class ProjectService {

    private static readonly PROJECTS_FILE_PATH = path.join(userDataPath, "projects.json");
    private static readonly DATA_DIR_PATH = path.join(userDataPath, "data");

    /**
     * Emits an array containing the user's saved projects.
     */
    private projects = new ReplaySubject<ETProject[]>(1);

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
                        this.projects.next([]);
                    } else {
                        try {
                            let projects = JSON.parse(data);
                            this.projects.next(projects);
                        } catch (err2) {
                            this.saveProjects([]).subscribe(
                                () => this.projects.next([])
                            );
                        }
                    }
                });
            } else {
                this.projects.next([]);
            }
        });
    }

    /**
     * @returns A ReplaySubject that emits an array of saved projects.
     */
    public getProjects(): ReplaySubject<ETProject[]> {
        return this.projects;
    }

    /**
     * Gets a project by its ID.
     * @param id The ID of the project to get.
     * @returns An Observable that returns the project if found, or throws an error if not found.
     */
    public getProjectById(id: string): Observable<ETProject> {
        return Observable.create(listener => {
            this.projects.subscribe(
                projects => {
                    let filteredProjects = projects.filter(project => project.id === id);
                    if (filteredProjects.length == 0)
                        listener.error("No project found by the ID: " + id);
                    else
                        listener.next(filteredProjects[0]);
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
        return Observable.create(listener => {
            this.projects.take(1).subscribe(projects => {
                if (projects.filter(project => project.name.toLowerCase() === projectName.toLowerCase()).length > 0) {
                    listener.error("A project with this name already exists.");
                    listener.complete();
                } else {
                    let newProject: ETProject = {};
                    newProject.id = projectName.toLowerCase().replace(" ", "_");
                    newProject.name = projectName;
                    newProject.dataPath = path.join(ProjectService.DATA_DIR_PATH, newProject.id);
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

                    projects.push(newProject);
                    this.saveProjects(projects).subscribe(
                        () => listener.next(newProject),
                        err => listener.error(err),
                        () => listener.complete()
                    );
                }
            });
        });
    }

    /**
     * Saves the array of projects to the disk.
     * @param projects The projects to save.
     * @returns An Observable that will emit once the projects have been saved (or may emit an error if the saving failed.)
     */
    private saveProjects(projects: ETProject[]): Observable<void> {
        return Observable.create(listener => {
            if (projects != null) {
                fs.writeFile(ProjectService.PROJECTS_FILE_PATH, JSON.stringify(projects), {encoding: 'utf8'}, err => {
                    if (err) {
                        listener.error(err.message);
                        console.log("Error while saving Projects: " + err);
                    } else {
                        this.projects.next(projects);
                        listener.next();
                    }
                    listener.complete();
                });
            }
        });
    }

}