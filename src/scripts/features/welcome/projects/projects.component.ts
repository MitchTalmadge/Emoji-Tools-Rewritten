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

import {ChangeDetectorRef, Component, EventEmitter, OnInit, Output} from "@angular/core";
import {ETPlatform, ETProject} from "../../../models/project.model";
import {ProjectService} from "../../../core/services/project.service";

@Component({
    selector: 'et-projects',
    templateUrl: 'projects.component.html',
    styleUrls: ['projects.component.css']
})
export class ProjectsComponent implements OnInit {

    @Output() openProject = new EventEmitter<ETProject>();

    projects: ETProject[] = [];

    APPLE = ETPlatform.APPLE;
    ANDROID = ETPlatform.ANDROID;

    constructor(private projectService: ProjectService,
                private changeDetectorRef: ChangeDetectorRef) {
    }

    ngOnInit() {
        // Get the array of projects
        this.projectService.getProjects().subscribe(projects => {
            this.projects = projects;
        });
    }

    onClickProject(project: ETProject) {
        this.openProject.emit(project);
    }

}