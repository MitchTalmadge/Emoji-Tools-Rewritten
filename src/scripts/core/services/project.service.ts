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
import * as fs from "fs";
import {Observable} from "rxjs/Observable";
const {remote} = require('electron');
const userDataPath = remote.app.getPath('userData');

@Injectable()
export class ProjectService {

    private static readonly PROJECTS_FILE_NAME = "projects.json";

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
        this.ensureProjectsExist();

        fs.readFile(userDataPath + "/" + ProjectService.PROJECTS_FILE_NAME, (err, data) => {
            if (!err) {
                console.log(data);
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
     * Saves a new project to the disk.
     * @returns An Observable that may emit an error message if the project could not be saved.
     */
    public saveNewProject(newProject: ETProject): Observable<void> {
        return Observable.create(listener => {
            this.projects.subscribe(projects => {
                if (projects.filter(project => project.name === newProject.name).length > 0) {
                    listener.error("A project with this name already exists.");
                    listener.complete();
                    return;
                }

                projects.push(newProject);
            });
        });
    }

    private ensureProjectsExist(): Observable<void> {
        return Observable.create(listener => {
            if (fs.exists(userDataPath + "/" + ProjectService.PROJECTS_FILE_NAME)) {
                listener.next();
                listener.complete();
            } else {
                this.saveProjects([]).subscribe(
                    () => {listener.next()},
                    (err) => {listener.error(err)},
                    () => {listener.complete()}
                );
            }
        });
    }

    /**
     * Saves the array of projects to the disk.
     * @param projects The projects to save.
     * @returns An Observable that will emit once the projects have been saved (or may emit an error if the saving failed.)
     */
    private saveProjects(projects: ETProject[]): Observable<void> {
        return Observable.create(listener => {
            if (projects) {
                fs.writeFile(userDataPath + "/" + ProjectService.PROJECTS_FILE_NAME, projects, (err) => {
                    if (err) {
                        listener.error(err.message);
                        console.log(err);
                    } else {
                        listener.next();
                    }
                    listener.complete();
                });
            }
        });
    }

}