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

import {Component, OnInit} from "@angular/core";
import {ETProject} from "../../../models/project.model";
import {ProjectService} from "../../../core/services/project.service";
import {Router} from "@angular/router";
import moment = require("moment");

@Component({
    selector: 'et-projects',
    templateUrl: 'projects.component.html',
    styleUrls: ['projects.component.css']
})
export class ProjectsComponent implements OnInit {

    /**
     * An array of existing projects.
     */
    projects: ETProject[] = [];

    constructor(private projectService: ProjectService,
                private router: Router) {
    }

    ngOnInit() {
        // Get the array of projects
        this.projectService.getProjects().subscribe(projects => {
            // Map to an array of projects for iterating in view.
            this.projects = Object.keys(projects).map(name => projects[name]);
            this.projects.sort((a, b) => moment(a.lastModified).isBefore(moment(b.lastModified)) ? 1 : -1)
        });
    }

    /**
     * When a project is clicked on to be opened.
     */
    onClickProject(project: ETProject) {
        // Save project to update its last modified date, then open it.
        this.projectService.saveProject(project).subscribe(() => this.router.navigate(['', 'project', project.name]));
    }

}